import { spawn } from "node:child_process";
import { chromium } from "playwright-core";

const port = Number(process.env.ACADEMY_PORT ?? 4183);
const base = `http://127.0.0.1:${port}/`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function startServer() {
  return spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
    cwd: "dist-domain",
    stdio: "ignore",
  });
}

async function launch() {
  try {
    return await chromium.launch({ channel: "chrome", headless: true });
  } catch {
    return chromium.launch({ headless: true });
  }
}

function densify(points, step) {
  const out = [];
  for (let i = 0; i < points.length; i += 1) {
    const next = points[i];
    const prev = out[out.length - 1];
    if (!prev) {
      out.push(next);
      continue;
    }
    const dist = Math.hypot(next.x - prev.x, next.y - prev.y);
    const hops = Math.max(1, Math.ceil(dist / step));
    for (let hop = 1; hop <= hops; hop += 1) {
      const t = hop / hops;
      out.push({ x: prev.x + (next.x - prev.x) * t, y: prev.y + (next.y - prev.y) * t });
    }
  }
  return out;
}

async function hello(page, grade) {
  await page.goto(base, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "English" }).waitFor();
  await page.getByRole("button", { name: "Español" }).waitFor();
  await page.getByRole("button", { name: grade, exact: true }).click();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.getByRole("link", { name: /Counting|Phonics/ }).first().waitFor();
}

async function openGame(page, title) {
  await page.getByRole("link", { name: new RegExp(title, "i") }).click();
  await page.locator(".ac-play, [data-hands], .ac-choice").first().waitFor({ timeout: 8000 });
}

async function strokePath(page, points, pointerType) {
  const path = densify(points, 6);
  const first = path[0];
  const last = path[path.length - 1];
  if (!first || !last) return;
  if (pointerType === "touch") {
    const client = await page.context().newCDPSession(page);
    const frame = () => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve(0))));
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: first.x, y: first.y, id: 1, radiusX: 2, radiusY: 2 }],
    });
    await frame();
    for (const point of path) {
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: point.x, y: point.y, id: 1, radiusX: 2, radiusY: 2 }],
      });
      await frame();
    }
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await frame();
    await client.detach();
    await page.evaluate(({ x, y }) => {
      document.querySelector(".ac-trace-stage")?.dispatchEvent(
        new PointerEvent("pointerup", {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
          pointerId: 1,
          pointerType: "touch",
          button: 0,
          buttons: 0,
          isPrimary: true,
        }),
      );
    }, { x: last.x, y: last.y });
    return;
  }
  await page.mouse.move(first.x, first.y);
  await page.mouse.down();
  for (const point of path) await page.mouse.move(point.x, point.y);
  await page.mouse.up();
}

async function traceBoard(page, pointerType) {
  const svg = page.locator(".ac-trace-guide");
  const box = await svg.boundingBox();
  if (!box) throw new Error("trace guide has no box");
  await page.evaluate(() => {
    window.__hits = [];
    const stage = document.querySelector(".ac-trace-stage");
    const note = (event) => {
      const row = window.__hits;
      const last = row[row.length - 1];
      if (last && last.kind === event.type) {
        last.n += 1;
        last.x2 = event.clientX;
        last.y2 = event.clientY;
      } else row.push({ kind: event.type, n: 1, x: event.clientX, y: event.clientY, x2: event.clientX, y2: event.clientY, type: event.pointerType });
    };
    stage?.addEventListener("pointerdown", note);
    stage?.addEventListener("pointermove", note);
    stage?.addEventListener("pointerup", note);
  });
  const raw = await svg.locator("polyline").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("points") ?? ""));
  for (const points of raw) {
    if (await page.locator(".ac-trace.is-complete").isVisible().catch(() => false)) break;
    const parsed = points
      .trim()
      .split(/\s+/)
      .map((pair) => {
        const [x, y] = pair.split(",").map(Number);
        return { x: box.x + (x / 100) * box.width, y: box.y + (y / 100) * box.height };
      });
    await strokePath(page, parsed, pointerType);
    await sleep(80);
  }
  try {
    await page.locator(".ac-trace.is-complete, .ac-feedback, .ac-choice").first().waitFor({ timeout: 2500 });
    if (await page.locator(".ac-trace.is-complete").isVisible().catch(() => false)) return;
    if (!(await page.locator("[data-hands='trace']").isVisible().catch(() => false))) return;
  } catch {
    /* report the gesture below */
  }
  const hits = await page.evaluate(() => window.__hits ?? []);
  throw new Error(`trace missed complete. hits ${JSON.stringify(hits)}`);
}

