import { create } from "zustand";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";
import { applyBuy, type BuyReason } from "./coins";
import { GRADE4_SPANS, UNIT_SPANS, UNITS, unitById, unitsFor } from "./curriculum";
import { parseLocale } from "./i18n";
import type { DaySession, LearnerSlice, Locale, PathGrade, SaveState } from "./types";
import { parsePathGrade } from "./types";

const SAVE_VERSION = 7;
export const STORAGE_KEY = "g3-path-v2";
export const LEGACY_STORAGE_KEYS = ["g3-path-v1", "times-tables-progress", "times-tables-settings"] as const;
const DEFAULT_ID = "kid-1";

let persistWrites = false;

function getLocalStorage(): Storage | null {
  try {
    const ls = globalThis.localStorage;
    return ls ?? null;
  } catch {
    return null;
  }
}

function parseJson(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function unwrapSave(parsed: unknown): Partial<SaveState> | null {
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;
  if (o.state && typeof o.state === "object") return o.state as Partial<SaveState>;
  return o as Partial<SaveState>;
}

export function looksLikeSave(s: Partial<SaveState> | null | undefined): boolean {
  if (!s || typeof s !== "object") return false;
  return (
    typeof s.coins === "number" ||
    typeof s.stars === "number" ||
    typeof s.name === "string" ||
    typeof s.version === "number" ||
    typeof s.learnerId === "string" ||
    typeof s.locale === "string" ||
    typeof s.seenWelcome === "boolean" ||
    Boolean(s.activities) ||
    Boolean(s.learners) ||
    Boolean(s.sessions)
  );
}

export function readFirstSave(): Partial<SaveState> | null {
  const ls = getLocalStorage();
  if (!ls) return null;
  for (const key of [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]) {
    const slice = unwrapSave(parseJson(ls.getItem(key)));
    if (looksLikeSave(slice)) return slice;
  }
  return null;
}

export function emptyLearner(name = ""): LearnerSlice {
  return {
    name,
    stars: 0,
    seenWelcome: false,
    activities: {},
    badges: [],
    shaky: {},
    sessions: {},
    squishees: [],
    coins: 0,
    attempts: {},
    perfectWalks: 0,
  };
}

function sliceOf(s: LearnerSlice): LearnerSlice {
  return {
    name: s.name,
    stars: s.stars,
    seenWelcome: s.seenWelcome,
    activities: s.activities,
    badges: s.badges,
    shaky: s.shaky,
    sessions: s.sessions,
    squishees: s.squishees ?? [],
    coins: typeof s.coins === "number" ? Math.max(0, Math.floor(s.coins)) : 0,
    attempts: s.attempts ?? {},
    perfectWalks: s.perfectWalks ?? 0,
  };
}

function empty(): SaveState {
  const kid = emptyLearner();
  return {
    version: SAVE_VERSION,
    learnerId: DEFAULT_ID,
    classUnitId: "",
    pathGrade: 3,
    skipWeekend: true,
    locale: "en",
    learners: { [DEFAULT_ID]: kid },
    ...kid,
  };
}

function migrate(raw: Partial<SaveState> | null | undefined): SaveState {
  const base = empty();
  if (!raw || typeof raw !== "object") return base;
  const learnerId = raw.learnerId || DEFAULT_ID;
  const fromFlat = sliceOf({
    name: raw.name ?? "",
    stars: typeof raw.stars === "number" ? raw.stars : 0,
    seenWelcome: Boolean(raw.seenWelcome),
    activities: raw.activities ?? {},
    badges: raw.badges ?? [],
    shaky: raw.shaky ?? {},
    sessions: raw.sessions ?? {},
    squishees: raw.squishees ?? [],
    coins: typeof raw.coins === "number" ? raw.coins : 0,
    attempts: raw.attempts ?? {},
    perfectWalks: raw.perfectWalks ?? 0,
  });
  const learners = { ...(raw.learners ?? {}) };
  if (!learners[learnerId]) learners[learnerId] = fromFlat;
  for (const id of Object.keys(learners)) learners[id] = sliceOf(learners[id]!);
  const cur = learners[learnerId] ?? fromFlat;
  const pathGrade = parsePathGrade(raw.pathGrade);
  let classUnitId = raw.classUnitId ?? "";
  if (classUnitId && !unitsFor(pathGrade).some((u) => u.id === classUnitId)) classUnitId = "";
  return {
    version: SAVE_VERSION,
    learnerId,
    classUnitId,
    pathGrade,
    skipWeekend: raw.skipWeekend !== false,
    locale: parseLocale(raw.locale),
    learners,
    ...cur,
  };
}

interface ProgressApi extends SaveState {
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  setName: (name: string) => void;
  markWelcome: () => void;
  setClassUnit: (id: string) => void;
  setPathGrade: (grade: PathGrade) => void;
  setSkipWeekend: (v: boolean) => void;
  setLocale: (locale: Locale) => void;
  recordRound: (opts: {
    activityId: string;
    correct: number;
    total: number;
    earned: number;
    misses: string[];
  }) => void;
  recordSession: (session: DaySession) => void;
  noteFact: (key: string, ok: boolean) => void;
  beginPlay: (activityId: string) => number;
  awardCoins: (n: number) => void;
  buySquishee: (id: string) => { ok: boolean; reason: BuyReason };
  switchLearner: (id: string) => void;
  addLearner: (name: string) => string;
  resetAll: () => void;
}

function snapshotSave(s: SaveState): SaveState {
  return {
    version: s.version,
    learnerId: s.learnerId,
    name: s.name,
    stars: s.stars,
    seenWelcome: s.seenWelcome,
    classUnitId: s.classUnitId,
    pathGrade: s.pathGrade,
    skipWeekend: s.skipWeekend,
    locale: s.locale,
    activities: s.activities,
    badges: s.badges,
    shaky: s.shaky,
    sessions: s.sessions,
    squishees: s.squishees,
    coins: s.coins,
    attempts: s.attempts,
    perfectWalks: s.perfectWalks,
    learners: s.learners,
  };
}

function commit(get: () => ProgressApi, set: (p: Partial<ProgressApi>) => void, patch: Partial<LearnerSlice>) {
  const id = get().learnerId || DEFAULT_ID;
  const cur = sliceOf(get().learners[id] ?? get());
  const next = { ...cur, ...patch };
  set({
    learnerId: id,
    ...next,
    learners: { ...get().learners, [id]: next },
  });
}

const progressStorage: PersistStorage<SaveState> = {
  getItem: (): StorageValue<SaveState> | null => {
    const slice = readFirstSave();
    if (!slice) return null;
    return { state: migrate(slice), version: 0 };
  },
  setItem: (_name, value) => {
    if (!persistWrites) return;
    const ls = getLocalStorage();
    if (!ls) return;
    ls.setItem(STORAGE_KEY, JSON.stringify(value));
  },
  removeItem: (_name) => {
    if (!persistWrites) return;
    getLocalStorage()?.removeItem(STORAGE_KEY);
  },
};

export const useProgress = create<ProgressApi>()(
  persist(
    (set, get) => ({
      ...empty(),
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),
      setName: (name) => commit(get, set, { name: name.trim().slice(0, 24) }),
      markWelcome: () => commit(get, set, { seenWelcome: true }),
      setClassUnit: (id) => set({ classUnitId: id }),
      setPathGrade: (grade) => {
        const pathGrade = parsePathGrade(grade);
        const classUnitId = unitsFor(pathGrade).some((u) => u.id === get().classUnitId) ? get().classUnitId : "";
        set({ pathGrade, classUnitId });
      },
      setSkipWeekend: (v) => set({ skipWeekend: v }),
      setLocale: (locale) => set({ locale: parseLocale(locale) }),
      recordRound: ({ activityId, correct, total, earned, misses }) => {
        const prev = get().activities[activityId] ?? {
          plays: 0,
          best: 0,
          last: 0,
          stars: 0,
          misses: [],
        };
        const pct = total === 0 ? 0 : correct / total;
        const stars = Math.max(prev.stars, pct >= 1 ? 3 : pct >= 0.7 ? 2 : pct >= 0.4 ? 1 : 0);
        commit(get, set, {
          stars: get().stars + earned,
          perfectWalks: get().perfectWalks + (total > 0 && correct === total ? 1 : 0),
          activities: {
            ...get().activities,
            [activityId]: {
              plays: prev.plays + 1,
              best: Math.max(prev.best, correct),
              last: correct,
              stars,
              misses: [...misses].slice(0, 12),
            },
          },
        });
      },
      recordSession: (session) => {
        commit(get, set, {
          sessions: {
            ...get().sessions,
            [session.date]: session,
          },
        });
      },
      noteFact: (key, ok) => {
        const shaky = { ...get().shaky };
        if (ok) {
          if (shaky[key]) {
            shaky[key] -= 1;
            if (shaky[key] <= 0) delete shaky[key];
          }
        } else {
          shaky[key] = (shaky[key] ?? 0) + 1;
        }
        commit(get, set, { shaky });
      },
      beginPlay: (activityId) => {
        const attempts = { ...get().attempts };
        const n = (attempts[activityId] ?? 0) + 1;
        attempts[activityId] = n;
        commit(get, set, { attempts });
        return n;
      },
      awardCoins: (n) => {
        const add = Math.max(0, Math.floor(n));
        if (!add) return;
        commit(get, set, { coins: get().coins + add });
      },
      buySquishee: (id) => {
        const r = applyBuy(get().coins, get().squishees, id);
        if (r.ok) commit(get, set, { coins: r.coins, squishees: r.squishees });
        return { ok: r.ok, reason: r.reason };
      },
      switchLearner: (id) => {
        const kid = get().learners[id];
        if (!kid) return;
        set({ learnerId: id, ...sliceOf(kid) });
      },
      addLearner: (name) => {
        const id = `kid-${Date.now().toString(36)}`;
        const kid = emptyLearner(name.trim().slice(0, 24) || "New kid");
        set({
          learnerId: id,
          ...kid,
          learners: { ...get().learners, [id]: kid },
        });
        return id;
      },
      resetAll: () => {
        const id = get().learnerId || DEFAULT_ID;
        const name = get().name;
        const kid = emptyLearner(name);
        set({
          ...empty(),
          hydrated: true,
          learnerId: id,
          classUnitId: get().classUnitId,
          pathGrade: get().pathGrade,
          skipWeekend: get().skipWeekend,
          locale: get().locale,
          learners: { ...get().learners, [id]: kid },
          ...kid,
        });
      },
    }),
    {
      name: STORAGE_KEY,
      skipHydration: true,
      storage: progressStorage,
      partialize: (s) => snapshotSave(s),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SaveState>;
        return { ...current, ...migrate(p) };
      },
    },
  ),
);

