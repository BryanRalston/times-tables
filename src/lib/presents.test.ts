import { describe, expect, it } from "vitest";
import { adjacentPadIds, isPortalPad, RADIAL_PAD_COUNT, START_PAD } from "./radial-web";
import { COMMON_SQUISHEES, RARE_SQUISHEES, SQUISHEE_IDS, squisheeById } from "./squishees";
import {
  GRADE3_PRESENTS,
  LEGACY_PRESENT_SQUISHEES,
  LIVE_PRESENT_COUNT,
  PRESENT_COIN_PILE,
  PRESENT_LOOT_WEIGHTS,
  applyPresentLand,
  applyUnlock,
  foundPresentPads,
  grade3PresentCommons,
  grade3PresentRares,
  healLivePresentPads,
  healOpenedPresents,
  heldRares,
  isPresentPad,
  landPresent,
  presentLootKinds,
  presentSquisheeAt,
  presentSpotAt,
  refillLivePresents,
  rollPresentLoot,
  visiblePresentPads,
  webOpenAroundPresents,
} from "./presents";

describe("Grade 3 mystery presents", () => {
  it("seeds four hoppable, non-portal, non-start pads", () => {
    expect(GRADE3_PRESENTS).toHaveLength(LIVE_PRESENT_COUNT);
    const pads = new Set<number>();
    for (const spot of GRADE3_PRESENTS) {
      expect(spot.pad).toBeGreaterThan(START_PAD);
      expect(spot.pad).toBeLessThanOrEqual(RADIAL_PAD_COUNT);
      expect(isPortalPad(spot.pad)).toBe(false);
      expect(isPresentPad(spot.pad)).toBe(true);
      expect(adjacentPadIds(spot.pad).length).toBeGreaterThan(0);
      expect(pads.has(spot.pad)).toBe(false);
      pads.add(spot.pad);
    }
    expect(PRESENT_COIN_PILE).toBe(10);
    expect(presentSquisheeAt(START_PAD)).toBeUndefined();
    expect(grade3PresentRares()).toEqual(RARE_SQUISHEES.map((s) => s.id));
    expect(grade3PresentCommons()).toEqual(COMMON_SQUISHEES.map((s) => s.id));
    expect(heldRares()).toEqual(RARE_SQUISHEES.map((s) => s.id));
  });

  it("weights coins and rolls above squishees", () => {
    expect(PRESENT_LOOT_WEIGHTS.coins + PRESENT_LOOT_WEIGHTS.rolls).toBeGreaterThan(
      PRESENT_LOOT_WEIGHTS.common + PRESENT_LOOT_WEIGHTS.rare,
    );
    expect(PRESENT_LOOT_WEIGHTS.rare).toBeLessThan(PRESENT_LOOT_WEIGHTS.common);
    expect(PRESENT_LOOT_WEIGHTS.coins).toBe(40);
    expect(PRESENT_LOOT_WEIGHTS.rolls).toBe(40);
    expect(PRESENT_LOOT_WEIGHTS.common).toBe(15);
    expect(PRESENT_LOOT_WEIGHTS.rare).toBe(5);
    const empty = presentLootKinds([]);
    expect(empty.filter((k) => k === "coins" || k === "rolls").length).toBe(80);
    expect(empty.filter((k) => k === "common").length).toBe(15);
    expect(empty.filter((k) => k === "rare").length).toBe(5);
    expect(presentLootKinds(SQUISHEE_IDS).every((k) => k === "coins" || k === "rolls")).toBe(true);
  });

  it("does not gate the radial web behind a present", () => {
    expect(webOpenAroundPresents()).toBe(true);
  });

  it("keeps unopened boxes anonymous and ignores a pad without a live box", () => {
    const live = [12, 17, 21, 25];
    expect(visiblePresentPads([], [], live)).toEqual(live);
    expect(foundPresentPads([], [])).toEqual([]);
    expect(landPresent(START_PAD, [], [], live)).toBeUndefined();
    expect(landPresent(12, [], [], [])).toBeUndefined();
    const forced = landPresent(21, [], [], live, () => 0);
    expect(forced).toEqual({ kind: "coins", coins: 10 });
    expect(presentSpotAt(21)?.kind).toBe("coins");
  });

  it("respawns a new box on an empty walkable pad after unwrap", () => {
    const first = applyPresentLand([], 3, [], 12, { live: [12, 17, 21, 25], hopperAt: 12, next: () => 0 });
    expect(first.ok).toBe(true);
    expect(first.reward).toEqual({ kind: "coins", coins: 10 });
    expect(first.coins).toBe(13);
    expect(first.livePads).toHaveLength(LIVE_PRESENT_COUNT);
    expect(first.livePads).not.toContain(12);
    expect(first.opened).toEqual([12]);
    for (const pad of first.livePads) {
      expect(isPortalPad(pad)).toBe(false);
      expect(pad).not.toBe(12);
      expect(pad).not.toBe(START_PAD);
      expect(adjacentPadIds(pad).length).toBeGreaterThan(0);
    }
    expect(applyPresentLand(first.squishees, first.coins, first.opened, 12, { live: first.livePads }).ok).toBe(false);
  });

  it("banks extra rolls instead of auto-spending them", () => {
    const rolls = applyPresentLand([], 0, [], 17, {
      live: [12, 17, 21, 25],
      hopperAt: 17,
      next: () => 0.5,
    });
    expect(rolls.ok).toBe(true);
    expect(rolls.reward?.kind).toBe("rolls");
    if (rolls.reward?.kind === "rolls") {
      expect(rolls.reward.rolls).toBeGreaterThanOrEqual(1);
      expect(rolls.reward.rolls).toBeLessThanOrEqual(2);
      expect(rolls.giftRolls).toBe(rolls.reward.rolls);
    }
    expect(applyUnlock([], "galaxy-narwhal").squishees).toEqual(["galaxy-narwhal"]);
  });

  it("falls back to coins or rolls when every toy is owned", () => {
    const r = applyPresentLand([...SQUISHEE_IDS], 0, [], 21, {
      live: [12, 17, 21, 25],
      granted: SQUISHEE_IDS,
      hopperAt: 21,
      next: () => 0.9,
    });
    expect(r.ok).toBe(true);
    expect(r.reward?.kind === "coins" || r.reward?.kind === "rolls").toBe(true);
    expect(r.squishees).toEqual(SQUISHEE_IDS);
  });

  it("heals old rare finds onto the same pads and refills live boxes", () => {
    expect(healOpenedPresents(["crystal-axolotl"], [], 14)).toEqual([12, 17]);
    expect(healOpenedPresents(["otter"], [], 15)).toEqual([12]);
    expect(healOpenedPresents(["golden-dragon"], [], 14)).toEqual([21]);
    expect(healOpenedPresents(["golden-dragon"], [], 15)).toEqual([]);
    expect(LEGACY_PRESENT_SQUISHEES[12]).toBe("crystal-axolotl");
    const live = healLivePresentPads({
      owned: ["crystal-axolotl"],
      rawLive: undefined,
      rawOpened: [],
      saveVersion: 15,
      hopperAt: 1,
    });
    expect(live).toHaveLength(LIVE_PRESENT_COUNT);
    expect(live).not.toContain(17);
    expect(refillLivePresents({ live: [], hopperAt: 1 })).toHaveLength(LIVE_PRESENT_COUNT);
  });

  it("rolls coins and rolls more often than squishees over many unwraps", () => {
    let n = 0.13;
    const next = () => {
      n = (n * 1.37 + 0.17) % 1;
      return n;
    };
    const tally = { coins: 0, rolls: 0, squishee: 0 };
    for (let i = 0; i < 200; i++) {
      const loot = rollPresentLoot([], next);
      tally[loot.kind === "squishee" ? "squishee" : loot.kind] += 1;
    }
    expect(tally.coins + tally.rolls).toBeGreaterThan(tally.squishee);
    expect(squisheeById("otter")).toBeTruthy();
  });
});
