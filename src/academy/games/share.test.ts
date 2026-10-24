import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { makeShareQuestion, makeShareTask, shareAnswer, shareMatches } from "./share-data";

describe("fair shares", () => {
  it("deals equal plates, groups, facts, and leftovers", () => {
    for (let i = 0; i < 30; i += 1) {
      const pairs = makeShareTask("pairs", rngFromSeed(`share-pairs-${i}`));
      expect(pairs.plates).toBe(2);
      expect([2, 4, 6]).toContain(pairs.total);
      expect(shareAnswer(pairs)).toBe(pairs.each);
      expect(shareMatches(pairs, [pairs.each, pairs.each], 0)).toBe(true);

      const fair = makeShareTask("fair", rngFromSeed(`share-fair-${i}`));
      expect(fair.total % fair.plates).toBe(0);
      expect(fair.total).toBeLessThanOrEqual(12);

      const groups = makeShareTask("groups", rngFromSeed(`share-groups-${i}`));
      expect(groups.total).toBe(groups.plates * groups.each);
      expect(shareAnswer(groups)).toBe(groups.plates);
      expect(groups.total).toBeLessThanOrEqual(20);

      const facts = makeShareTask("facts", rngFromSeed(`share-facts-${i}`));
      expect(facts.total).toBe(facts.plates * facts.each);
      expect(facts.total).toBeLessThanOrEqual(18);
      expect(shareAnswer(facts)).toBe(facts.each);

      const left = makeShareTask("left", rngFromSeed(`share-left-${i}`));
      expect(left.leftover).toBeGreaterThanOrEqual(1);
      expect(left.leftover).toBeLessThan(left.plates);
      expect(shareAnswer(left)).toBe(left.leftover);
      expect(shareMatches(left, Array.from({ length: left.plates }, () => left.each), left.leftover)).toBe(true);

      const question = makeShareQuestion(rngFromSeed(`share-q-${i}`), "facts");
      expect(question.choices).toHaveLength(4);
      expect(question.choices).toContain(question.answer);
      expect(question.answer.startsWith("no ")).toBe(false);
    }
  });
});
