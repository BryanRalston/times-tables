import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { UI } from "./i18n";
import {
  STORAGE_KEY,
  exportSaveJson,
  hydrateProgress,
  importSaveJson,
  persistWritesEnabled,
  resetProgressMemory,
  unwrapSave,
  useProgress,
} from "./progress";
import { dailyWalkActivityId, hopCreditsOf } from "./radial-web";

const HERE = dirname(fileURLToPath(import.meta.url));

class MemoryStorage implements Storage {
  private m = new Map<string, string>();
  get length() {
    return this.m.size;
  }
  clear() {
    this.m.clear();
  }
  getItem(key: string) {
    return this.m.has(key) ? this.m.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.m.set(key, String(value));
  }
  removeItem(key: string) {
    this.m.delete(key);
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
}

function installStorage() {
  const mem = new MemoryStorage();
  Object.defineProperty(globalThis, "localStorage", {
    value: mem,
    configurable: true,
    writable: true,
  });
  return mem;
}

function storedCoins(key = STORAGE_KEY): number | undefined {
  const slice = unwrapSave(JSON.parse(localStorage.getItem(key) || "null"));
  return slice?.coins;
}

function seedKid(extra: Record<string, unknown> = {}) {
  const kid = {
    name: "Maya",
    stars: 3,
    seenWelcome: true,
    activities: {
      "u1-leftover": { plays: 1, best: 4, last: 4, stars: 3, misses: [] },
    },
    badges: [],
    shaky: {},
    sessions: {},
    squishees: [],
    coins: 12,
    attempts: {},
    perfectWalks: 0,
    ...extra,
  };
  return {
    version: 7,
    learnerId: "kid-1",
    classUnitId: "",
    pathGrade: 3,
    skipWeekend: true,
    locale: "en",
    learners: { "kid-1": kid },
    ...kid,
  };
}

describe("progress persist", () => {
  beforeEach(() => {
    installStorage();
    resetProgressMemory();
  });

  afterEach(() => {
    resetProgressMemory();
  });

  it("hydrates coins, stars, name, and activity stars without wiping storage", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: seedKid(), version: 0 }));
    await hydrateProgress();
    const s = useProgress.getState();
    expect(s.hydrated).toBe(true);
    expect(s.coins).toBe(12);
    expect(s.stars).toBe(3);
    expect(s.seenWelcome).toBe(true);
    expect(s.name).toBe("Maya");
    expect(s.activities["u1-leftover"]?.stars).toBe(3);
    expect(storedCoins()).toBe(12);
    expect(persistWritesEnabled()).toBe(true);
  });

  it("setHydrated before rehydrate does not write empty coins over a stored 12", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: seedKid(), version: 0 }));
    expect(storedCoins()).toBe(12);
    expect(persistWritesEnabled()).toBe(false);
    useProgress.getState().setHydrated(true);
    expect(useProgress.getState().coins).toBe(0);
    expect(storedCoins()).toBe(12);
  });

  it("migrates times-tables-progress raw JSON into g3-path-v2 and keeps the old key", async () => {
    localStorage.setItem(
      "times-tables-progress",
      JSON.stringify({
        name: "Maya",
        coins: 12,
        stars: 3,
        seenWelcome: true,
        activities: {
          "u1-leftover": { plays: 1, best: 4, last: 4, stars: 3, misses: [] },
        },
      }),
    );
    await hydrateProgress();
    expect(useProgress.getState().coins).toBe(12);
    expect(useProgress.getState().name).toBe("Maya");
    expect(storedCoins()).toBe(12);
    expect(localStorage.getItem("times-tables-progress")).toContain("Maya");
  });

  it("exports and imports a JSON save", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: seedKid(), version: 0 }));
    await hydrateProgress();
    const json = exportSaveJson();
    expect(json).toContain("Maya");
    useProgress.getState().awardCoins(5);
    expect(useProgress.getState().coins).toBe(17);
    expect(importSaveJson(json)).toBe(true);
    expect(useProgress.getState().coins).toBe(12);
    expect(storedCoins()).toBe(12);
    expect(importSaveJson("nope")).toBe(false);
  });

  it("shows Saved in the header after hydrate", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: seedKid(), version: 0 }));
    await hydrateProgress();
    expect(useProgress.getState().hydrated).toBe(true);
    expect(useProgress.getState().name).toBe("Maya");
    expect(UI.en.saved).toBe("Saved");
    expect(UI.es.saved).toBe("Guardado");
    expect(UI["pt-BR"].saved).toBe("Salvo");
    const chrome = readFileSync(join(HERE, "../components/chrome.tsx"), "utf8");
    expect(chrome).toContain("data-saved");
    expect(chrome).toContain("ui.saved");
    expect(chrome).toContain("s.hydrated");
  });

  it("migrates a g3-path-v1 wrapper without deleting it", async () => {
    localStorage.setItem("g3-path-v1", JSON.stringify({ state: seedKid({ coins: 9, name: "Leo" }), version: 0 }));
    await hydrateProgress();
    expect(useProgress.getState().coins).toBe(9);
    expect(useProgress.getState().name).toBe("Leo");
    expect(storedCoins()).toBe(9);
    expect(localStorage.getItem("g3-path-v1")).toContain("Leo");
  });

  it("records fact accuracy, today, and personal bests without wiping coins", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: seedKid(), version: 0 }));
    await hydrateProgress();
    useProgress.getState().noteAttempt({ key: "7×8", kind: "fluency", ok: false, ms: 1800, date: "2026-09-15" });
    useProgress.getState().noteAttempt({ key: "7×8", kind: "fluency", ok: false, ms: 1600, date: "2026-09-15" });
    useProgress.getState().noteAttempt({ key: "7×8", kind: "fluency", ok: true, ms: 1400, date: "2026-09-15" });
    const s = useProgress.getState();
    expect(s.coins).toBe(12);
    expect(s.facts["7×8"]?.miss).toBe(2);
    expect(s.facts["7×8"]?.ok).toBe(1);
    expect(s.facts["kind:fluency"]?.ok).toBe(1);
    expect(s.today.questions).toBe(3);
    expect(s.today.correct).toBe(1);
    expect(s.shaky["7×8"]).toBeGreaterThan(0);
    expect(s.soundOn).toBe(true);
    s.setSoundOn(false);
    expect(useProgress.getState().soundOn).toBe(false);
  });

  it("restores hop credits when a v10 Guest ledger burned unused hops", async () => {
    const leftover = { plays: 1, best: 4, last: 4, stars: 3, misses: [] };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: seedKid({
          activities: { "u1-leftover": leftover, "u3-share": leftover },
          pathHopperAt: 0,
          pathHopSpent: 2,
        }),
        version: 0,
      }),
    );
    await hydrateProgress();
    const s = useProgress.getState();
    expect(s.pathHopSpent).toBe(0);
    expect(hopCreditsOf(s.activities, s.pathHopSpent, s.sessions)).toBe(2);
  });

  it("restores hop credits when a v11 Guest ledger is still burned", async () => {
    const leftover = { plays: 1, best: 4, last: 4, stars: 3, misses: [] };
    const prior = seedKid({
      activities: { "u1-leftover": leftover, "u3-share": leftover },
      pathHopperAt: 0,
      pathHopSpent: 2,
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { ...prior, version: 11 }, version: 0 }));
    await hydrateProgress();
    const s = useProgress.getState();
    expect(s.pathHopSpent).toBe(0);
    expect(hopCreditsOf(s.activities, s.pathHopSpent, s.sessions)).toBe(2);
  });

  it("keeps hops already taken on a current save", async () => {
    const leftover = { plays: 1, best: 4, last: 4, stars: 3, misses: [] };
    const prior = seedKid({
      activities: { "u1-leftover": leftover, "u3-share": leftover },
      pathHopperAt: 4,
      pathHopSpent: 1,
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { ...prior, version: 12 }, version: 0 }));
    await hydrateProgress();
    const s = useProgress.getState();
    expect(s.pathHopSpent).toBe(1);
    expect(s.pathStepsLeft).toBe(0);
    expect(hopCreditsOf(s.activities, s.pathHopSpent, s.sessions)).toBe(1);
  });

  it("keeps a mid-turn dice step count on a v13 save", async () => {
    const leftover = { plays: 1, best: 4, last: 4, stars: 3, misses: [] };
    const prior = seedKid({
      activities: { "u1-leftover": leftover, "u3-share": leftover },
      pathHopperAt: 4,
      pathHopSpent: 1,
      pathStepsLeft: 2,
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { ...prior, version: 13 }, version: 0 }));
    await hydrateProgress();
    const s = useProgress.getState();
    expect(s.pathHopSpent).toBe(1);
    expect(s.pathStepsLeft).toBe(2);
    expect(hopCreditsOf(s.activities, s.pathHopSpent, s.sessions)).toBe(1);
  });

  it("starts a dice turn from one banked roll and spends steps one pad at a time", () => {
    const leftover = { plays: 1, best: 4, last: 4, stars: 3, misses: [] };
    const activities = { "u1-leftover": leftover, "u1-friends": leftover };
    useProgress.setState((s) => {
      const id = s.learnerId;
      const kid = { ...(s.learners[id] ?? s), activities, pathHopSpent: 0, pathStepsLeft: 0 };
      return {
        activities,
        pathHopSpent: 0,
        pathStepsLeft: 0,
        learners: { ...s.learners, [id]: kid },
      };
    });
    expect(hopCreditsOf(useProgress.getState().activities, 0)).toBe(2);
    expect(useProgress.getState().startDiceTurn(3)).toBe(true);
    expect(useProgress.getState().pathHopSpent).toBe(1);
    expect(useProgress.getState().pathStepsLeft).toBe(3);
    expect(hopCreditsOf(useProgress.getState().activities, useProgress.getState().pathHopSpent)).toBe(1);
    expect(useProgress.getState().startDiceTurn(1)).toBe(false);
    expect(useProgress.getState().pathHopSpent).toBe(1);
    useProgress.getState().spendPathStep();
    expect(useProgress.getState().pathStepsLeft).toBe(2);
    useProgress.getState().spendPathStep();
    useProgress.getState().spendPathStep();
    expect(useProgress.getState().pathStepsLeft).toBe(0);
    expect(useProgress.getState().startDiceTurn(2)).toBe(true);
    expect(useProgress.getState().pathHopSpent).toBe(2);
    expect(useProgress.getState().pathStepsLeft).toBe(2);
    expect(hopCreditsOf(useProgress.getState().activities, useProgress.getState().pathHopSpent)).toBe(0);
    expect(useProgress.getState().startDiceTurn(1)).toBe(false);
  });

  it("starts a roll when leftover steps were stored without a spent turn", () => {
    const leftover = { plays: 1, best: 4, last: 4, stars: 3, misses: [] };
    const activities = { "u1-leftover": leftover };
    useProgress.setState((s) => {
      const id = s.learnerId;
      const kid = { ...(s.learners[id] ?? s), activities, pathHopSpent: 0, pathStepsLeft: 2 };
      return {
        activities,
        pathHopSpent: 0,
        pathStepsLeft: 2,
        learners: { ...s.learners, [id]: kid },
      };
    });
    expect(useProgress.getState().startDiceTurn(1)).toBe(true);
    expect(useProgress.getState().pathHopSpent).toBe(1);
    expect(useProgress.getState().pathStepsLeft).toBe(1);
  });

  it("counts a Guest daily walk as a hop-earning lesson", async () => {
    const leftover = { plays: 1, best: 4, last: 4, stars: 3, misses: [] };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: seedKid({
          activities: { "daily:u1": leftover },
          sessions: {
            "2026-09-10": {
              date: "2026-09-10",
              unitId: "u1",
              schoolDay: 1,
              correct: 8,
              total: 8,
              fresh: 8,
              review: 0,
              completed: true,
            },
          },
          coins: 39,
          pathHopperAt: 0,
          pathHopSpent: 0,
        }),
        version: 0,
      }),
    );
    await hydrateProgress();
    const s = useProgress.getState();
    expect(hopCreditsOf(s.activities, s.pathHopSpent, s.sessions)).toBe(1);
  });

  it("does not bank a second roll on same-day daily walk replay after the unit advances", () => {
    const date = "2026-09-10";
    const key = dailyWalkActivityId(date);
    const finish = (activityId: string, unitId: string) => {
      useProgress.getState().recordRound({
        activityId,
        correct: 14,
        total: 15,
        earned: 14,
        misses: ["7×8"],
      });
      useProgress.getState().recordSession({
        date,
        unitId,
        schoolDay: 1,
        correct: 14,
        total: 15,
        fresh: 8,
        review: 4,
        completed: true,
      });
    };
    finish(key, "u12");
    expect(hopCreditsOf(useProgress.getState().activities, 0, useProgress.getState().sessions)).toBe(1);
    finish(key, "u12");
    expect(useProgress.getState().activities[key]?.plays).toBe(2);
    expect(hopCreditsOf(useProgress.getState().activities, 0, useProgress.getState().sessions)).toBe(1);
    finish("daily:u13", "u13");
    expect(hopCreditsOf(useProgress.getState().activities, 0, useProgress.getState().sessions)).toBe(1);
    useProgress.getState().recordRound({
      activityId: "u1-leftover",
      correct: 4,
      total: 4,
      earned: 6,
      misses: [],
    });
    expect(hopCreditsOf(useProgress.getState().activities, 0, useProgress.getState().sessions)).toBe(2);
  });

  it("clears stale steps on a fresh daily earn so Lessons can invite a roll", () => {
    useProgress.setState((s) => {
      const id = s.learnerId;
      const kid = { ...(s.learners[id] ?? s), pathHopSpent: 0, pathStepsLeft: 2 };
      return { pathHopSpent: 0, pathStepsLeft: 2, learners: { ...s.learners, [id]: kid } };
    });
    const date = "2026-09-11";
    useProgress.getState().recordRound({
      activityId: dailyWalkActivityId(date),
      correct: 12,
      total: 14,
      earned: 12,
      misses: [],
    });
    useProgress.getState().recordSession({
      date,
      unitId: "u13",
      schoolDay: 170,
      correct: 12,
      total: 14,
      fresh: 8,
      review: 4,
      completed: true,
    });
    const s = useProgress.getState();
    expect(s.pathHopSpent).toBe(0);
    expect(s.pathStepsLeft).toBe(0);
    expect(hopCreditsOf(s.activities, s.pathHopSpent, s.sessions)).toBe(1);
    useProgress.getState().recordRound({
      activityId: dailyWalkActivityId(date),
      correct: 10,
      total: 14,
      earned: 10,
      misses: [],
    });
    expect(hopCreditsOf(useProgress.getState().activities, useProgress.getState().pathHopSpent, useProgress.getState().sessions)).toBe(
      1,
    );
    expect(useProgress.getState().pathStepsLeft).toBe(0);
  });

  it("keeps a real mid-turn when a later lesson is recorded", () => {
    const leftover = { plays: 1, best: 4, last: 4, stars: 3, misses: [] };
    useProgress.setState((s) => {
      const id = s.learnerId;
      const kid = { ...(s.learners[id] ?? s), activities: { "u1-leftover": leftover }, pathHopSpent: 1, pathStepsLeft: 2 };
      return {
        activities: { "u1-leftover": leftover },
        pathHopSpent: 1,
        pathStepsLeft: 2,
        learners: { ...s.learners, [id]: kid },
      };
    });
    useProgress.getState().recordRound({
      activityId: "u3-share",
      correct: 4,
      total: 4,
      earned: 6,
      misses: [],
    });
    expect(useProgress.getState().pathHopSpent).toBe(1);
    expect(useProgress.getState().pathStepsLeft).toBe(2);
  });

  it("heals a v13 Guest who rolled a farmed extra daily turn", async () => {
    const leftover = { plays: 1, best: 8, last: 8, stars: 3, misses: [] };
    const prior = seedKid({
      activities: { "daily:u12": leftover, "daily:u13": leftover },
      pathHopperAt: 1,
      pathHopSpent: 1,
      pathStepsLeft: 2,
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { ...prior, version: 13 }, version: 0 }));
    await hydrateProgress();
    const s = useProgress.getState();
    expect(s.pathHopSpent).toBe(0);
    expect(s.pathStepsLeft).toBe(0);
    expect(hopCreditsOf(s.activities, s.pathHopSpent, s.sessions)).toBe(1);
  });

  it("merges flat Guest lesson progress onto an empty learner slice", async () => {
    const leftover = { plays: 1, best: 4, last: 4, stars: 3, misses: [] };
    const kid = {
      name: "",
      stars: 0,
      seenWelcome: true,
      activities: {},
      badges: [],
      shaky: {},
      sessions: {},
      squishees: [],
      coins: 39,
      attempts: {},
      perfectWalks: 0,
      pathHopperAt: 0,
      pathHopSpent: 0,
    };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: {
          version: 11,
          learnerId: "kid-1",
          classUnitId: "",
          pathGrade: 3,
          skipWeekend: true,
          locale: "en",
          ...kid,
          coins: 39,
          activities: { "u1-leftover": leftover, "u3-share": leftover },
          pathHopperAt: 0,
          pathHopSpent: 2,
          learners: { "kid-1": kid },
        },
        version: 0,
      }),
    );
    await hydrateProgress();
    const s = useProgress.getState();
    expect(s.activities["u1-leftover"]?.plays).toBe(1);
    expect(s.activities["u3-share"]?.plays).toBe(1);
    expect(s.coins).toBe(39);
    expect(s.pathHopSpent).toBe(0);
    expect(hopCreditsOf(s.activities, s.pathHopSpent, s.sessions)).toBe(2);
  });

  it("persists Test mode on the device save and holds Grade 4 when it turns off", () => {
    expect(useProgress.getState().testMode).toBe(false);
    useProgress.getState().setTestMode(true);
    useProgress.getState().setPathGrade(4);
    expect(useProgress.getState().testMode).toBe(true);
    expect(useProgress.getState().pathGrade).toBe(4);
    useProgress.getState().setTestMode(false);
    expect(useProgress.getState().testMode).toBe(false);
    expect(useProgress.getState().pathGrade).toBe(3);
  });

  it("refunds a spent roll and clears leftover steps from Test mode cheats", () => {
    useProgress.setState((s) => {
      const id = s.learnerId;
      const kid = { ...(s.learners[id] ?? s), pathHopSpent: 2, pathStepsLeft: 3 };
      return { pathHopSpent: 2, pathStepsLeft: 3, learners: { ...s.learners, [id]: kid } };
    });
    useProgress.getState().grantTestRoll();
    expect(useProgress.getState().pathHopSpent).toBe(1);
    useProgress.getState().clearPathSteps();
    expect(useProgress.getState().pathStepsLeft).toBe(0);
    useProgress.getState().awardCoins(10);
    expect(useProgress.getState().coins).toBe(10);
  });

  it("keeps a Guest rare after map unlock and reload", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: seedKid(), version: 0 }));
    await hydrateProgress();
    expect(useProgress.getState().buySquishee("aurora-jelly")).toEqual({ ok: false, reason: "find" });
    expect(useProgress.getState().squishees).toEqual([]);
    expect(useProgress.getState().unlockSquishee("galaxy-narwhal")).toEqual({ ok: true, reason: "ok" });
    expect(useProgress.getState().squishees).toEqual(["galaxy-narwhal"]);
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toContain("galaxy-narwhal");
    resetProgressMemory();
    await hydrateProgress();
    expect(useProgress.getState().squishees).toEqual(["galaxy-narwhal"]);
    expect(useProgress.getState().unlockSquishee("galaxy-narwhal").ok).toBe(false);
  });

  it("does not call resetAll from main boot", () => {
    const main = readFileSync(join(HERE, "../main.tsx"), "utf8");
    expect(main).toContain("hydrateProgress");
    expect(main).not.toContain("resetAll");
    expect(main).not.toMatch(/localStorage\.clear/);
    const src = readFileSync(join(HERE, "progress.ts"), "utf8");
    expect(src).toContain("skipHydration: true");
    expect(src).toContain("persistWrites");
    expect(src).not.toContain("setTimeout");
  });
});
