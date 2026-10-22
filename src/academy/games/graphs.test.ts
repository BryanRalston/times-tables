import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { setLocale } from "../i18n";
import { GRAPH_LEVELS, graphAnswer, isGraphLevel, makeGraphsQuestion, makeGraphsSheet } from "./graph-data";

const ENGLISH_FOOD = ["apple", "banana", "carrot", "bone", "candy", "bug", "apples", "bananas", "carrots", "bones", "candies", "bugs"];

describe("data and graphs", () => {
  it("asks a grade-sized question with four real choices", () => {
    for (const level of GRAPH_LEVELS) {
      for (let seed = 0; seed < 40; seed += 1) {
        const question = makeGraphsQuestion(rngFromSeed(`graphs-${level}-${seed}`), level);
        expect(question.choices).toHaveLength(4);
        expect(new Set(question.choices).size).toBe(4);
        expect(question.choices).toContain(question.answer);
        expect(question.choices.some((choice) => choice.startsWith("no "))).toBe(false);
        expect(question.skill).toBe(`graphs:${level}`);
        if (question.visual.kind !== "scene" || question.visual.board.game !== "graphs") throw new Error(level);
        const board = question.visual.board;
        expect(board.mode).toBe(level);
        expect(question.answer).toBe(graphAnswer(board));
        if (level === "sort") {
          expect(board.items).toHaveLength(2);
          expect(board.items.every((item) => item.value >= 1 && item.value <= 3)).toBe(true);
        }
        if (level === "scale") {
          expect([2, 5]).toContain(board.scale);
          expect(board.items.every((item) => item.value % board.scale === 0)).toBe(true);
        }
        if (level === "line") {
          expect([2, 4, 8]).toContain(board.den);
          expect(board.marks).toHaveLength(5);
          expect(new Set(board.marks).size).toBeGreaterThan(1);
        }
        const row = makeGraphsSheet(rngFromSeed(`graphs-sheet-${level}-${seed}`), level);
        expect(row.prompt.length).toBeGreaterThan(0);
        expect(row.answer.length).toBeGreaterThan(0);
      }
    }
  });

  it("names the groups in Spanish", () => {
    setLocale("es");
    try {
      for (const level of GRAPH_LEVELS) {
        for (let seed = 0; seed < 12; seed += 1) {
          const question = makeGraphsQuestion(rngFromSeed(`graphs-es-${level}-${seed}`), level);
          const folded = question.title.toLowerCase();
          for (const word of ENGLISH_FOOD) expect(folded.includes(word)).toBe(false);
          const row = makeGraphsSheet(rngFromSeed(`graphs-es-sheet-${level}-${seed}`), level);
          expect(row.prompt.length).toBeGreaterThan(0);
        }
      }
    } finally {
      setLocale("en");
    }
    expect(isGraphLevel("sort")).toBe(true);
    expect(isGraphLevel("area")).toBe(false);
  });
});
