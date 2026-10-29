import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { ClockBoard } from "../ui/hands";
import { MinuteChoices, MinutePrompt } from "./minute";
import { makeMinuteQuestion, makeMinuteTask } from "./minute-data";

describe("time to the minute", () => {
  it("stays off the five-minute marks", () => {
    for (let i = 0; i < 40; i += 1) {
      const early = makeMinuteTask("early", rngFromSeed(`minute-early-${i}`));
      expect(early.snap).toBe(1);
      expect(early.minutes % 5).not.toBe(0);
      expect(early.minutes).toBeGreaterThanOrEqual(1);
      expect(early.minutes).toBeLessThanOrEqual(12);
      expect(early.skill).toBe("minute:early");

      const half = makeMinuteTask("half", rngFromSeed(`minute-half-${i}`));
      expect(half.minutes % 5).not.toBe(0);
      expect(half.minutes).toBeGreaterThanOrEqual(13);
      expect(half.minutes).toBeLessThanOrEqual(29);

      const all = makeMinuteTask("all", rngFromSeed(`minute-all-${i}`));
      expect(all.minutes % 5).not.toBe(0);
      expect(all.minutes).toBeGreaterThanOrEqual(1);
      expect(all.minutes).toBeLessThanOrEqual(59);

      const question = makeMinuteQuestion(rngFromSeed(`minute-q-${i}`), "all");
      expect(question.choices).toHaveLength(4);
      expect(question.choices).toContain(question.answer);
      expect(question.choices.some((choice) => choice.startsWith("no "))).toBe(false);
      expect(question.visual.kind === "scene" && question.visual.board.game === "minute").toBe(true);
    }
  });

  it("shows a paper clock and drags the hands one minute at a time", () => {
    const question = makeMinuteQuestion(rngFromSeed("minute-choice"), "early");
    const card = renderToStaticMarkup(
      createElement(MinutePrompt, { question, reveal: false, mascot: "kiwi", happy: false }),
    );
    expect(card).toContain("ac-clock");
    expect(card).toContain(question.answer);

    const choice = renderToStaticMarkup(
      createElement(MinuteChoices, { question, reveal: false, picked: null, onChoose: () => {} }),
    );
    expect(choice).toContain('dir="ltr"');
    expect(choice).toContain(question.answer);

    const task = makeMinuteTask("half", rngFromSeed("minute-hands"));
    const hands = renderToStaticMarkup(createElement(ClockBoard, { task, onAnswer: () => {} }));
    expect(hands).toContain('data-hands="clock"');
    expect(hands).toContain("ac-clock");
    expect(hands).toContain("Minute hand");
    expect(hands).toContain("Done");
  });
});
