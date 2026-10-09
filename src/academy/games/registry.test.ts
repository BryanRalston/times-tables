import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { GAMES, defaultLevels } from "./registry";

describe("academy game registry", () => {
  it("gives every game a level, a question, and a worksheet row", () => {
    const ids = new Set<string>();
    const slugs = new Set<string>();
    const screens = new Set<string>();
    for (const game of GAMES) {
      expect(ids.has(game.id)).toBe(false);
      expect(slugs.has(game.sheetSlug)).toBe(false);
      expect(screens.has(game.sheetScreen)).toBe(false);
      ids.add(game.id);
      slugs.add(game.sheetSlug);
      screens.add(game.sheetScreen);
      expect(game.levels.length).toBeGreaterThan(0);
      for (const grade of ["K", "1", "2", "3"] as const) {
        expect(game.isLevel(game.defaultLevel(grade))).toBe(true);
        expect(defaultLevels(grade)[game.id]).toBe(game.defaultLevel(grade));
      }
      for (const level of game.levels) {
        const q = game.makeQuestion(rngFromSeed(`${game.id}-${level.id}`), level.id);
        expect(q.game).toBe(game.id);
        expect(q.choices).toHaveLength(4);
        expect(new Set(q.choices).size).toBe(4);
        expect(q.choices).toContain(q.answer);
        const row = game.makeSheetItem(rngFromSeed(`${game.id}-sheet-${level.id}`), level.id);
        expect(row.prompt.length).toBeGreaterThan(0);
        expect(row.answer.length).toBeGreaterThan(0);
      }
    }
  });
});
