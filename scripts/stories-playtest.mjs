import { spawn } from "node:child_process";
import { chromium } from "playwright-core";

const port = Number(process.env.ACADEMY_PORT ?? 4183);
const base = process.env.PLAYTEST_URL ?? `http://127.0.0.1:${port}/`;

function startServer() {
  if (process.env.PLAYTEST_URL) return null;
  return spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
    cwd: "dist-domain",
    stdio: "ignore",
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function launch() {
  try {
    return await chromium.launch({ channel: "chrome", headless: true });
  } catch {
    return chromium.launch({ headless: true });
  }
}

async function overflow(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    return { scroll: root.scrollWidth, inner: window.innerWidth };
  });
}

const server = startServer();
if (server) await sleep(400);

const browser = await launch();
const page = await browser.newPage();
const failures = [];
const foreign = [];
page.on("pageerror", (err) => failures.push(String(err)));
page.on("request", (req) => {
  const url = new URL(req.url());
  if (url.origin !== new URL(base).origin && url.protocol !== "data:") foreign.push(url.origin + url.pathname);
});

async function readBook(width) {
  await page.setViewportSize({ width, height: width < 500 ? 844 : 900 });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.getByLabel("Your name").fill("Ada");
  await page.getByRole("button", { name: "2", exact: true }).click();
  await page.getByRole("button", { name: "Play" }).click();
  await page.locator("[data-stories='open']").click();
  await page.locator("[data-story-id='pk-peach-cat']").click();
  await page.locator("[data-story-phase='page']").waitFor();
  const line = (await page.locator(".ac-story-line").innerText()).replace(/\s+/g, " ").trim();
  if (!line.toLowerCase().includes("peach can see a cat")) throw new Error(`page text ${line}`);
  const laidOut = await page.evaluate(() => {
    const words = [...document.querySelectorAll(".ac-story-word")].map((el) => {
      const box = el.getBoundingClientRect();
      return { y: Math.round(box.y), h: Math.round(box.height) };
    });
    const ys = new Set(words.map((word) => word.y));
    return { words: words.length, rows: ys.size, tall: words.some((word) => word.h < 44) };
  });
  if (laidOut.words < 4) throw new Error(`words ${JSON.stringify(laidOut)}`);
  if (laidOut.rows > 2) throw new Error(`words stacked ${JSON.stringify(laidOut)}`);
  if (laidOut.tall) throw new Error(`tap target ${JSON.stringify(laidOut)}`);
  const stage = await page.evaluate(() => {
    const scene = document.querySelector(".ac-story-scene")?.getBoundingClientRect();
    const pals = [...document.querySelectorAll(".ac-story-pal")].map((el) => {
      const box = el.getBoundingClientRect();
      return {
        w: Math.round(box.width),
        h: Math.round(box.height),
        top: Math.round(box.top),
        bottom: Math.round(box.bottom),
        natural: el instanceof HTMLImageElement ? el.naturalWidth : 0,
      };
    });
    return {
      scene: scene ? { top: Math.round(scene.top), bottom: Math.round(scene.bottom), h: Math.round(scene.height) } : null,
      pals,
    };
  });
  if (!stage.scene || stage.pals.length < 2) throw new Error(`stage ${JSON.stringify(stage)}`);
  for (const pal of stage.pals) {
    if (pal.natural < 64) throw new Error(`pal art ${JSON.stringify(stage)}`);
    if (pal.h < 140) throw new Error(`pal size ${JSON.stringify(stage)}`);
    if (pal.top < stage.scene.top - 1 || pal.bottom > stage.scene.bottom + 1) throw new Error(`pal clipped ${JSON.stringify(stage)}`);
  }
  await page.screenshot({ path: `/workspace/story-${width}.png`, fullPage: true });
  await page.locator("[data-story-word='peach']").click();
  await page.locator("[data-story-read]").click();
  const pages = await page.locator(".ac-story-count i").count();
  if (pages < 4) throw new Error(`pages ${pages}`);
  for (let i = 0; i < pages; i += 1) await page.locator("[data-story-next]").click();
  await page.locator("[data-story-phase='check']").waitFor();
  if (width === 390) await page.screenshot({ path: "/workspace/story-check.png", fullPage: true });
  await page.locator("[data-story-choice='pig']").click();
  await page.locator("[data-story-phase='page']").waitFor();
  const again = (await page.locator(".ac-story-line").innerText()).replace(/\s+/g, " ").trim();
  if (!again.toLowerCase().includes("peach can see a cat")) throw new Error(`reteach ${again}`);
  await page.locator("[data-story-next]").click();
  await page.locator("[data-story-check='0']").waitFor();
  await page.locator("[data-story-choice='cat']").click();
  await page.locator("[data-story-check='1']").waitFor();
  await page.locator("[data-story-choice='cat']").click();
  await page.locator("[data-story-phase='done']").waitFor({ timeout: 8000 });
  if (width === 390) await page.screenshot({ path: "/workspace/story-done.png", fullPage: true });
  await page.waitForFunction(() => {
    const raw = localStorage.getItem("squishee-academy-v1");
    const save = raw ? JSON.parse(raw) : null;
    const child = save?.children?.find((row) => row.id === save.activeId) ?? save?.children?.[0];
    return (child?.stars ?? 0) > 0;
  });
  const stars = await page.evaluate(() => {
    const raw = localStorage.getItem("squishee-academy-v1");
    const save = raw ? JSON.parse(raw) : null;
    const child = save?.children?.find((row) => row.id === save.activeId) ?? save?.children?.[0];
    return {
      stars: child?.stars ?? 0,
      coins: child?.coins ?? 0,
      bond: child?.bonds?.peach ?? 0,
      story: child?.skills?.["story:pk-peach-cat"] ?? null,
      journey: child?.journey?.stop ?? null,
    };
  });
  if (stars.stars < 1) throw new Error(`stars ${JSON.stringify(stars)}`);
  if (stars.coins < 2) throw new Error(`coins ${JSON.stringify(stars)}`);
  if (stars.bond < 1) throw new Error(`bond ${JSON.stringify(stars)}`);
  if (!stars.story || stars.story.ok < 1) throw new Error(`skill ${JSON.stringify(stars)}`);
  const box = await overflow(page);
  if (box.scroll > box.inner + 1) throw new Error(`overflow ${width} ${box.scroll} > ${box.inner}`);
}