async function skipCard(page) {
  const choice = page.locator(".ac-choice").first();
  if (await choice.isVisible().catch(() => false)) {
    await choice.click();
    return;
  }
  const done = page.getByRole("button", { name: "Done" });
  if (await done.isVisible().catch(() => false)) {
    await done.click();
    return;
  }
  const again = page.getByRole("button", { name: "Try again" });
  if (await again.isVisible().catch(() => false)) {
    await again.click();
    return;
  }
  await sleep(200);
}

async function findAndTrace(page, pointerType, shot) {
  for (let step = 0; step < 40; step += 1) {
    if (await page.getByRole("button", { name: "Play again" }).isVisible().catch(() => false)) {
      await page.getByRole("button", { name: "Play again" }).click();
      await sleep(400);
    }
    const board = page.locator("[data-hands='trace']");
    if (await board.isVisible().catch(() => false)) {
      const glyph = await board.getAttribute("data-glyph");
      await page.screenshot({ path: shot, fullPage: false });
      await traceBoard(page, pointerType);
      await page.screenshot({ path: shot.replace(".png", "-done.png"), fullPage: false });
      return glyph ?? "";
    }
    await skipCard(page);
    await sleep(250);
  }
  await page.screenshot({ path: "/tmp/trace-miss.png" });
  throw new Error("no tracing card appeared");
}

async function runSize(browser, opts) {
  const context = await browser.newContext({
    viewport: { width: opts.width, height: opts.height },
    hasTouch: opts.touch,
    isMobile: opts.touch,
    deviceScaleFactor: opts.touch ? 2 : 1,
  });
  await context.addInitScript(() => {
    window.__deviceSpeech = [];
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.speak = (utterance) => {
      window.__deviceSpeech.push(String(utterance?.text ?? ""));
    };
  });
  const page = await context.newPage();
  const voices = [];
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("/voice/")) voices.push(url);
  });
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  await hello(page, opts.grade);
  await openGame(page, opts.game);
  const glyph = await findAndTrace(page, opts.touch ? "touch" : "mouse", opts.shot);
  if (errors.length) throw new Error(errors.join("\n"));
  if (voices.length === 0) throw new Error(`${opts.label} traced ${glyph} without a voice clip request`);
  const device = await page.evaluate(() => window.__deviceSpeech);
  if (device.length) throw new Error(`${opts.label} used speechSynthesis: ${device.join(" | ")}`);
  await page.evaluate(async () => navigator.serviceWorker.ready);
  const clip = voices.find((url) => url.includes("trace") || url.includes("start-at-the-dot") || url.includes("nice-tracing")) ?? voices[0];
  if (opts.offline) {
    await context.setOffline(true);
    const offline = await page.reload({ waitUntil: "domcontentloaded" });
    if (!offline || !offline.ok()) throw new Error(`offline reload status ${offline?.status()}`);
    await page.locator(".ac-play, [data-hands], .ac-choice, .ac-go").first().waitFor({ timeout: 8000 });
    const cached = await page.evaluate(async (url) => {
      const response = await fetch(url);
      const bytes = response.ok ? (await response.arrayBuffer()).byteLength : 0;
      return { ok: response.ok, bytes };
    }, clip);
    if (!cached.ok || cached.bytes < 200) throw new Error(`offline clip ${clip} ${JSON.stringify(cached)}`);
    await context.setOffline(false);
  }
  console.log(`${opts.label} traced ${glyph} clips ${voices.length} offline ${Boolean(opts.offline)}`);
  await context.close();
}

const server = startServer();
await sleep(400);
const browser = await launch();
try {
  await runSize(browser, {
    label: "phone",
    width: 390,
    height: 844,
    touch: true,
    grade: "Pre-K",
    game: "Counting",
    shot: "/tmp/trace-phone.png",
    offline: true,
  });
  await runSize(browser, {
    label: "tablet",
    width: 820,
    height: 1100,
    touch: false,
    grade: "Pre-K",
    game: "Phonics",
    shot: "/tmp/trace-tablet.png",
    offline: false,
  });
  console.log("trace playtest OK");
} finally {
  await browser.close();
  server.kill();
}
