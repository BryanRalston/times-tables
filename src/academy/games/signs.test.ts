import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { SignHands } from "../ui/sign-board";
import { makeSignsQuestion, makeSignsTask, signLabel, signTruth, signsMatch, trueSignCount } from "./signs-data";
import { SignChoices } from "./signs";

describe("compare numbers", () => {
  it("asks for one true sign and stays inside each level", () => {
    for (let i = 0; i < 40; i += 1) {
      const to10 = makeSignsTask("to10", rngFromSeed(`sign-10-${i}`));
      expect(to10.left).toBeGreaterThanOrEqual(1);
      expect(to10.right).toBeGreaterThanOrEqual(1);
      expect(to10.left).toBeLessThanOrEqual(10);
      expect(to10.right).toBeLessThanOrEqual(10);
      expect(to10.mark).toBe(signTruth(to10.left, to10.right));
      expect(signsMatch(to10, to10.mark)).toBe(true);
      expect(signsMatch(to10, to10.mark === "<" ? ">" : "<")).toBe(false);

      const tens = makeSignsTask("tens", rngFromSeed(`sign-tens-${i}`));
      expect(tens.left).toBeGreaterThanOrEqual(10);
      expect(tens.right).toBeLessThan(100);

      const hundreds = makeSignsTask("hundreds", rngFromSeed(`sign-h-${i}`));
      expect(hundreds.left).toBeGreaterThanOrEqual(100);
      expect(hundreds.right).toBeLessThan(1000);

      const big = makeSignsTask("big", rngFromSeed(`sign-big-${i}`));
      expect(big.left).toBeGreaterThanOrEqual(1000);
      expect(big.right).toBeLessThanOrEqual(9999);
      expect(big.speech).not.toMatch(/\d/);

      const question = makeSignsQuestion(rngFromSeed(`sign-q-${i}`), i % 2 === 0 ? "tens" : "to10");
      expect(question.choices).toHaveLength(4);
      expect(new Set(question.choices).size).toBe(4);
      expect(question.choices).toContain(question.answer);
      expect(question.visual.kind === "scene" && question.visual.quietChoices).toBe(true);
      if (question.visual.kind === "scene" && question.visual.board.game === "signs") {
        const board = question.visual.board;
        expect(question.answer).toBe(signLabel(board.left, board.mark, board.right));
        expect(trueSignCount(board.left, board.right, question.choices)).toBe(1);
      }
    }
  });

  it("keeps the first visit on smaller numbers", () => {
    const gentle = makeSignsTask("tens", rngFromSeed("sign-gentle"), undefined, ["ease:gentle"]);
    expect(gentle.left).toBeLessThanOrEqual(54);
    expect(gentle.right).toBeLessThanOrEqual(54);
  });

  it("renders the two numbers and lets the hands card place a sign", () => {
    const task = makeSignsTask("to10", rngFromSeed("sign-render"));
    const choice = renderToStaticMarkup(createElement(SignChoices, { question: makeSignsQuestion(rngFromSeed("sign-choice"), "to10"), reveal: false, picked: null, onChoose: () => {} }));
    expect(choice).toContain("ac-sign-eq");
    expect(choice).toContain("ac-choice");
    expect(choice).not.toContain("ac-num-tiles");

    const hands = renderToStaticMarkup(createElement(SignHands, { task, onAnswer: () => {} }));
    expect(hands).toContain("ac-num-tiles");
    expect(hands).toContain(">");
    expect(hands).toContain("=");
    expect(hands).toContain("Done");
  });
});
