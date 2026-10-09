import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { workedExample } from "../teach";
import { COUNT_LEVELS, countGame, makeCountQuestion } from "./count";
import type { ChoiceQ } from "./types";

function expectChoices(q: ChoiceQ) {
  expect(q.choices).toHaveLength(4);
  expect(new Set(q.choices).size).toBe(4);
  expect(q.choices).toContain(q.answer);
  for (const choice of q.choices) expect(choice.startsWith("no ")).toBe(false);
}

describe("counting questions", () => {
  it("keeps four real choices inside Pre-K and K ranges", () => {
    for (let seed = 0; seed < 24; seed += 1) {
      for (const level of COUNT_LEVELS) {
        const q = makeCountQuestion(rngFromSeed(`count-${seed}-${level}`), level);
        expectChoices(q);
        expect(q.visual.kind).toBe("scene");
        if (q.visual.kind !== "scene" || q.visual.board.game !== "count") continue;
        const board = q.visual.board;
        expect(board.mode).toBe(level);
        switch (board.mode) {
          case "objects":
            expect(board.n).toBeGreaterThanOrEqual(1);
            expect(board.n).toBeLessThanOrEqual(10);
            expect(q.answer).toBe(String(board.n));
            break;
          case "to20":
            expect(board.n).toBeGreaterThanOrEqual(8);
            expect(board.n).toBeLessThanOrEqual(20);
            expect(q.answer).toBe(String(board.n));
            break;
          case "compare": {
            expect(q.visual.hands).toBe(true);
            expect(board.groups).toHaveLength(4);
            expect(new Set(board.groups).size).toBe(4);
            for (const n of board.groups) {
              expect(n).toBeGreaterThanOrEqual(1);
              expect(n).toBeLessThanOrEqual(6);
            }
            expect(q.title).toMatch(board.ask === "more" ? /most/ : /fewest/);
            const target = board.ask === "more" ? Math.max(...board.groups) : Math.min(...board.groups);
            const index = Number(q.answer.slice(1));
            expect(board.groups[index]).toBe(target);
            break;
          }
          case "neighbor": {
            expect(board.n).toBeGreaterThanOrEqual(1);
            expect(board.n).toBeLessThanOrEqual(20);
            const next = board.ask === "before" ? board.n - 1 : board.n + 1;
            expect(next).toBeGreaterThanOrEqual(0);
            expect(next).toBeLessThanOrEqual(20);
            expect(q.answer).toBe(String(next));
            break;
          }
          case "subitize": {
            expect(board.clusters.reduce((sum, n) => sum + n, 0)).toBe(Number(q.answer));
            expect(Number(q.answer)).toBeGreaterThanOrEqual(1);
            expect(Number(q.answer)).toBeLessThanOrEqual(6);
            break;
          }
          case "tenframe": {
            const total = board.frames.reduce((sum, n) => sum + n, 0);
            expect(total).toBe(Number(q.answer));
            expect(total).toBeGreaterThanOrEqual(0);
            expect(total).toBeLessThanOrEqual(20);
            for (const frame of board.frames) expect(frame).toBeLessThanOrEqual(10);
            break;
          }
          case "build":
            expect(q.visual.hands).toBe(true);
            expect(q.visual.quietChoices).toBe(true);
            expect(q.tags).toContain("hands");
            expect(board.n).toBeGreaterThanOrEqual(1);
            expect(board.n).toBeLessThanOrEqual(10);
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

  it("prints a countable worksheet row", () => {
    for (let seed = 0; seed < 12; seed += 1) {
      for (const level of COUNT_LEVELS) {
        const row = countGame.makeSheetItem(rngFromSeed(`count-sheet-${seed}-${level}`), level);
        const stars = row.prompt.match(/^Count the stars: (★*)$/);
        if (stars) {
          expect(row.answer).toBe(String(stars[1]!.length));
          continue;
        }
        const after = row.prompt.match(/^What number comes after (\d+)\?$/);
        if (after) {
          expect(row.answer).toBe(String(Number(after[1]) + 1));
          continue;
        }
        const before = row.prompt.match(/^What number comes before (\d+)\?$/);
        if (before) {
          expect(row.answer).toBe(String(Number(before[1]) - 1));
          continue;
        }
        const more = row.prompt.match(/^Which is (more|less), (\d+) or (\d+)\?$/);
        if (more) {
          const a = Number(more[2]);
          const b = Number(more[3]);
          expect(row.answer).toBe(String(more[1] === "more" ? Math.max(a, b) : Math.min(a, b)));
          continue;
        }
        const dots = row.prompt.match(/^Dot groups: (\d+) and (\d+)\. How many dots\?$/);
        if (dots) {
          expect(row.answer).toBe(String(Number(dots[1]) + Number(dots[2])));
          continue;
        }
        const filled = row.prompt.match(/^Filled dots: (●*)$/);
        expect(filled).not.toBeNull();
        expect(row.answer).toBe(String(filled?.[1]!.length ?? -1));
      }
    }
    const sample = makeCountQuestion(rngFromSeed("count-teach"), "objects");
    expect(workedExample(sample).frames[0]?.kind).toBe("scene");
  });
});
