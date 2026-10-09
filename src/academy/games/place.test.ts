import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { PLACE_LEVELS, makePlaceQuestion, placeGame } from "./place";
import type { ChoiceQ } from "./types";

function expectChoices(q: ChoiceQ) {
  expect(q.choices).toHaveLength(4);
  expect(new Set(q.choices).size).toBe(4);
  expect(q.choices).toContain(q.answer);
  for (const choice of q.choices) expect(choice.startsWith("no ")).toBe(false);
}

function roundHalfUp(n: number, place: 10 | 100): number {
  return Math.floor(n / place + 0.5) * place;
}

function expandSum(text: string): number {
  return text.split(" + ").reduce((sum, part) => sum + Number(part), 0);
}

describe("place value questions", () => {
  it("uses grade 1–3 ranges and a real expanded or rounded answer", () => {
    for (let seed = 0; seed < 24; seed += 1) {
      for (const level of PLACE_LEVELS) {
        const q = makePlaceQuestion(rngFromSeed(`place-${seed}-${level}`), level);
        expectChoices(q);
        if (q.visual.kind !== "scene" || q.visual.board.game !== "place") throw new Error(level);
        const board = q.visual.board;
        expect(board.mode).toBe(level);
        switch (board.mode) {
          case "blocks":
            expect(board.n).toBeGreaterThanOrEqual(10);
            expect(board.n).toBeLessThanOrEqual(99);
            expect(q.answer).toBe(String(board.n));
            break;
          case "expanded":
            expect(board.n).toBeGreaterThanOrEqual(10);
            expect(board.n).toBeLessThanOrEqual(999);
            expect(expandSum(q.answer)).toBe(board.n);
            break;
          case "compare":
            expect(board.left).not.toBe(board.right);
            expect(q.choices).toContain(String(board.left));
            expect(q.choices).toContain(String(board.right));
            expect(q.answer).toBe(String(board.ask === "greater" ? Math.max(board.left, board.right) : Math.min(board.left, board.right)));
            expect(board.left).toBeGreaterThanOrEqual(10);
            expect(board.right).toBeLessThanOrEqual(999);
            break;
          case "round10":
            expect(board.n).toBeGreaterThanOrEqual(10);
            expect(board.n).toBeLessThanOrEqual(999);
            expect(q.answer).toBe(String(roundHalfUp(board.n, 10)));
            break;
          case "round100":
            expect(board.n).toBeGreaterThanOrEqual(100);
            expect(board.n).toBeLessThanOrEqual(999);
            expect(q.answer).toBe(String(roundHalfUp(board.n, 100)));
            break;
          case "build":
            expect(q.visual.hands).toBe(true);
            expect(q.visual.quietChoices).toBe(true);
            expect(board.n).toBeGreaterThanOrEqual(10);
            expect(board.n).toBeLessThanOrEqual(99);
            expect(q.answer).toBe(String(board.n));
            break;
          default: {
            const neverBoard: never = board;
            throw new Error(String(neverBoard));
          }
        }
      }
    }
  });

  it("prints place-value worksheet answers that match the prompt", () => {
    for (let seed = 0; seed < 12; seed += 1) {
      for (const level of placeGame.levels) {
        const row = placeGame.makeSheetItem(rngFromSeed(`place-sheet-${seed}-${level.id}`), level.id);
        const blocks = row.prompt.match(/^(\d+) tens and (\d+) ones =$/);
        if (blocks) {
          expect(row.answer).toBe(String(Number(blocks[1]) * 10 + Number(blocks[2])));
          continue;
        }
        const expanded = row.prompt.match(/^Write (\d+) in expanded form\.$/);
        if (expanded) {
          expect(expandSum(row.answer)).toBe(Number(expanded[1]));
          continue;
        }
        const compared = row.prompt.match(/^Which is (greater|less), (\d+) or (\d+)\?$/);
        if (compared) {
          const a = Number(compared[2]);
          const b = Number(compared[3]);
          expect(row.answer).toBe(String(compared[1] === "greater" ? Math.max(a, b) : Math.min(a, b)));
          continue;
        }
        const rounded = row.prompt.match(/^Round (\d+) to the nearest (10|100)\.$/);
        expect(rounded).not.toBeNull();
        const place = Number(rounded?.[2]) === 100 ? 100 : 10;
        expect(row.answer).toBe(String(roundHalfUp(Number(rounded?.[1]), place)));
      }
    }
  });
});
