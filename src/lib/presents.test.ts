import { describe, expect, it } from "vitest";
import { applyBuy } from "./coins";
import { adjacentPadIds, isPortalPad, RADIAL_PAD_COUNT, START_PAD } from "./radial-web";
import { RARE_SQUISHEES, squisheeById } from "./squishees";
import {
  GRADE3_PRESENTS,
  PRESENT_COIN_AMOUNT,
  applyPresentClaim,
  applyUnlock,
  foundPresentPads,
  grade3PresentCommons,
  grade3PresentRares,
  heldRares,
  isPresentPad,
  landPresent,
  parseClaimedPresentPads,
  presentSquisheeAt,
  visiblePresentPads,
  webOpenAroundPresents,
} from "./presents";

describe("Grade 3 mystery presents", () => {
  it("pins mixed fixed loot on hoppable, non-portal, non-start pads", () => {
    const pads = new Set<number>();
    const rares = new Set<string>();
    const commons = new Set<string>();
    let coins = 0;
    for (const spot of GRADE3_PRESENTS) {
      expect(spot.pad).toBeGreaterThan(START_PAD);
      expect(spot.pad).toBeLessThanOrEqual(RADIAL_PAD_COUNT);
      expect(isPortalPad(spot.pad)).toBe(false);
      expect(isPresentPad(spot.pad)).toBe(true);
      expect(adjacentPadIds(spot.pad).length).toBeGreaterThan(0);
      expect(pads.has(spot.pad)).toBe(false);
      pads.add(spot.pad);
      if (spot.kind === "coins") {
        expect(spot.amount).toBe(PRESENT_COIN_AMOUNT);
        expect(spot.amount).toBe(10);
        coins += 1;
        continue;
      }
      const s = squisheeById(spot.squisheeId);
      expect(s).toBeTruthy();
      expect(spot.squisheeId).not.toBe("peach");
      if (s?.rarity === "rare") {
        expect(rares.has(spot.squisheeId)).toBe(false);
        rares.add(spot.squisheeId);
      } else {
        expect(s?.rarity).toBe("common");
        expect(commons.has(spot.squisheeId)).toBe(false);
        commons.add(spot.squisheeId);
      }
    }
    expect(GRADE3_PRESENTS.length).toBeGreaterThanOrEqual(7);
    expect(rares.size).toBeGreaterThanOrEqual(2);
    expect(rares.size).toBeLessThanOrEqual(3);
    expect(commons.size).toBeGreaterThanOrEqual(2);
    expect(commons.size).toBeLessThanOrEqual(3);
    expect(coins).toBeGreaterThanOrEqual(2);
    expect(presentSquisheeAt(START_PAD)).toBeUndefined();
    expect(grade3PresentRares()).toHaveLength(rares.size);
    expect(grade3PresentCommons()).toEqual([...commons]);
    expect(heldRares()).toContain("rainbow-cupcake");
    expect(heldRares().length + grade3PresentRares().length).toBe(RARE_SQUISHEES.length);
  });

  it("does not gate the radial web behind a present", () => {
    expect(webOpenAroundPresents()).toBe(true);
  });

  it("does not stack two boxes on adjacent pads", () => {
    for (const a of GRADE3_PRESENTS) {
      for (const b of GRADE3_PRESENTS) {
        if (a.pad === b.pad) continue;
        expect(adjacentPadIds(a.pad)).not.toContain(b.pad);
      }
    }
  });

  it("keeps the same pad on the same reward every visit", () => {
    expect(landPresent(12, [])).toEqual(landPresent(12, []));
    expect(presentSquisheeAt(12)).toBe("crystal-axolotl");
    expect(presentSquisheeAt(17)).toBe("galaxy-narwhal");
    expect(presentSquisheeAt(21)).toBe("golden-dragon");
    expect(presentSquisheeAt(25)).toBe("capybara");
    expect(presentSquisheeAt(32)).toBe("boba");
    expect(presentSquisheeAt(49)).toBe("axolotl");
    expect(landPresent(37, [])).toEqual({ pad: 37, kind: "coins", amount: 10 });
    expect(landPresent(41, [])).toEqual({ pad: 41, kind: "coins", amount: 10 });
    expect(GRADE3_PRESENTS).toEqual(GRADE3_PRESENTS.slice());
  });

  it("keeps unfound boxes anonymous and drops them once claimed", () => {
    const all = GRADE3_PRESENTS.map((p) => p.pad);
    expect(visiblePresentPads([])).toEqual(all);
    expect(foundPresentPads([])).toEqual([]);
    expect(presentSquisheeAt(12)).toBe("crystal-axolotl");
    expect(landPresent(12, [])).toMatchObject({ kind: "squishee", squisheeId: "crystal-axolotl" });
    expect(landPresent(12, ["crystal-axolotl"])).toBeUndefined();
    expect(landPresent(START_PAD, [])).toBeUndefined();
    expect(visiblePresentPads(["crystal-axolotl", "peach"])).toEqual(all.filter((p) => p !== 12));
    expect(foundPresentPads(["crystal-axolotl", "peach"])).toEqual([12]);
    expect(visiblePresentPads([], [37, 41])).toEqual(all.filter((p) => p !== 37 && p !== 41));
    expect(foundPresentPads([])).toEqual([]);
    expect(landPresent(37, [], [37])).toBeUndefined();
  });

  it("grants a rare without touching coins, and coins once", () => {
    const first = applyUnlock([], "galaxy-narwhal");
    expect(first).toEqual({ ok: true, reason: "ok", squishees: ["galaxy-narwhal"] });
    expect(applyUnlock(first.squishees, "galaxy-narwhal").ok).toBe(false);
    expect(applyUnlock([], "nope").reason).toBe("missing");
    expect(first.squishees).toHaveLength(1);

    const coins = applyPresentClaim({ pad: 37, owned: [], coins: 3, claimedPads: [] });
    expect(coins.ok).toBe(true);
    expect(coins.coins).toBe(13);
    expect(coins.squishees).toEqual([]);
    expect(coins.claimedPads).toEqual([37]);
    expect(applyPresentClaim({ pad: 37, owned: [], coins: coins.coins, claimedPads: coins.claimedPads })).toEqual({
      ok: false,
      reason: "claimed",
      squishees: [],
      coins: 13,
      claimedPads: [37],
    });
    expect(parseClaimedPresentPads(undefined)).toEqual([]);
    expect(parseClaimedPresentPads([37, 37, 0, 99, "nope"])).toEqual([37]);
  });

  it("still refuses to sell rares for coins", () => {
    expect(applyBuy(100, [], "crystal-axolotl").reason).toBe("find");
    expect(applyBuy(100, [], "rainbow-cupcake").reason).toBe("find");
    expect(applyBuy(10, [], "capybara").ok).toBe(true);
  });
});