export function migrateSave(raw: Partial<SaveState> | null | undefined): SaveState {
  return migrate(raw);
}

export function persistWritesEnabled(): boolean {
  return persistWrites;
}

export function setPersistWrites(on: boolean): void {
  persistWrites = on;
}

export function resetProgressMemory(): void {
  persistWrites = false;
  useProgress.setState({ ...empty(), hydrated: false });
}

export function exportSaveJson(): string {
  return JSON.stringify({ state: snapshotSave(useProgress.getState()), version: 0 }, null, 2);
}

export function importSaveJson(raw: string): boolean {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return false;
  }
  const slice = unwrapSave(parsed);
  if (!looksLikeSave(slice)) return false;
  persistWrites = true;
  useProgress.setState({ ...migrate(slice), hydrated: true });
  return true;
}

export function hydrateProgress(): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      if (ok) persistWrites = true;
      try {
        useProgress.getState().setHydrated(true);
      } catch {
        /* ignore */
      }
      resolve();
    };
    try {
      const unsub = useProgress.persist.onFinishHydration(() => finish(true));
      void Promise.resolve(useProgress.persist.rehydrate()).then(
        () => {
          unsub();
          finish(true);
        },
        () => {
          unsub();
          finish(false);
        },
      );
    } catch {
      finish(false);
    }
  });
}

