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

function welcomeUrl(base) {
  const u = new URL(base);
  u.hash = "#/play/welcome";
  return u.href;
}

async function firstGotoPhoneLeftover(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => (document.querySelector("#app")?.innerText || "").length > 8, null, { timeout: 12000 });
  const text = await page.locator("#app").innerText();
  if (!text.includes("6 + n = 10")) throw new Error(`phone first visit missing leftover board: ${text.slice(0, 220)}`);
  if (/Play leftover/i.test(text)) throw new Error("phone first visit showed Play leftover CTA");
  if (/Start today's walk/i.test(text)) throw new Error("phone first visit showed today's walk CTA");
  if (/The year map/i.test(text)) throw new Error("phone first visit showed year map");
  if (/Your answer/i.test(text)) throw new Error("phone first visit YOUR ANSWER chrome");
  if (/\b1\/4\b/.test(text)) throw new Error("phone first visit 1/4 progress");
  if (/Take the dots you can see/i.test(text)) throw new Error("phone first visit lecture caption");
  const catalog = await page.evaluate(() => window.__G3_CATALOG === true);
  if (catalog) throw new Error("catalog painted on phone first navigation (not leftover-first)");
  const hash = await page.evaluate(() => location.hash);
  if (hash !== "#/play/welcome") throw new Error(`phone first visit hash ${hash}, want #/play/welcome`);
  if (await page.locator("[data-welcome-leftover]").count() < 1) throw new Error("phone first visit missing leftover kiosk");
  const check = page.getByRole("button", { name: /^Check$/i });
  if (await check.count()) throw new Error("phone first visit Check before why-move");
  const skip = page.getByRole("button", { name: /^Skip$/i });
  if (await skip.count()) throw new Error("phone first visit Skip before why-move");
  const dots = page.getByRole("button", { name: "dot" });
  const n = await dots.count();
  if (n !== 6) throw new Error(`phone first visit knowns ${n}, want 6`);
  return { check, dots };
}

async function firstGotoShell(page, url, viewport) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => (document.querySelector("#app")?.innerText || "").length > 8, null, { timeout: 12000 });
  const text = await page.locator("#app").innerText();
  if (await page.locator("[data-welcome-leftover]").count()) {
    throw new Error(`${viewport.width} first visit leftover kiosk`);
  }
  if (/Play leftover/i.test(text)) throw new Error(`${viewport.width} first visit Play leftover CTA`);
  if (!/Start today's walk/i.test(text)) throw new Error(`${viewport.width} first visit missing today's walk: ${text.slice(0, 180)}`);
  if (!/The year map/i.test(text)) throw new Error(`${viewport.width} first visit missing year map`);
  const home = page.getByRole("button", { name: /^Home$/i });
  const lessons = page.getByRole("button", { name: /^Lessons$/i });
  const shelf = page.getByRole("button", { name: /^Shelf$/i });
  if (!(await home.count()) || !(await lessons.count()) || !(await shelf.count())) {
    throw new Error(`${viewport.width} first visit missing Home|Lessons|Shelf`);
  }
  const hash = await page.evaluate(() => location.hash);
  if (hash && hash !== "#/" && hash !== "") {
    throw new Error(`${viewport.width} first visit hash ${hash}, want #/`);
  }
}

async function assertPhoneBoard(page, viewport) {
  const board = page.locator("[data-leftover-board]");
  const box = await board.boundingBox();
  if (!box) throw new Error("phone leftover board has no box");
  const fill = box.width / viewport.width;
  console.log(
    `phone board ${viewport.width}x${viewport.height} x=${Math.round(box.x)} w=${Math.round(box.width)} h=${Math.round(box.height)} fill=${fill.toFixed(2)}`,
  );
  if (box.x + box.width > viewport.width + 8) {
    throw new Error(`phone leftover overflow x=${box.x} w=${box.width} vw=${viewport.width}`);
  }
  if (fill < 0.8) throw new Error(`phone leftover fill ${fill.toFixed(2)} w=${box.width}`);
}

