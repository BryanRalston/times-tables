import { create } from "zustand";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";
import { todayIso } from "./calendar";
import { applyBuy, type BuyReason } from "./coins";
import {
  applyBuyCosmetic,
  parseCosmeticIds,
  parseEquippedCosmetic,
  type CosmeticBuyReason,
} from "./cosmetics";
import {
  applyPresentLand,
  applyUnlock,
  clampGiftRolls,
  healLivePresentPads,
  healOpenedPresents,
  healPresentGrantedIds,
  SEED_PRESENT_PADS,
  type LandedPresent,
} from "./presents";
import { parseHopperId } from "./squishees";
import { GRADE4_SPANS, UNIT_SPANS, UNITS, unitById, unitsFor } from "./curriculum";
import {
  RADIAL_PAD_COUNT,
  activePathStepsLeft,
  canStartDiceTurn,
  clampDieFace,
  clampPathStepsLeft,
  hopCreditsOf,
  migrateDiceTurnState,
  migratePathHopSpent,
  migratePathStepsLeft,
  type DieFace,
} from "./radial-web";
import { parseLocale } from "./i18n";
import {
  applyBests,
  bumpFact,
  emptyBests,
  emptyFacts,
  emptyRun,
  emptyToday,
  kindKey,
  parseBests,
  parseFacts,
  parseRun,
  parseToday,
  recordRun,
  recordToday,
  runAverageMs,
  shakyFromFacts,
} from "./practice";
import { schoolStreak } from "./streak";
import { parseTestMode } from "./test-mode";
import type { ActivitySave, DaySession, LearnerSlice, Locale, PathGrade, SaveState } from "./types";
import { parsePathGrade } from "./types";

const SAVE_VERSION = 16;
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

function clampPathHopperAt(n: unknown): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return 0;
  return Math.min(RADIAL_PAD_COUNT, Math.max(0, Math.round(n)));
}

function clampPathHopSpent(n: unknown): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
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
    facts: emptyFacts(),
    bests: emptyBests(),
    today: emptyToday(),
    runHonest: emptyRun(),
    pathHopperAt: 0,
    pathNowSeen: 0,
    pathHopSpent: 0,
    pathStepsLeft: 0,
    openedPresents: [],
    livePresentPads: [...SEED_PRESENT_PADS],
    presentGrantedIds: [],
    pathGiftRolls: 0,
    hopperId: "",
    cosmetics: [],
    equippedCosmetic: "",
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
    facts: parseFacts(s.facts),
    bests: parseBests(s.bests),
    today: parseToday(s.today),
    runHonest: parseRun(s.runHonest),
    pathHopperAt: clampPathHopperAt(s.pathHopperAt),
    pathNowSeen: clampPathHopperAt(s.pathNowSeen),
    pathHopSpent: clampPathHopSpent(s.pathHopSpent),
    pathStepsLeft: clampPathStepsLeft(s.pathStepsLeft),
    openedPresents: healOpenedPresents(s.squishees ?? [], s.openedPresents, 15),
    livePresentPads: healLivePresentPads({
      owned: s.squishees ?? [],
      rawLive: s.livePresentPads,
      rawOpened: s.openedPresents,
      saveVersion: 15,
      hopperAt: s.pathHopperAt,
    }),
    presentGrantedIds: healPresentGrantedIds(s.squishees ?? [], s.presentGrantedIds),
    pathGiftRolls: clampGiftRolls(s.pathGiftRolls),
    hopperId: parseHopperId(s.hopperId, s.squishees ?? []),
    cosmetics: parseCosmeticIds(s.cosmetics),
    equippedCosmetic: parseEquippedCosmetic(s.equippedCosmetic, parseCosmeticIds(s.cosmetics)),
  };
}

function mergeActivitySaves(
  a: Record<string, ActivitySave> = {},
  b: Record<string, ActivitySave> = {},
): Record<string, ActivitySave> {
  const out: Record<string, ActivitySave> = { ...a };
  for (const [id, y] of Object.entries(b)) {
    const x = out[id];
    if (!x) {
      out[id] = y;
      continue;
    }
    out[id] = {
      plays: Math.max(x.plays ?? 0, y.plays ?? 0),
      best: Math.max(x.best ?? 0, y.best ?? 0),
      last: y.last ?? x.last,
      stars: Math.max(x.stars ?? 0, y.stars ?? 0),
      misses: y.misses?.length ? y.misses : (x.misses ?? []),
    };
  }
  return out;
}

