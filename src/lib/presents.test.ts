import { describe, expect, it } from "vitest";
import { adjacentPadIds, isPortalPad, RADIAL_PAD_COUNT, START_PAD } from "./radial-web";
import { COMMON_SQUISHEES, RARE_SQUISHEES, squisheeById } from "./squishees";
import {
  GRADE3_PRESENTS,
  LEGACY_PRESENT_SQUISHEES,
  PRESENT_COIN_PILE,
  applyPresentLand,
  applyUnlock,
  foundPresentPads,
  grade3PresentCommons,
  grade3PresentRares,
  healOpenedPresents,
  heldRares,
  isPresentPad,
  landPresent,
  presentSquisheeAt,
  presentSpotAt,
  visiblePresentPads,
  webOpenAroundPresents,
} from "./presents";

describe("Grade 3 mystery presents", () => {
  it("pins four fixed mixed rewards on hoppable, non-portal, non-start pads", () => {
    expect(GRADE3_PRESENTS).toHaveLength(4);
    const pads = new Set<number>();
    const kinds = new Set<string>();
    for (const spot of GRADE3_PRESENTS) {
      expect(spot.pad).toBeGreaterThan(START_PAD);
      expect(spot.pad).toBeLessThanOrEqual(RADIAL_PAD_COUNT);
      expect(isPortalPad(spot.pad)).toBe(false);
      expect(isPresentPad(spot.pad)).toBe(true);
      expect(adjacentPadIds(spot.pad).length).toBeGreaterThan(0);
      expect(pads.has(spot.pad)).toBe(false);
      pads.add(spot.pad);
      kinds.add(spot.kind);
      if (spot.kind === "squishee") expect(squisheeById(spot.squisheeId)).toBeTruthy();
      if (spot.kind === "coins") expect(spot.coins).toBe(PRESENT_COIN_PILE);
    }
    expect(kinds.has("squishee")).toBe(true);
    expect(kinds.has("coins")).toBe(true);
    expect(PRESENT_COIN_PILE).toBe(10);
    expect(presentSquisheeAt(START_PAD)).toBeUndefined();
    expect(grade3PresentRares().length).toBeGreaterThanOrEqual(1);
    expect(grade3PresentCommons().length).toBeGreaterThanOrEqual(1);
    expect(grade3PresentCommons().every((id) => COMMON_SQUISHEES.some((s) => s.id === id))).toBe(true);
    expect(heldRares().length + grade3PresentRares().length).toBe(RARE_SQUISHEES.length);
    expect(heldRares()).toEqual(
      expect.arrayContaining([
        "nebula-fox",
        "frost-bun",
        "opal-otter",
        "solar-koi",
        "velvet-octopus",
        "lunar-lamb",
        "thunder-quokka",
        "coral-seahorse",
        "eclipse-owl",
        "amber-phoenix",
        "mist-deer",
        "sapphire-frog",
        "gilded-otter",
        "starlight-penguin",
        "rose-gold-seal",
      ]),
    );
    expect(grade3PresentRares()).not.toEqual(expect.arrayContaining(["nebula-fox", "frost-bun"]));
  });

  it("does not gate the radial web behind a present", () => {
    expect(webOpenAroundPresents()).toBe(true);
  });

  it("keeps unopened boxes anonymous and ignores a second land", () => {
    expect(visiblePresentPads([], [])).toEqual([12, 17, 21, 25]);
    expect(foundPresentPads([], [])).toEqual([]);
    expect(landPresent(12, [], [])).toEqual({ kind: "squishee", squisheeId: "otter" });
    expect(landPresent(21, [], [])).toEqual({ kind: "coins", coins: 10 });
    expect(landPresent(12, [], [12])).toBeUndefined();
    expect(landPresent(12, ["otter"], [])).toBeUndefined();
    expect(landPresent(START_PAD, [], [])).toBeUndefined();
    expect(visiblePresentPads([], [12])).toEqual([17, 21, 25]);
    expect(foundPresentPads([], [12])).toEqual([12]);
    expect(visiblePresentPads(["crystal-axolotl"], [])).toEqual([12, 21, 25]);
    expect(foundPresentPads(["crystal-axolotl"], [])).toEqual([17]);
    expect(presentSpotAt(21)?.kind).toBe("coins");
  });

  it("grants a toy or about one common in coins without reshuffling pads", () => {
    const rare = applyPresentLand([], 0, [], 17);
    expect(rare.ok).toBe(true);
    expect(rare.reward).toEqual({ kind: "squishee", squisheeId: "crystal-axolotl" });
    expect(rare.squishees).toEqual(["crystal-axolotl"]);
    expect(rare.opened).toEqual([17]);
    expect(applyPresentLand(rare.squishees, rare.coins, rare.opened, 17).ok).toBe(false);

    const coins = applyPresentLand([], 3, [], 21);
    expect(coins).toMatchObject({ ok: true, coins: 13, opened: [21] });
    expect(coins.reward).toEqual({ kind: "coins", coins: 10 });
    expect(applyUnlock([], "galaxy-narwhal").squishees).toEqual(["galaxy-narwhal"]);
  });

  it("heals old rare finds onto the same pads", () => {
    expect(healOpenedPresents(["crystal-axolotl"], [], 14)).toEqual([12, 17]);
    expect(healOpenedPresents(["otter"], [], 15)).toEqual([12]);
    expect(healOpenedPresents(["golden-dragon"], [], 14)).toEqual([21]);
    expect(healOpenedPresents(["golden-dragon"], [], 15)).toEqual([]);
    expect(LEGACY_PRESENT_SQUISHEES[12]).toBe("crystal-axolotl");
  });
});
