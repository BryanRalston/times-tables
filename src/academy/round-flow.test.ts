import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { clockMatches, dragClock, makeClockTask, makePayTask, payMatches, stepClock } from "./hands";
import { emptyPile } from "./games/money-model";
import { handsOnSlots, planReturn, scheduleMiss, similarSlot, weekStickers, type RoundSlot } from "./round-flow";

describe("hands-on cards", () => {
  it("puts at least three hands-on cards in a round of ten", () => {
    const slots = handsOnSlots(10);
    expect(slots.length).toBeGreaterThanOrEqual(3);
    expect(slots.every((slot) => slot >= 0 && slot < 10)).toBe(true);
    expect(new Set(slots).size).toBe(slots.length);
  });

  it("drags the hour hand to 3 and the minute hand to 6", () => {
    const hour = dragClock({ dx: 80, dy: 0, radius: 100, snap: 60, hours: 12, minutes: 0 });
    expect(hour).toEqual({ hours: 3, minutes: 0 });
    const half = dragClock({ dx: 0, dy: 80, radius: 100, snap: 30, hours: 3, minutes: 0 });
    expect(half.minutes).toBe(30);
    expect(half.hours).toBe(3);
  });

  it("steps an o'clock clock by hours", () => {
    expect(stepClock(3, 0, 60, 1, "hour")).toEqual({ hours: 4, minutes: 0 });
    expect(stepClock(12, 0, 60, 1, "hour")).toEqual({ hours: 1, minutes: 0 });
  });

  it("matches a clock and a pile of coins", () => {
    expect(clockMatches({ hours: 3, minutes: 0 }, 3, 0)).toBe(true);
    expect(clockMatches({ hours: 3, minutes: 0 }, 4, 0)).toBe(false);
    const pile = emptyPile();
    pile.quarter = 1;
    expect(payMatches(25, pile)).toBe(true);
    expect(payMatches(10, pile)).toBe(false);
  });

  it("builds a different clock and a payable coin pile", () => {
    const rng = rngFromSeed("hands");
    const clock = makeClockTask("hour", rng);
    const again = makeClockTask("hour", rng, clock.factKey);
    expect(clock.snap).toBe(60);
    expect(clock.minutes).toBe(0);
    expect(again.factKey).not.toBe(clock.factKey);
    const pay = makePayTask("count", rng);
    expect(pay.bank.length).toBeGreaterThan(0);
    expect(pay.speech.toLowerCase()).toContain("pay");
    const other = makePayTask("count", rng, pay.factKey);
    expect(other.factKey).not.toBe(pay.factKey);
  });
});

describe("a miss comes back before card 10", () => {
  it("schedules the fact on a later card and keeps hands-on slots", () => {
    const hands = handsOnSlots(10);
    expect(planReturn(0, 10, [], hands)).toBeGreaterThanOrEqual(1);
    expect(planReturn(0, 10, [], hands)).toBeLessThan(10);
    expect(hands.includes(planReturn(0, 10, [], hands))).toBe(false);
    expect(planReturn(8, 10, [], hands)).toBe(9);
    expect(planReturn(9, 10, [], [])).toBe(9);
  });

  it("still finds a slot when several facts are waiting", () => {
    let plan = { returns: {}, replay: false };
    plan = scheduleMiss(0, "3+2", 10, plan, handsOnSlots(10));
    plan = scheduleMiss(1, "4+1", 10, plan, handsOnSlots(10));
    const indexes = Object.keys(plan.returns).map(Number);
    expect(indexes.every((index) => index > 1 && index < 10)).toBe(true);
    expect(new Set(indexes).size).toBe(indexes.length);
    expect(plan.returns[indexes[0]!]).toBeTruthy();
  });

  it("retries a similar card, not the same fact", () => {
    const rng = rngFromSeed("similar");
    const slot: RoundSlot = makeClockTask("half", rng);
    const next = similarSlot("time", slot, rng);
    expect(next.kind).toBe("clock");
    if (next.kind === "clock" && slot.kind === "clock") expect(next.factKey).not.toBe(slot.factKey);
  });
});

describe("weekly stickers", () => {
  it("marks played days and never calls a quiet day broken", () => {
    const days = weekStickers({ "2026-10-05": 40 }, "2026-10-09");
    expect(days).toHaveLength(7);
    expect(days.filter((day) => day.played)).toHaveLength(1);
    expect(days.some((day) => day.today)).toBe(true);
    const text = JSON.stringify(days).toLowerCase();
    expect(text).not.toContain("broken");
    expect(text).not.toContain("streak");
  });
});