export function unitStars(unitId: string): number {
  const unit = unitById(unitId);
  if (!unit) return 0;
  const acts = useProgress.getState().activities;
  return unit.activities.reduce((n, a) => n + (acts[a.id]?.stars ?? 0), 0);
}

export function unitMaxStars(unitId: string): number {
  const unit = unitById(unitId);
  return unit ? unit.activities.length * 3 : 0;
}

export function sessionsForUnit(unitId: string): number {
  const sessions = useProgress.getState().sessions;
  return Object.values(sessions).filter((s) => s.unitId === unitId && s.completed).length;
}

export function unitExhausted(unitId: string): boolean {
  const span = UNIT_SPANS.find((s) => s.id === unitId) ?? GRADE4_SPANS.find((s) => s.id === unitId);
  if (!span) return false;
  const need = Math.max(6, Math.floor((span.end - span.start + 1) * 0.5));
  return sessionsForUnit(unitId) >= need;
}

export function allActivityCount(): number {
  return UNITS.reduce((n, u) => n + u.activities.length, 0);
}

export function learnerRoster(): { id: string; name: string }[] {
  const s = useProgress.getState();
  return Object.entries(s.learners).map(([id, k]) => ({
    id,
    name: k.name.trim() || (id === DEFAULT_ID ? "Kid 1" : "Kid"),
  }));
}
