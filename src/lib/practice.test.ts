import { describe, expect, it } from "vitest";
import { activityById } from "./curriculum";
import { makeDailyWalk } from "./daily";
import {
  applyBests,
  bumpFact,
  emptyBests,
  emptyToday,
  formatAvgSeconds,
  holdMsFor,
  isHonestMs,
  leftoverKey,
  needsPracticeList,
  parseTimesKey,
  preferParams,
  recordToday,
  REVEAL_AFTER_MISSES,
  todayView,
  timesKey,
  weakKeys,
  weakness,
} from "./practice";
import { makeActivityRound, makeFluencyItem, welcomeFirst } from "./questions";
import { rngFromSeed } from "./rng";

describe("practice facts", () => {
  it("tags leftover 6 + n = 10 as friends:6", () => {
    expect(leftoverKey(6, 4, 10, false)).toBe("friends:6");
    expect(welcomeFirst(rngFromSeed(1)).factKey).toBe("friends:6");
    expect(parseTimesKey("7×8")).toEqual({ a: 7, b: 8 });
    expect(timesKey(8, 7)).toBe("7×8");
  });

  it("lists ×7 and leftover friends after repeated misses, not after one miss", () => {
    let facts = bumpFact({}, "7×8", false);
    expect(needsPracticeList(facts)).toEqual([]);
    facts = bumpFact(facts, "7×8", false);
    facts = bumpFact(facts, "7×8", false);
    facts = bumpFact(facts, "friends:6", false);
    facts = bumpFact(facts, "friends:6", false);
    const needs = needsPracticeList(facts);
    expect(needs).toEqual(expect.arrayContaining(["×7", "×8", "6 + n"]));
  });

  it("weights fluency toward a weak 7×8", () => {
    const facts = bumpFact(bumpFact(bumpFact({}, "7×8", false), "7×8", false), "7×8", false);
    const weak = weakKeys(facts);
    let hits = 0;
    for (let i = 0; i < 24; i++) {
      const q = makeFluencyItem(rngFromSeed(`fluency-weak:${i}`), [2, 3, 4, 5, 6, 7, 8, 9], weak);
      if (q.factKey === "7×8" || q.prompt.includes("7") && q.prompt.includes("8")) hits += 1;
    }
    expect(hits).toBeGreaterThan(8);
  });

  it("weights leftover rounds toward a weak friend", () => {
    const found = activityById("u1-leftover");
    expect(found).toBeTruthy();
    const facts = bumpFact(bumpFact({}, "friends:6", false), "friends:6", false);
    const rng = rngFromSeed("leftover-weak");
    const prefer = preferParams(found!.activity, facts, rngFromSeed("prefer"));
    expect(prefer).toEqual({ preferShown: 6 });
    const round = makeActivityRound(found!.activity, rng, 8, "en", facts);
    const six = round.filter((q) => q.factKey === "friends:6" || q.prompt.startsWith("6 + n"));
    expect(six.length).toBeGreaterThan(0);
  });

  it("puts shaky times facts on a daily walk more often", () => {
    let hits = 0;
    for (let i = 0; i < 12; i++) {
      const w = makeDailyWalk({
        date: "2026-09-15",
        learnerId: `kid-weak-${i}`,
        attempt: 1,
        shaky: { "7×8": 4 },
        facts: { "7×8": { ok: 1, miss: 6, ms: 0 } },
      });
      hits += w.items.filter((q) => q.factKey === "7×8").length;
    }
    expect(hits).toBeGreaterThan(4);
  });

  it("keeps honest averages and personal bests quiet", () => {
    expect(isHonestMs(200)).toBe(false);
    expect(isHonestMs(900)).toBe(true);
    expect(isHonestMs(40_000)).toBe(false);
    let today = emptyToday("2026-09-15");
    today = recordToday(today, "2026-09-15", true, 1200);
    today = recordToday(today, "2026-09-15", true, 1100);
    today = recordToday(today, "2026-09-15", false, 2000);
    today = recordToday(today, "2026-09-15", true, 1300);
    today = recordToday(today, "2026-09-15", true, 1400);
    today = recordToday(today, "2026-09-15", true, 1000);
    const view = todayView(today, "2026-09-15");
    expect(view.questions).toBe(6);
    expect(view.pct).toBeCloseTo(5 / 6);
    expect(view.avgMs).toBeGreaterThan(1000);
    const bests = applyBests(emptyBests(), { streak: 4, accuracy: 5 / 6, avgMs: view.avgMs ?? 0 });
    expect(bests.streak).toBe(4);
    expect(bests.accuracy).toBeCloseTo(5 / 6);
    expect(formatAvgSeconds(4200)).toBe("4.2");
    expect(REVEAL_AFTER_MISSES).toBe(2);
    expect(holdMsFor("fluency", 2000, false)).toBeLessThan(800);
    expect(holdMsFor("tenframe", 2000, false)).toBe(2000);
    expect(weakness({ ok: 1, miss: 4, ms: 0 })).toBeGreaterThan(weakness({ ok: 4, miss: 1, ms: 0 }));
  });
});
