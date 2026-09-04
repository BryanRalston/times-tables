import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "scripts/playtest-out/buy-cheer");
mkdirSync(out, { recursive: true });
const base = "http://127.0.0.1:5173/times-tables/";

function seedStorage() {
  const kid = {
    name: "Maya",
    stars: 6,
    seenWelcome: true,
    activities: {},
    badges: [],
    shaky: {},
    sessions: {},
    squishees: [],
    coins: 40,
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

async function clip(page, locator, file) {
  const box = await locator.boundingBox();
  const pad = 16;
  await page.screenshot({
    path: file,
    clip: {
      x: Math.max(0, Math.floor(box.x - pad)),
      y: Math.max(0, Math.floor(box.y - pad)),
      width: Math.ceil(box.width + pad * 2),
      height: Math.ceil(box.height + pad * 2),
    },
  });
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: out, size: { width: 1280, height: 800 } },
});
await context.addInitScript(seedStorage);
const page = await context.newPage();
await page.goto(`${base}#/shelf`, { waitUntil: "networkidle" });
await page.waitForTimeout(400);

await page.screenshot({ path: resolve(out, "before.png") });
const pandaCard = page.locator(".frost").filter({ has: page.getByText("Panda", { exact: true }) });
await pandaCard.getByRole("button", { name: /Buy/ }).click();
await page.waitForTimeout(180);
const poke = page.getByRole("button", { name: "Poke Panda" });
await poke.waitFor({ state: "visible", timeout: 5000 });
const cheer = await poke.getAttribute("data-cheer");
const canvas = await page.locator("canvas").count();
console.log("AFTER_BUY", JSON.stringify({ cheer, canvas, squash: await poke.getAttribute("data-squash") }));
await clip(page, poke, resolve(out, "cheer-a.png"));
await page.waitForTimeout(280);
await clip(page, poke, resolve(out, "cheer-b.png"));
await page.waitForTimeout(280);
await clip(page, poke, resolve(out, "cheer-c.png"));
await page.waitForTimeout(1600);
const cheerAfter = await poke.getAttribute("data-cheer");
console.log("AFTER_CHEER", cheerAfter);
await poke.click();
await page.waitForTimeout(200);
console.log("POKE", JSON.stringify({ cheer: await poke.getAttribute("data-cheer"), squash: await poke.getAttribute("data-squash") }));
await clip(page, poke, resolve(out, "poke-after.png"));
await context.close();
console.log("WROTE", out);