try {
  await readBook(390);
  await readBook(820);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("[data-story-phase='done'] a.ac-go").click();
  await page.locator("[data-stories='open']").waitFor();
  await page.locator("[data-story-id='pk-peach-cat']").click();
  await page.locator("[data-story-phase='page']").waitFor();
  await page.evaluate(async () => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: "networkidle" });
  const controlling = await page.evaluate(() => Boolean(navigator.serviceWorker.controller));
  if (!controlling) throw new Error("service worker did not control the page");
  await page.locator("[data-story-phase='page']").waitFor();
  const voiceWait = page.waitForResponse((res) => res.url().includes("/voice/") && res.ok(), { timeout: 8000 });
  await page.locator("[data-story-word='peach']").click();
  const voice = await voiceWait;
  const voiceUrl = voice.url();
  await page.waitForFunction(
    async (url) => {
      const names = await caches.keys();
      for (const name of names) {
        const hit = await (await caches.open(name)).match(url);
        if (hit) return true;
      }
      return false;
    },
    voiceUrl,
    { timeout: 8000 },
  );
  if (server) server.kill();
  await sleep(200);
  await page.context().setOffline(true);
  const offline = await page.reload({ waitUntil: "domcontentloaded" });
  if (!offline || !offline.ok()) throw new Error(`offline reload status ${offline?.status()}`);
  await page.locator(".ac-story-line").waitFor({ timeout: 8000 });
  const offlineText = (await page.locator(".ac-story-line").innerText()).replace(/\s+/g, " ");
  if (!offlineText.toLowerCase().includes("peach")) throw new Error(`offline text ${offlineText}`);
  await page.locator("[data-story-word='peach']").click();
  await page.locator("[data-story-word='peach'].is-now").waitFor({ timeout: 8000 });
  const clip = await page.evaluate(async (url) => {
    const res = await fetch(url);
    const bytes = res.ok ? (await res.arrayBuffer()).byteLength : 0;
    return { ok: res.ok, status: res.status, bytes };
  }, voiceUrl);
  if (!clip.ok || clip.bytes < 200) throw new Error(`offline clip ${JSON.stringify(clip)}`);
  if (failures.length) throw new Error(failures.join("\n"));
  if (foreign.length) throw new Error(`off-device request ${foreign[0]}`);
  console.log("stories playtest ok");
} finally {
  await browser.close();
  if (server && server.exitCode == null) server.kill();
}
