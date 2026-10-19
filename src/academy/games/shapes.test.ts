import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { TRIANGLE_POINTS } from "./scene-ui";
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
            expect(q.visual.pictures?.[q.answer]).toBe(`shape:${q.answer}`);
            expect(q.visual.labels[q.answer]).toBe("");
            break;
          case "color":
          case "pattern":
            expect(["red", "blue", "yellow", "green"]).toContain(q.answer);
            expect(q.visual.pictures?.[q.answer]).toMatch(/^swatch:/);
            expect(q.visual.labels[q.answer]).toBe("");
            break;
          case "match":
            expect(["circle", "triangle", "square", "rectangle"]).toContain(q.answer);
            expect(q.visual.pictures?.[q.answer]).toBe(`fig:${q.answer}`);
            break;
          case "angles":
            if (board.ask === "degrees") expect(["90", "180"]).toContain(q.answer);
            else expect(["acute", "right", "obtuse", "straight"]).toContain(q.answer);
            break;
          case "position":
            expect(["above", "below", "beside", "behind"]).toContain(q.answer);
            expect(q.visual.labels[q.answer]).toBe("");
            expect(q.visual.pictures?.[q.answer]).toBe(`geo:pos:${q.answer}`);
            break;
          case "sort":
            if (board.ask === "flat") expect(["circle", "triangle", "square", "rectangle"]).toContain(q.answer);
            else expect(["cube", "sphere", "cone", "cylinder"]).toContain(q.answer);
            break;
          case "traits":
            expect(["circle", "triangle", "square", "rectangle"]).toContain(q.answer);
            expect(q.answer).toBe(board.shape);
            break;
          case "compose":
            expect(["rectangle", "square", "circle"]).toContain(q.answer);
            expect(q.answer).toBe(board.made);
            break;
          case "faces":
            expect(q.answer).toBe(board.kind === "net" ? "6" : "cube");
            break;
          case "rows":
          case "cover":
            expect(q.answer).toBe(String(board.rows * board.cols));
            break;
          case "quads":
            expect(["rhombus", "rectangle", "square", "trapezoid"]).toContain(q.answer);
            expect(q.visual.labels[q.answer]?.length).toBeGreaterThan(0);
            break;
          case "share":
            expect(q.answer).toBe(`1/${board.den}`);
            break;
          case "fold":
            expect(q.answer.endsWith(":yes")).toBe(true);
            expect(board.mirror).toBe(true);
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
        if (level.id === "position") expect(["above", "below", "beside", "behind"]).toContain(row.answer);
        if (level.id === "faces") expect(row.answer).toBe("6");
        if (level.id === "rows" || level.id === "cover") {
          const found = row.prompt.match(/(\d+) rows of (\d+)/);
          expect(row.answer).toBe(String(Number(found?.[1]) * Number(found?.[2])));
        }
        if (level.id === "share") expect(["1/2", "1/3", "1/4"]).toContain(row.answer);
        if (level.id === "quads") expect(["rhombus", "rectangle", "square", "trapezoid"]).toContain(row.answer);
        if (level.id === "fold") expect(row.answer).toBe("square");
      }
      const points = TRIANGLE_POINTS.split(/[\s,]+/).map(Number);
      const corners: Array<[number, number]> = [];
      for (let i = 0; i < points.length; i += 2) corners.push([points[i]!, points[i + 1]!]);
      const lengths = corners.map((corner, index) => {
        const next = corners[(index + 1) % corners.length]!;
        return Math.hypot(corner[0] - next[0], corner[1] - next[1]);
      });
      expect(Math.max(...lengths) - Math.min(...lengths)).toBeLessThan(0.2);
    }
  });
});
