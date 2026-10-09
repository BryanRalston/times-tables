import type { SquishRole } from "./gesture";

const KEY = "squishee-academy-squish";
const CAP = 9999;

let count = 0;
let loaded = false;
const listeners = new Set<() => void>();

/** A soft pitch unique to each squishee, kept in a cute range. */
export function squishPitch(id: string): number {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const unit = (hash >>> 0) % 1000;
  return 320 + (unit / 999) * 150;
}

/** Catchphrase every few squishes. Hearts only for the round buddy. */
export function squishFlourish(countOn: number, role: SquishRole): { line: boolean; hearts: boolean } {
  return {
    line: countOn > 0 && countOn % 4 === 0,
    hearts: role === "buddy" && countOn > 0 && countOn % 3 === 0,
  };
}

function readStored(): number {
  if (typeof localStorage === "undefined") return 0;
  try {
    const n = Number(localStorage.getItem(KEY));
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.min(CAP, Math.floor(n));
  } catch {
    return 0;
  }
}

function writeStored(n: number): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(KEY, String(n));
  } catch {
    /* Private mode can refuse storage. The tally still works in memory. */
  }
}

export function getSquishCount(): number {
  if (!loaded) {
    loaded = true;
    count = readStored();
  }
  return count;
}

export function bumpSquishCount(): number {
  count = Math.min(CAP, getSquishCount() + 1);
  loaded = true;
  writeStored(count);
  for (const listener of listeners) listener();
  return count;
}

export function subscribeSquish(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetSquishCount(): void {
  count = 0;
  loaded = true;
  writeStored(0);
  for (const listener of listeners) listener();
}

export function squishBuzz(reduced: boolean, vibrate?: (ms: number) => void): void {
  if (reduced) return;
  const buzz = vibrate ?? defaultVibrate;
  try {
    buzz(12);
  } catch {
    /* Some browsers expose vibrate and then throw. */
  }
}

function defaultVibrate(ms: number): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  navigator.vibrate(ms);
}
