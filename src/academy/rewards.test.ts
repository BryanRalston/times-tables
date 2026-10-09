import { describe, expect, it } from "vitest";
import { SQUAD_IDS, weekDates, type Child, type RoundResult } from "./model";
import { blankChild } from "./storage";
import {
  acknowledgeUnlocks,
  applyRound,
  formatMinutes,
  giftCount,
  isMastered,
  masteredChips,
  newestUnlock,
  nextStreak,
  practiceTip,
  skillBars,
  starsForRound,
  starsNeeded,
  unlockedCount,
  weakTimesFacts,
} from "./rewards";

function child(partial: Partial<Child> = {}): Child {
  return { ...blankChild({ id: "kid", name: "Maya", grade: "3" }), ...partial };
}

function round(partial: Partial<RoundResult> = {}): RoundResult {
  return {
    game: "times",
    correct: 10,
    total: 10,
    seconds: 80,
    answers: [
      { skill: "times:toTen", tags: ["table:7", "table:8"], factKey: "7×8", ok: false },
      { skill: "times:toTen", tags: ["table:6", "table:7"], factKey: "6×7", ok: false },
      { skill: "times:toTen", tags: ["table:2"], factKey: "2×5", ok: true },
    ],
    ...partial,
  };
}

describe("stars, streak, and unlocks", () => {
  it("gives 1, 2, or 3 stars and always keeps a star for finishing", () => {
    expect(starsForRound(0)).toBe(1);
    expect(starsForRound(5)).toBe(1);
    expect(starsForRound(6)).toBe(2);
    expect(starsForRound(8)).toBe(2);
    expect(starsForRound(9)).toBe(3);
    expect(starsForRound(10)).toBe(3);
  });

  it("counts a daily streak and resets when a day is skipped", () => {
    expect(nextStreak({ count: 0, lastPlayed: null }, "2026-10-09")).toEqual({ count: 1, lastPlayed: "2026-10-09" });
    expect(nextStreak({ count: 4, lastPlayed: "2026-10-09" }, "2026-10-09")).toEqual({
      count: 4,
      lastPlayed: "2026-10-09",
    });
    expect(nextStreak({ count: 4, lastPlayed: "2026-10-08" }, "2026-10-09")).toEqual({
      count: 5,
      lastPlayed: "2026-10-09",
    });
    expect(nextStreak({ count: 4, lastPlayed: "2026-10-07" }, "2026-10-09")).toEqual({
      count: 1,
      lastPlayed: "2026-10-09",
    });
  });

  it("unlocks the fourth squishee at 6 stars and ten of the squad by 128", () => {
    expect(starsNeeded(0)).toBe(0);
    expect(starsNeeded(2)).toBe(0);
    expect(starsNeeded(3)).toBe(6);
    expect(unlockedCount(0)).toBe(3);
    expect(unlockedCount(5)).toBe(3);
    expect(unlockedCount(6)).toBe(4);
    expect(unlockedCount(128)).toBe(10);
    expect(newestUnlock(5, 6)).toBe(SQUAD_IDS[3]);
    expect(newestUnlock(6, 8)).toBeNull();
    expect(SQUAD_IDS).toHaveLength(24);
  });

  it("banks stars, streak, minutes, and skill marks when a round ends", () => {
    const today = "2026-10-09";
    expect(weekDates(today)).toEqual([
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
      "2026-10-11",
    ]);
    const next = applyRound(child(), round({ correct: 9, seconds: 95 }), today);
    expect(next.stars).toBe(3);
    expect(next.streak).toBe(1);
    expect(next.lastPlayed).toBe(today);
    expect(next.bestStars.times).toBe(3);
    expect(next.rounds).toBe(1);
    expect(next.secondsByDay[today]).toBe(95);
    expect(next.skills["fact:7×8"]).toEqual({ ok: 0, miss: 1 });
    expect(next.skills["table:2"]).toEqual({ ok: 1, miss: 0 });
    const again = applyRound(next, round({ correct: 6, seconds: 40 }), "2026-10-10");
    expect(again.streak).toBe(2);
    expect(again.stars).toBe(5);
    expect(formatMinutes(again.secondsByDay["2026-10-09"]! + again.secondsByDay["2026-10-10"]!)).toBe("2.3m");
  });

  it("treats a skill as mastered at 80% after five tries and names weak facts", () => {
    expect(isMastered({ ok: 4, miss: 0 })).toBe(false);
    expect(isMastered({ ok: 4, miss: 1 })).toBe(true);
    expect(isMastered({ ok: 3, miss: 2 })).toBe(false);
    const skills = {
      "table:2": { ok: 5, miss: 0 },
      doubles: { ok: 4, miss: 1 },
      "fact:7×8": { ok: 0, miss: 3 },
      "fact:6×7": { ok: 1, miss: 2 },
      "fact:2×5": { ok: 5, miss: 0 },
      "add:within20": { ok: 8, miss: 2 },
    };
    expect(masteredChips(skills)).toContain("×2");
    expect(masteredChips(skills)).toContain("Doubles");
    expect(masteredChips(skills)).toContain("Within 20");
    expect(weakTimesFacts(skills).slice(0, 2)).toEqual(["7×8", "6×7"]);
    expect(practiceTip("Maya", skills).text).toBe(
      "Maya keeps missing 7×8 and 6×7. Try the free times tables worksheet tonight.",
    );
    expect(practiceTip("Maya", skills).factor).toBe(7);
    const bars = skillBars(skills);
    expect(bars.some((row) => row.key === "add:within20" && row.pct === 80)).toBe(true);
    expect(bars.find((row) => row.key === "table:2")?.pct).toBe(100);
  });

  it("counts unopened unlocks as gifts until the child meets them", () => {
    const earned = child({ stars: 6, opened: 3 });
    expect(giftCount(earned)).toBe(1);
    expect(giftCount(acknowledgeUnlocks(earned))).toBe(0);
    expect(giftCount(child({ stars: 0, opened: 3 }))).toBe(0);
  });
});
