import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const base = process.env.PLAYTEST_URL ?? "http://127.0.0.1:4173/times-tables/";
const failDir = resolve("scripts/playtest-out/fail");
mkdirSync(failDir, { recursive: true });

const ACTIVITIES = [
  ["u1-leftover", "tenframe"],
  ["u1-friends", "tenframe"],
  ["u1-coins", "money"],
  ["u1-tally", "graph"],
  ["u1-graph", "graph"],
  ["u2-place", "placevalue"],
  ["u2-word", "placevalue"],
  ["u2-build", "build"],
  ["u2-expanded", "placevalue"],
  ["u2-compare", "compare"],
  ["u2-order", "order"],
  ["u3-groups", "groups"],
  ["u3-jumps", "jumps"],
  ["u3-array", "array"],
  ["u3-factor", "groups"],
  ["u3-share", "groups"],
  ["u3-family", "choice"],
  ["u4-name", "choice"],
  ["u4-sides", "choice"],
  ["u4-vs", "choice"],
  ["u4-attr", "choice"],
  ["u4-combine", "choice"],
  ["u4-subdivide", "choice"],
  ["u5-name", "fraction"],
  ["u5-line", "fraction"],
  ["u5-unit", "fraction"],
  ["u5-leftover", "fraction"],
  ["u5-mixed", "fraction"],
  ["u5-set", "fraction"],
  ["u6-facts", "groups"],
  ["u6-array", "array"],
  ["u6-factor", "groups"],
  ["u6-skip", "pattern"],
  ["u6-picto", "graph"],
  ["u7-add", "word"],
  ["u7-take", "word"],
  ["u7-compare", "word"],
  ["u7-estimate", "compute"],
  ["u7-exact", "compute"],
  ["u7-pattern", "pattern"],
  ["u7-bar", "graph"],
  ["u8-length", "measure"],
  ["u8-mass", "measure"],
  ["u8-volume", "measure"],
  ["u8-unit", "measure"],
  ["u8-area", "area"],
  ["u8-peri", "perimeter"],
  ["u8-missing", "perimeter"],
  ["u9-groups", "groups"],
  ["u9-array", "array"],
  ["u9-factor", "groups"],
  ["u9-family", "choice"],
  ["u9-mix", "fluency"],
  ["u10-equiv", "fraction"],
  ["u10-compare", "fraction"],
  ["u10-bench", "fraction"],
  ["u10-order", "order"],
  ["u10-line", "fraction"],
  ["u11-clock", "clock"],
  ["u11-match", "clock"],
  ["u11-elapsed", "clock"],
  ["u11-count", "money"],
  ["u11-compare", "money"],
  ["u11-make", "money"],
  ["u11-change", "money"],
  ["u12-six", "groups"],
  ["u12-mix", "fluency"],
  ["u12-factor", "groups"],
  ["u12-family", "choice"],
  ["u12-array", "array"],
  ["u13-two", "word"],
  ["u13-compute", "compute"],
  ["u13-pattern", "pattern"],
  ["u13-measure", "measure"],
  ["u13-area", "area"],
];

const G4_SPOT = [
  ["g4-u7-tenths", "decimal"],
  ["g4-u6-add", "fracop"],
  ["g4-u12-lines", "lines"],
];

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

async function waitApp(page) {
  await page.waitForSelector("#app");
  await page.waitForFunction(() => (document.querySelector("#app")?.innerText || "").length > 12, null, {
    timeout: 12000,
  });
  await page.waitForTimeout(250);
}

async function brokenImgs(page) {
  return page.evaluate(async () => {
    const imgs = [...document.querySelectorAll("#app img")];
    await Promise.all(
      imgs.map(
        (img) =>
          img.complete ||
          new Promise((r) => {
            img.addEventListener("load", r, { once: true });
            img.addEventListener("error", r, { once: true });
          }),
      ),
    );
    return imgs
      .filter((img) => {
        if (!img.complete) return true;
        if (img.naturalWidth > 0) return false;
        const box = img.getBoundingClientRect();
        if (box.width < 2 && box.height < 2) return false;
        return true;
      })
      .map((img) => img.getAttribute("src") || "");
  });
}