function mergeSessions(
  a: Record<string, DaySession> = {},
  b: Record<string, DaySession> = {},
): Record<string, DaySession> {
  const out: Record<string, DaySession> = { ...a };
  for (const [date, y] of Object.entries(b)) {
    const x = out[date];
    out[date] = x?.completed && !y.completed ? x : y;
  }
  return out;
}

function sliceOfWithHopHeal(s: LearnerSlice, saveVersion: number): LearnerSlice {
  const next = sliceOf(s);
  const pathHopSpent = migratePathHopSpent({
    activities: next.activities,
    sessions: next.sessions,
    pathHopSpent: s.pathHopSpent,
    pathHopperAt: next.pathHopperAt,
    saveVersion,
  });
  const pathStepsLeft = migratePathStepsLeft({
    pathStepsLeft: s.pathStepsLeft,
    saveVersion,
  });
  const turn = migrateDiceTurnState({
    activities: next.activities,
    pathHopSpent,
    pathStepsLeft,
    saveVersion,
  });
  return {
    ...next,
    pathHopSpent: turn.pathHopSpent,
    pathStepsLeft: turn.pathStepsLeft,
    openedPresents: healOpenedPresents(next.squishees, s.openedPresents, saveVersion),
    livePresentPads: healLivePresentPads({
      owned: next.squishees,
      rawLive: s.livePresentPads,
      rawOpened: s.openedPresents,
      saveVersion,
      hopperAt: next.pathHopperAt,
    }),
    presentGrantedIds: healPresentGrantedIds(next.squishees, s.presentGrantedIds),
    pathGiftRolls: clampGiftRolls(s.pathGiftRolls),
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
    soundOn: true,
    testMode: false,
    learners: { [DEFAULT_ID]: kid },
    ...kid,
  };
}

