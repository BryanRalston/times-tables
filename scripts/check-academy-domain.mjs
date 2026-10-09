import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { hasRootTimesTablesPath, rewriteDomainSource } from "./academy-domain-rewrite.mjs";
import { pokeMediaFiles, referencedPokeNames } from "./academy-precache.mjs";

function fail(msg) {
  console.error(`check-academy-domain FAIL: ${msg}`);
  process.exit(1);
}

const SHARE_IMAGE = "https://squisheeacademy.com/og/squishee-academy.png";
const SHARE_ALT = "Squishee Academy. Free learning games for K-3.";

function assertShareCard(label, html) {
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
  const description = html.match(/name="description"\s+content="([^"]*)"/)?.[1];
  const canonical = html.match(/rel="canonical"\s+href="(https:\/\/squisheeacademy\.com\/[^"]*)"/)?.[1];
  if (!title || !description || !canonical) fail(`${label} missing title, description, or absolute canonical`);
  const tags = [
    `property="og:title" content="${title}"`,
    `property="og:description" content="${description}"`,
    `property="og:url" content="${canonical}"`,
    'property="og:type" content="website"',
    'property="og:site_name" content="Squishee Academy"',
    `property="og:image" content="${SHARE_IMAGE}"`,
    'property="og:image:width" content="1200"',
    'property="og:image:height" content="630"',
    `property="og:image:alt" content="${SHARE_ALT}"`,
    'name="twitter:card" content="summary_large_image"',
    `name="twitter:title" content="${title}"`,
    `name="twitter:description" content="${description}"`,
    `name="twitter:image" content="${SHARE_IMAGE}"`,
    `name="twitter:image:alt" content="${SHARE_ALT}"`,
  ];
  for (const tag of tags) {
    if (!html.includes(tag)) fail(`${label} missing ${tag}`);
  }
  if (/property="og:image" content="(?!https:\/\/)/.test(html)) fail(`${label} og:image is not an absolute https URL`);
  if (/name="twitter:image" content="(?!https:\/\/)/.test(html)) fail(`${label} twitter:image is not an absolute https URL`);
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
const iconSrcs = (manifest.icons ?? []).map((icon) => icon.src);
for (const src of [
  "/favicon-32.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/apple-touch-icon.png",
  "/icons/icon-512-maskable.png",
]) {
  if (!iconSrcs.includes(src)) fail(`manifest missing ${src}`);
}
const maskable = (manifest.icons ?? []).find((icon) => icon.purpose === "maskable");
if (maskable?.sizes !== "512x512" || maskable?.type !== "image/png") fail("manifest maskable icon");

const sw = readFileSync(resolve(root, "academy-sw.js"), "utf8");
if (!sw.includes('caches.match("/index.html")')) fail("service worker missing root index fallback");
if (sw.includes("/times-tables/academy")) fail("service worker still scoped to the math subpath");
if (hasRootTimesTablesPath(sw)) fail("service worker has a root /times-tables/ path");
if (!sw.includes('const SHARE_IMAGE = "/og/squishee-academy.png"')) fail("service worker missing share image path");
if (!sw.includes("if (url.pathname === SHARE_IMAGE) return;")) fail("service worker intercepts the share image");

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

for (const sheet of ["times-tables", "add-subtract", "telling-time", "sight-words", "spelling", "counting", "place-value", "shapes", "fractions", "measurement", "phonics", "word-problems"]) {
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
if (staticSheets < 15 || staticSheets > 40) fail(`expected 15–40 static worksheets, found ${staticSheets}`);

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

assertShareCard("index.html", html);
if (!html.includes('property="og:title" content="Squishee Academy"')) fail("home og:title");
if (!html.includes('content="Free K-3 learning games with squishees. No ads, no accounts."')) fail("home description");
if (!html.includes('property="og:url" content="https://squisheeacademy.com/"')) fail("home og:url");
if (!html.includes('rel="apple-touch-icon" href="/apple-touch-icon.png"')) fail("home apple touch icon");
for (const page of [
  ["privacy/index.html", "https://squisheeacademy.com/privacy/"],
  ["worksheets/index.html", "https://squisheeacademy.com/worksheets/"],
  ["worksheets/multiplication-7s/index.html", "https://squisheeacademy.com/worksheets/multiplication-7s/"],
  ["worksheets/times-tables/index.html", "https://squisheeacademy.com/worksheets/times-tables/"],
]) {
  const pageHtml = readFileSync(resolve(root, page[0]), "utf8");
  assertShareCard(page[0], pageHtml);
  if (!pageHtml.includes(`property="og:url" content="${page[1]}"`)) fail(`${page[0]} og:url`);
}

const imagePath = resolve(root, "og/squishee-academy.png");
if (!existsSync(imagePath)) fail("share image missing from domain build");
const image = readFileSync(imagePath);
if (image.length > 300 * 1024) fail(`share image is ${image.length} bytes`);
if (image.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") fail("share image is not a png");
if (image.readUInt32BE(16) !== 1200 || image.readUInt32BE(20) !== 630) {
  fail(`share image is ${image.readUInt32BE(16)}x${image.readUInt32BE(20)}`);
}
if (manifestList.includes("/og/squishee-academy.png")) fail("service worker precaches the share image");

const pokeNames = referencedPokeNames(bundle);
const shippedPoke = new Set(pokeMediaFiles().map((rel) => rel.slice("squishees/".length)));
if (pokeNames.length === 0) fail("bundle does not reference poke clips or strips");
for (const name of pokeNames) {
  if (!shippedPoke.has(name)) fail(`referenced poke asset is not a shipped poke file: ${name}`);
  const rel = `squishees/${name}`;
  if (!existsSync(join(root, rel))) fail(`poke asset missing from dist-domain: ${rel}`);
  if (!manifestList.includes(`/${rel}`)) fail(`precache missing /${rel}`);
}
for (const rel of pokeMediaFiles()) {
  if (!existsSync(join(root, rel))) fail(`poke asset missing from dist-domain: ${rel}`);
  if (!pokeNames.includes(rel.slice("squishees/".length))) fail(`bundle does not reference ${rel}`);
  if (!manifestList.includes(`/${rel}`)) fail(`precache missing /${rel}`);
}
for (const rel of [
  "favicon.ico",
  "favicon-16.png",
  "favicon-32.png",
  "apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-512-maskable.png",
]) {
  if (!existsSync(resolve(root, rel))) fail(`${rel} missing`);
}
const ico = readFileSync(resolve(root, "favicon.ico"));
if (ico.readUInt16LE(0) !== 0 || ico.readUInt16LE(2) !== 1 || ico.readUInt16LE(4) < 3) fail("favicon.ico set");

console.log("check-academy-domain OK dist-domain");