async function assertClassroomCard(page, viewport) {
  const board = page.locator("[data-leftover-board]");
  const box = await board.boundingBox();
  if (!box) throw new Error("leftover board has no box");
  const cx = box.x + box.width / 2;
  const mid = viewport.width / 2;
  const fill = box.width / viewport.width;
  console.log(
    `card ${viewport.width}x${viewport.height} x=${Math.round(box.x)} w=${Math.round(box.width)} h=${Math.round(box.height)} fill=${fill.toFixed(2)}`,
  );
  if (Math.abs(cx - mid) > Math.max(48, viewport.width * 0.12)) {
    throw new Error(`leftover card not centered cx=${cx} vw=${viewport.width}`);
  }
  if (fill > 0.82) {
    throw new Error(`leftover billboard fill ${fill.toFixed(2)} w=${box.width} vw=${viewport.width}`);
  }
  if (fill < 0.35) {
    throw new Error(`leftover stamp fill ${fill.toFixed(2)} w=${box.width} vw=${viewport.width}`);
  }
  if (box.height > viewport.height * 0.72) {
    throw new Error(`leftover billboard height h=${box.height} vh=${viewport.height}`);
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

async function leftoverPlayable(browser, url, viewport, how) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  page.setDefaultTimeout(12000);
  await page.goto(welcomeUrl(url), { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => (document.querySelector("#app")?.innerText || "").length > 8, null, { timeout: 12000 });
  if (await page.locator("[data-welcome-leftover]").count()) {
    throw new Error(`leftover kiosk at ${viewport.width} (quietWelcome should not strip md+)`);
  }
  if (!(await page.getByRole("button", { name: /^Home$/i }).count()) && !(await page.getByText("← Home").count())) {
    throw new Error(`leftover at ${viewport.width} missing Home control`);
  }
  const dots = page.getByRole("button", { name: "dot" });
  const n = await dots.count();
  if (n !== 6) throw new Error(`leftover knowns ${n} at ${viewport.width}`);
  await assertClassroomCard(page, viewport);
  const check = page.getByRole("button", { name: /^Check$/i });
  if (how === "drag") await dragKnown(page, dots);
  else if (how === "take-all") await page.locator("[data-known-group]").first().click({ timeout: 1500 });
  else await dots.first().click({ force: true });
  if (await check.count()) throw new Error(`leftover Check present before why-move wait (${how} ${viewport.width})`);
  await page.waitForTimeout(450);
  if (!(await check.count())) throw new Error(`leftover Check missing after ${how} why-move ${viewport.width}`);
  await assertKeypadOnScreen(page, viewport);
  await ctx.close();
}

async function assertPhoneWhyMove(browser, url, how) {
  const viewport = { width: 390, height: 844 };
  const ctx = await browser.newContext({ viewport });
  await ctx.addInitScript(watchCatalog);
  const page = await ctx.newPage();
  page.setDefaultTimeout(12000);
  const first = await firstGotoPhoneLeftover(page, url);
  if (how === "drag") await dragKnown(page, first.dots);
  else if (how === "take-all") await page.locator("[data-known-group]").first().click({ timeout: 1500 });
  else await first.dots.first().click({ force: true });
  if (await first.check.count()) throw new Error(`phone leftover Check present before why-move wait (${how})`);
  await page.waitForTimeout(450);
  if (!(await first.check.count())) throw new Error(`phone leftover Check missing after ${how} why-move`);
  await assertKeypadOnScreen(page, viewport);
  await ctx.close();
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

  const phoneVp = { width: 390, height: 844 };
  const phoneCtx = await browser.newContext({ viewport: phoneVp });
  await phoneCtx.addInitScript(watchCatalog);
  const phonePage = await phoneCtx.newPage();
  phonePage.setDefaultTimeout(12000);
  await firstGotoPhoneLeftover(phonePage, rawBase);
  await assertPhoneBoard(phonePage, phoneVp);
  await phonePage.screenshot({ path: join(shotDir, "leftover-390x844.png") });
  await phoneCtx.close();
  await assertPhoneWhyMove(browser, rawBase, "click");
  await assertPhoneWhyMove(browser, rawBase, "drag");
  await assertPhoneWhyMove(browser, rawBase, "take-all");
  console.log("phone first-visit leftover OK");

  for (const vp of [
    { width: 768, height: 1024 },
    { width: 1280, height: 800 },
  ]) {
    const lay = await browser.newContext({ viewport: vp });
    const p = await lay.newPage();
    p.setDefaultTimeout(12000);
    await firstGotoShell(p, rawBase, vp);
    await p.screenshot({ path: join(shotDir, `shell-${vp.width}x${vp.height}.png`) });
    await lay.close();
    console.log(`md+ first-visit shell OK ${vp.width}x${vp.height}`);
  }

  await leftoverPlayable(browser, rawBase, { width: 768, height: 1024 }, "click");
  await leftoverPlayable(browser, rawBase, { width: 768, height: 1024 }, "drag");
  await leftoverPlayable(browser, rawBase, { width: 1280, height: 800 }, "click");
  await leftoverPlayable(browser, rawBase, { width: 1280, height: 800 }, "drag");
  console.log("leftover classroom card click+drag OK at 768 and 1280");

  for (const vp of [
    { width: 390, height: 844 },
    { width: 1280, height: 800 },
  ]) {
    const ctx = await browser.newContext({ viewport: vp });
    await ctx.addInitScript(seedStorage);
    const p = await ctx.newPage();
    p.setDefaultTimeout(12000);
    const u = new URL(rawBase);
    u.hash = "#/play/activity/u1-tally";
    await p.goto(u.href, { waitUntil: "domcontentloaded" });
    await p.waitForFunction(() => (document.querySelector("#app")?.innerText || "").length > 8, null, { timeout: 12000 });
    const text = await p.locator("#app").innerText();
    if (!/Sort every picture/i.test(text)) throw new Error(`tally ${vp.width} missing sort heading: ${text.slice(0, 200)}`);
    if (await p.getByRole("button", { name: /^Check$/i }).count()) {
      throw new Error(`tally ${vp.width} Check/keypad during sort`);
    }
    const rail = await p.locator("button.w-full.justify-start").count();
    if (rail) throw new Error(`tally ${vp.width} ChoiceList rail during sort (${rail})`);
    const srcs = await p.evaluate(() =>
      [...document.querySelectorAll("#app img")].map((img) => img.getAttribute("src") || img.src).filter(Boolean),
    );
    const toys = srcs.filter((s) => /squishees\/[a-z0-9-]+\.(png|jpg)/i.test(s));
    if (toys.length < 6) throw new Error(`tally ${vp.width} squishee imgs ${toys.length} srcs=${srcs.slice(0, 8).join(",")}`);
    const origin = new URL(rawBase).origin;
    const bad = [];
    for (const src of [...new Set(toys)]) {
      const abs = src.startsWith("http") ? src : origin + src;
      const res = await p.request.get(abs);
      if (res.status() !== 200) bad.push(`${abs}→${res.status()}`);
    }
    if (bad.length) throw new Error(`tally ${vp.width} img 404 ${bad.join(" ")}`);
    const dead = await p.evaluate(() =>
      [...document.querySelectorAll("#app span")].some((s) => (s.textContent || "").trim() === "?"),
    );
    if (dead) throw new Error(`tally ${vp.width} mascot died to ?`);
    await p.screenshot({ path: join(shotDir, `tally-${vp.width}x${vp.height}.png`) });
    await ctx.close();
    console.log(`tally sort OK ${vp.width}x${vp.height} imgs=${toys.length}`);
  }
} finally {
  if (browser) await browser.close();
  if (preview) preview.kill();
}
