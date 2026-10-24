import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { createConnection } from "node:net";
import { resolve } from "node:path";
import { chromium } from "playwright-core";

const PORT = 5174;
const BASE = `http://127.0.0.1:${PORT}/times-tables/academy/`;
const OUT = resolve("academy/public/shots");
const GAMES = [
  "times",
  "add",
  "time",
  "money",
  "sight",
  "spelling",
  "count",
  "place",
  "shapes",
  "fractions",
  "measure",
  "phonics",
  "problems",
  "variables",
  "graphs",
  "share",
  "grid",
  "patterns",
];

function portOpen(port) {
  return new Promise((res) => {
    const socket = createConnection({ port, host: "127.0.0.1" }, () => {
      socket.end();
      res(true);
    });
    socket.on("error", () => res(false));
  });
}

async function ensureDev() {
  if (await portOpen(PORT)) return null;
  const child = spawn("npm", ["run", "dev:academy"], { stdio: "inherit", shell: true });
  for (let i = 0; i < 80; i++) {
    if (await portOpen(PORT)) return child;
    await new Promise((r) => setTimeout(r, 250));
  }
  child.kill();
  throw new Error("academy dev server did not start");
}

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: "chrome", headless: true });
  } catch {
    return await chromium.launch({ headless: true });
  }
}

const server = await ensureDev();
mkdirSync(OUT, { recursive: true });
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 480, height: 720 }, deviceScaleFactor: 1 });
  await page.addInitScript(() => {
    localStorage.setItem(
      "squishee-academy-v1",
      JSON.stringify({
        version: 11,
        activeId: "c-shot",
        sound: false,
        lang: "en",
        langChosen: true,
        children: [{ id: "c-shot", name: "Sam", grade: "4", avatarId: "peach" }],
      }),
    );
    const style = document.createElement("style");
    style.textContent = ".for-grownups{display:none !important}";
    document.documentElement.appendChild(style);
  });
  for (const id of GAMES) {
    await page.goto(`${BASE}#/play/${id}`, { waitUntil: "domcontentloaded" });
    await page.locator(".ac-stage .ac-story").waitFor({ timeout: 20000 });
    await page.evaluate(async () => {
      window.scrollTo(0, 0);
      await document.fonts.ready;
    });
    await page.waitForTimeout(200);
    const text = await page.locator(".ac-stage").innerText();
    if (text.trim().length < 8) throw new Error(`${id} stage is empty`);
    await page.screenshot({ path: resolve(OUT, `${id}.png`), type: "png" });
    console.log(`shot ${id}`);
  }
} finally {
  await browser.close();
  if (server) server.kill();
}
