import { spawn } from "node:child_process";
import { chromium } from "playwright-core";
import { resolve } from "node:path";
import { mkdirSync, readFileSync } from "node:fs";
const port = Number(process.env.ACADEMY_PORT ?? 4197);
const base = process.env.PREVIEW_URL ?? `http://127.0.0.1:${port}/`;
const server = process.env.PREVIEW_URL ? null : spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], { cwd: "dist-domain", stdio: "ignore" });
let browser;
const errors = [];
const output = resolve(process.env.SHOTS_DIR ?? "docs/screenshots") + "/";
mkdirSync(output, { recursive: true });
try {
  for (let i=0;i<30;i++) { try { if ((await fetch(base)).ok) break; } catch {} await new Promise(r=>setTimeout(r,100)); }
  try { browser = await chromium.launch({ channel: "chrome", headless: true }); }
  catch { browser = await chromium.launch({ headless: true }); }
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce", serviceWorkers: "block" });
  page.on("pageerror", e => errors.push(String(e)));
  page.on("response", r => { if (r.status() >= 400 && new URL(r.url()).origin === new URL(base).origin) errors.push(`${r.status()} ${r.url()}`); });
  await page.addInitScript(() => {
    Math.random = () => (218.1 / 0xffffffff);
    localStorage.setItem("squishee-academy-v1", JSON.stringify({ version: 13, activeId: "c-shot", sound: false, lang: "en", langChosen: true, children: [{ id: "c-shot", name: "Ada", grade: "2", avatarId: "peach" }] }));
  });
  await page.goto(base, { waitUntil: "networkidle" });
  for (const [id, suffix] of [["k-bunny-hat", "hat"], ["g1-duck-fish", "fish"], ["g2-bear-boat", "boat"], ["g2-owl-night", "night"], ["k-penguin-cup", "cup"]]) {
    await page.goto(base + "#/stories/" + id, { waitUntil: "networkidle" });
    await page.locator("[data-story-phase='page']").waitFor();
    await page.locator(".ac-story-prop img").waitFor();
    await page.evaluate(async () => { await Promise.all([...document.images].map(im => im.decode().catch(()=>{}))); });
    const bad = await page.evaluate(() => [...document.images].filter(im => !im.complete || !im.naturalWidth).map(im=>im.src));
    if (bad.length) throw Error(`broken images ${bad}`);
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error(`overflow in ${id}`);
    await page.screenshot({ path: output + `story-bg-${process.env.PHASE ?? "after"}-${suffix}.png` });
    console.log("scene", await page.locator(".ac-story-scene").boundingBox());
    console.log(id, await page.locator(".ac-story-line").innerText());
  }
  if (process.env.FULL_CHECK === "1") {
    let pages = 0;
    const source = readFileSync("src/academy/stories/catalog.ts", "utf8") + readFileSync("src/academy/stories/shelf.ts", "utf8");
    const books = [...source.matchAll(/id: "([^"]+)",\s+title:/g)].map((match) => match[1]);
    for (const id of books) {
      await page.goto(base + "#/stories/" + id, { waitUntil: "networkidle" });
      const count = await page.locator(".ac-story-count i").count();
      for (let index = 0; index < count; index += 1) {
        await page.locator(`[data-story-page='${index}']`).waitFor();
        await page.evaluate(async () => { await Promise.all([...document.images].map(im => im.decode())); });
        if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error(`overflow ${id}/${index}`);
        pages += 1;
        if (index < count - 1) await page.locator("[data-story-next]").click();
      }
    }
    console.log(`Full coverage: ${books.length} books, ${pages} pages, all background/prop/pal decodes OK.`);
    await page.setViewportSize({ width: 820, height: 900 });
    await page.goto(base + "#/stories/g2-bear-boat", { waitUntil: "networkidle" });
    await page.evaluate(async () => { await Promise.all([...document.images].map(im => im.decode())); });
    console.log("Wide scene", await page.locator(".ac-story-scene").boundingBox());
    await page.screenshot({ path: output + "story-bg-after-boat-wide.png" });
    await page.setViewportSize({ width: 390, height: 844 });
    // Init script is replaced in a separate page so it cannot reset locale on reload.
    const rtl = await browser.newPage({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
    await rtl.addInitScript(() => localStorage.setItem("squishee-academy-v1", JSON.stringify({ version: 13, activeId: "c-shot", sound: false, lang: "ar", langChosen: true, children: [{ id: "c-shot", name: "Ada", grade: "2", avatarId: "peach" }] })));
    await rtl.goto(base + "#/stories/g2-owl-night", { waitUntil: "networkidle" });
    await rtl.locator("[data-story-phase='page'][dir='rtl']").waitFor();
    await rtl.evaluate(async () => { await Promise.all([...document.images].map(im => im.decode())); });
    if (await rtl.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error("RTL overflow");
    await rtl.screenshot({ path: output + "story-bg-after-night-ar.png" });
    await rtl.close();
    console.log("Wide and Arabic RTL phone checks OK.");
  }
  if (errors.length) throw Error(errors.join("\n"));
  console.log("No broken images, page errors or phone overflow.");
} finally { if(browser) await browser.close(); if(server) server.kill(); }
