import { parseHash } from "./nav";

export const WELCOME_HASH = "#/play/welcome";
export const SAVE_KEYS = ["g3-path-v2", "g3-path-v1", "times-tables-progress", "times-tables-settings"] as const;

export function unwrapSaveUnknown(parsed: unknown): Record<string, unknown> | null {
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;
  if (o.state && typeof o.state === "object") return o.state as Record<string, unknown>;
  return o;
}

export function saveShowsWelcome(parsed: unknown): boolean {
  const s = unwrapSaveUnknown(parsed);
  if (!s) return false;
  if (s.seenWelcome === true) return true;
  const learners = s.learners;
  if (learners && typeof learners === "object") {
    const id = typeof s.learnerId === "string" && s.learnerId ? s.learnerId : "kid-1";
    const kid = (learners as Record<string, { seenWelcome?: unknown }>)[id];
    if (kid?.seenWelcome === true) return true;
  }
  return false;
}

export function storageShowsWelcome(ls: Pick<Storage, "getItem"> | null | undefined): boolean {
  if (!ls) return false;
  for (const key of SAVE_KEYS) {
    try {
      const raw = ls.getItem(key);
      if (!raw) continue;
      if (saveShowsWelcome(JSON.parse(raw))) return true;
    } catch {
      /* ignore bad save */
    }
  }
  return false;
}

/** Empty Guest catalog hashes become leftover. Grown-ups stay. Already-welcome hash stays. */
export function shouldOpenLeftover(hash: string, seenWelcome: boolean): boolean {
  if (seenWelcome) return false;
  const route = parseHash(hash);
  if (route.id === "grownup") return false;
  if (route.id === "play" && route.kind === "welcome") return false;
  return true;
}

/** Set leftover hash before React can paint Home. No-op if already there or they have seen welcome. */
export function applyFirstVisitHash(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const seen = storageShowsWelcome(window.localStorage);
    if (!shouldOpenLeftover(window.location.hash, seen)) return false;
    const next = `${window.location.pathname}${window.location.search}${WELCOME_HASH}`;
    window.history.replaceState(null, "", next);
    return true;
  } catch {
    return false;
  }
}
