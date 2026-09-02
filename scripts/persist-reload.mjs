import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { createConnection } from "node:net";
import { join } from "node:path";
import { chromium } from "playwright-core";

const shotDir = join("scripts", "playtest-out");
mkdirSync(shotDir, { recursive: true });

const rawBase = process.env.PLAYTEST_URL ?? "http://127.0.0.1:4173/times-tables/";

function seedStorage() {
  const kid = {
    name: "Maya",
    stars: 3,
    seenWelcome: true,
    activities: { "u1-leftover": { plays: 1, best: 4, last: 4, stars: 3, misses: [] } },
    badges: [],
    shaky: {},
    sessions: {},
    squishees: [],
    coins: 12,
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

function portOpen(port) {
  return new Promise((res) => {
    const s = createConnection({ port, host: "127.0.0.1" }, () => {
      s.end();
      res(true);
    });
    s.on("error", () => res(false));
  });
}

async function ensurePreview() {
  if (process.env.PLAYTEST_URL) return null;
  if (await portOpen(4173)) return null;
  const child = spawn("npm", ["run", "preview"], { stdio: "inherit", shell: true });
  for (let i = 0; i < 40; i++) {
    if (await portOpen(4173)) return child;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("preview did not start on 4173");
}

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: "chrome", headless: true });
  } catch {
    return await chromium.launch({ headless: true });
  }
}

function watchCatalog() {
  window.__G3_CATALOG = false;
  const bad = /Play leftover|Start today's walk|The year map/;
  const scan = () => {
    const t = document.querySelector("#app")?.innerText || "";
    if (t && bad.test(t)) window.__G3_CATALOG = true;
  };
  const start = () => {
    const app = document.getElementById("app");
    if (app) new MutationObserver(scan).observe(app, { childList: true, subtree: true, characterData: true });
    scan();
  };
  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start);
}

async function firstGotoLeftover(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => (document.querySelector("#app")?.innerText || "").length > 8, null, { timeout: 12000 });
  const text = await page.locator("#app").innerText();
  if (!text.includes("6 + n = 10")) throw new Error(`first visit missing leftover board: ${text.slice(0, 220)}`);
  if (/Play leftover/i.test(text)) throw new Error("first visit showed Play leftover CTA");
  if (/Start today's walk/i.test(text)) throw new Error("first visit showed today's walk CTA");
  if (/The year map/i.test(text)) throw new Error("first visit showed year map");
  if (/Your answer/i.test(text)) throw new Error("first visit YOUR ANSWER chrome");
  if (/\b1\/4\b/.test(text)) throw new Error("first visit 1/4 progress");
  if (/Take the dots you can see/i.test(text)) throw new Error("first visit lecture caption");
  const catalog = await page.evaluate(() => window.__G3_CATALOG === true);
  if (catalog) throw new Error("catalog painted on first navigation (not leftover-first)");
  const hash = await page.evaluate(() => location.hash);
  if (hash !== "#/play/welcome") throw new Error(`first visit hash ${hash}, want #/play/welcome`);
  const check = page.getByRole("button", { name: /^Check$/i });
  if (await check.count()) throw new Error("first visit Check before why-move");
  const skip = page.getByRole("button", { name: /^Skip$/i });
  if (await skip.count()) throw new Error("first visit Skip before why-move");
  const dots = page.getByRole("button", { name: "dot" });
  const n = await dots.count();
  if (n !== 6) throw new Error(`first visit knowns ${n}, want 6`);
  return { check, dots };
}

async function assertBoardLayout(page, viewport) {
  const board = page.locator("[data-leftover-board]");
  const box = await board.boundingBox();
  if (!box) throw new Error("leftover board has no box");
  const cx = box.x + box.width / 2;
  const mid = viewport.width / 2;
  const fill = box.width / viewport.width;
  console.log(
    `board ${viewport.width}x${viewport.height} x=${Math.round(box.x)} w=${Math.round(box.width)} h=${Math.round(box.height)} cx=${Math.round(cx)} fill=${fill.toFixed(2)}`,
  );
  if (Math.abs(cx - mid) > Math.max(48, viewport.width * 0.08)) {
    throw new Error(
      `leftover not centered cx=${cx} vw=${viewport.width} x=${box.x} w=${box.width}`,
    );
  }
  if (viewport.width <= 430) {
    if (box.x + box.width > viewport.width + 8) {
      throw new Error(`phone leftover overflow x=${box.x} w=${box.width} vw=${viewport.width}`);
    }
    if (fill < 0.8) throw new Error(`phone leftover fill ${fill.toFixed(2)} w=${box.width}`);
    return;
  }
  if (fill < 0.7) {
    throw new Error(
      `leftover postcard fill ${fill.toFixed(2)} w=${box.width} vw=${viewport.width} (want ≥ 0.70)`,
    );
  }
  if (viewport.width >= 1280 && box.width < 900) {
    throw new Error(`leftover too narrow at ${viewport.width}: w=${box.width} (want ≥ 900)`);
  }
  if (viewport.width >= 1920 && box.width < 1340) {
    throw new Error(`leftover too narrow at ${viewport.width}: w=${box.width} (want ≥ 1340)`);
  }
  const minH = Math.max(280, Math.round(viewport.height * 0.45));
  if (viewport.width >= 768 && box.height < minH) {
    throw new Error(
      `leftover too short at ${viewport.width}x${viewport.height} h=${box.height} (want ≥ ${minH}; tablet must fill without waiting for lg)`,
    );
  }
  if (box.height < 150) throw new Error(`leftover too short ${box.height}`);
}