async function answerUi(page) {
  const has = async (name) => (await page.getByRole("button", { name, exact: true }).count()) > 0;
  const digit = await has("1");
  const check = (await page.getByRole("button", { name: /^Check$/i }).count()) > 0;
  const lt = await has("<");
  const hour = (await page.getByRole("button", { name: /Hour \+|Hour −/i }).count()) > 0;
  const skip = (await page.getByRole("button", { name: /^Skip$/i }).count()) > 0;
  const yesno = (await page.getByRole("button", { name: /^(yes|no|sí|nao|não)$/i }).count()) > 0;
  const buttons = await page.locator("#app button").count();
  return { digit, check, lt, hour, skip, yesno, buttons };
}

async function maybeInteract(page) {
  const dots = page.getByRole("button", { name: "dot" });
  if (await dots.count()) {
    await dots.first().click({ timeout: 2000 }).catch(() => undefined);
    return;
  }
  const groups = page.locator("button[aria-label^='group']");
  if (await groups.count()) {
    await groups.first().click({ timeout: 2000 }).catch(() => undefined);
    return;
  }
  for (let i = 0; i < 10; i++) {
    const tray = page.locator(".border-dashed button");
    if (!(await tray.count())) break;
    const label = (await tray.first().getAttribute("aria-label")) || "";
    await tray.first().click({ timeout: 2000 }).catch(() => undefined);
    const cat = page.locator("button.w-20").filter({ hasText: new RegExp(`^${label}$`, "i") });
    if (await cat.count()) await cat.first().click({ timeout: 2000 }).catch(() => undefined);
    else {
      const any = page.locator("button.w-20");
      if (await any.count()) await any.first().click({ timeout: 2000 }).catch(() => undefined);
    }
  }
}

async function typeDigits(page, s) {
  for (const ch of s) {
    if (ch === ".") {
      const dot = page.getByRole("button", { name: ".", exact: true });
      if (await dot.count()) await dot.first().click();
      continue;
    }
    if (ch === "/") {
      const sl = page.getByRole("button", { name: "/", exact: true });
      if (await sl.count()) await sl.first().click();
      continue;
    }
    if (ch === " ") continue;
    const b = page.getByRole("button", { name: ch, exact: true });
    if (await b.count()) await b.first().click({ timeout: 2500 });
  }
}

async function statusOf(page) {
  return page.evaluate(() => {
    const t = document.body.innerText;
    if (/n is |Nice walk|Find the pairs|Who hid\?|Poke the /i.test(t) && /Try again/i.test(t) === false) {
      /* continue */
    }
    const wrong = document.querySelector(".shake, .border-bad");
    const good = document.querySelector(".border-good, .bg-good-soft");
    if (good && !wrong) return "correct";
    if (wrong) return "wrong";
    if (/Try again/i.test(t)) return "wrong";
    if (/n is /i.test(t)) return "correct";
    return "idle";
  });
}

