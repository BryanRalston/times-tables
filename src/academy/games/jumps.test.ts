import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { JumpHands } from "../ui/jump-board";
import { JumpChoices } from "./jumps";
import { jumpsMatch, makeJumpQuestion, makeJumpTask } from "./jumps-data";

describe("ten more", () => {
  it("moves one place and leaves the other digits alone", () => {
    for (let i = 0; i < 40; i += 1) {
      const ten = makeJumpTask("ten", rngFromSeed(`jump-ten-${i}`));
      expect(ten.step).toBe(10);
      expect(ten.start).toBeGreaterThanOrEqual(10);
      expect(ten.start).toBeLessThan(100);
      expect(ten.answer % 10).toBe(ten.start % 10);
      expect(ten.answer).toBe(ten.dir === "more" ? ten.start + 10 : ten.start - 10);
      expect(ten.answer).toBeGreaterThanOrEqual(0);
      expect(ten.answer).toBeLessThanOrEqual(100);
      expect(jumpsMatch(ten, ten.answer)).toBe(true);
      expect(jumpsMatch(ten, ten.start)).toBe(false);

      const hundred = makeJumpTask("hundred", rngFromSeed(`jump-h-${i}`));
      expect(hundred.step).toBe(100);
      expect(hundred.answer % 100).toBe(hundred.start % 100);
      expect(hundred.answer).toBeLessThanOrEqual(1000);

      const thousand = makeJumpTask("thousand", rngFromSeed(`jump-th-${i}`));
      expect(thousand.step).toBe(1000);
      expect(thousand.start).toBeGreaterThanOrEqual(1000);
      expect(thousand.answer % 1000).toBe(thousand.start % 1000);
      if (thousand.start !== 1000) expect(thousand.speech).not.toContain(String(thousand.start));
      expect(thousand.answer).toBeLessThanOrEqual(9999);

      const question = makeJumpQuestion(rngFromSeed(`jump-q-${i}`), "ten");
      expect(question.choices).toHaveLength(4);
      expect(question.choices).toContain(question.answer);
      expect(question.visual.kind === "scene" && question.visual.quietChoices).toBe(false);
    }
  });

  it("keeps a gentle ten inside the lower half", () => {
    const gentle = makeJumpTask("ten", rngFromSeed("jump-gentle"), undefined, ["ease:gentle"]);
    expect(gentle.start).toBeLessThanOrEqual(54);
  });

  it("shows the start number and builds the jump by adding or taking a place", () => {
    const task = makeJumpTask("ten", rngFromSeed("jump-render"));
    const question = makeJumpQuestion(rngFromSeed("jump-choice"), "ten");
    const choice = renderToStaticMarkup(
      createElement(JumpChoices, { question, reveal: false, picked: null, onChoose: () => {} }),
    );
    expect(choice).toContain("ac-jump-read");
    if (question.visual.kind === "scene" && question.visual.board.game === "jumps") {
      expect(choice).toContain(String(question.visual.board.start));
    }
    expect(choice).toContain("ac-choice");
    expect(choice).not.toContain("Start over");

    const hands = renderToStaticMarkup(createElement(JumpHands, { task, onAnswer: () => {} }));
    expect(hands).toContain("+10");
    expect(hands).toContain("10");
    expect(hands).toContain("Start over");
    expect(hands).toContain("Done");
  });
});