function migrate(raw: Partial<SaveState> | null | undefined): SaveState {
  const base = empty();
  if (!raw || typeof raw !== "object") return base;
  const learnerId = raw.learnerId || DEFAULT_ID;
  const saveVersion = typeof raw.version === "number" && Number.isFinite(raw.version) ? raw.version : 0;
  const fromFlat = sliceOfWithHopHeal(
    {
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
      facts: parseFacts(raw.facts),
      bests: parseBests(raw.bests),
      today: parseToday(raw.today),
      runHonest: parseRun(raw.runHonest),
      pathHopperAt: raw.pathHopperAt ?? 0,
      pathNowSeen: raw.pathNowSeen ?? 0,
      pathHopSpent: raw.pathHopSpent ?? 0,
      pathStepsLeft: raw.pathStepsLeft ?? 0,
      openedPresents: raw.openedPresents ?? [],
      livePresentPads: healLivePresentPads({
        owned: raw.squishees ?? [],
        rawLive: raw.livePresentPads,
        rawOpened: raw.openedPresents,
        saveVersion,
        hopperAt: raw.pathHopperAt,
      }),
      presentGrantedIds: raw.presentGrantedIds ?? [],
      pathGiftRolls: raw.pathGiftRolls ?? 0,
      hopperId: raw.hopperId ?? "",
      cosmetics: raw.cosmetics ?? [],
      equippedCosmetic: raw.equippedCosmetic ?? "",
    },
    saveVersion,
  );
  const learners = { ...(raw.learners ?? {}) };
  if (!learners[learnerId]) {
    learners[learnerId] = fromFlat;
  } else {
    const kid = learners[learnerId]!;
    learners[learnerId] = {
      ...kid,
      name: kid.name?.trim() ? kid.name : fromFlat.name,
      activities: mergeActivitySaves(fromFlat.activities, kid.activities),
      sessions: mergeSessions(fromFlat.sessions, kid.sessions),
      coins: Math.max(fromFlat.coins, typeof kid.coins === "number" ? kid.coins : 0),
      stars: Math.max(fromFlat.stars, typeof kid.stars === "number" ? kid.stars : 0),
      pathHopperAt: kid.pathHopperAt || fromFlat.pathHopperAt,
      pathHopSpent: kid.pathHopSpent ?? fromFlat.pathHopSpent,
      pathStepsLeft: kid.pathStepsLeft ?? fromFlat.pathStepsLeft,
    };
  }
  for (const id of Object.keys(learners)) learners[id] = sliceOfWithHopHeal(learners[id]!, saveVersion);
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
    soundOn: raw.soundOn !== false,
    testMode: parseTestMode(raw.testMode),
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
  setPathHopperAt: (n: number) => void;
  setPathNowSeen: (n: number) => void;
  startDiceTurn: (face: DieFace) => boolean;
  spendPathStep: () => void;
  setPathGrade: (grade: PathGrade) => void;
  setSkipWeekend: (v: boolean) => void;
  setLocale: (locale: Locale) => void;
  setTestMode: (on: boolean) => void;
  grantTestRoll: () => void;
  clearPathSteps: () => void;
  recordRound: (opts: {
    activityId: string;
    correct: number;
    total: number;
    earned: number;
    misses: string[];
  }) => void;
  recordSession: (session: DaySession) => void;
  noteFact: (key: string, ok: boolean) => void;
  noteAttempt: (opts: { key?: string; kind?: string; ok: boolean; ms?: number; date?: string }) => void;
  setSoundOn: (on: boolean) => void;
  beginPlay: (activityId: string) => number;
  awardCoins: (n: number) => void;
  buySquishee: (id: string) => { ok: boolean; reason: BuyReason };
  unlockSquishee: (id: string) => { ok: boolean; reason: "ok" | "missing" | "owned" };
  landPresentPad: (pad: number) => { ok: boolean; reward?: LandedPresent };
  setHopperId: (id: string) => void;
  buyCosmetic: (id: string) => { ok: boolean; reason: CosmeticBuyReason };
  equipCosmetic: (id: string) => boolean;
  unequipCosmetic: () => void;
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
    soundOn: s.soundOn,
    testMode: s.testMode,
    activities: s.activities,
    badges: s.badges,
    shaky: s.shaky,
    sessions: s.sessions,
    squishees: s.squishees,
    coins: s.coins,
    attempts: s.attempts,
    perfectWalks: s.perfectWalks,
    facts: s.facts,
    bests: s.bests,
    today: s.today,
    runHonest: s.runHonest,
    pathHopperAt: s.pathHopperAt,
    pathNowSeen: s.pathNowSeen,
    pathHopSpent: s.pathHopSpent,
    pathStepsLeft: s.pathStepsLeft,
    openedPresents: s.openedPresents,
    livePresentPads: s.livePresentPads,
    presentGrantedIds: s.presentGrantedIds,
    pathGiftRolls: s.pathGiftRolls,
    hopperId: s.hopperId,
    cosmetics: s.cosmetics,
    equippedCosmetic: s.equippedCosmetic,
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
      setPathHopperAt: (n) => commit(get, set, { pathHopperAt: clampPathHopperAt(n) }),
      setPathNowSeen: (n) =>
        commit(get, set, { pathNowSeen: Math.max(get().pathNowSeen, clampPathHopperAt(n)) }),
      startDiceTurn: (face) => {
        const s = get();
        const steps = clampDieFace(face);
        const rolls = hopCreditsOf(s.activities, s.pathHopSpent, s.sessions, s.pathGiftRolls);
        if (!canStartDiceTurn(rolls, activePathStepsLeft(s.pathHopSpent, s.pathStepsLeft))) return false;
        commit(get, set, { pathHopSpent: s.pathHopSpent + 1, pathStepsLeft: steps });
        return true;
      },
      spendPathStep: () => {
        const left = clampPathStepsLeft(get().pathStepsLeft);
        if (left <= 0) return;
        commit(get, set, { pathStepsLeft: left - 1 });
      },
      setPathGrade: (grade) => {
        const pathGrade = parsePathGrade(grade);
        const classUnitId = unitsFor(pathGrade).some((u) => u.id === get().classUnitId) ? get().classUnitId : "";
        set({ pathGrade, classUnitId });
      },
      setSkipWeekend: (v) => set({ skipWeekend: v }),
      setLocale: (locale) => set({ locale: parseLocale(locale) }),
      setTestMode: (on) => {
        const testMode = parseTestMode(on);
        if (testMode) {
          set({ testMode: true });
          return;
        }
        const classUnitId = unitsFor(3).some((u) => u.id === get().classUnitId) ? get().classUnitId : "";
        set({ testMode: false, pathGrade: 3, classUnitId });
      },
      grantTestRoll: () => {
        const spent = clampPathHopSpent(get().pathHopSpent);
        commit(get, set, { pathHopSpent: Math.max(0, spent - 1) });
      },
      clearPathSteps: () => commit(get, set, { pathStepsLeft: 0 }),
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
        const avg = runAverageMs(get().runHonest);
        const spent = clampPathHopSpent(get().pathHopSpent);
        commit(get, set, {
          stars: get().stars + earned,
          perfectWalks: get().perfectWalks + (total > 0 && correct === total ? 1 : 0),
          bests: applyBests(get().bests, {
            accuracy: total >= 5 ? pct : undefined,
            avgMs: avg ?? undefined,
          }),
          runHonest: emptyRun(),
          // Fresh earn with no started turn must not keep stale mid-turn steps.
          pathStepsLeft: spent <= 0 ? 0 : get().pathStepsLeft,
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
        const sessions = {
          ...get().sessions,
          [session.date]: session,
        };
        const streak = schoolStreak(sessions, session.date);
        commit(get, set, {
          sessions,
          bests: applyBests(get().bests, {
            streak,
            accuracy: session.total >= 5 ? session.correct / session.total : undefined,
          }),
        });
      },
      noteFact: (key, ok) => {
        get().noteAttempt({ key, ok });
      },
      noteAttempt: ({ key, kind, ok, ms, date }) => {
        let facts = get().facts ?? emptyFacts();
        if (key) facts = bumpFact(facts, key, ok, ms);
        if (kind) facts = bumpFact(facts, kindKey(kind), ok, ms);
        const today = recordToday(get().today, date || todayIso(), ok, ms);
        commit(get, set, {
          facts,
          shaky: shakyFromFacts(facts, get().shaky),
          today,
          runHonest: recordRun(get().runHonest, ok, ms),
        });
      },
      setSoundOn: (on) => set({ soundOn: Boolean(on) }),
      beginPlay: (activityId) => {
        const attempts = { ...get().attempts };
        const n = (attempts[activityId] ?? 0) + 1;
        attempts[activityId] = n;
        commit(get, set, { attempts, runHonest: emptyRun() });
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
      unlockSquishee: (id) => {
        const r = applyUnlock(get().squishees, id);
        if (r.ok) commit(get, set, { squishees: r.squishees });
        return { ok: r.ok, reason: r.reason };
      },
      landPresentPad: (pad) => {
        const s = get();
        const r = applyPresentLand(s.squishees, s.coins, s.openedPresents, pad, {
          live: s.livePresentPads,
          granted: s.presentGrantedIds,
          giftRolls: s.pathGiftRolls,
          hopperAt: s.pathHopperAt || pad,
        });
        if (r.ok) {
          commit(get, set, {
            squishees: r.squishees,
            coins: r.coins,
            openedPresents: r.opened,
            livePresentPads: r.livePads,
            presentGrantedIds: r.granted,
            pathGiftRolls: r.giftRolls,
          });
        }
        return { ok: r.ok, reward: r.reward };
      },
      setHopperId: (id) => {
        const hopperId = parseHopperId(id, get().squishees);
        commit(get, set, { hopperId });
      },
      buyCosmetic: (id) => {
        const r = applyBuyCosmetic(get().coins, get().cosmetics, id);
        if (r.ok) commit(get, set, { coins: r.coins, cosmetics: r.cosmetics });
        return { ok: r.ok, reason: r.reason };
      },
      equipCosmetic: (id) => {
        const owned = parseCosmeticIds(get().cosmetics);
        const equippedCosmetic = parseEquippedCosmetic(id, owned);
        if (!equippedCosmetic) return false;
        commit(get, set, { equippedCosmetic });
        return true;
      },
      unequipCosmetic: () => {
        commit(get, set, { equippedCosmetic: "" });
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
          soundOn: get().soundOn !== false,
          testMode: parseTestMode(get().testMode),
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
