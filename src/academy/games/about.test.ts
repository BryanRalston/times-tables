import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { AboutHands } from "../ui/about-board";
import { roundHalfUp } from "./boards";
import { AboutChoices } from "./about";
import { aboutMatch, aboutStart, makeAboutQuestion, makeAboutTask } from "./about-data";

describe("rounding stories", () => {
  it("rounds a grade-sized number and starts the hands card off the answer", () => {
    for (let i = 0; i < 40; i += 1) {
      const ten = makeAboutTask("ten", rngFromSeed(`about-ten-${i}`));
      expect(ten.place).toBe(10);
      expect(ten.n).toBeGreaterThanOrEqual(10);
      expect(ten.n).toBeLessThan(100);
      expect(ten.answer).toBe(roundHalfUp(ten.n, 10));
      expect(ten.answer).toBeLessThanOrEqual(100);
      expect(aboutMatch(ten, ten.answer)).toBe(true);
      expect(aboutStart(ten.n, ten.place, ten.answer)).not.toBe(ten.answer);

      const hundred = makeAboutTask("hundred", rngFromSeed(`about-h-${i}`));
      expect(hundred.place).toBe(100);
      expect(hundred.n).toBeGreaterThanOrEqual(100);
      expect(hundred.n).toBeLessThanOrEqual(999);
      expect(hundred.answer).toBe(roundHalfUp(hundred.n, 100));

      const mix = makeAboutTask("mix", rngFromSeed(`about-mix-${i}`));
      expect([10, 100]).toContain(mix.place);
      expect(mix.n).toBeGreaterThanOrEqual(100);
      expect(mix.n).toBeLessThanOrEqual(999);
      expect(mix.answer).toBe(roundHalfUp(mix.n, mix.place));
      expect(mix.answer).toBeLessThanOrEqual(1000);
      expect(mix.story.length).toBeGreaterThan(0);
      expect(mix.speech).not.toContain("stickers");

      const question = makeAboutQuestion(rngFromSeed(`about-q-${i}`), "ten");
      expect(question.choices).toHaveLength(4);
      expect(question.choices).toContain(question.answer);
      expect(question.visual.kind === "scene" && question.visual.board.game === "about").toBe(true);
    }
  });

  it("shows the story number and builds the rounded value by tens or hundreds", () => {
    const task = makeAboutTask("ten", rngFromSeed("about-render"));
    const question = makeAboutQuestion(rngFromSeed("about-choice"), "hundred");
    const choice = renderToStaticMarkup(
      createElement(AboutChoices, { question, reveal: false, picked: null, onChoose: () => {} }),
    );
    expect(choice).toContain("ac-jump-read");
    if (question.visual.kind === "scene" && question.visual.board.game === "about") {
      expect(choice).toContain(String(question.visual.board.n));
    }
    expect(choice).not.toContain("Start over");

    const hands = renderToStaticMarkup(createElement(AboutHands, { task, onAnswer: () => {} }));
    expect(hands).toContain("+10");
    expect(hands).toContain("Start over");
    expect(hands).toContain("Done");
    expect(hands).toContain(String(aboutStart(task.n, task.place, task.answer)));
  });
});
