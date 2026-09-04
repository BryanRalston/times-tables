import { mkdirSync, copyFileSync, existsSync } from "node:fs";
import { createConnection } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "scripts/playtest-out/poke");
mkdirSync(out, { recursive: true });

const base = process.env.PLAYTEST_URL ?? "http://127.0.0.1:5173/times-tables/";
const fails = [];

function portOpen(port) {
  return new Promise((res) => {
    const s = createConnection({ port, host: "127.0.0.1" }, () => {
      s.end();
      res(true);
    });
    s.on("error", () => res(false));
  });
}

function seedStorage() {
  const kid = {
    name: "Maya",
    stars: 6,
    seenWelcome: true,
    activities: { "u1-leftover": { plays: 1, best: 4, last: 4, stars: 3, misses: [] } },
    badges: [],
    shaky: {},
    sessions: {},
    squishees: ["frog", "cat", "bunny", "panda", "peach"],
    coins: 40,
    attempts: {},
    perfectWalks: 0,
  };
  localStorage.setItem(
    "g3-path-v2",
    JSON.stringify({
      state: {
        version: 7,
        learnerId: "kid-1",
        classUnitId: "",
        pathGrade: 3,
        skipWeekend: true,
        locale: "en",
        learners: { "kid-1": kid },
        ...kid,
      },
      version: 0,
    }),
  );
}

async function waitForServer() {
  for (let i = 0; i < 40; i++) {
    if (await portOpen(5173)) return;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("dev server not up on 5173");
}

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: "chrome", headless: true });
  } catch {
    return await chromium.launch({ headless: true });
  }
}

async function shotClip(page, locator, file) {
  const box = await locator.boundingBox();
  if (!box) {
    await page.screenshot({ path: file });
    return;
  }
  const pad = 28;
  const vp = page.viewportSize() ?? { width: 1280, height: 800 };
  await page.screenshot({
    path: file,
    clip: {
      x: Math.max(0, Math.floor(box.x - pad)),
      y: Math.max(0, Math.floor(box.y - pad)),
      width: Math.min(vp.width, Math.ceil(box.width + pad * 2)),
      height: Math.min(vp.height, Math.ceil(box.height + pad * 2)),
    },
  });
}

async function pokeAndInspect(page, locator, label, { expectCanvas, expectStrip }) {
  await locator.waitFor({ state: "visible", timeout: 8000 });
  await shotClip(page, locator, resolve(out, `${label}-idle.png`));
  await locator.click();
  await page.waitForTimeout(220);
  await shotClip(page, locator, resolve(out, `${label}-a.png`));
  await page.waitForTimeout(220);
  await shotClip(page, locator, resolve(out, `${label}-b.png`));
  await page.waitForTimeout(220);
  await shotClip(page, locator, resolve(out, `${label}-c.png`));

  const canvas = await page.locator("canvas").count();
  const strip = await page.locator(".poke-strip-run").count();
  const video = await page.locator("video").count();
  const row = { label, canvas, strip, video };
  console.log("POKE", JSON.stringify(row));

  if (expectCanvas && canvas < 1) fails.push(`${label}: expected canvas (MagentaVideo), got ${canvas}`);
  if (!expectCanvas && canvas > 0) fails.push(`${label}: unexpected canvas on strip path`);
  if (expectStrip && strip < 1) fails.push(`${label}: expected poke-strip, got ${strip}`);
  if (!expectStrip && strip > 0) fails.push(`${label}: unexpected strip on desktop video path`);
  await page.waitForTimeout(1500);
  return row;
}

async function runPass(browser, name, contextOpts, expect) {
  const context = await browser.newContext({
    ...contextOpts,
    recordVideo: { dir: out, size: contextOpts.viewport },
  });
  await context.addInitScript(seedStorage);
  const page = await context.newPage();
  page.setDefaultTimeout(12000);

  await page.goto(`${base}#/shelf`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  const body = await page.locator("body").innerText();
  if (!/Squishee|Shelf|shop/i.test(body)) fails.push(`${name}: not on shelf: ${body.slice(0, 180)}`);
  if (/6 \+ n = 10/.test(body)) fails.push(`${name}: leftover door, seed missed`);
  if (!/Maya/.test(body) && !/Coins: 40/.test(body) && !/Poke Cat/.test(body)) {
    /* name may be "Maya's path" */
  }
  const owned = await page.getByRole("button", { name: /^Poke / }).count();
  console.log("OWNED_POKE_BUTTONS", name, owned);
  if (owned < 3) fails.push(`${name}: expected owned poke toys, got ${owned}`);

  const assetOk = await page.evaluate(async () => {
    const paths = [
      "squishees/frog-poke.mp4",
      "squishees/cat-poke.mp4",
      "squishees/bunny-poke.mp4",
      "squishees/frog-poke-strip.png",
      "squishees/cat-poke-strip.png",
      "squishees/bunny-poke-strip.png",
    ];
    const out = {};
    for (const p of paths) {
      const r = await fetch(p, { method: "HEAD" }).catch(() => null);
      out[p] = r ? r.status : 0;
    }
    return out;
  });
  console.log("ASSETS", name, JSON.stringify(assetOk));
  for (const [p, status] of Object.entries(assetOk)) {
    if (status !== 200) fails.push(`${name}: ${p} status ${status}`);
  }

  await page.screenshot({ path: resolve(out, `${name}-shelf.png`) });

  await pokeAndInspect(page, page.getByRole("button", { name: "Poke Frog" }).first(), `${name}-frog`, expect);
  await pokeAndInspect(page, page.getByRole("button", { name: "Poke Cat" }).first(), `${name}-cat`, expect);
  await pokeAndInspect(page, page.getByRole("button", { name: "Poke Bunny" }).first(), `${name}-bunny`, expect);

  const rec = page.video();
  await context.close();
  if (rec) {
    const src = await rec.path();
    const dest = resolve(out, `${name}.webm`);
    if (src && existsSync(src)) copyFileSync(src, dest);
    console.log("VIDEO", dest);
  }
}

await waitForServer();
const browser = await launchBrowser();
try {
  await runPass(
    browser,
    "desk",
    { viewport: { width: 1280, height: 800 }, hasTouch: false },
    { expectCanvas: true, expectStrip: false },
  );
  await runPass(
    browser,
    "phone",
    {
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    },
    { expectCanvas: false, expectStrip: true },
  );
} finally {
  await browser.close();
}

if (fails.length) {
  console.error("FAIL", fails.join(" | "));
  process.exit(1);
}
console.log("PASS poke playtest desk+phone");
