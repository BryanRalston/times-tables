import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { MEASURE_LEVELS, makeMeasureQuestion, measureGame } from "./measure";
import type { ChoiceQ } from "./types";

function expectChoices(q: ChoiceQ) {
  expect(q.choices).toHaveLength(4);
  expect(new Set(q.choices).size).toBe(4);
  expect(q.choices).toContain(q.answer);
  for (const choice of q.choices) expect(choice.startsWith("no ")).toBe(false);
}

describe("measurement questions", () => {
  it("compares lengths, reads a 12-inch ruler, and reads graphs", () => {
    for (let seed = 0; seed < 24; seed += 1) {
      for (const level of MEASURE_LEVELS) {
        const q = makeMeasureQuestion(rngFromSeed(`measure-${seed}-${level}`), level);
        expectChoices(q);
        if (q.visual.kind !== "scene" || q.visual.board.game !== "measure") throw new Error(level);
        const board = q.visual.board;
        switch (board.mode) {
          case "compare": {
            expect(q.visual.hands).toBe(true);
            expect(board.items).toHaveLength(4);
            const values = board.items.map((item) => item.value);
            expect(new Set(values).size).toBe(4);
            for (const value of values) {
              expect(value).toBeGreaterThanOrEqual(2);
              expect(value).toBeLessThanOrEqual(9);
            }
            const target = board.ask === "longest" ? Math.max(...values) : Math.min(...values);
            expect(board.items.find((item) => item.name === q.answer)?.value).toBe(target);
            break;
          }
          case "ruler":
            expect(board.inches).toBeGreaterThanOrEqual(1);
            expect(board.inches).toBeLessThanOrEqual(12);
            expect(q.answer).toBe(String(board.inches));
            for (const choice of q.choices) {
              const n = Number(choice);
              expect(n).toBeGreaterThanOrEqual(1);
              expect(n).toBeLessThanOrEqual(12);
            }
            break;
          case "picture":
          case "bar": {
            expect(board.items).toHaveLength(4);
            for (const item of board.items) {
              expect(item.value).toBeGreaterThanOrEqual(1);
              expect(item.value).toBeLessThanOrEqual(8);
            }
            const focus = board.items[board.focus];
            expect(focus).toBeTruthy();
            if (board.ask === "most") {
              const max = Math.max(...board.items.map((item) => item.value));
              expect(q.answer).toBe(board.items.find((item) => item.value === max)?.name);
            } else {
              expect(q.answer).toBe(String(focus?.value));
            }
            break;
          }
          case "more": {
            const high = board.items[board.left]?.value ?? 0;
            const low = board.items[board.right]?.value ?? 0;
            expect(high).toBeGreaterThan(low);
            expect(q.answer).toBe(String(high - low));
            expect(high).toBeLessThanOrEqual(8);
            expect(low).toBeGreaterThanOrEqual(1);
            break;
          }
          default: {
            const neverBoard: never = board;
            throw new Error(String(neverBoard));
          }
        }
      }
    }
  });

  it("prints measurement worksheet answers from the prompt", () => {
    for (let seed = 0; seed < 10; seed += 1) {
      for (const level of measureGame.levels) {
        const row = measureGame.makeSheetItem(rngFromSeed(`measure-sheet-${seed}-${level.id}`), level.id);
        const compared = row.prompt.match(/^Which is (longer|shorter), (\d+) units or (\d+) units\?$/);
        if (compared) {
          const a = Number(compared[2]);
          const b = Number(compared[3]);
          expect(row.answer).toBe(String(compared[1] === "longer" ? Math.max(a, b) : Math.min(a, b)));
          continue;
        }
        const inches = row.prompt.match(/^The ribbon goes from 0 to (\d+) on the ruler\. How many inches\?$/);
        if (inches) {
          expect(row.answer).toBe(inches[1]);
          continue;
        }
        const graph = row.prompt.match(/^The graph shows (.+) apples\. How many apples\?$/);
        if (graph) {
          const icon = graph[1]!.includes("▮") ? "▮" : "🍎";
          expect(row.answer).toBe(String(graph[1]!.length / icon.length));
          continue;
        }
        const more = row.prompt.match(/^There are (\d+) cats and (\d+) dogs\. How many more cats\?$/);
        expect(more).not.toBeNull();
        expect(row.answer).toBe(String(Number(more?.[1]) - Number(more?.[2])));
      }
    }
  });
});