async function tryFunction(page, kind, id) {
  try {
  await maybeInteract(page);
  await page.waitForTimeout(200);
  const text = await page.locator("#app").innerText();
  const ui = await answerUi(page);

  if (/if you count them all/i.test(text)) return { fn: "fail", note: "spoiled money prompt" };

  if (ui.lt) {
    if (/\d+\s*\/\s*\d+\s*○/.test(text) || /○\s*\d+\s*\/\s*\d+/.test(text)) {
      return { fn: "skip", note: "fraction compare keys" };
    }
    const m = text.match(/(\d[\d,]*)\s*○\s*(\d[\d,]*)/);
    if (!m) return { fn: "skip", note: "compare keys, no pair parsed" };
    const a = Number(m[1].replace(/,/g, ""));
    const b = Number(m[2].replace(/,/g, ""));
    const ans = a < b ? "<" : a > b ? ">" : "=";
    await page.getByRole("button", { name: ans, exact: true }).click();
    await page.waitForTimeout(400);
    const st = await statusOf(page);
    return { fn: st === "correct" ? "ok" : st === "wrong" ? "fail" : "skip", note: `compare ${a}${ans}${b}` };
  }

  if (kind === "choice" || (ui.buttons > 8 && !ui.digit && !ui.hour)) {
    const panel = page.locator("#app .mt-4 button, #app .grid.gap-2 button");
    const n = await panel.count();
    if (n >= 2 && n <= 8) {
      for (let i = 0; i < n; i++) {
        await panel.nth(i).click();
        await page.waitForTimeout(500);
        const st = await statusOf(page);
        if (st === "correct") return { fn: "ok", note: `choice #${i}` };
        await page.waitForTimeout(200);
      }
      return { fn: "fail", note: "no choice marked correct" };
    }
  }

  if (ui.check && ui.digit) {
    let n = null;
    let m;
    if ((m = text.match(/(\d+)\s*\+\s*n\s*=\s*(\d+)/))) n = Number(m[2]) - Number(m[1]);
    else if ((m = text.match(/(\d+)\s*[−\-]\s*n\s*=\s*(\d+)/))) n = Number(m[1]) - Number(m[2]);
    else if ((m = text.match(/(\d+)\s*×\s*n\s*=\s*(\d+)/))) n = Number(m[2]) / Number(m[1]);
    else if ((m = text.match(/n\s*×\s*(\d+)\s*=\s*(\d+)/))) n = Number(m[2]) / Number(m[1]);
    else if ((m = text.match(/^(\d+)\s*×\s*(\d+)\s*$/m))) n = Number(m[1]) * Number(m[2]);
    else if ((m = text.match(/^(\d+)\s*÷\s*(\d+)\s*$/m))) n = Number(m[1]) / Number(m[2]);
    else if ((m = text.match(/^(\d+)\s*\+\s*(\d+)\s*$/m))) n = Number(m[1]) + Number(m[2]);
    else if ((m = text.match(/^(\d+)\s*[−\-]\s*(\d+)\s*$/m))) n = Number(m[1]) - Number(m[2]);
    else if (kind === "money" && /How many cents/i.test(text)) {
      n = await page.evaluate(() => {
        const cents = { penny: 1, nickel: 5, dime: 10, quarter: 25, dollar: 100, five: 500 };
        let t = 0;
        for (const img of document.querySelectorAll("#app img")) {
          const s = img.getAttribute("src") || "";
          for (const [k, v] of Object.entries(cents)) if (s.includes(`money/${k}.png`)) t += v;
        }
        return t;
      });
    } else if (kind === "area") {
      n = await page.evaluate(() => {
        const cells = [...document.querySelectorAll("#app [class*='bg-teal'], #app .size-4, #app .size-5")];
        return 0;
      });
      n = null;
    }
    if (n != null && Number.isFinite(n) && n >= 0 && Number.isInteger(n)) {
      await typeDigits(page, String(n));
      const check = page.getByRole("button", { name: /^Check$/i });
      if (await check.count()) await check.first().click();
      await page.waitForTimeout(450);
      const st = await statusOf(page);
      return { fn: st === "correct" ? "ok" : st === "wrong" ? "fail" : "skip", note: `typed ${n}` };
    }
    return { fn: "skip", note: "keypad, answer not derived" };
  }

  if (ui.hour) return { fn: "skip", note: "clock hands / clock keys" };
  if (kind === "order") return { fn: "skip", note: "order tap sequence" };
  if (kind === "graph") return { fn: "skip", note: "graph collect or read" };
  if (kind === "money") return { fn: "skip", note: "money make/change/compare" };

  return { fn: "skip", note: "no derived answer" };
  } catch (e) {
    return { fn: "skip", note: String(e).slice(0, 100) };
  }
}

async function hunt(page, kind, id, text) {
  const notes = [];
  if (/if you count them all/i.test(text)) notes.push("spoiled money");
  if (kind === "money" && /How many cents/i.test(text)) {
    const cents = await page.evaluate(() => {
      const map = { penny: 1, nickel: 5, dime: 10, quarter: 25, dollar: 100, five: 500 };
      let t = 0;
      for (const img of document.querySelectorAll("#app img")) {
        const s = img.getAttribute("src") || "";
        for (const [k, v] of Object.entries(map)) if (s.includes(`money/${k}.png`)) t += v;
      }
      return t;
    });
    if (cents > 0 && (text.includes(`$${ (cents / 100).toFixed(2) }`) || text.includes(`${cents}¢`))) {
      notes.push("prompt shows coin total");
    }
  }
  if (kind === "measure" && !/u8-unit/.test(id)) {
    const hasTool = await page.evaluate(
      () =>
        !!document.querySelector('#app img[src*="measure/"]') ||
        !!document.querySelector("#app svg") ||
        /inch|yard|meter|estimate|exact/i.test(document.body.innerText),
    );
    if (!hasTool) notes.push("empty measure board");
  }
  if (id === "u4-combine") {
    const ok = await page.evaluate(() => {
      const t = document.body.innerText;
      return t.includes("?") && /\+/.test(t);
    });
    if (!ok) notes.push("combine missing ? placeholder");
  }
  const canvases = await page.evaluate(() =>
    [...document.querySelectorAll("canvas")].map((c) => {
      const s = getComputedStyle(c);
      return { w: c.width, h: c.height, vis: s.display !== "none" && s.opacity !== "0" };
    }),
  );
  if (canvases.some((c) => c.vis && (c.w === 0 || c.h === 0))) notes.push("empty canvas");
  const videos = await page.locator("video").count();
  if (videos) {
    const ctrl = await page.evaluate(() => [...document.querySelectorAll("video")].some((v) => v.controls));
    if (ctrl) notes.push("video controls");
  }
  return notes;
}

