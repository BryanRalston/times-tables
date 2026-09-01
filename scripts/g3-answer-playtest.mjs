import { spawn } from "node:child_process";
import { createConnection } from "node:net";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright-core";

const rawBase = process.env.PLAYTEST_URL ?? "http://127.0.0.1:4173/times-tables/";

function playUrl(hash) {
  const u = new URL(rawBase);
  if (!u.pathname.endsWith("/")) u.pathname += "/";
  u.searchParams.set("qa", "1");
  u.hash = hash.startsWith("#") ? hash : `#${hash}`;
  return u.href;
}
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
    try {
      return await chromium.launch({ headless: true });
    } catch (e2) {
      console.error(
        "Playwright could not launch Chrome. Install Google Chrome (channel: chrome) or Playwright browsers. scripts/g3-answer-playtest.mjs is still in the repo. npm run test:play did not run the product checks.",
      );
      process.exit(2);
    }
  }
}

async function waitApp(page) {
  await page.waitForSelector("#app");
  await page.waitForFunction(() => (document.querySelector("#app")?.innerText || "").length > 8, null, { timeout: 12000 });
}

async function qa(page) {
  return page.evaluate(() => window.__G3_Q ?? null);
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
        if (!img.complete || img.naturalWidth > 0) return false;
        const box = img.getBoundingClientRect();
        return box.width >= 2 && box.height >= 2;
      })
      .map((img) => img.getAttribute("src") || "");
  });
}

async function interactIfNeeded(page) {
  for (let i = 0; i < 12; i++) {
    const hook = await qa(page);
    if (!hook?.checkDisabled) return;
    const dots = page.getByRole("button", { name: "dot" });
    if (await dots.count()) {
      await dots.first().click({ timeout: 1500 }).catch(() => undefined);
      await page.waitForTimeout(80);
      continue;
    }
    const groups = page.locator("button[aria-label^='group']");
    if (await groups.count()) {
      await groups.first().click({ timeout: 1500 }).catch(() => undefined);
      await page.waitForTimeout(80);
      continue;
    }
    const piece = page.getByRole("button", { name: /^piece /i });
    if (await piece.count()) {
      await piece.first().click({ timeout: 1500 }).catch(() => undefined);
      await page.waitForTimeout(80);
      continue;
    }
    const coin = page.locator("#app button").filter({ has: page.locator("img[src*='money/']") });
    if (await coin.count()) {
      await coin.first().click({ timeout: 1500 }).catch(() => undefined);
      await page.waitForTimeout(80);
      continue;
    }
    const nMark = page.locator("svg text").filter({ hasText: /^n$/ });
    if (await nMark.count()) {
      await nMark.first().click({ timeout: 1500 }).catch(() => undefined);
      await page.waitForTimeout(80);
      continue;
    }
    const tray = page.locator(".border-dashed button");
    if (await tray.count()) {
      const label = (await tray.first().getAttribute("aria-label")) || "";
      await tray.first().click({ timeout: 1500 }).catch(() => undefined);
      const cat = page.locator("button.w-20").filter({ hasText: new RegExp(`^${label}$`, "i") });
      if (await cat.count()) await cat.first().click({ timeout: 1500 }).catch(() => undefined);
      else {
        const any = page.locator("#app button").filter({ hasText: new RegExp(`^${label}$`, "i") });
        if (await any.count()) await any.first().click({ timeout: 1500 }).catch(() => undefined);
      }
      await page.waitForTimeout(80);
      continue;
    }
    break;
  }
}

async function typeAnswer(page, answer) {
  const hook = await qa(page);
  if (!hook) return "skip";
  if (hook.input === "choice") {
    const btn = page.getByRole("button", { name: answer, exact: true });
    if (await btn.count()) {
      await btn.first().click();
      return "clicked";
    }
    return "skip";
  }
  if (hook.input === "compare") {
    const btn = page.getByRole("button", { name: answer, exact: true });
    if (await btn.count()) {
      await btn.first().click();
      return "clicked";
    }
    return "skip";
  }
  if (hook.input === "order") {
    for (const part of answer.split(" ")) {
      const btn = page.getByRole("button", { name: part, exact: true });
      if (await btn.count()) await btn.first().click();
    }
    const check = page.getByRole("button", { name: /^Check$/i });
    if (await check.count()) await check.first().click();
    return "typed";
  }
  if (hook.input === "clock") return "skip";
  for (const ch of answer) {
    if (ch === " ") continue;
    const buttons = page.getByRole("button", { name: ch, exact: true });
    const n = await buttons.count();
    let hit = false;
    for (let i = 0; i < n; i++) {
      if (await buttons.nth(i).isDisabled()) continue;
      await buttons.nth(i).click({ timeout: 2000 });
      hit = true;
      break;
    }
    if (!hit) return "skip";
  }
  const check = page.getByRole("button", { name: /^Check$/i });
  if ((await check.count()) && !(await check.first().isDisabled())) await check.first().click();
  else return "skip";
  return "typed";
}

async function statusOf(page) {
  return page.evaluate(() => {
    const t = document.body.innerText;
    if (/Try again/i.test(t)) return "wrong";
    if (/n is |n es |n é /i.test(t)) return "correct";
    if (document.querySelector(".border-good, .bg-good-soft")) return "correct";
    if (document.querySelector(".border-bad, .shake")) return "wrong";
    return "idle";
  });
}

