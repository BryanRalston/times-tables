import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createConnection } from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const shotDir = join(ROOT, "scripts", "playtest-out", "portals");
mkdirSync(shotDir, { recursive: true });

const PAIRS = [
  [2, 19],
  [96, 97],
  [104, 106],
  [107, 102],
  [54, 75],
  [98, 57],
  [99, 100],
  [69, 101],
];

const FIRST_NEIGHBOR = {
  2: 1,
  19: 6,
  54: 95,
  57: 79,
  69: 68,
  75: 41,
  96: 15,
  97: 23,
  98: 58,
  99: 63,
  100: 83,
  101: 88,
  102: 25,
  104: 12,
  106: 43,
  107: 38,
};

function seedGuest(hopperAt, steps = 3) {
  const leftover = { plays: 1, best: 4, last: 4, stars: 3, misses: [] };
  const kid = {
    name: "",
    stars: 3,
    seenWelcome: true,
    activities: {
      "u1-leftover": leftover,
      "u1-friends": leftover,
      "u2-groups": leftover,
    },
    badges: [],
    shaky: {},
    sessions: {},
    squishees: [],
    coins: 0,
    attempts: {},
    perfectWalks: 0,
    facts: {},
    bests: {},
    today: {},
    runHonest: {},
    pathHopperAt: hopperAt,
    pathNowSeen: hopperAt,
    pathHopSpent: 1,
    pathStepsLeft: steps,
    openedPresents: [12, 17, 21, 25],
    hopperId: "",
    cosmetics: [],
    equippedCosmetic: "",
  };
  return {
    state: {
      version: 16,
      learnerId: "kid-1",
      classUnitId: "",
      pathGrade: 3,
      skipWeekend: true,
      locale: "en",
      soundOn: false,
      testMode: false,
      learners: { "kid-1": kid },
      ...kid,
    },
    version: 0,
  };
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
  if (await portOpen(4173)) return null;
  const child = spawn("npm", ["run", "preview"], { stdio: "inherit", shell: true, cwd: ROOT });
  for (let i = 0; i < 60; i++) {
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

async function readBoard(page) {
  return page.evaluate(() => {
    const map = document.querySelector("[data-grade-path]");
    const hopper = document.querySelector("[data-path-hopper]");
    const here = document.querySelector("[data-pad-here='1']");
    const choices = [...document.querySelectorAll("[data-pad-choice='1']")].map((el) =>
      Number(el.getAttribute("data-pad-id")),
    );
    const enterable = [...document.querySelectorAll("[data-pad-enterable='1']")].map((el) =>
      Number(el.getAttribute("data-pad-id")),
    );
    return {
      testFree: map?.getAttribute("data-test-free-move"),
      steps: map?.getAttribute("data-dice-steps"),
      hopTo: hopper?.getAttribute("data-path-hop-to"),
      warp: hopper?.getAttribute("data-path-warp"),
      here: here ? Number(here.getAttribute("data-pad-id")) : null,
      choices,
      enterable,
    };
  });
}

async function openLessons(page, pad) {
  await page.addInitScript((save) => {
    localStorage.setItem("g3-path-v2", JSON.stringify(save));
  }, seedGuest(pad, 3));
  await page.goto("http://127.0.0.1:4173/times-tables/#/lessons", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("[data-grade-path]");
  await page.waitForTimeout(150);
}

async function tapPad(page, id) {
  const hit = await page.evaluate((padId) => {
    const el = document.querySelector(`[data-pad-id="${padId}"]`);
    if (!el) return { ok: false };
    el.scrollIntoView({ block: "center", inline: "center" });
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const onScreen = x >= 0 && y >= 0 && x <= window.innerWidth && y <= window.innerHeight;
    if (!onScreen) {
      el.click();
      return { ok: true, x, y, onScreen: false };
    }
    return { ok: true, x, y, onScreen: true };
  }, id);
  if (!hit.ok) throw new Error(`missing pad ${id}`);
  if (hit.onScreen) await page.mouse.click(hit.x, hit.y);
}

async function waitSettled(page, expectPad, timeout = 2500) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const st = await readBoard(page);
    if (st.warp === "0" && Number(st.hopTo) === expectPad && st.here === expectPad) return st;
    await page.waitForTimeout(40);
  }
  return readBoard(page);
}

async function main() {
  const preview = await ensurePreview();
  const browser = await launchBrowser();
  const results = [];
  const pairOf = new Map();
  for (const [a, b] of PAIRS) {
    pairOf.set(a, b);
    pairOf.set(b, a);
  }
  const portals = [...pairOf.keys()].sort((a, b) => a - b);

  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    });
    await openLessons(page, 1);
    const boot = await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem("g3-path-v2") || "{}");
      return {
        testMode: raw.state?.testMode ?? null,
        pathGrade: raw.state?.pathGrade ?? null,
        name: raw.state?.name ?? null,
      };
    });
    const bootBoard = await readBoard(page);
    results.push({ kind: "boot", boot, bootBoard });
    if (boot.testMode !== false) throw new Error("testMode must be off");
    if (bootBoard.testFree !== "0") throw new Error("free move must be off");
    await page.screenshot({ path: join(shotDir, "guest-boot-plaza.png") });
    await page.close();
  }

  for (const portal of portals) {
    const from = FIRST_NEIGHBOR[portal];
    const dest = pairOf.get(portal);
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    });
    await openLessons(page, from);
    let st = await readBoard(page);
    if (st.here !== from) {
      await page.screenshot({ path: join(shotDir, `fail-stand-${portal}-wanted-${from}-got-${st.here}.png`) });
      results.push({ kind: "fail-stand", portal, from, dest, here: st.here });
      await page.close();
      continue;
    }
    const glow = st.enterable.includes(portal);
    if (!glow) {
      await page.screenshot({ path: join(shotDir, `fail-no-glow-${portal}-from-${from}.png`) });
      results.push({ kind: "fail-glow", portal, from, dest, enterable: st.enterable, choices: st.choices });
      await page.close();
      continue;
    }
    await page.screenshot({ path: join(shotDir, `glow-${portal}-from-${from}.png`) });
    await tapPad(page, portal);
    st = await waitSettled(page, dest);
    const ok = Number(st.hopTo) === dest && st.here === dest && st.warp === "0";
    await page.screenshot({ path: join(shotDir, `${ok ? "warp" : "fail"}-${portal}-to-${dest}.png`) });
    results.push({
      kind: ok ? "ok" : "fail-warp",
      portal,
      from,
      dest,
      hopTo: st.hopTo,
      here: st.here,
      warp: st.warp,
      steps: st.steps,
    });
    await page.close();
  }

  writeFileSync(join(shotDir, "results.json"), JSON.stringify(results, null, 2));
  const fails = results.filter((r) => String(r.kind).startsWith("fail"));
  console.log(JSON.stringify({ total: portals.length, fails: fails.length, results }, null, 2));
  await browser.close();
  if (preview) preview.kill();
  if (fails.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
