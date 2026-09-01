import { spawn } from "node:child_process";
import { createConnection } from "node:net";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright-core";

const rawBase = process.env.PLAYTEST_URL ?? "http://127.0.0.1:4173/times-tables/";
const outDir = resolve("scripts/playtest-out/boards");
mkdirSync(outDir, { recursive: true });

const ACTIVITIES = [
  "welcome",
  "u1-leftover",
  "u1-friends",
  "u1-coins",
  "u1-tally",
  "u1-graph",
  "u2-place",
  "u2-word",
  "u2-build",
  "u2-expanded",
  "u2-compare",
  "u2-order",
  "u3-groups",
  "u3-jumps",
  "u3-array",
  "u3-factor",
  "u3-share",
  "u3-family",
  "u4-name",
  "u4-sides",
  "u4-vs",
  "u4-attr",
  "u4-combine",
  "u4-subdivide",
  "u5-name",
  "u5-line",
  "u5-unit",
  "u5-leftover",
  "u5-mixed",
  "u5-set",
  "u6-facts",
  "u6-array",
  "u6-factor",
  "u6-skip",
  "u6-picto",
  "u7-add",
  "u7-take",
  "u7-compare",
  "u7-estimate",
  "u7-exact",
  "u7-pattern",
  "u7-bar",
  "u8-length",
  "u8-mass",
  "u8-volume",
  "u8-unit",
  "u8-area",
  "u8-peri",
  "u8-missing",
  "u9-groups",
  "u9-array",
  "u9-factor",
  "u9-family",
  "u9-mix",
  "u10-equiv",
  "u10-compare",
  "u10-bench",
  "u10-order",
  "u10-line",
  "u11-clock",
  "u11-match",
  "u11-elapsed",
  "u11-count",
  "u11-compare",
  "u11-make",
  "u11-change",
  "u12-six",
  "u12-mix",
  "u12-factor",
  "u12-family",
  "u12-array",
  "u13-two",
  "u13-compute",
  "u13-pattern",
  "u13-measure",
  "u13-area",
];

const CHROME = [
  ["home", "#/"],
  ["lessons", "#/lessons"],
  ["shelf", "#/shelf"],
  ["grownup", "#/grownup"],
];

const MEASURE_IDS = ["u8-length", "u8-mass", "u8-volume", "u13-measure"];

function playUrl(hash) {
  const u = new URL(rawBase);
  if (!u.pathname.endsWith("/")) u.pathname += "/";
  u.searchParams.set("qa", "1");
  u.hash = hash.startsWith("#") ? hash : `#${hash}`;
  return u.href;
}

function activityHash(id) {
  return id === "welcome" ? "#/play/welcome" : `#/play/activity/${id}`;
}

