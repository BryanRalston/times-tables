import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { hasRootTimesTablesPath, rewriteDomainSource } from "./academy-domain-rewrite.mjs";
import { pokeMediaFiles, referencedPokeNames } from "./academy-precache.mjs";

function fail(msg) {
  console.error(`check-academy-domain FAIL: ${msg}`);
  process.exit(1);
}

const SHARE_IMAGE = "https://squisheeacademy.com/og/squishee-academy.png";
const SHARE_ALT = "Squishee Academy. Free learning games for Pre-K to grade 4.";

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

for (const sheet of ["times-tables", "add-subtract", "telling-time", "sight-words", "spelling", "counting", "place-value", "shapes", "fractions", "measurement", "phonics", "word-problems", "missing-numbers", "data"]) {
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

const COUNTER_SRC = "//gc.zgo.at/count.js";
const COUNTER_ENDPOINT = "https://squisheeacademy.goatcounter.com/count";

/** The page-view loader is not content. Pages still render without it. */
function stripVisitorCounter(html) {
  return html.replace(/<script>\s*\(function \(\) \{[\s\S]*?gc\.zgo\.at\/count\.js[\s\S]*?<\/script>/g, "");
}

/** JSON-LD is data. The visitor-counter loader is optional. Any other script means the page is not crawlable HTML. */
function needsJs(html) {
  return /<script(?![^>]*type="application\/ld\+json")/i.test(stripVisitorCounter(html));
}

function hasTracking(html) {
  return /gtag\(|googletagmanager|google-analytics|GTM-|fbq\(|analytics\.js/.test(html);
}

const sheetDir = resolve(root, "worksheets");
let staticSheets = 0;
for (const name of readdirSync(sheetDir)) {
  const file = join(sheetDir, name, "index.html");
  if (!existsSync(file)) continue;
  const sheetHtml = readFileSync(file, "utf8");
  if (needsJs(sheetHtml)) continue;
  staticSheets += 1;
  if (!sheetHtml.includes("<h1>")) fail(`${name} missing h1`);
  if (!sheetHtml.includes("Answer key")) fail(`${name} missing answer key`);
  if (!sheetHtml.includes("Play free")) fail(`${name} missing play link`);
  if (!sheetHtml.includes('property="og:description"')) fail(`${name} missing open graph`);
  if (!sheetHtml.includes(`<link rel="canonical" href="https://squisheeacademy.com/worksheets/${name}/"`)) {
    fail(`${name} canonical`);
  }
  if (sheetHtml.includes('id="app"')) fail(`${name} is the SPA shell`);
  if (needsJs(sheetHtml)) fail(`${name} needs JavaScript to render`);
  if (hasTracking(sheetHtml)) fail(`${name} has a tracking script`);
}
if (staticSheets < 15 || staticSheets > 45) fail(`expected 15–45 static worksheets, found ${staticSheets}`);

const privacy = readFileSync(resolve(root, "privacy/index.html"), "utf8");
if (!privacy.includes("does not collect") && !privacy.includes("do not collect")) fail("privacy page");
if (!privacy.includes("COPPA")) fail("privacy COPPA");
if (!privacy.includes('<a href="mailto:hello@squisheeacademy.com">hello@squisheeacademy.com</a>')) {
  fail("privacy contact email");
}
if (privacy.includes("no analytics")) fail("privacy still says no analytics");
if (privacy.includes("third parties collect")) fail("privacy still says third parties collect data");
if (!privacy.includes("We count page views with GoatCounter")) fail("privacy GoatCounter");
if (!privacy.includes("sets no cookies")) fail("privacy cookies");
if (!privacy.includes("It does not store IP addresses.")) fail("privacy IP");
if (!privacy.includes("It honors Do Not Track.")) fail("privacy Do Not Track");
if (!privacy.includes("Nothing here is about an individual child.")) fail("privacy children");
if (needsJs(privacy)) fail("privacy page needs JavaScript");
const privacyLocales = [
  ["es/privacy/index.html", "es", ""],
  ["pt-br/privacy/index.html", "pt-BR", ""],
  ["fr/privacy/index.html", "fr", ""],
  ["zh-hans/privacy/index.html", "zh-Hans", ""],
  ["hi/privacy/index.html", "hi", ""],
  ["ar/privacy/index.html", "ar", ' dir="rtl"'],
];
for (const [rel, lang, dir] of privacyLocales) {
  const page = readFileSync(resolve(root, rel), "utf8");
  if (!page.includes(`<html lang="${lang}"${dir}>`)) fail(`${rel} lang`);
  if (!page.includes("GoatCounter") || !page.includes("Do Not Track") || !page.includes("COPPA") || !page.includes("IP")) {
    fail(`${rel} privacy wording`);
  }
  if (!page.includes('<a href="mailto:hello@squisheeacademy.com">hello@squisheeacademy.com</a>')) {
    fail(`${rel} contact email`);
  }
  if (needsJs(page)) fail(`${rel} needs JavaScript`);
}

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
const esPrecache = JSON.parse(readFileSync(resolve("src/academy/voice/es-precache.json"), "utf8"));
if (!Array.isArray(esPrecache) || esPrecache.length < 100) fail("Spanish precache list is empty");
const esUrls = manifestList.filter((url) => typeof url === "string" && url.startsWith("/voice/es/"));
if (esUrls.length !== esPrecache.length) fail(`Spanish precache has ${esUrls.length} urls, list has ${esPrecache.length}`);
for (const rel of esPrecache) {
  if (typeof rel !== "string" || !rel.startsWith("es/") || !manifestList.includes(`/voice/${rel}`)) {
    fail(`precache missing Spanish clip ${rel}`);
  }
}
const ptPrecache = JSON.parse(readFileSync(resolve("src/academy/voice/pt-precache.json"), "utf8"));
if (!Array.isArray(ptPrecache) || ptPrecache.length < 100) fail("Portuguese precache list is empty");
const ptUrls = manifestList.filter((url) => typeof url === "string" && url.startsWith("/voice/pt/"));
if (ptUrls.length !== ptPrecache.length) fail(`Portuguese precache has ${ptUrls.length} urls, list has ${ptPrecache.length}`);
for (const rel of ptPrecache) {
  if (typeof rel !== "string" || !rel.startsWith("pt/") || !manifestList.includes(`/voice/${rel}`)) {
    fail(`precache missing Portuguese clip ${rel}`);
  }
}
const ptDir = resolve(root, "voice/pt");
if (!existsSync(ptDir)) fail("voice/pt missing from domain build");
const ptOnDisk = readdirSync(ptDir).filter((name) => name.endsWith(".mp3"));
if (ptUrls.length >= ptOnDisk.length) fail("Portuguese precache includes every clip");
const frPrecache = JSON.parse(readFileSync(resolve("src/academy/voice/fr-precache.json"), "utf8"));
if (!Array.isArray(frPrecache) || frPrecache.length < 100) fail("French precache list is empty");
const frUrls = manifestList.filter((url) => typeof url === "string" && url.startsWith("/voice/fr/"));
if (frUrls.length !== frPrecache.length) fail(`French precache has ${frUrls.length} urls, list has ${frPrecache.length}`);
for (const rel of frPrecache) {
  if (typeof rel !== "string" || !rel.startsWith("fr/") || !manifestList.includes(`/voice/${rel}`)) {
    fail(`precache missing French clip ${rel}`);
  }
}
const frDir = resolve(root, "voice/fr");
if (!existsSync(frDir)) fail("voice/fr missing from domain build");
const frOnDisk = readdirSync(frDir).filter((name) => name.endsWith(".mp3"));
if (frUrls.length >= frOnDisk.length) fail("French precache includes every clip");
const zhPrecache = JSON.parse(readFileSync(resolve("src/academy/voice/zh-precache.json"), "utf8"));
if (!Array.isArray(zhPrecache) || zhPrecache.length < 100) fail("Chinese precache list is empty");
const zhUrls = manifestList.filter((url) => typeof url === "string" && url.startsWith("/voice/zh/"));
if (zhUrls.length !== zhPrecache.length) fail(`Chinese precache has ${zhUrls.length} urls, list has ${zhPrecache.length}`);
for (const rel of zhPrecache) {
  if (typeof rel !== "string" || !rel.startsWith("zh/") || !manifestList.includes(`/voice/${rel}`)) {
    fail(`precache missing Chinese clip ${rel}`);
  }
}
const zhDir = resolve(root, "voice/zh");
if (!existsSync(zhDir)) fail("voice/zh missing from domain build");
const zhOnDisk = readdirSync(zhDir).filter((name) => name.endsWith(".mp3"));
if (zhUrls.length >= zhOnDisk.length) fail("Chinese precache includes every clip");
const esDir = resolve(root, "voice/es");
if (!existsSync(esDir)) fail("voice/es missing from domain build");
const esOnDisk = readdirSync(esDir).filter((name) => name.endsWith(".mp3"));
if (esUrls.length >= esOnDisk.length) fail("Spanish precache includes every clip");
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
if (!html.includes('property="og:title" content="Free learning games for kids Pre-K to grade 4 | Squishee Academy"')) {
  fail("home og:title");
}
if (
  !html.includes(
    'content="Free learning games for kids Pre-K to grade 4. Play in 7 languages: English, Español, Português, Français, 中文, हिन्दी, العربية. No ads, no accounts."',
  )
) {
  fail("home description");
}
for (const lang of ["x-default", "en", "es", "pt-BR", "fr", "zh-Hans", "hi", "ar"]) {
  if (!html.includes(`rel="alternate" hreflang="${lang}" href="https://squisheeacademy.com/"`)) fail(`home hreflang ${lang}`);
}
if (!html.includes('href="times-tables-game/"')) fail("home missing times tables landing");
if (!html.includes('href="graphs-game/"')) fail("home missing graphs landing");
if (!html.includes('href="privacy/"')) fail("home missing privacy link");
if (hasTracking(html)) fail("home has a tracking script");
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

const GAME_LANDINGS = [
  ["times-tables-game", "Free times tables game for kids (grades 2–4)", "times"],
  ["telling-time-game", "Free telling time game for kids (grades 1–4)", "time"],
  ["money-game", "Free counting money game for kids (Pre-K to grade 4)", "money"],
  ["addition-subtraction-game", "Free addition and subtraction game for kids (kindergarten through grade 4)", "add"],
  ["fractions-game", "Free fractions game for kids (grades 1–4)", "fractions"],
  ["graphs-game", "Free graphs game for kids (Pre-K to grade 4)", "graphs"],
  ["sight-words-game", "Free sight words game for kids (kindergarten through grade 4)", "sight"],
  ["phonics-game", "Free phonics game for kids (Pre-K to grade 4)", "phonics"],
  ["shapes-geometry-game", "Free shapes and geometry game for kids (Pre-K to grade 4)", "shapes"],
];
for (const [slug, titleStart, gameId] of GAME_LANDINGS) {
  const pagePath = resolve(root, slug, "index.html");
  if (!existsSync(pagePath)) fail(`missing landing ${slug}`);
  const page = readFileSync(pagePath, "utf8");
  if (!page.includes(`<title>${titleStart} | Squishee Academy</title>`)) fail(`${slug} title`);
  if (!page.includes("<h1>")) fail(`${slug} missing h1`);
  if (!page.includes(`href="../#/play/${gameId}">Play free</a>`)) fail(`${slug} play link`);
  if (!page.includes(`src="/shots/${gameId}.png"`)) fail(`${slug} screenshot`);
  if (!page.includes("Free, no ads, no accounts, 7 languages.")) fail(`${slug} note`);
  if (!page.includes('hreflang="x-default"')) fail(`${slug} x-default`);
  if (!page.includes(`hreflang="ar" href="https://squisheeacademy.com/ar/${slug}/"`)) fail(`${slug} arabic alternate`);
  if (needsJs(page)) fail(`${slug} needs JavaScript`);
  if (hasTracking(page)) fail(`${slug} has a tracking script`);
  if (!sitemap.includes(`<loc>https://squisheeacademy.com/${slug}/</loc>`)) fail(`sitemap missing ${slug}`);
  const skill = readdirSync(resolve(root, slug)).find((name) => name !== "index.html");
  if (!skill) fail(`${slug} missing a skill page`);
  const skillHtml = readFileSync(resolve(root, slug, skill, "index.html"), "utf8");
  if (!skillHtml.includes("Play free")) fail(`${slug}/${skill} play link`);
  if (needsJs(skillHtml)) fail(`${slug}/${skill} needs JavaScript`);
}
const arabic = readFileSync(resolve(root, "ar/times-tables-game/index.html"), "utf8");
if (!arabic.includes('<html lang="ar" dir="rtl">')) fail("arabic page is not rtl");
for (const prefix of ["es", "pt-br", "fr", "zh-hans", "hi", "ar"]) {
  const localized = resolve(root, prefix, "times-tables-game/index.html");
  if (!existsSync(localized)) fail(`missing ${prefix} times tables landing`);
  if (!sitemap.includes(`<loc>https://squisheeacademy.com/${prefix}/times-tables-game/</loc>`)) {
    fail(`sitemap missing ${prefix} times tables`);
  }
}

const sitemapCheck = spawnSync(
  "python3",
  [
    "-c",
    `import xml.etree.ElementTree as ET
root = ET.parse("dist-domain/sitemap.xml").getroot()
ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9", "xhtml": "http://www.w3.org/1999/xhtml"}
urls = root.findall("sm:url", ns)
assert urls, "sitemap has no urls"
for url in urls:
    loc = url.find("sm:loc", ns)
    text = "" if loc is None or loc.text is None else loc.text
    assert text.startswith("https://squisheeacademy.com/"), text
    links = url.findall("xhtml:link", ns)
    assert links, text
    langs = [link.get("hreflang") for link in links]
    assert "x-default" in langs, text
    for link in links:
        href = link.get("href") or ""
        assert href.startswith("https://squisheeacademy.com/"), href
print(len(urls))
`,
  ],
  { encoding: "utf8" },
);
if (sitemapCheck.status !== 0) fail(`sitemap xml\n${sitemapCheck.stderr || sitemapCheck.stdout}`);
const sitemapCount = Number(sitemapCheck.stdout.trim());
if (!Number.isFinite(sitemapCount) || sitemapCount < 100) fail(`sitemap has ${sitemapCount} urls`);

const VERIFY_LINE = "google-site-verification: google2c987beeafe3d9b2.html";
const verifyPath = resolve(root, "google2c987beeafe3d9b2.html");
if (!existsSync(verifyPath)) fail("google site verification file missing from dist");
const verify = readFileSync(verifyPath, "utf8");
if (verify.trim() !== VERIFY_LINE || verify.split("\n").filter((line) => line.length > 0).length !== 1) {
  fail("google site verification file contents");
}
if (manifestList.includes("/google2c987beeafe3d9b2.html")) fail("precache includes the search console file");
if (manifestList.some((url) => typeof url === "string" && (url.startsWith("/shots/") || url.includes("-game")))) {
  fail("precache includes a landing page or screenshot");
}
for (const id of ["times", "add", "time", "money", "sight", "spelling", "count", "place", "shapes", "fractions", "measure", "phonics", "problems", "variables", "graphs", "share", "grid", "patterns"]) {
  const shot = readFileSync(resolve(root, "shots", `${id}.png`));
  if (shot.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") fail(`${id} screenshot is not a png`);
  if (shot.readUInt32BE(16) !== 480 || shot.readUInt32BE(20) !== 720) {
    fail(`${id} screenshot is ${shot.readUInt32BE(16)}x${shot.readUInt32BE(20)}`);
  }
}

function walkHtml(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const file = join(dir, name);
    if (statSync(file).isDirectory()) walkHtml(file, out);
    else if (name.endsWith(".html")) out.push(file);
  }
  return out;
}

let countedPages = 0;
for (const file of walkHtml(root)) {
  const rel = file.slice(root.length + 1);
  const body = readFileSync(file, "utf8");
  if (rel === "google2c987beeafe3d9b2.html") {
    if (body.includes(COUNTER_SRC) || body.includes("goatcounter") || body.includes("<script")) {
      fail("search console file was changed");
    }
    continue;
  }
  if (!body.includes("<html")) continue;
  countedPages += 1;
  const srcCount = body.split(COUNTER_SRC).length - 1;
  const endpointCount = body.split(COUNTER_ENDPOINT).length - 1;
  if (srcCount !== 1 || endpointCount !== 1) fail(`${rel} visitor counter src=${srcCount} endpoint=${endpointCount}`);
  if (!body.includes('nav.doNotTrack === "1"') || !body.includes("nav.globalPrivacyControl === true")) {
    fail(`${rel} counter ignores Do Not Track or Global Privacy Control`);
  }
  if (body.includes("gtag(") || body.includes("googletagmanager") || body.includes("google-analytics") || body.includes("fbq(")) {
    fail(`${rel} has another tracker`);
  }
  for (const match of body.matchAll(/\ssrc=["']([^"']+)["']/gi)) {
    const src = match[1];
    if (!/^https?:|^\/\//.test(src)) continue;
    const host = src.replace(/^https?:/, "").replace(/^\/\//, "").split("/")[0];
    if (host !== "gc.zgo.at") fail(`${rel} external script ${src}`);
  }
}
if (countedPages < 100) fail(`expected the counter on every HTML page, found ${countedPages}`);
if (manifestList.some((url) => typeof url === "string" && (url.includes("goatcounter") || url.includes("zgo.at")))) {
  fail("precache includes the visitor counter");
}
if (sw.includes("gc.zgo.at") || sw.includes("goatcounter")) fail("service worker mentions the visitor counter");
const robotsBody = readFileSync(resolve(root, "robots.txt"), "utf8");
const sitemapBody = readFileSync(resolve(root, "sitemap.xml"), "utf8");
if (robotsBody.includes(COUNTER_SRC) || sitemapBody.includes(COUNTER_SRC)) fail("robots or sitemap includes the counter");
if (!sitemapBody.includes("<loc>https://squisheeacademy.com/privacy/</loc>")) fail("sitemap missing privacy");
if (!sitemapBody.includes("<loc>https://squisheeacademy.com/ar/privacy/</loc>")) fail("sitemap missing arabic privacy");

console.log("check-academy-domain OK dist-domain");
