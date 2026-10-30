import { isGameId } from "../games/catalog";
import { storyById } from "../stories/catalog";

/**
 * Anonymous GoatCounter events for the domain build.
 * Nothing is stored here, and nothing is sent until count.js has loaded.
 * Do Not Track and Global Privacy Control use the same check as the page-view snippet.
 */

const LOCALES = new Set(["en", "es", "pt", "fr", "zh", "hi", "ar"]);

type CountCall = { path: string; event: true };
type CountFn = (opts: CountCall) => void;
type VisitWindow = Window & { goatcounter?: { count?: CountFn } };

const pending: string[] = [];
const langSent = new Set<string>();
let hooked = false;

function browserNav(): (Navigator & { globalPrivacyControl?: boolean }) | null {
  const nav = (globalThis as { navigator?: Navigator }).navigator;
  return nav ?? null;
}

function browserWindow(): VisitWindow | null {
  const win = (globalThis as { window?: VisitWindow }).window;
  return win ?? null;
}

function optOut(): boolean {
  const nav = browserNav();
  if (!nav) return true;
  return nav.doNotTrack === "1" || nav.globalPrivacyControl === true;
}

function countFn(): CountFn | null {
  const win = browserWindow();
  if (!win || optOut()) return null;
  const counter = win.goatcounter;
  if (!counter || typeof counter.count !== "function") return null;
  return counter.count.bind(counter);
}

type CounterScript = { tagName?: string; addEventListener?: (type: string, fn: () => void) => void };

function counterScript(): CounterScript | null {
  const doc = (globalThis as { document?: { querySelector: (selector: string) => CounterScript | null } }).document;
  const node = doc?.querySelector('script[src*="gc.zgo.at/count.js"]') ?? null;
  if (!node || node.tagName !== "SCRIPT" || typeof node.addEventListener !== "function") return null;
  return node;
}

/** Returns true when count.js is on the page and we can send after it loads. */
function ensureHook(): boolean {
  if (hooked) return true;
  const script = counterScript();
  if (!script?.addEventListener) return false;
  hooked = true;
  script.addEventListener("load", () => flush());
  return true;
}

function flush(): void {
  if (optOut()) {
    pending.length = 0;
    return;
  }
  let count = countFn();
  if (!count) {
    ensureHook();
    count = countFn();
  }
  if (!count) return;
  const batch = pending.splice(0, pending.length);
  for (const name of batch) {
    if (name.startsWith("lang/")) {
      if (langSent.has(name)) continue;
      langSent.add(name);
    }
    count({ path: `event/${name}`, event: true });
  }
}

function enqueue(name: string): void {
  if (optOut()) return;
  if (name.startsWith("lang/")) {
    if (langSent.has(name) || pending.includes(name)) return;
  }
  const ready = !!countFn();
  if (!ready && !ensureHook()) return;
  pending.push(name);
  flush();
}

/** The language in use, once per locale for this page load. */
export function noteLocale(locale: string): void {
  if (!LOCALES.has(locale)) return;
  enqueue(`lang/${locale}`);
}

export function countGameStart(gameId: string): void {
  if (!isGameId(gameId)) return;
  enqueue(`game-start/${gameId}`);
}

export function countRoundComplete(gameId: string): void {
  if (!isGameId(gameId)) return;
  enqueue(`round-complete/${gameId}`);
}

export function countStoryFinish(bookId: string): void {
  if (!storyById(bookId)) return;
  enqueue(`storybook-finish/${bookId}`);
}

/** Test hook. The page never calls this. */
export function resetVisitCountsForTests(): void {
  pending.length = 0;
  langSent.clear();
  hooked = false;
}