function seedStorage() {
  const kid = {
    name: "Maya",
    stars: 8,
    seenWelcome: true,
    activities: {},
    badges: [],
    shaky: {},
    sessions: {},
    squishees: ["frog", "cat", "panda"],
    coins: 80,
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

function hashSeed(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rngFromSeed(seed) {
  let a = hashSeed(seed);
  const next = () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    pick(arr) {
      return arr[Math.floor(next() * arr.length)];
    },
  };
}

function pickMiniKind(seed) {
  return rngFromSeed(seed).pick(["match", "who-hid", "poke"]);
}

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function miniSeeds() {
  const date = todayIso();
  const found = {};
  for (const id of ACTIVITIES) {
    const kind = pickMiniKind(`minigame:kid-1:${id}:${date}`);
    if (!found[kind]) found[kind] = id;
    if (found.match && found["who-hid"] && found.poke) break;
  }
  return found;
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
  } catch (e) {
    console.warn("chrome channel missing:", String(e).slice(0, 160));
    return await chromium.launch({ headless: true });
  }
}

async function waitApp(page) {
  await page.waitForSelector("#app");
  await page.waitForFunction(() => (document.querySelector("#app")?.innerText || "").length > 8, null, { timeout: 12000 });
}

async function waitBoard(page, id) {
  await waitApp(page);
  await page.waitForFunction(
    (act) => {
      const q = window.__G3_Q;
      if (!q) return false;
      const hash = location.hash || "";
      if (act === "welcome") {
        if (!hash.includes("welcome")) return false;
      } else if (!hash.includes(act)) {
        return false;
      }
      const app = document.querySelector("#app");
      if (!app) return false;
      const text = (app.innerText || "").replace(/\s+/g, " ");
      if (text.length < 20) return false;
      const pic = app.querySelector("img, svg, canvas");
      const btns = app.querySelectorAll("button");
      return Boolean(pic) || btns.length >= 4;
    },
    id,
    { timeout: 15000 },
  );
  await page
    .waitForFunction(() => {
      const imgs = [...document.querySelectorAll("#app img")];
      return imgs.every((img) => img.complete && (img.naturalWidth > 0 || img.getBoundingClientRect().width < 2));
    }, null, { timeout: 8000 })
    .catch(() => undefined);
  await page.waitForTimeout(180);
}

async function waitChrome(page) {
  await waitApp(page);
  await page
    .waitForFunction(() => {
      const imgs = [...document.querySelectorAll("#app img")];
      return imgs.every((img) => img.complete && (img.naturalWidth > 0 || img.getBoundingClientRect().width < 2));
    }, null, { timeout: 8000 })
    .catch(() => undefined);
  // persist skipHydration + rehydrate (~400ms). Seeded name is Maya.
  await page.waitForFunction(() => /Maya|Coins:\s*[1-9]/i.test(document.body.innerText || ""), null, { timeout: 4000 }).catch(() => undefined);
  await page.waitForTimeout(200);
}

async function shot(page, name) {
  const path = resolve(outDir, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  return path;
}

async function measureSidecar(page, id, viewport) {
  return page.evaluate(
    ({ id, viewport }) => {
      const q = window.__G3_Q ?? {};
      const fill = document.querySelector("[data-beaker-fill]");
      const rotateEl = [...document.querySelectorAll("g[transform]")].find((g) => /rotate\(/.test(g.getAttribute("transform") || ""));
      const rot = rotateEl?.getAttribute("transform") || null;
      const pointer = document.querySelector("polygon");
      return {
        id,
        viewport,
        prompt: q.prompt ?? null,
        answer: q.answer ?? null,
        value: q.value ?? null,
        max: q.max ?? null,
        unit: q.unit ?? null,
        attribute: q.attribute ?? null,
        checkDisabled: q.checkDisabled ?? null,
        fillY: fill?.getAttribute("data-fill-y") ?? null,
        fillValue: fill?.getAttribute("data-value") ?? null,
        fillMax: fill?.getAttribute("data-max") ?? null,
        scaleRotate: rot,
        pointerPoints: pointer?.getAttribute("points") ?? null,
        snip: (document.querySelector("#app")?.innerText || "").slice(0, 280).replace(/\s+/g, " "),
      };
    },
    { id, viewport },
  );
}

async function skipToMinigame(page, activityId) {
  await page.goto(playUrl(activityHash(activityId)), { waitUntil: "domcontentloaded" });
  await waitBoard(page, activityId);
  for (let n = 0; n < 16; n++) {
    const t = await page.locator("#app").innerText();
    if (/Find the pairs|Who hid\?|Poke the /i.test(t)) {
      if (/Who hid\?/i.test(t)) await page.waitForTimeout(2600);
      return page.locator("#app").innerText();
    }
    const skip = page.getByRole("button", { name: /^Skip$/i });
    if (await skip.count()) await skip.first().click();
    else break;
    await page.waitForTimeout(220);
  }
  return page.locator("#app").innerText();
}

function miniKindFromText(t) {
  if (/Find the pairs/i.test(t)) return "match";
  if (/Who hid\?/i.test(t)) return "who-hid";
  if (/Poke the /i.test(t)) return "poke";
  return null;
}

const measureMeta = [];
const log = [];

const preview = await ensurePreview();
let browser;
try {
  browser = await launchBrowser();
} catch (e) {
  if (preview) preview.kill();
  throw e;
}

const seeds = miniSeeds();
console.log("mini seeds", seeds);

for (const [vpName, viewport] of [
  ["phone", { width: 390, height: 844 }],
  ["desk", { width: 1280, height: 800 }],
]) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await context.addInitScript(seedStorage);
  const page = await context.newPage();
  page.setDefaultTimeout(12000);

  for (const [name, hash] of CHROME) {
    try {
      await page.goto(playUrl(hash), { waitUntil: "domcontentloaded" });
      await waitChrome(page);
      await shot(page, `${vpName}-${name}`);
      log.push({ viewport: vpName, id: name, ok: true });
      console.log(`SHOT ${vpName}-${name}`);
    } catch (e) {
      log.push({ viewport: vpName, id: name, ok: false, note: String(e).slice(0, 160) });
      try {
        await shot(page, `${vpName}-${name}`);
      } catch {
        /* ignore */
      }
      console.log(`FAIL ${vpName}-${name} ${String(e).slice(0, 120)}`);
    }
  }

  for (const id of ACTIVITIES) {
    try {
      await page.goto(playUrl(activityHash(id)), { waitUntil: "domcontentloaded" });
      await waitBoard(page, id);
      await shot(page, `${vpName}-${id}`);
      if (MEASURE_IDS.includes(id)) {
        measureMeta.push(await measureSidecar(page, id, vpName));
      }
      const hook = await page.evaluate(() => window.__G3_Q ?? null);
      log.push({
        viewport: vpName,
        id,
        ok: true,
        prompt: hook?.prompt ?? null,
        answer: hook?.answer ?? null,
        checkDisabled: hook?.checkDisabled ?? null,
        kind: hook?.kind ?? null,
        attribute: hook?.attribute ?? null,
        unit: hook?.unit ?? null,
        value: hook?.value ?? null,
        max: hook?.max ?? null,
      });
      console.log(`SHOT ${vpName}-${id}`);
    } catch (e) {
      log.push({ viewport: vpName, id, ok: false, note: String(e).slice(0, 180) });
      try {
        await shot(page, `${vpName}-${id}`);
      } catch {
        /* ignore */
      }
      console.log(`FAIL ${vpName}-${id} ${String(e).slice(0, 120)}`);
    }
  }

  const seenMini = new Set();
  for (const kind of ["match", "who-hid", "poke"]) {
    const act = seeds[kind];
    if (!act) continue;
    try {
      const t = await skipToMinigame(page, act);
      const got = miniKindFromText(t);
      const name = got ?? kind;
      if (seenMini.has(name)) continue;
      seenMini.add(name);
      await shot(page, `${vpName}-mini-${name}`);
      log.push({ viewport: vpName, id: `mini-${name}`, ok: Boolean(got), activity: act, snip: t.slice(0, 160).replace(/\s+/g, " ") });
      console.log(`SHOT ${vpName}-mini-${name} via ${act}`);
    } catch (e) {
      log.push({ viewport: vpName, id: `mini-${kind}`, ok: false, note: String(e).slice(0, 160) });
      console.log(`FAIL ${vpName}-mini-${kind} ${String(e).slice(0, 120)}`);
    }
  }

  await context.close();
}

await browser.close();
if (preview) preview.kill();

writeFileSync(resolve(outDir, "measure.json"), JSON.stringify(measureMeta, null, 2));
writeFileSync(resolve(outDir, "dump-log.json"), JSON.stringify({ activities: ACTIVITIES, chrome: CHROME.map((c) => c[0]), log, measureMeta }, null, 2));
const fails = log.filter((r) => !r.ok);
console.log(`\nDUMP ${log.length} FAIL ${fails.length} out=${outDir}`);
if (fails.length) process.exitCode = 1;
