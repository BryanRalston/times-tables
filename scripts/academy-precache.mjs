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

export const WARDROBE_IDS = [
  "flower-clip",
  "star-cap",
  "bow-tie",
  "round-glasses",
  "flower-crown",
  "berry-beret",
  "sun-hat",
  "night-cap",
  "party-crown",
  "star-glasses",
];

/** One costume file per squad squishee. A single overlay cannot fit every body. */
export const WARDROBE_FILES = SQUAD_IDS.flatMap((id) => WARDROBE_IDS.map((look) => `wardrobe/fitted/${id}-${look}.webp`));

export const COIN_FILES = ["penny.png", "nickel.png", "dime.png", "quarter.png", "dollar.png", "five.png"];

const PRECACHE_EXT = /\.(?:html|js|css|svg|png|webp|woff2?|webmanifest|mp3|wav|ogg|m4a|mp4)$/i;
/** Spanish clips for core games and Times Tables. Other `voice/es/` files stay on the runtime cache. */
const ES_PRECACHE_FILES = new Set(
  JSON.parse(readFileSync(new URL("../src/academy/voice/es-precache.json", import.meta.url), "utf8")),
);
/** Portuguese clips for core games and Times Tables. Other `voice/pt/` files stay on the runtime cache. */
const PT_PRECACHE_FILES = new Set(
  JSON.parse(readFileSync(new URL("../src/academy/voice/pt-precache.json", import.meta.url), "utf8")),
);
/** French clips for core games and Times Tables. Other `voice/fr/` files stay on the runtime cache. */
const FR_PRECACHE_FILES = new Set(
  JSON.parse(readFileSync(new URL("../src/academy/voice/fr-precache.json", import.meta.url), "utf8")),
);
/** Chinese clips for core games and Times Tables. Other `voice/zh/` files stay on the runtime cache. */
const ZH_PRECACHE_FILES = new Set(
  JSON.parse(readFileSync(new URL("../src/academy/voice/zh-precache.json", import.meta.url), "utf8")),
);
/** Hindi clips for core games and Times Tables. Other `voice/hi/` files stay on the runtime cache. */
const HI_PRECACHE_FILES = new Set(
  JSON.parse(readFileSync(new URL("../src/academy/voice/hi-precache.json", import.meta.url), "utf8")),
);
/** Arabic clips for core games and Times Tables. Other `voice/ar/` files stay on the runtime cache. */
const AR_PRECACHE_FILES = new Set(
  JSON.parse(readFileSync(new URL("../src/academy/voice/ar-precache.json", import.meta.url), "utf8")),
);
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
  for (const file of WARDROBE_FILES) out.push(file);
  return out;
}

