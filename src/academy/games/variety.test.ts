import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { GAMES } from "./registry";

describe("question variety", () => {
  it("gives every level more than one spoken prompt", () => {
    for (const game of GAMES) {
      for (const level of game.levels) {
        const titles = new Set<string>();
        for (let i = 0; i < 24; i += 1) {
          titles.add(game.makeQuestion(rngFromSeed(`variety-${game.id}-${level.id}-${i}`), level.id).title);
        }
        expect(titles.size, `${game.id}:${level.id}`).toBeGreaterThan(1);
      }
    }
  });
});
