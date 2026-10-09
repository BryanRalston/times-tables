import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { hasRootTimesTablesPath, rewriteDomainSource } from "./academy-domain-rewrite.mjs";

function fail(msg) {
  console.error(`check-academy-domain FAIL: ${msg}`);
  process.exit(1);
}

const cases = [
  ["/times-tables/squishees/frog.png", "/squishees/frog.png"],
  ['"/times-tables/academy/"', '"/"'],
  ["/times-tables/academy-sw.js", "/academy-sw.js"],
  ['{ scope: "/times-tables/academy/" }', '{ scope: "/" }'],
  [
    "https://bryanralston.github.io/times-tables/academy/worksheets/times-tables/",
    "https://squisheeacademy.com/worksheets/times-tables/",
  ],
  ["https://bryanralston.github.io/times-tables/", "https://bryanralston.github.io/times-tables/"],
  ["/times-tables/money/penny.png", "/money/penny.png"],
  ["/times-tables/favicon.svg", "/favicon.svg"],
];

for (const [input, expected] of cases) {
  const got = rewriteDomainSource(input);
  if (got !== expected) fail(`rewrite\n  in:  ${input}\n  got: ${got}\n  want:${expected}`);
}
if (hasRootTimesTablesPath(rewriteDomainSource("/times-tables/squishees/frog.png"))) {
  fail("root /times-tables/ path survived rewrite");
}
console.log("check-academy-domain OK rewrite");

const root = resolve("dist-domain");
const indexPath = resolve(root, "index.html");
if (!existsSync(indexPath)) fail("dist-domain/index.html missing — run npm run build:academy-domain");