export function isPrecacheFile(rel) {
  if (!rel || SKIP_COPY.test(rel)) return false;
  if (
    rel === "precache-manifest.json" ||
    rel === "precache-later.json" ||
    /^precache-voice-[a-z]{2}\.json$/.test(rel) ||
    rel === "CNAME" ||
    rel === ".nojekyll"
  ) {
    return false;
  }
  if (rel === SHARE_IMAGE_PATH.slice(1)) return false;
  // Game clips load on first play and stay in the runtime cache. Core clips are deferred until the first prompt.
  if (rel.startsWith("voice/lazy/")) return false;
  if (rel.startsWith("voice/es/")) return ES_PRECACHE_FILES.has(rel.slice("voice/".length));
  if (rel.startsWith("voice/pt/")) return PT_PRECACHE_FILES.has(rel.slice("voice/".length));
  if (rel.startsWith("voice/fr/")) return FR_PRECACHE_FILES.has(rel.slice("voice/".length));
  if (rel.startsWith("voice/zh/")) return ZH_PRECACHE_FILES.has(rel.slice("voice/".length));
  if (rel.startsWith("voice/hi/")) return HI_PRECACHE_FILES.has(rel.slice("voice/".length));
  if (rel.startsWith("voice/ar/")) return AR_PRECACHE_FILES.has(rel.slice("voice/".length));
  if (rel.startsWith("fonts/")) return false;
  // Landing pages, translations, and screenshots are for crawlers. They stay off the first download.
  if (rel === "google2c987beeafe3d9b2.html") return false;
  if (rel.startsWith("shots/")) return false;
  if (/^(?:es|fr|hi|ar|pt-br|zh-hans)\//.test(rel)) return false;
  if (/(?:^|\/)[a-z0-9]+(?:-[a-z0-9]+)*-game(?:\/|$)/.test(rel)) return false;
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

const VOICE_PARTS = [
  ["/voice/core/", "en"],
  ["/voice/es/", "es"],
  ["/voice/pt/", "pt"],
  ["/voice/fr/", "fr"],
  ["/voice/zh/", "zh"],
  ["/voice/hi/", "hi"],
  ["/voice/ar/", "ar"],
];

/** Which deferred voice list a precache URL belongs to. Lazy game clips are omitted. */
export function voicePrecacheLang(url) {
  const path = String(url).split("?")[0] ?? "";
  if (!path.includes("/voice/")) return null;
  for (const [part, lang] of VOICE_PARTS) {
    if (path.includes(part)) return lang;
  }
  return "lazy";
}

/**
 * The install cache is the app shell. Voice, costumes, and the rest of the
 * pictures wait until the first prompt has started, so a phone is not still
 * downloading them when the first question is ready.
 */
export function isShellUrl(url) {
  const path = String(url).split("?")[0] ?? "";
  if (path === "/" || path === "/times-tables/academy" || path === "/times-tables/academy/") return true;
  const asset = path.indexOf("/assets/");
  const rel = (asset >= 0 ? path.slice(asset + 1) : path.replace(/^\/times-tables\/academy/, "").replace(/^\/times-tables/, ""))
    .replace(/^\//, "");
  if (rel === "" || rel === "index.html" || rel === "404.html" || rel === "academy-sw.js") return true;
  if (rel === "favicon.svg" || rel === "favicon.ico" || rel === "favicon-16.png" || rel === "favicon-32.png") return true;
  if (rel === "apple-touch-icon.png" || rel === "manifest.webmanifest" || rel.startsWith("icons/")) return true;
  if (rel.endsWith(".woff")) return false;
  if (rel.startsWith("assets/main-")) return true;
  if (rel.startsWith("assets/fredoka-") || rel.startsWith("assets/nunito-") || rel.startsWith("assets/noto-")) return true;
  return false;
}

/** Split the offline set into the install shell, the later download, and one voice list per language. */
export function partitionPrecache(urls) {
  const shell = [];
  const later = [];
  const voice = { en: [], es: [], pt: [], fr: [], zh: [], hi: [], ar: [] };
  for (const url of urls) {
    const lang = voicePrecacheLang(url);
    if (lang === "lazy") continue;
    if (lang) {
      voice[lang].push(url);
      continue;
    }
    if (isShellUrl(url)) shell.push(url);
    else later.push(url);
  }
  return { shell, later, voice };
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
  const { shell, later, voice } = partitionPrecache(list);
  writeFileSync(join(root, "precache-manifest.json"), `${JSON.stringify(shell)}\n`);
  writeFileSync(join(root, "precache-later.json"), `${JSON.stringify(later)}\n`);
  for (const [lang, urls] of Object.entries(voice)) {
    writeFileSync(join(root, `precache-voice-${lang}.json`), `${JSON.stringify(urls)}\n`);
  }
  return list;
}

const PRECACHE_RUNTIME = `
const VOICE_LANGS = ["en", "es", "pt", "fr", "zh", "hi", "ar"];
let precachePaused = false;
const precacheJobs = {};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readList(name) {
  const manifestUrl = new URL(name, self.registration.scope);
  const res = await fetch(manifestUrl, { cache: "no-store" });
  if (!res.ok) throw new Error(name);
  const list = await res.json();
  if (!Array.isArray(list)) throw new Error(name);
  return list;
}

function matchCached(req) {
  return caches.match(req, { ignoreVary: true });
}

async function precacheUrls(list, batchSize, deferrable) {
  const cache = await caches.open(CACHE);
  for (let i = 0; i < list.length; i += batchSize) {
    if (deferrable) {
      while (precachePaused) await sleep(40);
    }
    const slice = list.slice(i, i + batchSize);
    await Promise.all(
      slice.map(async (url) => {
        if (typeof url !== "string" || !url.startsWith("/")) throw new Error("precache url");
        if (deferrable && (await cache.match(url, { ignoreVary: true }))) return;
        if (deferrable) {
          while (precachePaused) await sleep(40);
          if (!navigator.onLine) throw new Error("offline");
        }
        const hit = await fetch(url, deferrable ? { priority: "low" } : undefined);
        if (!hit.ok) throw new Error(url);
        await cache.put(url, hit);
      }),
    );
  }
}

async function precacheAll() {
  await precacheUrls(await readList("precache-manifest.json"), 8, false);
}

async function tellClients(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  for (const client of clients) client.postMessage(message);
}

function cleanSeen(seen) {
  if (!Array.isArray(seen)) return [];
  const out = [];
  const used = new Set();
  for (const url of seen) {
    if (typeof url !== "string" || !url.startsWith("/") || url.includes("..") || url.length >= 240) continue;
    if (used.has(url)) continue;
    used.add(url);
    out.push(url);
  }
  return out;
}

async function rememberSeen(urls) {
  const cache = await caches.open(CACHE);
  const list = cleanSeen(urls);
  for (let i = 0; i < list.length; i += 4) {
    while (precachePaused) await sleep(40);
    if (!navigator.onLine) throw new Error("offline");
    const slice = list.slice(i, i + 4);
    await Promise.all(
      slice.map(async (url) => {
        try {
          if (await cache.match(url, { ignoreVary: true })) return;
          while (precachePaused) await sleep(40);
          const hit = await fetch(url, { priority: "low" });
          if (!hit.ok) return;
          await cache.put(url, hit);
        } catch {
          /* one missed file should not skip this language's clips */
        }
      }),
    );
  }
}

async function networkFirst(req, cached) {
  const hit = await matchCached(req);
  const pull = fetch(req).then((res) => {
    if (res && res.ok) {
      const copy = res.clone();
      caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
      return res;
    }
    return hit || res;
  });
  if (!hit) {
    try {
      return await pull;
    } catch {
      return cached();
    }
  }
  let timer = 0;
  const giveUp = new Promise((resolve) => {
    timer = setTimeout(() => resolve(hit), 2500);
  });
  try {
    const res = await Promise.race([pull, giveUp]);
    clearTimeout(timer);
    return res;
  } catch {
    clearTimeout(timer);
    return hit;
  }
}

async function precacheLater(lang, seen) {
  if (!VOICE_LANGS.includes(lang)) return;
  if (!precacheJobs.seen) {
    precacheJobs.seen = rememberSeen(seen).catch((err) => {
      delete precacheJobs.seen;
      throw err;
    });
  }
  await precacheJobs.seen;
  if (!precacheJobs[lang]) {
    precacheJobs[lang] = readList("precache-voice-" + lang + ".json")
      .then((list) => precacheUrls(list, 4, true))
      .catch((err) => {
        delete precacheJobs[lang];
        throw err;
      });
  }
  await precacheJobs[lang];
  await tellClients({ type: "precache-voice-done", lang });
  if (!precacheJobs.rest) {
    precacheJobs.rest = readList("precache-later.json")
      .then((list) => precacheUrls(list, 4, true))
      .catch((err) => {
        delete precacheJobs.rest;
        throw err;
      });
  }
  await precacheJobs.rest;
  await tellClients({ type: "precache-later-done", lang });
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

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;
  if (data.type === "precache-pause") {
    precachePaused = true;
    return;
  }
  if (data.type === "precache-resume") {
    precachePaused = false;
    return;
  }
  if (data.type === "precache-later" && typeof data.lang === "string") {
    event.waitUntil(precacheLater(data.lang, data.seen));
  }
});
`;

export function subpathServiceWorker() {
  return `/* Academy-only offline cache. Registered with scope /times-tables/academy/ so Squishee Math is not controlled. */
const CACHE = "squishee-academy-v15";
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

  const cached = async () => {
    const hit = await matchCached(req);
    if (hit) return hit;
    if (req.mode === "navigate") {
      const page =
        (await matchCached("/times-tables/academy/index.html")) || (await matchCached("/times-tables/academy/"));
      if (page) return page;
    }
    return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
  };
  event.respondWith(
    (async () => {
      if (!navigator.onLine) return cached();
      return networkFirst(req, cached);
    })(),
  );
});
`;
}

export function domainServiceWorker() {
  return `/* Squishee Academy offline cache. Served from the domain root so scope is /. */
const CACHE = "squishee-academy-root-v15";
const SHARE_IMAGE = ${JSON.stringify(SHARE_IMAGE_PATH)};
${PRECACHE_RUNTIME}
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Link-preview crawlers need the PNG itself. Do not intercept, cache, or replace it with the app shell.
  if (url.pathname === SHARE_IMAGE) return;

  const cached = async () => {
    const hit = await matchCached(req);
    if (hit) return hit;
    if (req.mode === "navigate") {
      const indexUrl = (url.pathname.endsWith("/") ? url.pathname : url.pathname + "/") + "index.html";
      const page =
        (await matchCached(url.pathname)) ||
        (await matchCached(indexUrl)) ||
        (await caches.match("/index.html")) ||
        (await matchCached("/index.html")) ||
        (await matchCached("/"));
      if (page) return page;
    }
    return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
  };
  event.respondWith(
    (async () => {
      if (!navigator.onLine) return cached();
      return networkFirst(req, cached);
    })(),
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
