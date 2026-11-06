import { spawn } from "node:child_process";
import { chromium } from "playwright-core";
import { resolve } from "node:path";
import { mkdirSync } from "node:fs";
import { PROP_ART_FILES } from "./academy-prop-assets.mjs";
const port = Number(process.env.ACADEMY_PORT ?? 4197);
const base = `http://127.0.0.1:${port}/`;
const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], { cwd: "dist-domain", stdio: "ignore" });
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
  for (const [id, suffix] of [["k-bunny-hat", "hat"], ["g1-duck-fish", "fish"], ["g2-bear-boat", "boat"], ["g1-fox-kite", "kite"]]) {
    await page.goto(base + "#/stories/" + id, { waitUntil: "networkidle" });
    await page.locator("[data-story-phase='page']").waitFor();
    await page.locator(".ac-story-prop img").waitFor();
    await page.evaluate(async () => { await Promise.all([...document.images].map(im => im.decode().catch(()=>{}))); });
    const bad = await page.evaluate(() => [...document.images].filter(im => !im.complete || !im.naturalWidth).map(im=>im.src));
    if (bad.length) throw Error(`broken images ${bad}`);
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error(`overflow in ${id}`);
    await page.screenshot({ path: output + `story-objects-after-${suffix}.png` });
    console.log(id, await page.locator(".ac-story-line").innerText());
  }
  await page.goto(base + "#/play/problems", { waitUntil: "networkidle" });
  await page.locator(".ac-qcard").waitFor();
  await page.locator(".ac-qcard .ac-problem-object").first().waitFor();
  await page.evaluate(async () => { await Promise.all([...document.images].map(im => im.decode().catch(()=>{}))); });
  await page.screenshot({ path: output + "story-objects-after-wordproblems.png" });
  console.log("Word problems", await page.locator(".ac-qcard").innerText());
  console.log("Object count", await page.locator(".ac-qcard .ac-problem-object").count());
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error("Word Problems overflow");
  for (const rel of PROP_ART_FILES) {
    const result = await page.evaluate(async (rel) => { const im=new Image();im.src=rel;await im.decode(); return {w:im.naturalWidth,h:im.naturalHeight}; }, rel);
    if (result.w !== 512 || result.h !== 512) throw Error(`bad asset ${rel}`);
  }
  if (errors.length) throw Error(errors.join("\n"));
  console.log("All 18 browser image decodes OK; no broken images, page errors or phone overflow.");
} finally { if(browser) await browser.close(); server.kill(); }