const html = readFileSync(indexPath, "utf8");
if (/src\/academy\/main\.tsx/.test(html)) fail("index still points at source");
if (html.includes("%BASE_URL%")) fail("index still has %BASE_URL%");
if (!/\/assets\/[^"']+\.js/.test(html)) fail("index missing /assets/*.js");
if (hasRootTimesTablesPath(html)) fail("index still has a root /times-tables/ path");

const manifest = JSON.parse(readFileSync(resolve(root, "manifest.webmanifest"), "utf8"));
if (manifest.start_url !== "/") fail(`manifest start_url ${manifest.start_url}`);
if (manifest.scope !== "/") fail(`manifest scope ${manifest.scope}`);
if (manifest.name !== "Squishee Academy") fail("manifest name");
if (manifest.icons?.[0]?.src !== "/squishees/frog.png") fail(`manifest icon ${manifest.icons?.[0]?.src}`);

const sw = readFileSync(resolve(root, "academy-sw.js"), "utf8");
if (!sw.includes('caches.match("/index.html")')) fail("service worker missing root index fallback");
if (sw.includes("/times-tables/academy")) fail("service worker still scoped to the math subpath");
if (hasRootTimesTablesPath(sw)) fail("service worker has a root /times-tables/ path");

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const file = join(dir, name);
    if (statSync(file).isDirectory()) {
      walk(file);
      continue;
    }
    if (!name.endsWith(".js") && !name.endsWith(".css") && !name.endsWith(".html") && !name.endsWith(".webmanifest")) {
      continue;
    }
    if (hasRootTimesTablesPath(readFileSync(file, "utf8"))) fail(`${file} still has a root /times-tables/ path`);
  }
}
walk(root);

const assetsDir = resolve(root, "assets");
if (!existsSync(assetsDir)) fail("dist-domain/assets missing");
const jsChunks = [];
for (const name of readdirSync(assetsDir)) {
  if (!name.endsWith(".js")) continue;
  jsChunks.push(readFileSync(join(assetsDir, name), "utf8"));
}

const bundle = jsChunks.join("\n");
if (!bundle.includes("/academy-sw.js")) fail("bundle does not register /academy-sw.js");
if (!bundle.includes('scope:"/"') && !bundle.includes('scope: "/"')) fail("bundle service worker scope is not /");

for (const sheet of ["times-tables", "add-subtract", "telling-time"]) {
  const sheetPath = resolve(root, "worksheets", sheet, "index.html");
  if (!existsSync(sheetPath)) fail(`missing worksheet ${sheet}`);
  const sheetHtml = readFileSync(sheetPath, "utf8");
  if (!sheetHtml.includes(`https://squisheeacademy.com/worksheets/${sheet}/`)) {
    fail(`worksheet ${sheet} canonical was not moved to the domain`);
  }
  if (hasRootTimesTablesPath(sheetHtml)) fail(`worksheet ${sheet} still has a root /times-tables/ path`);
}

if (readFileSync(resolve(root, "CNAME"), "utf8").trim() !== "squisheeacademy.com") fail("CNAME");

const robots = readFileSync(resolve(root, "robots.txt"), "utf8");
if (!robots.includes("Sitemap: https://squisheeacademy.com/sitemap.xml")) fail("robots.txt sitemap");
const sitemap = readFileSync(resolve(root, "sitemap.xml"), "utf8");
for (const loc of [
  "https://squisheeacademy.com/worksheets/",
  "https://squisheeacademy.com/worksheets/telling-time-quarter-hour/",
  "https://squisheeacademy.com/worksheets/counting-coins/",
  "https://squisheeacademy.com/worksheets/multiplication-7s/",
  "https://squisheeacademy.com/privacy/",
]) {
  if (!sitemap.includes(`<loc>${loc}</loc>`)) fail(`sitemap missing ${loc}`);
}

const sheetDir = resolve(root, "worksheets");
let staticSheets = 0;
for (const name of readdirSync(sheetDir)) {
  const file = join(sheetDir, name, "index.html");
  if (!existsSync(file)) continue;
  const sheetHtml = readFileSync(file, "utf8");
  if (sheetHtml.includes("<script")) continue;
  staticSheets += 1;
  if (!sheetHtml.includes("<h1>")) fail(`${name} missing h1`);
  if (!sheetHtml.includes("Answer key")) fail(`${name} missing answer key`);
  if (!sheetHtml.includes("Play the game")) fail(`${name} missing play link`);
  if (!sheetHtml.includes('property="og:description"')) fail(`${name} missing open graph`);
  if (!sheetHtml.includes(`<link rel="canonical" href="https://squisheeacademy.com/worksheets/${name}/"`)) {
    fail(`${name} canonical`);
  }
  if (sheetHtml.includes('id="app"')) fail(`${name} is the SPA shell`);
  if (/<script/i.test(sheetHtml)) fail(`${name} needs JavaScript to render`);
}
if (staticSheets < 15 || staticSheets > 25) fail(`expected 15–25 static worksheets, found ${staticSheets}`);

const privacy = readFileSync(resolve(root, "privacy/index.html"), "utf8");
if (!privacy.includes("does not collect") && !privacy.includes("do not collect")) fail("privacy page");
if (!privacy.includes("COPPA")) fail("privacy COPPA");
if (!privacy.includes('<a href="mailto:hello@squisheeacademy.com">hello@squisheeacademy.com</a>')) {
  fail("privacy contact email");
}
if (privacy.includes("<script")) fail("privacy page needs JavaScript");

const manifestList = JSON.parse(readFileSync(resolve(root, "precache-manifest.json"), "utf8"));
if (!Array.isArray(manifestList) || manifestList.length < 20) fail("precache manifest");
for (const needed of [
  "/",
  "/index.html",
  "/privacy/",
  "/worksheets/multiplication-7s/",
  "/worksheets/telling-time-quarter-hour/index.html",
  "/squishees/peach.png",
  "/cosmetics/peach-bow.png",
  "/money/penny.png",
  "/favicon.svg",
]) {
  if (!manifestList.includes(needed)) fail(`precache missing ${needed}`);
}
if (!manifestList.some((url) => typeof url === "string" && url.startsWith("/assets/") && url.endsWith(".js"))) {
  fail("precache missing app js");
}
if (!manifestList.some((url) => typeof url === "string" && url.startsWith("/assets/") && url.endsWith(".css"))) {
  fail("precache missing app css");
}
for (const url of manifestList) {
  if (typeof url !== "string" || !url.startsWith("/")) fail(`bad precache url ${url}`);
  let rel = url.slice(1);
  if (rel === "" || rel.endsWith("/")) rel += "index.html";
  if (!existsSync(join(root, rel))) fail(`precache file missing for ${url}`);
}
if (!sw.includes("precache-manifest.json")) fail("service worker does not precache");
if (!sw.includes('caches.match("/index.html")')) fail("service worker missing root index fallback");
if (!existsSync(resolve(root, ".nojekyll"))) fail(".nojekyll missing");
if (!existsSync(resolve(root, "404.html"))) fail("404.html missing");
if (!existsSync(resolve(root, "squishees/frog.png"))) fail("squishees/frog.png missing");
if (!existsSync(resolve(root, "favicon.svg"))) fail("favicon.svg missing");
if (!existsSync(resolve(root, "money/penny.png"))) fail("money/penny.png missing");

console.log("check-academy-domain OK dist-domain");
