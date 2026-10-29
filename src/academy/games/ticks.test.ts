import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { TickHands, TickLine } from "../ui/tick-board";
import { TickChoices } from "./ticks";
import { makeTickQuestion, makeTickTask, ticksMatch } from "./ticks-data";

describe("number line fractions", () => {
  it("keeps each level on its own denominators", () => {
    for (let i = 0; i < 30; i += 1) {
      const fourths = makeTickTask("fourths", rngFromSeed(`tick-4-${i}`));
      expect(fourths.whole).toBe(1);
      expect([2, 4]).toContain(fourths.den);
      expect(fourths.num).toBeGreaterThan(0);
      expect(fourths.num).toBeLessThan(fourths.den);
      expect(ticksMatch(fourths, fourths.num)).toBe(true);
      expect(ticksMatch(fourths, 0)).toBe(false);

      const sixths = makeTickTask("sixths", rngFromSeed(`tick-6-${i}`));
      expect([3, 6]).toContain(sixths.den);
      expect(sixths.num).toBeLessThan(sixths.den);

      const eighths = makeTickTask("eighths", rngFromSeed(`tick-8-${i}`));
      expect(eighths.den).toBe(8);
      expect(eighths.num).toBeLessThan(8);

      const past = makeTickTask("past", rngFromSeed(`tick-past-${i}`));
      expect(past.whole).toBe(2);
      expect(past.num).toBeGreaterThanOrEqual(past.den);
      expect(past.num).toBeLessThan(past.den * past.whole);

      const question = makeTickQuestion(rngFromSeed(`tick-q-${i}`), "eighths");
      expect(question.choices).toHaveLength(4);
      expect(question.choices).toContain(question.answer);
      expect(question.choices.some((choice) => choice.startsWith("no "))).toBe(false);
    }
  });

  it("labels only the wholes, and the hands card moves the dot", () => {
    const line = renderToStaticMarkup(createElement(TickLine, { whole: 1, den: 4, mark: 1 }));
    expect(line).toContain("ac-line");
    expect(line).toContain(">0<");
    expect(line).toContain(">1<");
    expect(line).not.toContain(">1/4<");
    expect(line).not.toContain(">2/4<");

    const question = makeTickQuestion(rngFromSeed("tick-choice"), "fourths");
    const choice = renderToStaticMarkup(
      createElement(TickChoices, { question, reveal: false, picked: null, onChoose: () => {} }),
    );
    expect(choice).toContain("ac-choice");
    expect(choice).toContain(question.answer);

    const task = makeTickTask("sixths", rngFromSeed("tick-hands"));
    const hands = renderToStaticMarkup(createElement(TickHands, { task, onAnswer: () => {} }));
    expect(hands).toContain("ac-line-dot");
    expect(hands).toContain("Start over");
    expect(hands).toContain("Done");
    expect(hands).toContain(task.answer);
  });
});
