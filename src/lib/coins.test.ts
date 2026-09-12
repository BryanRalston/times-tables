import { describe, expect, it } from "vitest";
import { applyBuy, canAffordAnything, coinsForResult, COMMON_PRICE, MISSING_ADDEND_PRICE, RARE_PRICE, squisheePrice } from "./coins";
import { COMMON_SQUISHEES } from "./squishees";
import { migrateSave } from "./progress";
import type { LearnerSlice } from "./types";

describe("coinsForResult", () => {
  it("matches the locked payouts", () => {
    expect(coinsForResult(4, 4)).toBe(12);
    expect(MISSING_ADDEND_PRICE).toBe(12);
    expect(coinsForResult(4, 4)).toBe(MISSING_ADDEND_PRICE);
    expect(coinsForResult(10, 10)).toBe(18);
    expect(coinsForResult(7, 10)).toBe(13);
    expect(coinsForResult(4, 10)).toBe(9);
  });
});

describe("buySquishee", () => {
  it("buys a common when they can pay", () => {
    const r = applyBuy(10, [], "frog");
    expect(r.ok).toBe(true);
    expect(r.reason).toBe("ok");
    expect(r.coins).toBe(0);
    expect(r.squishees).toEqual(["frog"]);
    expect(squisheePrice("frog")).toBe(COMMON_PRICE);
  });

  it("refuses when too poor and does not go negative", () => {
    const r = applyBuy(9, [], "frog");
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("poor");
    expect(r.coins).toBe(9);
    expect(r.squishees).toEqual([]);
  });

  it("refuses already owned", () => {
    const r = applyBuy(100, ["frog"], "frog");
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("owned");
    expect(r.coins).toBe(100);
  });

  it("never sells rares for coins", () => {
    expect(squisheePrice("aurora-jelly")).toBe(RARE_PRICE);
    expect(squisheePrice("sleepy-moon")).toBe(RARE_PRICE);
    expect(squisheePrice("blush-cloud")).toBe(RARE_PRICE);
    expect(applyBuy(50, [], "aurora-jelly")).toEqual({
      ok: false,
      reason: "find",
      coins: 50,
      squishees: [],
    });
    expect(applyBuy(100, [], "crystal-axolotl").reason).toBe("find");
  });

  it("knows when the shop has something they can buy", () => {
    expect(canAffordAnything(10, [])).toBe(true);
    expect(canAffordAnything(9, [])).toBe(false);
    expect(canAffordAnything(50, ["frog"])).toBe(true);
    expect(canAffordAnything(50, COMMON_SQUISHEES.map((s) => s.id))).toBe(false);
  });
});

describe("migrate", () => {
  it("keeps old squishees and defaults coins to 0", () => {
    const next = migrateSave({
      version: 5,
      squishees: ["frog", "cat"],
      stars: 12,
      learners: {
        "kid-1": {
          name: "Ada",
          stars: 12,
          seenWelcome: true,
          activities: {},
          badges: [],
          shaky: {},
          sessions: {},
          squishees: ["frog", "cat"],
          attempts: {},
          perfectWalks: 2,
        } as unknown as LearnerSlice,
      },
    });
    expect(next.squishees).toEqual(["frog", "cat"]);
    expect(next.coins).toBe(0);
    expect(next.version).toBe(16);
    expect(next.claimedPresentPads).toEqual([]);
    expect(next.avatarId).toBe("cat");
    expect(next.ownedCosmetics).toEqual([]);
    expect(next.pathHopSpent).toBe(0);
    expect(next.pathNowSeen).toBe(0);
    expect(next.pathGrade).toBe(3);
    expect(next.learners["kid-1"]?.squishees).toEqual(["frog", "cat"]);
    expect(next.learners["kid-1"]?.coins).toBe(0);
  });
});
