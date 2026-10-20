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
  const line = await page.locator(".ac-story-line").innerText();
  if (!line.toLowerCase().includes("peach can see a cat")) throw new Error(`page text ${line}`);
  await page.locator("[data-story-word='peach']").click();
  await page.locator("[data-story-read]").click();
  const pages = await page.locator(".ac-story-count i").count();
  if (pages < 4) throw new Error(`pages ${pages}`);
  for (let i = 0; i < pages; i += 1) await page.locator("[data-story-next]").click();
  await page.locator("[data-story-phase='check']").waitFor();
  await page.locator("[data-story-choice='pig']").click();
  await page.locator("[data-story-phase='page']").waitFor();
  const again = await page.locator(".ac-story-line").innerText();
  if (!again.toLowerCase().includes("peach can see a cat")) throw new Error(`reteach ${again}`);
  await page.locator("[data-story-next]").click();
  await page.locator("[data-story-check='0']").waitFor();
  await page.locator("[data-story-choice='cat']").click();
  await page.locator("[data-story-check='1']").waitFor();
  await page.locator("[data-story-choice='cat']").click();
  await page.locator("[data-story-phase='done']").waitFor({ timeout: 8000 });
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
  await page.goto(`${base}#/stories/pk-peach-cat`, { waitUntil: "networkidle" });
  await page.locator("[data-story-word='cat']").click();
  await page.waitForResponse((res) => res.url().includes("/voice/") && res.ok(), { timeout: 8000 });
  await page.evaluate(async () => navigator.serviceWorker.ready);
  if (server) server.kill();
  await sleep(200);
  await page.context().setOffline(true);
  const offline = await page.reload({ waitUntil: "domcontentloaded" });
  if (!offline || !offline.ok()) throw new Error(`offline reload status ${offline?.status()}`);
  await page.locator(".ac-story-line").waitFor({ timeout: 8000 });
  const offlineText = await page.locator(".ac-story-line").innerText();
  if (!offlineText.toLowerCase().includes("peach")) throw new Error(`offline text ${offlineText}`);
  const clip = await page.evaluate(async () => {
    const word = document.querySelector("[data-story-word]");
    word?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    const src = document.querySelector("[data-story-word='peach']");
    const key = src instanceof HTMLElement ? src.dataset.storyWord : "";
    const links = performance.getEntriesByType("resource").map((row) => row.name).filter((name) => name.includes("/voice/"));
    const sample = links[links.length - 1];
    if (!sample) return { key, ok: false, status: 0 };
    const res = await fetch(sample);
    return { key, ok: res.ok, status: res.status };
  });
  if (!clip.ok) throw new Error(`offline clip ${JSON.stringify(clip)}`);
  if (failures.length) throw new Error(failures.join("\n"));
  if (foreign.length) throw new Error(`off-device request ${foreign[0]}`);
  console.log("stories playtest ok");
} finally {
  await browser.close();
  if (server && server.exitCode == null) server.kill();
}
