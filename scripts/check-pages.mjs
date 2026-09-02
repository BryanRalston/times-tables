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
if (!html.includes("#/play/welcome") || !html.includes("g3-path-v2") || !html.includes("seenWelcome") || !html.includes("history.replaceState")) {
  fail("dist/index.html missing first-visit leftover boot script");
}
if (!html.includes("max-width: 767px") || !html.includes("matchMedia")) {
  fail("leftover boot must skip replaceState to #/play/welcome at 768px and up");
}
if (!/<script(?![^>]*type=["']module["'])[^>]*>[\s\S]*?#\/play\/welcome/.test(html)) {
  fail("leftover boot must be a classic (non-module) script so it runs before React");
}
if (!existsSync(nojekyll)) fail("dist/.nojekyll missing");

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
} catch (e) {
  console.warn(`check-pages WARN live GET skipped: ${String(e).slice(0, 120)}`);
}