async function assertKeypadOnScreen(page, viewport) {
  const check = page.getByRole("button", { name: /^Check$/i });
  await check.waitFor({ state: "visible", timeout: 3000 });
  const box = await check.boundingBox();
  if (!box) throw new Error("Check has no box");
  if (box.x + box.width < 8 || box.x > viewport.width - 8) {
    throw new Error(`Check off-screen x=${box.x} w=${box.width} vw=${viewport.width}`);
  }
  if (box.y + 8 < 0) throw new Error(`Check above viewport y=${box.y}`);
  if (box.y > viewport.height) {
    throw new Error(`Check below viewport y=${box.y} vh=${viewport.height}`);
  }
}

async function dragKnown(page, dots) {
  const box = await dots.first().boundingBox();
  if (!box) throw new Error("known dot has no box");
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 48, y, { steps: 8 });
  await page.mouse.up();
}

async function assertWhyMove(browser, url, viewport, how) {
  const ctx = await browser.newContext({ viewport });
  await ctx.addInitScript(watchCatalog);
  const page = await ctx.newPage();
  page.setDefaultTimeout(12000);
  const first = await firstGotoLeftover(page, url);
  if (how === "drag") await dragKnown(page, first.dots);
  else if (how === "take-all") await page.locator("[data-known-group]").first().click({ timeout: 1500 });
  else await first.dots.first().click({ force: true });
  if (await first.check.count()) throw new Error(`leftover Check present before why-move wait (${how} ${viewport.width})`);
  await page.waitForTimeout(450);
  if (!(await first.check.count())) throw new Error(`leftover Check missing after ${how} why-move ${viewport.width}`);
  await assertKeypadOnScreen(page, viewport);
  await ctx.close();
}

async function assertFirstVisitLeftover(browser, url) {
  const desk = { width: 1280, height: 800 };
  const tablet = { width: 768, height: 1024 };
  await assertWhyMove(browser, url, desk, "drag");
  await assertWhyMove(browser, url, desk, "take-all");
  await assertWhyMove(browser, url, desk, "click");
  await assertWhyMove(browser, url, tablet, "drag");
  await assertWhyMove(browser, url, tablet, "click");
}

const preview = await ensurePreview();
let browser;
try {
  browser = await launchBrowser();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await context.addInitScript(seedStorage);
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  await page.goto(rawBase, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => (document.querySelector("#app")?.innerText || "").length > 8);
  const coins1 = (await page.locator('button[aria-label="Coins"]').innerText()).trim();
  const heading1 = await page.locator("h1").first().innerText();
  const saved = await page.locator("[data-saved='1']").count();
  if (coins1 !== "12" || !/Maya/.test(heading1) || !saved) {
    throw new Error(`first paint coins=${coins1} heading=${heading1} saved=${saved}`);
  }
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => (document.querySelector("#app")?.innerText || "").length > 8);
  const coins2 = (await page.locator('button[aria-label="Coins"]').innerText()).trim();
  const heading2 = await page.locator("h1").first().innerText();
  const stored = await page.evaluate(() => {
    const raw = localStorage.getItem("g3-path-v2");
    const p = JSON.parse(raw || "null");
    return p?.state?.coins ?? p?.coins;
  });
  if (coins2 !== "12" || stored !== 12 || !/Maya/.test(heading2)) {
    throw new Error(`after reload coins=${coins2} stored=${stored} heading=${heading2}`);
  }
  console.log("persist-reload OK coins=12 name=Maya");

  await assertFirstVisitLeftover(browser, rawBase);
  console.log("first-visit leftover OK first goto + drag + take-all + mouse click at 1280 and 768");

  for (const vp of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 820, height: 1180 },
    { width: 1024, height: 768 },
    { width: 1280, height: 800 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ]) {
    const lay = await browser.newContext({ viewport: vp });
    await lay.addInitScript(watchCatalog);
    const p = await lay.newPage();
    p.setDefaultTimeout(12000);
    const first = await firstGotoLeftover(p, rawBase);
    await assertBoardLayout(p, vp);
    await p.screenshot({ path: join(shotDir, `leftover-${vp.width}x${vp.height}.png`) });
    const catalog = await p.evaluate(() => window.__G3_CATALOG === true);
    if (catalog) throw new Error(`catalog on ${vp.width} first goto`);
    await first.dots.first().click({ force: true });
    await p.waitForTimeout(450);
    await assertKeypadOnScreen(p, vp);
    await p.screenshot({ path: join(shotDir, `leftover-key-${vp.width}x${vp.height}.png`) });
    await lay.close();
    console.log(`leftover layout OK ${vp.width}x${vp.height}`);
  }
} finally {
  if (browser) await browser.close();
  if (preview) preview.kill();
}
