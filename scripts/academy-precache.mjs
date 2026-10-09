import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export const SQUAD_IDS = [
  "peach",
  "frog",
  "bunny",
  "melon",
  "grape",
  "bear",
  "cat",
  "panda",
  "owl",
  "chick",
  "duck",
  "pig",
  "penguin",
  "whale",
  "avocado",
  "donut",
  "corn",
  "lemon",
  "strawberry",
  "cookie",
  "boba",
  "fox",
  "otter",
  "capybara",
];

export const COSMETIC_IDS = ["party-hat", "scarf", "bow", "shades"];

export const COIN_FILES = ["penny.png", "nickel.png", "dime.png", "quarter.png", "dollar.png", "five.png"];

const PRECACHE_EXT = /\.(?:html|js|css|svg|png|webp|woff2?|webmanifest|mp3|wav|ogg|m4a|mp4)$/i;
const POKE_NAME = /[a-z0-9]+(?:-[a-z0-9]+)*-poke(?:-strip)?\.(?:mp4|png)/g;
const SKIP_COPY = /^(?:squishees|cosmetics|money)\//;

/** Share card. Left out of the offline cache so the worker never answers it. */
export const SHARE_IMAGE_PATH = "/og/squishee-academy.png";

export function isPokeMediaName(name) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*-poke\.mp4$/.test(name) || /^[a-z0-9]+(?:-[a-z0-9]+)*-poke-strip\.png$/.test(name);
}

/** Poke clips and coarse-pointer strips. Cheer hops are not poke media. */
export function pokeMediaFiles() {
  const dir = resolve("public/squishees");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => isPokeMediaName(name))
    .sort()
    .map((name) => `squishees/${name}`);
}

export function referencedPokeNames(text) {
  return [...new Set(String(text).match(POKE_NAME) ?? [])].sort();
}

export function copyPokeMedia(outDir) {
  const root = resolve(outDir);
  const srcDir = resolve("public/squishees");
  const copied = [];
  for (const rel of pokeMediaFiles()) {
    const name = rel.slice("squishees/".length);
    const src = join(srcDir, name);
    if (!existsSync(src)) continue;
    const dest = join(root, rel);
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest);
    copied.push(rel);
  }
  return copied;
}

export function artPaths() {
  const out = ["favicon.svg"];
  for (const id of SQUAD_IDS) out.push(`squishees/${id}.png`);
  for (const id of SQUAD_IDS) {
    for (const cosmetic of COSMETIC_IDS) out.push(`cosmetics/${id}-${cosmetic}.png`);
  }
  for (const file of COIN_FILES) out.push(`money/${file}`);
  return out;
}

export function isPrecacheFile(rel) {
  if (!rel || SKIP_COPY.test(rel)) return false;
  if (rel === "precache-manifest.json" || rel === "CNAME" || rel === ".nojekyll") return false;
  if (rel === SHARE_IMAGE_PATH.slice(1)) return false;
  return PRECACHE_EXT.test(rel);
}

export function joinUrl(prefix, rel) {
  const left = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
  const right = String(rel).replace(/^\/+/, "");
  if (!left) return `/${right}`;
  return `${left}/${right}`;
}

