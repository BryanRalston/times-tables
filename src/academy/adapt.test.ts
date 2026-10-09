import { describe, expect, it } from "vitest";
import {
  noteMark,
  openingIndex,
  pickServeIndex,
  servePlan,
  skillHeat,
  startLadder,
  stepLadder,
} from "./adapt";
import { DEFAULT_START_GRADE } from "./model";

describe("adaptive ladder", () => {
  it("steps up after three clean corrects and down after a miss", () => {
    let ladder = startLadder(0);
    ladder = stepLadder(ladder, 4, true);
    ladder = stepLadder(ladder, 4, true);
    expect(ladder).toEqual({ index: 0, streak: 2 });
    ladder = stepLadder(ladder, 4, true);
    expect(ladder).toEqual({ index: 1, streak: 0 });
    ladder = stepLadder(ladder, 4, false);
    expect(ladder).toEqual({ index: 0, streak: 0 });
    expect(stepLadder(startLadder(0), 4, false)).toEqual({ index: 0, streak: 0 });
    expect(stepLadder({ index: 3, streak: 2 }, 4, true)).toEqual({ index: 3, streak: 3 });
  });

  it("starts a new kid one level easier, then holds the grade level", () => {
    expect(openingIndex(2, 0, false)).toBe(1);
    expect(openingIndex(0, 0, false)).toBe(0);
    expect(openingIndex(2, 1, false)).toBe(2);
    expect(openingIndex(2, 0, true)).toBe(2);
  });

  it("defaults the grade picker to grade 1", () => {
    expect(DEFAULT_START_GRADE).toBe("1");
  });
});

describe("mastery mix", () => {
  const heats = ["mastered", "learning", "new", "new"] as const;

  it("reviews the rustiest lower skill about one time in five", () => {
    expect(pickServeIndex({ ladderIndex: 2, levelCount: 4, heats, roll: 0.1 })).toEqual({
      index: 1,
      reason: "review",
    });
    expect(pickServeIndex({ ladderIndex: 0, levelCount: 4, heats: ["learning", "new", "new", "new"], roll: 0.1 })).toEqual({
      index: 0,
      reason: "stay",
    });
  });

  it("stretches a mastered skill and otherwise stays on the ladder", () => {
    expect(pickServeIndex({ ladderIndex: 0, levelCount: 4, heats, roll: 0.4 })).toEqual({
      index: 1,
      reason: "stretch",
    });
    expect(pickServeIndex({ ladderIndex: 1, levelCount: 4, heats, roll: 0.5 })).toEqual({
      index: 1,
      reason: "stay",
    });
    expect(pickServeIndex({ ladderIndex: 0, levelCount: 4, heats, roll: 0.9 })).toEqual({
      index: 0,
      reason: "stay",
    });
  });

  it("plans a round that steps up, then mixes a review", () => {
    const plan = servePlan({
      startIndex: 0,
      levelCount: 4,
      heats: ["learning", "learning", "new", "new"],
      outcomes: [true, true, true],
      rolls: [0.5, 0.5, 0.5, 0.1],
    });
    expect(plan.map((row) => row.index)).toEqual([0, 0, 0, 0]);
    expect(plan[2]?.reason).toBe("stay");
    expect(plan[3]?.reason).toBe("review");
  });

  it("treats five strong tries as mastered and records one outcome per mark", () => {
    expect(skillHeat(undefined)).toBe("new");
    expect(skillHeat({ ok: 4, miss: 0 })).toBe("learning");
    expect(skillHeat({ ok: 4, miss: 1 })).toBe("mastered");
    const skills: Record<string, { ok: number; miss: number }> = {};
    noteMark(skills, { skill: "add:within5", tags: ["doubles"], ok: false, unscored: true });
    noteMark(skills, { skill: "add:within5", tags: ["doubles"], ok: true, taught: true });
    expect(skills["add:within5"]).toEqual({ ok: 1, miss: 1 });
    expect(skills.doubles).toEqual({ ok: 1, miss: 1 });
    noteMark(skills, { skill: "add:within5", tags: [], factKey: "2×3", ok: false });
    expect(skills["add:within5"]).toEqual({ ok: 1, miss: 2 });
    expect(skills["fact:2×3"]).toEqual({ ok: 0, miss: 1 });
  });
});
