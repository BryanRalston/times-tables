import { spawn } from "node:child_process";
import { createConnection } from "node:net";
import { chromium } from "playwright-core";

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
  console.log(
    `board ${viewport.width}x${viewport.height} x=${Math.round(box.x)} w=${Math.round(box.width)} h=${Math.round(box.height)} cx=${Math.round(cx)}`,
  );
  if (Math.abs(cx - mid) > Math.max(80, viewport.width * 0.12)) {
    throw new Error(
      `leftover not centered cx=${cx} vw=${viewport.width} x=${box.x} w=${box.width}`,
    );
  }
  if (viewport.width <= 430) {
    if (box.x + box.width > viewport.width + 8) {
      throw new Error(`phone leftover overflow x=${box.x} w=${box.width} vw=${viewport.width}`);
    }
    if (box.width < 240) throw new Error(`phone leftover too narrow ${box.width}`);
    return;
  }
  const minW = Math.min(420, viewport.width * 0.55);
  if (box.width < minW) throw new Error(`leftover too narrow ${box.width} vw=${viewport.width}`);
  if (box.height < 150) throw new Error(`leftover too short ${box.height}`);
  if (box.width < viewport.width * 0.35 && box.x < viewport.width * 0.15) {
    throw new Error(`postage-stamp leftover x=${box.x} w=${box.width} vw=${viewport.width}`);
  }
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

async function assertFirstVisitLeftover(browser, url) {
  const dragCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await dragCtx.addInitScript(watchCatalog);
  const dragPage = await dragCtx.newPage();
  dragPage.setDefaultTimeout(12000);
  const drag = await firstGotoLeftover(dragPage, url);
  await dragKnown(dragPage, drag.dots);
  if (await drag.check.count()) throw new Error("leftover Check present before why-move wait (drag)");
  await dragPage.waitForTimeout(450);
  if (!(await drag.check.count())) throw new Error("leftover Check missing after drag why-move");
  await dragCtx.close();

  const takeCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await takeCtx.addInitScript(watchCatalog);
  const takePage = await takeCtx.newPage();
  takePage.setDefaultTimeout(12000);
  const take = await firstGotoLeftover(takePage, url);
  await takePage.locator("[data-known-group]").first().click({ timeout: 1500 });
  if (await take.check.count()) throw new Error("leftover Check present before why-move wait (take-all)");
  await takePage.waitForTimeout(450);
  if (!(await take.check.count())) throw new Error("leftover Check missing after take-all why-move");
  await takeCtx.close();

  const clickCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await clickCtx.addInitScript(watchCatalog);
  const clickPage = await clickCtx.newPage();
  clickPage.setDefaultTimeout(12000);
  const click = await firstGotoLeftover(clickPage, url);
  await click.dots.first().click({ force: true });
  if (await click.check.count()) throw new Error("leftover Check present before why-move wait (mouse click)");
  await clickPage.waitForTimeout(450);
  if (!(await click.check.count())) throw new Error("leftover Check missing after mouse click why-move");
  await assertKeypadOnScreen(clickPage, { width: 1280, height: 800 });
  await clickCtx.close();
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
  console.log("first-visit leftover OK first goto + drag + take-all + mouse click");

  for (const vp of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1280, height: 800 },
    { width: 1440, height: 900 },
  ]) {
    const lay = await browser.newContext({ viewport: vp });
    await lay.addInitScript(watchCatalog);
    const p = await lay.newPage();
    p.setDefaultTimeout(12000);
    const first = await firstGotoLeftover(p, rawBase);
    await assertBoardLayout(p, vp);
    const catalog = await p.evaluate(() => window.__G3_CATALOG === true);
    if (catalog) throw new Error(`catalog on ${vp.width} first goto`);
    await first.dots.first().click({ force: true });
    await p.waitForTimeout(450);
    await assertKeypadOnScreen(p, vp);
    await lay.close();
    console.log(`leftover layout OK ${vp.width}x${vp.height}`);
  }
} finally {
  if (browser) await browser.close();
  if (preview) preview.kill();
}
