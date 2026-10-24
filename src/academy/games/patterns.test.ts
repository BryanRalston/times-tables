import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
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
});