/** Absolute URLs mentioned in built HTML, CSS, and JS, including sound files. */
export function referencedUrls(text) {
  const out = new Set();
  const re =
    /(?:https?:\/\/[^/"'\s]+)?(\/(?:times-tables\/)?(?:assets|squishees|cosmetics|money|art|sounds|worksheets|privacy)\/[A-Za-z0-9._~/-]+)/g;
  for (const match of text.matchAll(re)) {
    const path = match[1];
    if (path) out.add(path.split("?")[0].split("#")[0]);
  }
  return [...out];
}

export function buildPrecacheList({ appPrefix, artPrefix, mediaPrefix, files, texts }) {
  const urls = new Set();
  for (const rel of files) {
    if (!isPrecacheFile(rel)) continue;
    const url = joinUrl(appPrefix, rel);
    urls.add(url);
    if (rel === "index.html") urls.add(appPrefix ? `${appPrefix}/` : "/");
    if (rel.endsWith("/index.html")) urls.add(url.slice(0, -"index.html".length));
  }
  for (const rel of artPaths()) urls.add(joinUrl(artPrefix, rel));
  if (mediaPrefix !== undefined) {
    for (const rel of pokeMediaFiles()) urls.add(joinUrl(mediaPrefix, rel));
  }
  for (const text of texts ?? []) {
    for (const url of referencedUrls(text)) urls.add(url);
  }
  return [...urls].sort();
}

function listBuildFiles(root, dir = root, prefix = "") {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    const rel = prefix ? `${prefix}/${name}` : name;
    if (statSync(abs).isDirectory()) out.push(...listBuildFiles(root, abs, rel));
    else out.push(rel);
  }
  return out;
}

export function fileForPrecacheUrl(url, { outDir, publicDir, appPrefix, artPrefix }) {
  const candidates = [];
  const appRoot = appPrefix ? `${appPrefix}/` : "/";
  if (url === (appPrefix || "/") || url.startsWith(appRoot)) {
    let rel = appPrefix ? url.slice(appPrefix.length).replace(/^\//, "") : url.replace(/^\//, "");
    if (rel === "" || rel.endsWith("/")) rel += "index.html";
    candidates.push(join(outDir, rel));
  }
  const artRoot = artPrefix ? `${artPrefix}/` : "/";
  if (url.startsWith(artRoot)) {
    const rel = artPrefix ? url.slice(artPrefix.length).replace(/^\//, "") : url.replace(/^\//, "");
    if (rel && !rel.endsWith("/")) {
      candidates.push(join(publicDir, rel));
      candidates.push(join(outDir, rel));
    }
  }
  return candidates.find((file) => existsSync(file) && statSync(file).isFile()) ?? null;
}

export function writePrecacheManifest(outDir, { appPrefix, artPrefix, mediaPrefix, publicDir = resolve("public") }) {
  const root = resolve(outDir);
  const files = listBuildFiles(root);
  const texts = [];
  for (const rel of files) {
    if (/\.(?:js|css|html|webmanifest)$/.test(rel)) texts.push(readFileSync(join(root, rel), "utf8"));
  }
  const list = buildPrecacheList({ appPrefix, artPrefix, mediaPrefix, files, texts }).filter((url) =>
    fileForPrecacheUrl(url, { outDir: root, publicDir, appPrefix, artPrefix }),
  );
  writeFileSync(join(root, "precache-manifest.json"), `${JSON.stringify(list)}\n`);
  return list;
}

const PRECACHE_RUNTIME = `
async function precacheAll() {
  const cache = await caches.open(CACHE);
  const manifestUrl = new URL("precache-manifest.json", self.registration.scope);
  const res = await fetch(manifestUrl, { cache: "no-store" });
  if (!res.ok) throw new Error("precache manifest");
  const list = await res.json();
  if (!Array.isArray(list)) throw new Error("precache manifest");
  for (let i = 0; i < list.length; i += 8) {
    const slice = list.slice(i, i + 8);
    await Promise.all(
      slice.map(async (url) => {
        if (typeof url !== "string" || !url.startsWith("/")) throw new Error("precache url");
        const hit = await fetch(url);
        if (!hit.ok) throw new Error(url);
        await cache.put(url, hit);
      }),
    );
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheAll().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key.startsWith("squishee-academy-") && key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});
`;

export function subpathServiceWorker() {
  return `/* Academy-only offline cache. Registered with scope /times-tables/academy/ so Squishee Math is not controlled. */
const CACHE = "squishee-academy-v4";
${PRECACHE_RUNTIME}
function isMathShell(pathname) {
  return pathname === "/times-tables" || pathname === "/times-tables/" || pathname === "/times-tables/index.html";
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (isMathShell(url.pathname)) return;
  if (req.mode === "navigate" && !url.pathname.startsWith("/times-tables/academy")) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(async () => {
        const hit = await caches.match(req);
        if (hit) return hit;
        if (req.mode === "navigate") {
          const page =
            (await caches.match("/times-tables/academy/index.html")) || (await caches.match("/times-tables/academy/"));
          if (page) return page;
        }
        return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
      }),
  );
});
`;
}

export function domainServiceWorker() {
  return `/* Squishee Academy offline cache. Served from the domain root so scope is /. */
const CACHE = "squishee-academy-root-v4";
const SHARE_IMAGE = ${JSON.stringify(SHARE_IMAGE_PATH)};
${PRECACHE_RUNTIME}
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Link-preview crawlers need the PNG itself. Do not intercept, cache, or replace it with the app shell.
  if (url.pathname === SHARE_IMAGE) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(async () => {
        const hit = await caches.match(req);
        if (hit) return hit;
        if (req.mode === "navigate") {
          const indexUrl = (url.pathname.endsWith("/") ? url.pathname : url.pathname + "/") + "index.html";
          const page =
            (await caches.match(url.pathname)) ||
            (await caches.match(indexUrl)) ||
            (await caches.match("/index.html")) ||
            (await caches.match("/"));
          if (page) return page;
        }
        return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
      }),
  );
});
`;
}

export function academyPrecachePlugin(outDir, options) {
  return {
    name: "academy-precache-manifest",
    writeBundle() {
      copyPokeMedia(outDir);
    },
    closeBundle() {
      writePrecacheManifest(outDir, options);
    },
  };
}
