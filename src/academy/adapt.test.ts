import { describe, expect, it } from "vitest";
import {
  clockMastery,
  easeFromRound,
  easeOf,
  easeSpan,
  freshMastery,
  gameHasMarks,
  moveLadder,
  noteMark,
  openingForRound,
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

  it("does not drop again when Play already saved the easier level", () => {
    expect(
      openingForRound({ savedIndex: 3, startIndex: 4, roundsPlayed: 0, boss: false, bounds: { min: 2, max: 5 } }),
    ).toBe(3);
    expect(
      openingForRound({ savedIndex: 4, startIndex: 4, roundsPlayed: 0, boss: false, bounds: { min: 2, max: 5 } }),
    ).toBe(3);
    expect(
      openingForRound({ savedIndex: 3, startIndex: 4, roundsPlayed: 1, boss: false, bounds: { min: 2, max: 5 } }),
    ).toBe(3);
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

  it("steps up after 8 clean answers and down after two misses of one idea", () => {
    let clock = freshMastery();
    for (let i = 0; i < 7; i++) {
      const step = clockMastery(clock, { ok: true, idea: "add:within10", assisted: false }, 8);
      clock = step.clock;
      expect(step.shift).toBe("stay");
    }
    const up = clockMastery(clock, { ok: true, idea: "add:within10", assisted: false }, 8);
    expect(up.shift).toBe("up");
    expect(up.clock.clean).toBe(8);

    let missed = freshMastery();
    const once = clockMastery(missed, { ok: false, idea: "quarterpast", assisted: true });
    expect(once.shift).toBe("stay");
    const twice = clockMastery(once.clock, { ok: false, idea: "quarterpast", assisted: true });
    expect(twice.shift).toBe("down");
    const other = clockMastery(once.clock, { ok: false, idea: "quarterto", assisted: true });
    expect(other.shift).toBe("stay");

    let mixed = freshMastery();
    for (let i = 0; i < 2; i++) mixed = clockMastery(mixed, { ok: false, idea: "a", assisted: true }).clock;
    for (let i = 0; i < 7; i++) mixed = clockMastery(mixed, { ok: true, idea: "b", assisted: false }).clock;
    const eightOfTen = clockMastery(mixed, { ok: true, idea: "b", assisted: false }, 8);
    expect(eightOfTen.clock.clean).toBe(8);
    expect(eightOfTen.clock.answered).toBe(10);
    expect(eightOfTen.shift).toBe("up");

    const hinted = clockMastery(freshMastery(), { ok: true, idea: "add:within5", assisted: true }, 8);
    expect(hinted.clock.clean).toBe(0);
    expect(hinted.shift).toBe("stay");

    let short = freshMastery();
    for (let i = 0; i < 4; i++) short = clockMastery(short, { ok: true, idea: "count", assisted: false }, 5).clock;
    expect(clockMastery(short, { ok: true, idea: "count", assisted: false }, 5).shift).toBe("up");
    expect(moveLadder(startLadder(1), 4, -1, { min: 0, max: 2 })).toEqual({ index: 0, streak: 0 });
    expect(moveLadder(startLadder(2), 4, 1, { min: 0, max: 2 })).toEqual({ index: 2, streak: 0 });
  });

  it("eases the numbers inside a level without leaving it", () => {
    expect(easeSpan(1, 20, "steady")).toEqual({ lo: 1, hi: 20 });
    expect(easeSpan(1, 20, "gentle")).toEqual({ lo: 1, hi: 10 });
    expect(easeSpan(1, 20, "firm")).toEqual({ lo: 11, hi: 20 });
    expect(easeSpan(5, 5, "firm")).toEqual({ lo: 5, hi: 5 });
    expect(easeOf(["doubles", "ease:gentle"])).toBe("gentle");
    expect(easeOf(["ease:firm"])).toBe("firm");
    expect(easeOf([])).toBe("steady");
    expect(easeFromRound({ combo: 0, missed: true })).toBe("gentle");
    expect(easeFromRound({ combo: 2, missed: true })).toBe("steady");
    expect(easeFromRound({ combo: 4, missed: false })).toBe("firm");
    expect(gameHasMarks({ "add:within5": { ok: 1, miss: 0 } }, "add")).toBe(true);
    expect(gameHasMarks({ "add:within5": { ok: 0, miss: 0 } }, "add")).toBe(false);
    expect(gameHasMarks({ "count:objects": { ok: 2, miss: 0 } }, "add")).toBe(false);
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