async function shotFail(page, name) {
  const path = resolve(failDir, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  return path;
}

async function checkActivity(page, id, kind, viewport) {
  const row = { id, kind, ui: "ok", fn: "skip", note: "", viewport };
  try {
    await page.goto(playUrl(`#/play/activity/${id}`), { waitUntil: "domcontentloaded" });
    await waitApp(page);
    await page.waitForFunction(
      (act) => Boolean(window.__G3_Q) && location.hash.includes(act),
      id,
      { timeout: 8000 },
    );
    const hook = await qa(page);
    if (!hook) {
      row.ui = "fail";
      row.note = "missing __G3_Q (?qa=1)";
      await shotFail(page, `${viewport}-${id}`);
      return row;
    }
    const broken = await brokenImgs(page);
    if (broken.length) {
      row.ui = "fail";
      row.note = `broken img ${broken.slice(0, 3).join(",")}`;
      await shotFail(page, `${viewport}-${id}`);
      return row;
    }
    if ((id === "u1-leftover" || id === "u1-friends") && hook.needsInteract) {
      row.ui = "fail";
      row.note = "leftover gated Check";
      await shotFail(page, `${viewport}-${id}`);
      return row;
    }
    if (hook.needsInteract && (id === "u1-tally" || id === "u6-picto" || id === "u7-bar")) {
      if (!hook.checkDisabled) {
        row.ui = "fail";
        row.note = "collect Check enabled before sort";
        await shotFail(page, `${viewport}-${id}`);
        return row;
      }
    }
    if (id === "u4-combine") {
      const text = await page.locator("#app").innerText();
      if (!text.includes("?")) {
        row.ui = "fail";
        row.note = "combine missing ?";
        await shotFail(page, `${viewport}-${id}`);
        return row;
      }
    }
    if (viewport !== "desk") {
      row.fn = "skip";
      row.note = "phone UI only";
      return row;
    }
    if (kind === "graph" && hook.needsInteract) {
      await interactIfNeeded(page);
      const after = await qa(page);
      if (after?.checkDisabled) {
        row.fn = "skip";
        row.note = "collect still sorting";
        return row;
      }
    } else if (hook.checkDisabled) {
      await interactIfNeeded(page);
    }
    const did = await typeAnswer(page, hook.answer);
    if (did === "skip") {
      row.fn = "skip";
      row.note = `${hook.input} not auto-answered`;
      return row;
    }
    await page.waitForTimeout(500);
    const st = await statusOf(page);
    row.fn = st === "correct" ? "ok" : st === "wrong" ? "fail" : "skip";
    row.note = `${did} ${hook.answer} → ${st}`;
    if (row.fn === "fail") await shotFail(page, `${viewport}-${id}-fn`);
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

async function miniDesk(page) {
  await page.goto(playUrl("#/play/welcome"), { waitUntil: "domcontentloaded" });
  await waitApp(page);
  for (let n = 0; n < 6; n++) {
    const t = await page.locator("#app").innerText();
    if (/Find the pairs|Who hid\?|Poke the |Nice walk/i.test(t)) break;
    const hook = await qa(page);
    if (hook?.answer) {
      await typeAnswer(page, hook.answer);
      await page.waitForTimeout(900);
    } else {
      const skip = page.getByRole("button", { name: /^Skip$/i });
      if (await skip.count()) await skip.first().click();
      await page.waitForTimeout(300);
    }
  }
  await page.waitForTimeout(400);
  const t = await page.locator("#app").innerText();
  const png = await page.evaluate(
    () =>
      [...document.querySelectorAll("#app img")].filter(
        (img) => (img.getAttribute("src") || "").includes("squishees/") && img.naturalWidth > 0,
      ).length,
  );
  const videos = await page.locator("video").count();
  const emptyVid = await page.evaluate(() =>
    [...document.querySelectorAll("video")].some((v) => !v.src && v.offsetWidth > 8),
  );
  const ok = /Find the pairs|Who hid\?|Poke the |Nice walk/i.test(t) && !emptyVid;
  return { ok, png, videos, emptyVid, snip: t.slice(0, 160).replace(/\s+/g, " ") };
}

const preview = await ensurePreview();
const results = [];
let browser;
try {
  browser = await launchBrowser();
} catch (e) {
  if (preview) preview.kill();
  throw e;
}

for (const [name, viewport] of [
  ["desk", { width: 1280, height: 800 }],
  ["phone", { width: 390, height: 844 }],
]) {
  const context = await browser.newContext({ viewport });
  await context.addInitScript(seedStorage);
  const page = await context.newPage();
  page.setDefaultTimeout(10000);

  if (name === "desk") {
    try {
      const mini = await miniDesk(page);
      const fail = !mini.ok || (mini.png === 0 && !/Nice walk/i.test(mini.snip));
      results.push({
        id: "minigame-desk",
        kind: "minigame",
        ui: fail ? "fail" : "ok",
        fn: mini.ok ? "ok" : "fail",
        note: `png=${mini.png} video=${mini.videos} emptyVid=${mini.emptyVid} ${mini.snip}`,
      });
      if (fail) await shotFail(page, "minigame-desk");
    } catch (e) {
      results.push({ id: "minigame-desk", kind: "minigame", ui: "fail", fn: "fail", note: String(e).slice(0, 160) });
    }
  }

  for (const [id, kind] of ACTIVITIES) {
    const row = await checkActivity(page, id, kind, name);
    results.push(row);
    process.stdout.write(`${name} ${id} ui=${row.ui} fn=${row.fn} ${row.note}\n`);
  }
  await context.close();
}

await browser.close();
if (preview) preview.kill();

const fails = results.filter((r) => r.ui === "fail" || r.fn === "fail");
console.log(`\nTOTAL ${results.length} FAIL ${fails.length}`);
writeFileSync(resolve("scripts/playtest-out/g3-answer-report.json"), JSON.stringify({ results, fails }, null, 2));
if (fails.length) process.exit(1);
