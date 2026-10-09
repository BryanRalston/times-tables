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
if (!existsSync(resolve(root, ".nojekyll"))) fail(".nojekyll missing");
if (!existsSync(resolve(root, "404.html"))) fail("404.html missing");
if (!existsSync(resolve(root, "squishees/frog.png"))) fail("squishees/frog.png missing");
if (!existsSync(resolve(root, "favicon.svg"))) fail("favicon.svg missing");
if (!existsSync(resolve(root, "money/penny.png"))) fail("money/penny.png missing");

console.log("check-academy-domain OK dist-domain");
