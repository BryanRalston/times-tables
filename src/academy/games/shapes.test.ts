import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { SHAPE_LEVELS, makeShapeQuestion, shapesGame } from "./shapes";
import type { ChoiceQ } from "./types";

function expectChoices(q: ChoiceQ) {
  expect(q.choices).toHaveLength(4);
  expect(new Set(q.choices).size).toBe(4);
  expect(q.choices).toContain(q.answer);
  for (const choice of q.choices) expect(choice.startsWith("no ")).toBe(false);
}

const SIDES: Record<string, number> = { triangle: 3, square: 4, rectangle: 4, pentagon: 5, hexagon: 6 };
const LINES: Record<string, string> = { square: "4", rectangle: "2", triangle: "3", circle: "more than 4" };

describe("shape questions", () => {
  it("names shapes and counts sides without a leaked worksheet answer", () => {
    for (let seed = 0; seed < 20; seed += 1) {
      for (const level of SHAPE_LEVELS) {
        const q = makeShapeQuestion(rngFromSeed(`shapes-${seed}-${level}`), level);
        expectChoices(q);
        if (q.visual.kind !== "scene" || q.visual.board.game !== "shapes") throw new Error(level);
        const board = q.visual.board;
        switch (board.mode) {
          case "flat":
            expect(["circle", "triangle", "square", "rectangle"]).toContain(q.answer);
            break;
          case "solid":
            expect(["cube", "sphere", "cone", "cylinder"]).toContain(q.answer);
            break;
          case "sides":
            expect(q.answer).toBe(String(SIDES[board.shape]));
            expect(Number(q.answer)).toBeGreaterThanOrEqual(3);
            expect(Number(q.answer)).toBeLessThanOrEqual(6);
            break;
          case "symmetry":
            expect(q.answer).toBe(LINES[board.shape]);
            break;
          case "parts":
            expect(q.visual.hands).toBe(true);
            expect(["halves", "thirds", "fourths", "unequal"]).toContain(q.answer);
            break;
          default: {
            const neverBoard: never = board;
            throw new Error(String(neverBoard));
          }
        }
      }
      for (const level of shapesGame.levels) {
        const row = shapesGame.makeSheetItem(rngFromSeed(`shapes-sheet-${seed}-${level.id}`), level.id);
        if (level.id === "flat" || level.id === "solid") expect(row.prompt.toLowerCase().includes(row.answer)).toBe(false);
        if (level.id === "sides") {
          const found = row.prompt.match(/^How many (sides|corners) does a (\w+) have\?$/);
          expect(row.answer).toBe(String(SIDES[found?.[2] ?? ""]));
        }
        if (level.id === "symmetry") {
          const found = row.prompt.match(/^How many lines of symmetry does a (\w+) have\?$/);
          expect(row.answer).toBe(LINES[found?.[1] ?? ""]);
        }
        if (level.id === "parts") expect(["halves", "thirds", "fourths", "not equal"]).toContain(row.answer);
      }
    }
  });
});