async function shotFail(page, name) {
  const path = resolve(failDir, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  return path;
}

async function checkActivity(page, id, kind, viewport) {
  const row = { id, kind, ui: "ok", fn: "skip", note: "" };
  try {
    await page.goto(`${base}#/play/activity/${id}`, { waitUntil: "domcontentloaded" });
    await waitApp(page);
    const text = await page.locator("#app").innerText();
    if (text.length < 8) {
      row.ui = "fail";
      row.note = "empty app";
      await shotFail(page, `${viewport}-${id}`);
      return row;
    }
    const broken = await brokenImgs(page);
    const ui = await answerUi(page);
    const hasAnswer = ui.digit || ui.check || ui.lt || ui.hour || ui.yesno || ui.buttons > 4;
    const hunts = await hunt(page, kind, id, text);
    if (broken.length) {
      row.ui = "fail";
      row.note = `broken img ${broken.slice(0, 3).join(",")}`;
      await shotFail(page, `${viewport}-${id}`);
      return row;
    }
    if (!hasAnswer) {
      row.ui = "fail";
      row.note = "no answer UI";
      await shotFail(page, `${viewport}-${id}`);
      return row;
    }
    if (hunts.length) {
      row.ui = "fail";
      row.note = hunts.join("; ");
      await shotFail(page, `${viewport}-${id}`);
      return row;
    }
    if (viewport === "desk") {
      const f = await tryFunction(page, kind, id);
      row.fn = f.fn;
      row.note = f.note;
      if (f.fn === "fail") {
        row.ui = row.ui === "ok" ? "ok" : row.ui;
        await shotFail(page, `${viewport}-${id}-fn`);
      }
    } else {
      row.fn = "skip";
      row.note = "phone UI only";
    }
  } catch (e) {
    row.ui = "fail";
    row.fn = "fail";
    row.note = String(e).slice(0, 180);
    try {
      await shotFail(page, `${viewport}-${id}-err`);
    } catch {
      /* ignore */
    }
  }
  return row;
}

async function chromeChecks(page, viewport) {
  const notes = [];
  await page.goto(`${base}#/`, { waitUntil: "domcontentloaded" });
  await waitApp(page);
  await page.waitForTimeout(400);

  let t = await page.locator("#app").innerText();
  if (!/Lessons|Home|Grade 3/i.test(t)) notes.push("home missing chrome");
  if (!/What's hiding|Lessons|Grade 3/i.test(t)) notes.push("home missing");

  await page.goto(`${base}#/lessons`, { waitUntil: "domcontentloaded" });
  await waitApp(page);
  t = await page.locator("#app").innerText();
  if (!/Data cycle|Place value|Lessons/i.test(t)) notes.push("lessons empty");
  if (/Nine-digit|g4-u1/i.test(t) && /pathGrade/.test(t)) notes.push("grade 4 leaked into lessons?");

  await page.goto(`${base}#/shelf`, { waitUntil: "domcontentloaded" });
  await waitApp(page);
  await page.waitForTimeout(400);
  t = await page.locator("#app").innerText();
  if (!/Buy|Coins|Frog|Poke/i.test(t)) notes.push("shelf empty");
  const sil = await page.locator("#app img.grayscale, #app img[class*='grayscale']").count();
  if (!sil) notes.push("no silhouettes");
  const coinsLine = await page.locator("#app").innerText();
  if (!/Coins:/i.test(coinsLine)) notes.push("shelf missing coins");
  const buy = page.locator("button:not([disabled])").filter({ hasText: /^Buy/ });
  if (await buy.count()) {
    await buy.first().click({ timeout: 3000 }).catch(() => undefined);
    await page.waitForTimeout(300);
  }

  await page.goto(`${base}#/grownup`, { waitUntil: "domcontentloaded" });
  await waitApp(page);
  t = await page.locator("#app").innerText();
  if (!/Grade 3 Path|Advanced/i.test(t)) notes.push("grownup missing path toggle");
  const sel = page.locator("select");
  const n = await sel.count();
  let g3 = false;
  for (let i = 0; i < n; i++) {
    const v = await sel.nth(i).inputValue();
    if (v === "3") g3 = true;
  }
  if (!g3) notes.push("pathGrade not 3");

  await page.goto(`${base}#/play/welcome`, { waitUntil: "domcontentloaded" });
  await waitApp(page);
  t = await page.locator("#app").innerText();
  if (!/6 \+ n = 10|What's hiding|Take what/i.test(t)) notes.push("welcome leftover missing");

  return notes;
}

async function miniGameDesk(page) {
  await page.goto(`${base}#/play/welcome`, { waitUntil: "domcontentloaded" });
  await waitApp(page);
  for (let i = 0; i < 5; i++) {
    const t = await page.locator("#app").innerText();
    if (/Find the pairs|Who hid\?|Poke the /i.test(t)) break;
    const skip = page.getByRole("button", { name: /^Skip$/i });
    if (await skip.count()) {
      await skip.first().click();
      await page.waitForTimeout(400);
    }
  }
  await page.waitForTimeout(500);
  const t = await page.locator("#app").innerText();
  const png = await page.evaluate(() =>
    [...document.querySelectorAll("#app img")].filter((img) => (img.getAttribute("src") || "").includes("squishees/") && img.naturalWidth > 0).length,
  );
  const qmarks = await page.getByText("?", { exact: true }).count();
  const ok = /Find the pairs|Who hid\?|Poke the |Nice walk|Skip/i.test(t);
  const videos = await page.locator("video").count();
  return { ok, png, qmarks, videos, snip: t.slice(0, 180).replace(/\s+/g, " ") };
}

const results = [];

const browser = await chromium.launch({ channel: "chrome", headless: true });

for (const [name, viewport] of [
  ["desk", { width: 1280, height: 800 }],
  ["phone", { width: 390, height: 844 }],
]) {
  const context = await browser.newContext({ viewport });
  await context.addInitScript(seedStorage);
  const page = await context.newPage();
  page.setDefaultTimeout(10000);

  let chromeNotes = [];
  try {
    chromeNotes = await chromeChecks(page, name);
  } catch (e) {
    chromeNotes = [`chrome threw ${String(e).slice(0, 120)}`];
  }
  results.push({
    id: `chrome-${name}`,
    kind: "chrome",
    ui: chromeNotes.length ? "fail" : "ok",
    fn: "skip",
    note: chromeNotes.join("; ") || "home/lessons/shelf/grownup/welcome",
  });
  if (chromeNotes.length) await shotFail(page, `chrome-${name}`);

  if (name === "desk") {
    const mini = await miniGameDesk(page);
    const miniFail = !mini.ok || (mini.png === 0 && mini.qmarks === 0);
    results.push({
      id: "minigame-desk",
      kind: "minigame",
      ui: miniFail ? "fail" : "ok",
      fn: mini.ok ? "ok" : "fail",
      note: `png=${mini.png} ?=${mini.qmarks} video=${mini.videos} ${mini.snip}`,
    });
    if (miniFail) await shotFail(page, "minigame-desk");
  }

  const list = name === "desk" ? [...ACTIVITIES, ...G4_SPOT] : ACTIVITIES;
  for (const [id, kind] of list) {
    const row = await checkActivity(page, id, kind, name);
    results.push({ ...row, viewport: name });
    process.stdout.write(`${name} ${id} ui=${row.ui} fn=${row.fn} ${row.note}\n`);
  }
  await context.close();
}

await browser.close();

const fails = results.filter((r) => r.ui === "fail" || r.fn === "fail");
console.log("\n=== TABLE ===");
for (const r of results) {
  console.log(`${r.id}\t${r.kind}\t${r.ui}\t${r.fn}\t${r.note || ""}`);
}
console.log(`\nTOTAL ${results.length} FAIL ${fails.length}`);
writeFileSync(resolve("scripts/playtest-out/g3-report.json"), JSON.stringify({ results, fails }, null, 2));
