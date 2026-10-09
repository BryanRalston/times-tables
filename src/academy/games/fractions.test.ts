import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { FRACTION_LEVELS, fractionsGame, makeFractionQuestion } from "./fractions";
import type { ChoiceQ } from "./types";

function expectChoices(q: ChoiceQ) {
  expect(q.choices).toHaveLength(4);
  expect(new Set(q.choices).size).toBe(4);
  expect(q.choices).toContain(q.answer);
  for (const choice of q.choices) expect(choice.startsWith("no ")).toBe(false);
}

function lineText(num: number, den: number): string {
  if (num <= 0) return "0";
  if (num >= den) return "1";
  return `${num}/${den}`;
}

describe("fraction questions", () => {
  it("stays inside grade 1–3 denominators and compares with the same numerator or denominator", () => {
    for (let seed = 0; seed < 24; seed += 1) {
      for (const level of FRACTION_LEVELS) {
        const q = makeFractionQuestion(rngFromSeed(`fractions-${seed}-${level}`), level);
        expectChoices(q);
        if (q.visual.kind !== "scene" || q.visual.board.game !== "fractions") throw new Error(level);
        const board = q.visual.board;
        switch (board.mode) {
          case "parts":
            expect([2, 4]).toContain(board.den);
            expect(board.num).toBeGreaterThanOrEqual(1);
            expect(board.num).toBeLessThanOrEqual(board.den);
            expect(q.answer).toBe(`${board.num}/${board.den}`);
            break;
          case "unit":
            expect(board.num).toBe(1);
            expect([2, 3, 4]).toContain(board.den);
            expect(q.answer).toBe(`1/${board.den}`);
            break;
          case "line":
            expect([2, 3, 4]).toContain(board.den);
            expect(board.num).toBeGreaterThanOrEqual(0);
            expect(board.num).toBeLessThanOrEqual(board.den);
            expect(q.answer).toBe(lineText(board.num, board.den));
            break;
          case "compare": {
            const sameDen = board.den === board.den2;
            const sameNum = board.num === board.num2;
            expect(sameDen || sameNum).toBe(true);
            expect([2, 3, 4]).toContain(board.den);
            expect([2, 3, 4]).toContain(board.den2);
            const left = board.num * board.den2;
            const right = board.num2 * board.den;
            expect(left).not.toBe(right);
            const greater = left > right ? `${board.num}/${board.den}` : `${board.num2}/${board.den2}`;
            const lesser = left > right ? `${board.num2}/${board.den2}` : `${board.num}/${board.den}`;
            expect(q.answer).toBe(board.ask === "greater" ? greater : lesser);
            expect(q.choices).toContain(`${board.num}/${board.den}`);
            expect(q.choices).toContain(`${board.num2}/${board.den2}`);
            break;
          }
          case "equivalent":
            expect(board.num * board.den2).toBe(board.num2 * board.den);
            expect(q.answer).toBe(`${board.num2}/${board.den2}`);
            expect(`${board.num}/${board.den}`).not.toBe(q.answer);
            break;
          case "shade":
            expect(q.visual.hands).toBe(true);
            expect(q.visual.quietChoices).toBe(true);
            expect([2, 3, 4, 6, 8]).toContain(board.den);
            expect(q.answer).toBe(`${board.num}/${board.den}`);
            break;
          default: {
            const neverBoard: never = board;
            throw new Error(String(neverBoard));
          }
        }
      }
    }
  });

  it("prints fraction worksheet answers that match the words", () => {
    for (let seed = 0; seed < 10; seed += 1) {
      for (const level of fractionsGame.levels) {
        const row = fractionsGame.makeSheetItem(rngFromSeed(`fractions-sheet-${seed}-${level.id}`), level.id);
        const parts = row.prompt.match(/^(\d+) of (\d+) equal parts are shaded\. What fraction\?$/);
        if (parts) {
          expect(row.answer).toBe(`${parts[1]}/${parts[2]}`);
          continue;
        }
        const unit = row.prompt.match(/^1 of (\d+) equal parts is shaded\. What unit fraction\?$/);
        if (unit) {
          expect(row.answer).toBe(`1/${unit[1]}`);
          continue;
        }
        const line = row.prompt.match(/has (\d+) equal jumps\. The dot is on jump (\d+)/);
        if (line) {
          expect(row.answer).toBe(lineText(Number(line[2]), Number(line[1])));
          continue;
        }
        const compared = row.prompt.match(/^Which is greater, (\d+)\/(\d+) or (\d+)\/(\d+)\?$/);
        if (compared) {
          const left = Number(compared[1]) * Number(compared[4]);
          const right = Number(compared[3]) * Number(compared[2]);
          const greater = left >= right ? `${compared[1]}/${compared[2]}` : `${compared[3]}/${compared[4]}`;
          expect(row.answer).toBe(greater);
          continue;
        }
        const match = row.prompt.match(/^Which fraction matches (\d+)\/(\d+)\?$/);
        expect(match).not.toBeNull();
        const [num, den] = row.answer.split("/").map(Number);
        expect(num! * Number(match?.[2])).toBe(den! * Number(match?.[1]));
      }
    }
  });
});
