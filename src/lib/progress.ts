import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UNIT_SPANS, UNITS, unitById } from "./curriculum";
import type { DaySession, SaveState } from "./types";

const SAVE_VERSION = 2;
const STORAGE_KEY = "g3-path-v2";

function empty(): SaveState {
  return {
    version: SAVE_VERSION,
    name: "",
    stars: 0,
    seenWelcome: false,
    classUnitId: "",
    skipWeekend: true,
    activities: {},
    badges: [],
    shaky: {},
    sessions: {},
  };
}

function migrate(raw: Partial<SaveState> | null | undefined): SaveState {
  const base = empty();
  if (!raw || typeof raw !== "object") return base;
  return {
    ...base,
    ...raw,
    version: SAVE_VERSION,
    activities: raw.activities ?? {},
    badges: raw.badges ?? [],
    shaky: raw.shaky ?? {},
    sessions: raw.sessions ?? {},
    stars: typeof raw.stars === "number" ? raw.stars : 0,
    skipWeekend: raw.skipWeekend !== false,
    classUnitId: raw.classUnitId ?? "",
  };
}

interface ProgressApi extends SaveState {
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  setName: (name: string) => void;
  markWelcome: () => void;
  setClassUnit: (id: string) => void;
  setSkipWeekend: (v: boolean) => void;
  recordRound: (opts: {
    activityId: string;
    correct: number;
    total: number;
    earned: number;
    misses: string[];
  }) => void;
  recordSession: (session: DaySession) => void;
  noteFact: (key: string, ok: boolean) => void;
  resetAll: () => void;
}

export const useProgress = create<ProgressApi>()(
  persist(
    (set, get) => ({
      ...empty(),
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),
      setName: (name) => set({ name: name.trim().slice(0, 24) }),
      markWelcome: () => set({ seenWelcome: true }),
      setClassUnit: (id) => set({ classUnitId: id }),
      setSkipWeekend: (v) => set({ skipWeekend: v }),
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
        set({
          stars: get().stars + earned,
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
        set({
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
        set({ shaky });
      },
      resetAll: () => set({ ...empty(), hydrated: true }),
    }),
    {
      name: STORAGE_KEY,
      skipHydration: true,
      partialize: (s) => ({
        version: s.version,
        name: s.name,
        stars: s.stars,
        seenWelcome: s.seenWelcome,
        classUnitId: s.classUnitId,
        skipWeekend: s.skipWeekend,
        activities: s.activities,
        badges: s.badges,
        shaky: s.shaky,
        sessions: s.sessions,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SaveState>;
        return { ...current, ...migrate(p) };
      },
    },
  ),
);

export function hydrateProgress() {
  void Promise.resolve(useProgress.persist.rehydrate()).finally(() => {
    useProgress.getState().setHydrated(true);
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
  const span = UNIT_SPANS.find((s) => s.id === unitId);
  if (!span) return false;
  const need = Math.max(6, Math.floor((span.end - span.start + 1) * 0.5));
  return sessionsForUnit(unitId) >= need;
}

export function allActivityCount(): number {
  return UNITS.reduce((n, u) => n + u.activities.length, 0);
}
