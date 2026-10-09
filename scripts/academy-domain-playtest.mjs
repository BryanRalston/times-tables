import { spawn } from "node:child_process";
import { chromium } from "playwright-core";

const port = Number(process.env.ACADEMY_PORT ?? 4179);
const base = process.env.PLAYTEST_URL ?? `http://127.0.0.1:${port}/`;

function startServer() {
  if (process.env.PLAYTEST_URL) return null;
  const child = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
    cwd: "dist-domain",
    stdio: "ignore",
  });
  return child;
}

async function launch() {
  try {
    return await chromium.launch({ channel: "chrome", headless: true });
  } catch {
    return chromium.launch({ headless: true });
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const server = startServer();
if (server) await sleep(400);

const browser = await launch();
const page = await browser.newPage();
const failures = [];
page.on("pageerror", (err) => failures.push(String(err)));
try {
  const res = await page.goto(base, { waitUntil: "networkidle" });
  if (!res || !res.ok()) throw new Error(`GET ${base} status ${res?.status()}`);
  await page.getByLabel("Your name").fill("Ada");
  await page.getByRole("button", { name: "Let's play" }).click();
  await page.getByRole("link", { name: /Times tables/i }).click();
  await page.locator(".ac-choice").first().waitFor();
  for (let i = 0; i < 10; i += 1) {
    await page.locator(".ac-choice").first().click();
    if (i < 9) await page.getByText(`Question ${i + 2} of 10`).waitFor({ timeout: 8000 });
  }
  await page.getByRole("button", { name: "Play again" }).waitFor({ timeout: 8000 });

  const meta = await page.evaluate(async () => {
    const link = document.querySelector('link[rel="manifest"]');
    const manifestHref = link instanceof HTMLLinkElement ? link.href : "";
    const manifest = manifestHref ? await (await fetch(manifestHref)).json() : null;
    const reg = await navigator.serviceWorker.ready;
    const frog = document.querySelector("img");
    return {
      title: document.title,
      manifestHref,
      start: manifest?.start_url ?? null,
      scope: manifest?.scope ?? null,
      sw: reg.scope,
      swScript: reg.active?.scriptURL ?? null,
      img: frog instanceof HTMLImageElement ? { src: frog.currentSrc || frog.src, w: frog.naturalWidth } : null,
    };
  });

  if (failures.length) throw new Error(failures.join("\n"));
  if (!meta.manifestHref.endsWith("/manifest.webmanifest")) throw new Error(`manifest href ${meta.manifestHref}`);
  if (meta.start !== "/") throw new Error(`manifest start_url ${meta.start}`);
  if (meta.scope !== "/") throw new Error(`manifest scope ${meta.scope}`);
  if (!meta.sw.endsWith("/")) throw new Error(`sw scope ${meta.sw}`);
  if (!meta.swScript?.endsWith("/academy-sw.js")) throw new Error(`sw script ${meta.swScript}`);
  if (!meta.img || meta.img.w < 1) throw new Error(`mascot image ${JSON.stringify(meta.img)}`);
  if (!meta.img.src.includes("/squishees/")) throw new Error(`mascot src ${meta.img.src}`);

  await page.evaluate(async () => navigator.serviceWorker.ready);
  if (server) server.kill();
  await sleep(200);
  await page.context().setOffline(true);
  const offline = await page.reload({ waitUntil: "domcontentloaded" });
  if (!offline || !offline.ok()) throw new Error(`offline reload status ${offline?.status()}`);
  await page.locator(".ac-choice").first().waitFor({ timeout: 8000 });
  await page.locator(".ac-choice").first().click();
  await page.getByText("Question 2 of 10").waitFor({ timeout: 8000 });
  console.log("academy-domain playtest OK", JSON.stringify(meta));
} finally {
  await browser.close();
  if (server) server.kill();
}
