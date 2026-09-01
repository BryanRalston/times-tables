import { describe, expect, it } from "vitest";
import { UNITS } from "./curriculum";
import {
  COMMON_SQUISHEES,
  eligibleRares,
  pickPrize,
  RARE_SQUISHEES,
  squisheePokeSrc,
  unitAllThreeStars,
} from "./squishees";

const base = {
  earned: [] as string[],
  stars: 0,
  perfectWalks: 0,
  streak: 0,
  activities: {} as Record<string, { stars: number }>,
  kind: "daily" as const,
  pct: 1,
};

describe("rare squishees", () => {
  it("never randomly awards a rare", () => {
    for (let i = 0; i < 40; i++) {
      const id = pickPrize(base, `kid:${i}`);
      expect(id).toBeTruthy();
      expect(RARE_SQUISHEES.some((r) => r.id === id)).toBe(false);
    }
  });

  it("holds commons until 70%", () => {
    expect(pickPrize({ ...base, pct: 0.69 }, "kid")).toBeNull();
    expect(pickPrize({ ...base, pct: 0.7 }, "kid")).toBeTruthy();
  });

  it("unlocks rares only when the hidden bar is met", () => {
    expect(eligibleRares(base)).toEqual([]);
    expect(eligibleRares({ ...base, streak: 7 })).toEqual(["crystal-axolotl"]);
    expect(eligibleRares({ ...base, stars: 50 })).toEqual(["galaxy-narwhal"]);
    expect(eligibleRares({ ...base, perfectWalks: 10 })).toEqual(["rainbow-cupcake"]);
    expect(eligibleRares({ ...base, kind: "welcome", pct: 1 })).toEqual(["aurora-jelly"]);
    expect(eligibleRares({ ...base, kind: "welcome", pct: 0.9 })).toEqual([]);
    expect(eligibleRares({ ...base, earned: COMMON_SQUISHEES.map((s) => s.id) })).toEqual(["star-mochi"]);
  });

  it("unlocks the dragon on a fully starred unit", () => {
    const unit = UNITS[0]!;
    const activities = Object.fromEntries(unit.activities.map((a) => [a.id, { stars: 3 }]));
    expect(unitAllThreeStars(activities)).toBe(true);
    expect(eligibleRares({ ...base, activities })).toEqual(["golden-dragon"]);
  });

  it("prefers a newly eligible rare over a common", () => {
    expect(pickPrize({ ...base, streak: 7, pct: 1 }, "kid")).toBe("crystal-axolotl");
  });
});

describe("poke clips", () => {
  it("is only frog and cat", () => {
    expect(squisheePokeSrc("frog")).toMatch(/squishees\/frog-poke\.mp4$/);
    expect(squisheePokeSrc("cat")).toMatch(/squishees\/cat-poke\.mp4$/);
    expect(squisheePokeSrc("panda")).toBeNull();
    expect(squisheePokeSrc("peach")).toBeNull();
  });
});
