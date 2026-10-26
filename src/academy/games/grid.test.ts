import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { gridAnswer, gridMatches, gridPerimeter, makeGridQuestion, makeGridTask, sharedSides } from "./grid-data";
import { setLocale } from "../i18n";

describe("grid garden", () => {
  it("counts irregular squares, exposed edges, and a missing side", () => {
    setLocale("en");
    for (let i = 0; i < 24; i += 1) {
      const tiles = makeGridTask("tiles", rngFromSeed(`grid-tiles-${i}`));
      expect(tiles.cells.length).toBeGreaterThanOrEqual(3);
      expect(tiles.cells.length).toBeLessThanOrEqual(6);
      expect(tiles.cells.length).not.toBe(tiles.rows * tiles.cols);
      expect(gridAnswer(tiles)).toBe(tiles.cells.length);
      expect(tiles.speech).toBe("Count the squares.");
      expect(tiles.speech.toLowerCase()).not.toMatch(/tall|wide/);

      const fence = makeGridTask("fence", rngFromSeed(`grid-fence-${i}`));
      expect(fence.speech).toBe("How many units around?");
      expect(fence.edges).toBe(gridPerimeter(fence.cells));
      expect(fence.edges).toBe(fence.cells.length * 4 - sharedSides(fence.cells) * 2);
      expect(gridMatches(fence, [])).toBe(false);

      const side = makeGridTask("side", rngFromSeed(`grid-side-${i}`));
      expect(gridAnswer(side)).toBe(side.missing);
      expect(side.known).not.toBe(side.missing);
      const question = makeGridQuestion(rngFromSeed(`grid-q-${i}`), "side");
      expect(question.choices).toContain(question.answer);
      expect(question.choices.every((choice) => !choice.startsWith("no "))).toBe(true);
    }
  });
});
