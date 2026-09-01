import { describe, expect, it } from "vitest";
import { SCHOOL_DAYS, isSchoolDay, prevSchoolDay, weekdayName } from "./calendar";
import { UNITS, WELCOME_ACTIVITY, suggestedUnitId, unitById } from "./curriculum";
import { makeDailyWalk } from "./daily";
import { parseHash } from "./nav";
import { makeQuestion, makeWelcomeRound, welcomeFirst } from "./questions";
import { rngFromSeed } from "./rng";
import { schoolStreak } from "./streak";
import { answersMatch } from "./utils";

describe("calendar", () => {
  it("has 180 school days", () => {
    expect(SCHOOL_DAYS).toHaveLength(180);
    expect(SCHOOL_DAYS[0]).toBe("2026-08-17");
    expect(SCHOOL_DAYS[179]).toBe("2027-06-11");
  });

  it("skips weekends and holidays", () => {
    expect(isSchoolDay("2026-09-05")).toBe(false);
    expect(isSchoolDay("2026-09-07")).toBe(false);
    expect(isSchoolDay("2026-09-08")).toBe(true);
  });

  it("walks school days backward", () => {
    expect(prevSchoolDay(SCHOOL_DAYS[0]!)).toBeNull();
    expect(prevSchoolDay(SCHOOL_DAYS[1]!)).toBe(SCHOOL_DAYS[0]);
  });
});

describe("curriculum", () => {
  it("opens unit 1 before the year and follows the calendar", () => {
    expect(suggestedUnitId("2026-08-01")).toBe("u1");
    expect(suggestedUnitId("2026-08-17")).toBe("u1");
    expect(unitById(suggestedUnitId("2026-12-01"))?.quarter).toBe(2);
  });

  it("does not jump to the last unit on a Saturday", () => {
    expect(suggestedUnitId("2026-09-19")).toBe(suggestedUnitId("2026-09-18"));
  });

  it("class unit wins", () => {
    expect(suggestedUnitId("2026-08-17", "u9")).toBe("u9");
  });
});

describe("welcome leftover", () => {
  it("starts on 6 + n = 10", () => {
    const q = welcomeFirst(rngFromSeed(1));
    expect(q.prompt).toBe("6 + n = 10");
    expect(q.answer).toBe("4");
    expect(q.kind).toBe("tenframe");
  });

  it("is a short leftover run", () => {
    const round = makeWelcomeRound(rngFromSeed(7));
    expect(round).toHaveLength(4);
    expect(round[0]?.prompt).toBe("6 + n = 10");
    expect(WELCOME_ACTIVITY.rounds).toBe(4);
  });
});

describe("daily walk", () => {
  it("weekday is 8–12 current plus 3–5 review", () => {
    const w = makeDailyWalk({ date: "2026-09-15" });
    expect(weekdayName("2026-09-15")).toBe("Tuesday");
    expect(w.isSchoolDay).toBe(true);
    expect(w.isFriday).toBe(false);
    const fresh = w.items.filter((q) => q.source === "fresh").length;
    const review = w.items.filter((q) => q.source === "review").length;
    const fluency = w.items.filter((q) => q.source === "fluency").length;
    expect(fresh + fluency).toBeGreaterThanOrEqual(8);
    expect(fresh + fluency).toBeLessThanOrEqual(12);
    expect(review).toBeGreaterThanOrEqual(3);
    expect(review).toBeLessThanOrEqual(5);
    expect(fluency).toBe(2);
    expect(w.fresh).toBe(fresh);
    expect(w.review).toBe(review);
  });

  it("every activity can mint a question", () => {
    const rng = rngFromSeed(42);
    for (const unit of UNITS) {
      for (const activity of unit.activities) {
        const q = makeQuestion(activity, rng);
        expect(q.answer.length).toBeGreaterThan(0);
        expect(q.prompt.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("answers", () => {
  it("matches leftover, money, and time", () => {
    expect(answersMatch("4", "4")).toBe(true);
    expect(answersMatch("4/8", "4/8", ["4"])).toBe(true);
    expect(answersMatch("4", "4/8", ["4"])).toBe(true);
    expect(answersMatch("5", "4")).toBe(false);
    expect(answersMatch("$1.00", "100", ["$1.00"])).toBe(true);
    expect(answersMatch("3:05", "3:5")).toBe(true);
  });
});

describe("streak", () => {
  it("counts consecutive completed school days and ignores an unfinished today", () => {
    const sessions = {
      "2026-09-14": {
        date: "2026-09-14",
        unitId: "u1",
        schoolDay: 1,
        correct: 8,
        total: 12,
        fresh: 8,
        review: 4,
        completed: true,
      },
    };
    expect(schoolStreak(sessions, "2026-09-15")).toBe(1);
    expect(schoolStreak({}, "2026-09-15")).toBe(0);
  });
});

describe("nav", () => {
  it("parses hash routes", () => {
    expect(parseHash("")).toEqual({ id: "home" });
    expect(parseHash("#/play/welcome")).toEqual({ id: "play", kind: "welcome" });
    expect(parseHash("#/play/daily")).toEqual({ id: "play", kind: "daily" });
    expect(parseHash("#/play/activity/u3-groups")).toEqual({ id: "play", kind: "activity", activityId: "u3-groups" });
    expect(parseHash("#/unit/u2")).toEqual({ id: "unit", unitId: "u2" });
    expect(parseHash("#/grownup")).toEqual({ id: "grownup" });
  });
});
