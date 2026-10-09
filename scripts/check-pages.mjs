import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const indexPath = resolve("dist/index.html");
const nojekyll = resolve("dist/.nojekyll");

function fail(msg) {
  console.error(`check-pages FAIL: ${msg}`);
  process.exit(1);
}

if (!existsSync(indexPath)) fail("dist/index.html missing — run npm run build first");
const html = readFileSync(indexPath, "utf8");

if (!/\/times-tables\/assets\/[^"']+\.js/.test(html)) {
  fail("dist/index.html must contain hashed /times-tables/assets/*.js");
}
if (/src\/main\.tsx/.test(html)) fail("dist/index.html still points at src/main.tsx");
if (html.includes("%BASE_URL%")) fail("dist/index.html still has unsubstituted %BASE_URL%");
if (html.includes("#/play/welcome") && html.includes("history.replaceState")) {
  fail("dist/index.html must not rewrite first visit onto leftover");
}
if (!existsSync(nojekyll)) fail("dist/.nojekyll missing");
const catPng = resolve("dist/squishees/cat.png");
if (!existsSync(catPng)) fail("dist/squishees/cat.png missing");

const academyIndex = resolve("dist/academy/index.html");
if (!existsSync(academyIndex)) fail("dist/academy/index.html missing");
const academyHtml = readFileSync(academyIndex, "utf8");
if (!/\/times-tables\/academy\/assets\/[^"']+\.js/.test(academyHtml)) {
  fail("dist/academy/index.html must contain hashed /times-tables/academy/assets/*.js");
}
if (/src\/academy\/main\.tsx/.test(academyHtml)) fail("dist/academy/index.html still points at source");
for (const sheet of ["times-tables", "add-subtract", "telling-time", "money", "sight-words", "spelling", "counting", "place-value", "shapes", "fractions", "measurement", "phonics", "word-problems"]) {
  const sheetPath = resolve(`dist/academy/worksheets/${sheet}/index.html`);
  if (!existsSync(sheetPath)) fail(`missing worksheet ${sheet}`);
  const sheetHtml = readFileSync(sheetPath, "utf8");
  if (!sheetHtml.includes("<title>")) fail(`worksheet ${sheet} missing title`);
}
if (!existsSync(resolve("dist/academy-sw.js"))) fail("dist/academy-sw.js missing");
const academyManifestPath = resolve("dist/academy/precache-manifest.json");
if (!existsSync(academyManifestPath)) fail("dist/academy/precache-manifest.json missing");
const academyManifest = JSON.parse(readFileSync(academyManifestPath, "utf8"));
for (const rel of [
  "squishees/frog-poke.mp4",
  "squishees/cat-poke.mp4",
  "squishees/bunny-poke.mp4",
  "squishees/frog-poke-strip.png",
  "squishees/cat-poke-strip.png",
  "squishees/bunny-poke-strip.png",
]) {
  if (!existsSync(resolve("dist/academy", rel))) fail(`dist/academy/${rel} missing`);
  const url = `/times-tables/academy/${rel}`;
  if (!academyManifest.includes(url)) fail(`academy precache missing ${url}`);
}
if (!existsSync(resolve("dist/squishees/frog-poke.mp4"))) fail("dist/squishees/frog-poke.mp4 missing");

console.log("check-pages OK dist/index.html");

const live = process.env.PAGES_URL ?? "https://bryanralston.github.io/times-tables/";
try {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 8000);
  const res = await fetch(live, { signal: ac.signal, redirect: "follow" });
  clearTimeout(t);
  const body = await res.text();
  const bad =
    !res.ok ||
    /src\/main\.tsx/.test(body) ||
    body.includes("%BASE_URL%") ||
    !/\/times-tables\/assets\/[^"']+\.js/.test(body);
  if (bad) {
    console.warn(`check-pages WARN live ${live} status=${res.status} (fail-open)`);
  } else {
    console.log(`check-pages OK live ${live}`);
  }
  const assetUrl = new URL("squishees/cat.png", live.endsWith("/") ? live : `${live}/`).href;
  const ac2 = new AbortController();
  const t2 = setTimeout(() => ac2.abort(), 8000);
  const img = await fetch(assetUrl, { signal: ac2.signal, redirect: "follow", method: "HEAD" });
  clearTimeout(t2);
  if (!img.ok) console.warn(`check-pages WARN live asset ${assetUrl} status=${img.status} (fail-open)`);
  else console.log(`check-pages OK live asset ${assetUrl}`);
} catch (e) {
  console.warn(`check-pages WARN live GET skipped: ${String(e).slice(0, 120)}`);
}
