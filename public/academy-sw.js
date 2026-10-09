/* Academy-only offline cache. Registered with scope /times-tables/academy/ so Squishee Math is not controlled. */
const CACHE = "squishee-academy-v3";

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
