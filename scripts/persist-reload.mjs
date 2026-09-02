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

async function assertFirstVisitLeftover(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => (document.querySelector("#app")?.innerText || "").length > 8, null, { timeout: 12000 });
  const text = await page.locator("#app").innerText();
  if (!text.includes("6 + n = 10")) throw new Error(`first visit missing leftover board: ${text.slice(0, 220)}`);
  if (/Play leftover/i.test(text)) throw new Error("first visit showed Play leftover CTA");
  if (/Start today's walk/i.test(text)) throw new Error("first visit showed today's walk CTA");
  if (/The year map/i.test(text)) throw new Error("first visit showed year map");
  const check = page.getByRole("button", { name: /^Check$/i });
  if (await check.count()) throw new Error("first visit Check before why-move");
  const skip = page.getByRole("button", { name: /^Skip$/i });
  if (await skip.count()) throw new Error("first visit Skip before why-move");
  const dots = page.getByRole("button", { name: "dot" });
  const n = await dots.count();
  if (n !== 6) throw new Error(`first visit knowns ${n}, want 6`);
  await dots.first().click({ timeout: 1500 });
  if (await check.count()) throw new Error("leftover Check present before why-move wait");
  await page.waitForTimeout(450);
  if (!(await check.count())) throw new Error("leftover Check missing after why-move");
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

  const fresh = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const first = await fresh.newPage();
  first.setDefaultTimeout(12000);
  await assertFirstVisitLeftover(first, rawBase);
  await fresh.close();
  console.log("first-visit leftover OK 6 + n = 10");
} finally {
  if (browser) await browser.close();
  if (preview) preview.kill();
}
