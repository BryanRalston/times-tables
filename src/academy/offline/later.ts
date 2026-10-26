const PRECACHE_LANGS = ["en", "es", "pt", "fr", "zh", "hi", "ar"] as const;

if (typeof performance !== "undefined" && typeof performance.setResourceTimingBufferSize === "function") {
  try {
    performance.setResourceTimingBufferSize(2000);
  } catch {
    /* the entries already kept are still enough to cache this round */
  }
}

type PrecacheLang = (typeof PRECACHE_LANGS)[number];

type PrecacheMessage =
  | { type: "precache-pause" }
  | { type: "precache-resume" }
  | { type: "precache-later"; lang: PrecacheLang; seen: string[] };

let held = 0;
const waiting: Array<() => void> = [];
const started = new Set<PrecacheLang>();
let chain: Promise<void> = Promise.resolve();

function isPrecacheLang(lang: string): lang is PrecacheLang {
  return (PRECACHE_LANGS as readonly string[]).includes(lang);
}

function pushPath(out: string[], raw: string): void {
  if (typeof location === "undefined") return;
  try {
    const url = new URL(raw, location.origin);
    if (url.origin !== location.origin) return;
    if (!url.pathname.startsWith("/") || url.pathname.includes("..")) return;
    out.push(url.pathname);
  } catch {
    /* skip a bad resource entry */
  }
}

function seenPaths(): string[] {
  const out: string[] = [];
  if (typeof performance !== "undefined") {
    for (const entry of performance.getEntriesByType("resource")) pushPath(out, entry.name);
  }
  if (typeof document !== "undefined") {
    for (const el of document.querySelectorAll("script[src], link[href]")) {
      const src = el.getAttribute("src") || el.getAttribute("href");
      if (src) pushPath(out, src);
    }
  }
  return out;
}

function post(message: PrecacheMessage): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const ready = navigator.serviceWorker.ready;
  if (!ready || typeof ready.then !== "function") return;
  chain = chain
    .then(async () => {
      const reg = await navigator.serviceWorker.ready;
      reg.active?.postMessage(message);
    })
    .catch(() => undefined);
}

/** Hold the background download while a prompt's clips are fetched. */
export function holdPrecache(): () => void {
  held += 1;
  post({ type: "precache-pause" });
  let done = false;
  return () => {
    if (done) return;
    done = true;
    held = Math.max(0, held - 1);
    post({ type: "precache-resume" });
    if (held === 0) {
      const pending = waiting.splice(0);
      for (const run of pending) run();
    }
  };
}

/**
 * Cache this language's clips, then the rest of the offline set.
 * Waits until the current prompt's clips have loaded so the first round is not silent.
 */
export function precacheAfterFirstPrompt(lang: string): void {
  if (!isPrecacheLang(lang) || started.has(lang)) return;
  started.add(lang);
  const run = () => post({ type: "precache-later", lang, seen: seenPaths() });
  if (held > 0) waiting.push(run);
  else run();
}
