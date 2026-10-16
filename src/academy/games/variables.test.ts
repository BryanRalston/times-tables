import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { VARIABLE_LEVELS, makeVariableQuestion, pictureKind, printVariable, variableAnswer, variablesGame } from "./variables";
import type { ChoiceQ } from "./types";

function expectChoices(q: ChoiceQ) {
  expect(q.choices).toHaveLength(4);
  expect(new Set(q.choices).size).toBe(4);
  expect(q.choices).toContain(q.answer);
}

function filledHolds(prompt: string, answer: string): void {
  expect(prompt.match(/__/g)).toHaveLength(1);
  const filled = prompt.replace("__", answer);
  const steps = filled.match(/^(\d+) × (\d+) ([+−]) (\d+) = (\d+)$/);
  if (steps) {
    const product = Number(steps[1]) * Number(steps[2]);
    const total = steps[3] === "+" ? product + Number(steps[4]) : product - Number(steps[4]);
    expect(total).toBe(Number(steps[5]));
    return;
  }
  const plain = filled.match(/^(\d+) ([+−×÷]) (\d+) = (\d+)$/);
  expect(plain).toBeTruthy();
  const a = Number(plain?.[1]);
  const op = plain?.[2];
  const b = Number(plain?.[3]);
  const result = Number(plain?.[4]);
  if (op === "+") expect(a + b).toBe(result);
  if (op === "−") expect(a - b).toBe(result);
  if (op === "×") expect(a * b).toBe(result);
  if (op === "÷") expect(a / b).toBe(result);
}

describe("missing-number questions", () => {
  it("hides one number that makes the equation true", () => {
    for (let seed = 0; seed < 24; seed += 1) {
      for (const level of VARIABLE_LEVELS) {
        const q = makeVariableQuestion(rngFromSeed(`variables-${seed}-${level}`), level);
        expectChoices(q);
        if (q.visual.kind !== "scene" || q.visual.board.game !== "variables") throw new Error(level);
        const board = q.visual.board;
        expect(q.answer).toBe(String(variableAnswer(board)));
        expect(q.skill).toBe(`variables:${level}`);
        expect(pictureKind(board)).toBe(q.visual.picture);
        filledHolds(printVariable(board), q.answer);
        if (level === "addend") {
          expect(board.op).toBe("+");
          expect(board.a + board.b).toBeLessThanOrEqual(10);
          expect(pictureKind(board)).toBe("holes");
        }
        if (level === "factor") {
          expect(board.a).toBeLessThanOrEqual(5);
          expect(board.b).toBeLessThanOrEqual(5);
          expect(board.box === "left" || board.box === "right").toBe(true);
        }
        if (level === "steps") {
          const total = board.extraOp === "+" ? board.a * board.b + board.c : board.a * board.b - board.c;
          expect(total).toBeGreaterThanOrEqual(1);
          expect(total).toBeLessThanOrEqual(30);
        }
      }
    }
  });

  it("prints a worksheet row with one blank", () => {
    for (let seed = 0; seed < 8; seed += 1) {
      for (const level of variablesGame.levels) {
        const row = variablesGame.makeSheetItem(rngFromSeed(`variables-sheet-${seed}-${level.id}`), level.id);
        filledHolds(row.prompt, row.answer);
      }
    }
  });

  it("starts kindergarten on a missing addend", () => {
    expect(variablesGame.defaultLevel("K")).toBe("addend");
    expect(variablesGame.defaultLevel("1")).toBe("addend");
    expect(variablesGame.defaultLevel("4")).toBe("steps");
    expect(variablesGame.sheetSlug).toBe("missing-numbers");
    expect(readFileSync("academy/worksheets/missing-numbers/index.html", "utf8")).toContain('data-screen="sheet-variables"');
    expect(readFileSync("vite.academy.config.ts", "utf8")).toContain("worksheets/missing-numbers/index.html");
  });
});
