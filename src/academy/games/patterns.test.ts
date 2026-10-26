import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { PatternBench } from "../ui/pattern-board";
import { makePatternQuestion, makePatternTask, patternMatches, ruleLabel } from "./patterns-data";

describe("number patterns", () => {
  it("extends skip counts and names the rule", () => {
    for (let i = 0; i < 24; i += 1) {
      const tens = makePatternTask("tens", rngFromSeed(`pat-tens-${i}`));
      expect(tens.step).toBe(10);
      expect(tens.answer).toBe((tens.terms[2] ?? 0) + 10);
      expect(tens.answer).toBeLessThanOrEqual(100);
      expect(patternMatches(tens, tens.answer)).toBe(true);

      const hundreds = makePatternTask("hundreds", rngFromSeed(`pat-h-${i}`));
      expect(hundreds.step).toBe(100);
      expect(hundreds.answer).toBeLessThanOrEqual(1000);

      const rule = makePatternTask("rule", rngFromSeed(`pat-rule-${i}`));
      expect([2, 3, 4, 5, 10]).toContain(rule.step);
      expect(rule.answer).toBeLessThanOrEqual(60);

      const grow = makePatternTask("grow", rngFromSeed(`pat-grow-${i}`));
      expect(grow.answer).toBe(grow.step);
      expect(grow.terms).toHaveLength(4);
      const question = makePatternQuestion(rngFromSeed(`pat-q-${i}`), "grow");
      const step = Number(question.factKey.split(":").at(-1));
      expect(question.answer).toBe(ruleLabel(step));
      expect(question.choices).toHaveLength(4);
      expect(question.choices).toContain(question.answer);
    }
  });

  it("lets the choice card answer with the buttons under the row", () => {
    const tens = makePatternTask("tens", rngFromSeed("pat-bench"));
    const choice = renderToStaticMarkup(
      createElement(PatternBench, { task: tens, locked: false, picked: null, onPick: () => {}, tiles: false }),
    );
    expect(choice).toContain("ac-pattern-row");
    expect(choice).not.toContain("ac-num-tiles");
    expect(choice).not.toContain("Put a number on the blank.");

    const hands = renderToStaticMarkup(
      createElement(PatternBench, { task: tens, locked: false, picked: null, onPick: () => {} }),
    );
    expect(hands).toContain("ac-num-tiles");

    const grow = makePatternTask("grow", rngFromSeed("pat-grow-bench"));
    const rule = renderToStaticMarkup(
      createElement(PatternBench, { task: grow, locked: false, picked: null, onPick: () => {}, tiles: false }),
    );
    expect(rule).not.toContain("is-blank");
    expect(rule).not.toContain("ac-num-tiles");
  });
});
