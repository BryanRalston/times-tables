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
