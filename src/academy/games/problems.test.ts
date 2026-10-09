import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { PROBLEM_LEVELS, makeProblemQuestion, problemsGame } from "./problems";
import type { ChoiceQ } from "./types";

function expectChoices(q: ChoiceQ) {
  expect(q.choices).toHaveLength(4);
  expect(new Set(q.choices).size).toBe(4);
  expect(q.choices).toContain(q.answer);
  for (const choice of q.choices) expect(choice.startsWith("no ")).toBe(false);
}

function storyAnswer(op: "+" | "-" | "×" | "÷", a: number, b: number): number {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return a / b;
    default: {
      const neverOp: never = op;
      return neverOp;
    }
  }
}

describe("word problem questions", () => {
  it("uses grade 1–3 facts and a picture that matches the story", () => {
    for (let seed = 0; seed < 24; seed += 1) {
      for (const level of PROBLEM_LEVELS) {
        const q = makeProblemQuestion(rngFromSeed(`problems-${seed}-${level}`), level);
        expectChoices(q);
        if (q.visual.kind !== "scene" || q.visual.board.game !== "problems") throw new Error(level);
        const board = q.visual.board;
        expect(q.title.length).toBeGreaterThan(12);
        switch (board.mode) {
          case "add":
            expect(board.a + board.b).toBeLessThanOrEqual(10);
            expect(board.a).toBeGreaterThanOrEqual(0);
            expect(board.b).toBeGreaterThanOrEqual(0);
            expect(q.answer).toBe(String(storyAnswer(board.op, board.a, board.b)));
            break;
          case "sub":
            expect(board.a).toBeLessThanOrEqual(12);
            expect(board.b).toBeLessThanOrEqual(board.a);
            expect(q.answer).toBe(String(storyAnswer(board.op, board.a, board.b)));
            break;
          case "mult":
            expect(board.a).toBeGreaterThanOrEqual(1);
            expect(board.a).toBeLessThanOrEqual(5);
            expect(board.b).toBeGreaterThanOrEqual(1);
            expect(board.b).toBeLessThanOrEqual(5);
            expect(q.answer).toBe(String(board.a * board.b));
            break;
          case "div":
            expect(board.b).toBeGreaterThanOrEqual(2);
            expect(board.b).toBeLessThanOrEqual(5);
            expect(board.a % board.b).toBe(0);
            expect(board.a / board.b).toBeGreaterThanOrEqual(1);
            expect(board.a / board.b).toBeLessThanOrEqual(5);
            expect(q.answer).toBe(String(board.a / board.b));
            break;
          case "picture": {
            expect(q.visual.hands).toBe(true);
            expect(board.a).toBeGreaterThanOrEqual(2);
            expect(board.a).toBeLessThanOrEqual(4);
            expect(board.b).toBeGreaterThanOrEqual(1);
            expect(board.b).toBeLessThanOrEqual(4);
            const shown = q.visual.pictures?.[q.answer] ?? "";
            const groups = shown.split(" ").filter((part) => part.length > 0);
            expect(groups).toHaveLength(board.a);
            expect(groups.every((part) => part === board.emoji.repeat(board.b))).toBe(true);
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

  it("prints story worksheet answers from the numbers in the sentence", () => {
    for (let seed = 0; seed < 10; seed += 1) {
      for (const level of problemsGame.levels) {
        const row = problemsGame.makeSheetItem(rngFromSeed(`problems-sheet-${seed}-${level.id}`), level.id);
        const add = row.prompt.match(/^Sam has (\d+) apples?\. Jo gives Sam (\d+) more\. How many apples\?$/);
        if (add) {
          expect(Number(add[1]) + Number(add[2])).toBeLessThanOrEqual(10);
          expect(row.answer).toBe(String(Number(add[1]) + Number(add[2])));
          continue;
        }
        const sub = row.prompt.match(/^Max has (\d+) fish and gives away (\d+)\. How many fish are left\?$/);
        if (sub) {
          expect(Number(sub[1])).toBeLessThanOrEqual(12);
          expect(row.answer).toBe(String(Number(sub[1]) - Number(sub[2])));
          continue;
        }
        const mult = row.prompt.match(/^Ana has (\d+) bags with (\d+) stars in each bag\. How many stars\?$/);
        if (mult) {
          expect(row.answer).toBe(String(Number(mult[1]) * Number(mult[2])));
          continue;
        }
        const div = row.prompt.match(/^Lee has (\d+) cookies in (\d+) equal boxes\. How many cookies are in each box\?$/);
        if (div) {
          expect(Number(div[1]) % Number(div[2])).toBe(0);
          expect(row.answer).toBe(String(Number(div[1]) / Number(div[2])));
          continue;
        }
        const picture = row.prompt.match(/^Nia draws (\d+) groups of (\d+) frogs\. How many frogs\?$/);
        expect(picture).not.toBeNull();
        expect(row.answer).toBe(String(Number(picture?.[1]) * Number(picture?.[2])));
      }
    }
  });
});
