import { describe, expect, it } from "vitest";
import { openingForRound, openingIndex, pickServeIndex } from "./adapt";
import { GAME_CARDS as GAMES, gameCard } from "./games/catalog";
import { nextTimesFact } from "./games/times";
import { tierWindow, type Tier } from "./grade-map";
import type { Grade } from "./model";
import { rngFromSeed } from "@/lib/rng";

const GRADES: Grade[] = ["PK", "K", "1", "2", "3", "4", "5"];
const TIERS: Tier[] = ["easy", "medium", "hard"];

function openFor(gameId: string, grade: Grade, tier: Tier, saved: string) {
  const game = gameCard(gameId)!;
  const ids = game.levels.map((row) => row.id);
  const w = tierWindow(ids, gameId, grade, false, tier);
  const level = w.ids.includes(saved) ? saved : w.start;
  const at = openingForRound({
    savedIndex: ids.indexOf(level),
    startIndex: ids.indexOf(w.start),
    roundsPlayed: 0,
    boss: false,
    bounds: { min: w.min, max: w.max },
  });
  return { id: ids[at], w, ids };
}

describe("round opens at the current level", () => {
  it("grade 5 Fractions saved at level 9 opens Level 9 on every tier that offers it", () => {
    for (const tier of ["medium", "hard"] as Tier[]) {
      expect(openFor("fractions", "5", tier, "addUnlike").id).toBe("addUnlike");
    }
  });

  it("a tapped stone (saved by onLevel) starts that exact level", () => {
    for (const game of GAMES) {
      for (const grade of GRADES) {
        for (const tier of TIERS) {
          const w = tierWindow(game.levels.map((row) => row.id), game.id, grade, false, tier);
          if (w.offer === "later") continue;
          for (const stone of w.ids) expect(openFor(game.id, grade, tier, stone).id).toBe(stone);
        }
      }
    }
  });

  it("a fresh kid opens at the grade start, not one under", () => {
    for (const game of GAMES) {
      for (const grade of GRADES) {
        const { id, w } = openFor(game.id, grade, "medium", "");
        if (w.offer === "later" || w.ids.length === 0) continue;
        expect(id).toBe(w.start);
      }
    }
  });

  it("first question of a round never dips to a review level", () => {
    const heats = ["learning", "learning", "new", "new"] as const;
    for (const roll of [0, 0.05, 0.1, 0.19]) {
      expect(pickServeIndex({ ladderIndex: 2, levelCount: 4, heats, roll, first: true }).index).toBe(2);
    }
    expect(pickServeIndex({ ladderIndex: 2, levelCount: 4, heats, roll: 0 }).reason).toBe("review");
  });
});

describe("grade guard: opening never leaves the tier window", () => {
  it("clamps any saved level into the window for every game, grade and tier", () => {
    for (const game of GAMES) {
      const ids = game.levels.map((row) => row.id);
      for (const grade of GRADES) {
        for (const tier of TIERS) {
          const w = tierWindow(ids, game.id, grade, false, tier);
          if (w.offer === "later" || w.ids.length === 0) continue;
          for (let saved = 0; saved < ids.length; saved++) {
            const at = openingIndex(saved, 0, false, { min: w.min, max: w.max });
            expect(at).toBeGreaterThanOrEqual(w.min);
            expect(at).toBeLessThanOrEqual(w.max);
          }
        }
      }
    }
  });

  it("Hard reaches at most one level past the Medium window", () => {
    for (const game of GAMES) {
      const ids = game.levels.map((row) => row.id);
      for (const grade of GRADES) {
        const med = tierWindow(ids, game.id, grade, false, "medium");
        const hard = tierWindow(ids, game.id, grade, false, "hard");
        if (med.ids.length === 0) continue;
        expect(hard.max).toBeLessThanOrEqual(med.max + 1);
      }
    }
  });
});

describe("Hard starts harder", () => {
  it("grade 3 times on Hard never serves ×1 or ×2 facts at Multiply to 10", () => {
    for (let i = 0; i < 400; i++) {
      const f = nextTimesFact(rngFromSeed(`firm-${i}`), "toTen", ["ease:firm"]);
      expect(Math.min(f.a, f.b)).toBeGreaterThanOrEqual(3);
    }
  });

  it("Hard never serves ×1 on any times level; Easy may", () => {
    for (const level of ["count", "twos", "mix", "toTen"] as const) {
      for (let i = 0; i < 200; i++) {
        const f = nextTimesFact(rngFromSeed(`firm-${level}-${i}`), level, ["ease:firm"]);
        expect(Math.min(f.a, f.b)).toBeGreaterThanOrEqual(2);
      }
    }
    let sawOne = false;
    for (let i = 0; i < 400 && !sawOne; i++) {
      const f = nextTimesFact(rngFromSeed(`gentle-${i}`), "toTen", ["ease:gentle"]);
      if (Math.min(f.a, f.b) === 1) sawOne = true;
    }
    expect(sawOne).toBe(true);
  });

  it("grade 3 times Hard opens at Multiply to 10, not a lower level", () => {
    expect(openFor("times", "3", "hard", "").id).toBe("toTen");
  });
});
