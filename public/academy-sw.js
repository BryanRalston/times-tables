/* Academy-only offline cache. Registered with scope /times-tables/academy/ so Squishee Math is not controlled. */
const CACHE = "squishee-academy-v15";

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
