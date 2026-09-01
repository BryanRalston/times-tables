import { describe, expect, it } from "vitest";
import { GRADE4_SOLS, GRADE4_UNITS, coversSol, suggestedUnitId, unitsFor } from "./curriculum";
import { makeDailyWalk } from "./daily";
import { makeQuestion } from "./questions";
import { migrateSave } from "./progress";
import { rngFromSeed } from "./rng";
import type { DecimalData, FracOpData, LinesData, PlaceValueData } from "./types";

describe("grade 4 path", () => {
  it("defaults pathGrade to 3 and leaves Grade 3 unit titles", () => {
    const next = migrateSave({ version: 6, classUnitId: "u1" });
    expect(next.pathGrade).toBe(3);
    expect(next.classUnitId).toBe("u1");
    expect(unitsFor(3)[0]?.title).toMatch(/Data Cycle/i);
    expect(unitsFor(3)).toHaveLength(13);
  });

  it("Advanced suggested unit is a g4 id, not u1", () => {
    expect(suggestedUnitId("2026-08-17", undefined, 4)).toMatch(/^g4-/);
    expect(suggestedUnitId("2026-08-17", undefined, 4)).not.toBe("u1");
    expect(unitsFor(4)[0]?.id).toBe("g4-u1");
  });

  it("clears a Grade 3 class unit when migrating to Grade 4", () => {
    const next = migrateSave({ version: 6, pathGrade: 4, classUnitId: "u9" });
    expect(next.pathGrade).toBe(4);
    expect(next.classUnitId).toBe("");
  });

  it("Grade 3 daily walk never includes 4. SOLs", () => {
    const w = makeDailyWalk({ date: "2026-09-15", learnerId: "g3", grade: 3 });
    expect(w.unit.id.startsWith("g4-")).toBe(false);
    for (const q of w.items) {
      for (const s of q.sol ?? []) {
        expect(s.startsWith("4.")).toBe(false);
      }
    }
  });

  it("covers Grade 4 SOLs", () => {
    for (const code of GRADE4_SOLS) {
      expect(coversSol(code, 4), code).toBe(true);
    }
    expect(GRADE4_UNITS.length).toBe(15);
  });

  it("Grade 4 place-value numbers are at least 1,000,000", () => {
    const place = GRADE4_UNITS[0]!.activities.find((a) => a.id === "g4-u1-place")!;
    const word = GRADE4_UNITS[0]!.activities.find((a) => a.id === "g4-u1-word")!;
    for (let i = 0; i < 20; i++) {
      const q = makeQuestion(place, rngFromSeed(`pv:${i}`));
      expect((q.data as PlaceValueData).number).toBeGreaterThanOrEqual(1_000_000);
      const w = makeQuestion(word, rngFromSeed(`pw:${i}`));
      expect((w.data as PlaceValueData).number).toBeGreaterThanOrEqual(1_000_000);
    }
  });

  it("Grade 4 fluency can include 11 and 12", () => {
    const facts = GRADE4_UNITS.flatMap((u) => u.activities).find((a) => a.id === "g4-u4-facts")!;
    const seen = new Set<number>();
    for (let i = 0; i < 80; i++) {
      const q = makeQuestion(facts, rngFromSeed(`fl:${i}`));
      const m = q.prompt.match(/(\d+)\s*[×÷]\s*(\d+)/);
      expect(m).toBeTruthy();
      seen.add(Number(m![1]));
      seen.add(Number(m![2]));
    }
    expect(seen.has(11) || seen.has(12)).toBe(true);
  });

  it("like-denom fraction sum matches the pieces", () => {
    const add = GRADE4_UNITS.flatMap((u) => u.activities).find((a) => a.id === "g4-u6-add")!;
    for (let i = 0; i < 25; i++) {
      const q = makeQuestion(add, rngFromSeed(`fa:${i}`));
      const d = q.data as FracOpData;
      expect(d.op).toBe("+");
      expect(d.den).toBeGreaterThan(1);
      expect(Number(q.answer.split("/")[0])).toBe(d.a + d.b);
      expect(q.answer).toBe(`${d.a + d.b}/${d.den}`);
    }
  });

  it("decimal tenths grid matches tenths", () => {
    const tenths = GRADE4_UNITS.flatMap((u) => u.activities).find((a) => a.id === "g4-u7-tenths")!;
    for (let i = 0; i < 20; i++) {
      const q = makeQuestion(tenths, rngFromSeed(`dt:${i}`));
      const d = q.data as DecimalData;
      expect(d.tenths).toBeGreaterThanOrEqual(1);
      expect(d.tenths).toBeLessThanOrEqual(9);
      expect(q.answer).toBe(`0.${d.tenths}`);
    }
  });

  it("angle/line answer is in choices", () => {
    for (const id of ["g4-u12-lines", "g4-u12-angles", "g4-u12-parallel"]) {
      const act = GRADE4_UNITS.flatMap((u) => u.activities).find((a) => a.id === id)!;
      for (let i = 0; i < 20; i++) {
        const q = makeQuestion(act, rngFromSeed(`${id}:${i}`));
        const d = q.data as LinesData;
        expect(q.choices ?? []).toContain(q.answer);
        expect(d.figure.length).toBeGreaterThan(0);
      }
    }
  });
});
