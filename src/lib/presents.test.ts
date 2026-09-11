import { describe, expect, it } from "vitest";
import { adjacentPadIds, isPortalPad, RADIAL_PAD_COUNT, START_PAD } from "./radial-web";
import { RARE_SQUISHEES, squisheeById } from "./squishees";
import {
  GRADE3_PRESENTS,
  applyUnlock,
  foundPresentPads,
  grade3PresentRares,
  heldRares,
  isPresentPad,
  landPresent,
  presentSquisheeAt,
  visiblePresentPads,
  webOpenAroundPresents,
} from "./presents";

describe("Grade 3 mystery presents", () => {
  it("pins four fixed rares on hoppable, non-portal, non-start pads", () => {
    expect(GRADE3_PRESENTS).toHaveLength(4);
    const pads = new Set<number>();
    const rares = new Set<string>();
    for (const spot of GRADE3_PRESENTS) {
      expect(spot.pad).toBeGreaterThan(START_PAD);
      expect(spot.pad).toBeLessThanOrEqual(RADIAL_PAD_COUNT);
      expect(isPortalPad(spot.pad)).toBe(false);
      expect(isPresentPad(spot.pad)).toBe(true);
      expect(adjacentPadIds(spot.pad).length).toBeGreaterThan(0);
      expect(squisheeById(spot.squisheeId)?.rarity).toBe("rare");
      expect(pads.has(spot.pad)).toBe(false);
      expect(rares.has(spot.squisheeId)).toBe(false);
      pads.add(spot.pad);
      rares.add(spot.squisheeId);
    }
    expect(presentSquisheeAt(START_PAD)).toBeUndefined();
    expect(grade3PresentRares()).toHaveLength(4);
    expect(heldRares().length + grade3PresentRares().length).toBe(RARE_SQUISHEES.length);
  });

  it("does not gate the radial web behind a present", () => {
    expect(webOpenAroundPresents()).toBe(true);
  });

  it("keeps unfound boxes anonymous and drops them once owned", () => {
    expect(visiblePresentPads([])).toEqual([12, 17, 21, 25]);
    expect(foundPresentPads([])).toEqual([]);
    expect(landPresent(12, [])).toBe("crystal-axolotl");
    expect(landPresent(12, ["crystal-axolotl"])).toBeUndefined();
    expect(landPresent(START_PAD, [])).toBeUndefined();
    expect(visiblePresentPads(["crystal-axolotl", "peach"])).toEqual([17, 21, 25]);
    expect(foundPresentPads(["crystal-axolotl", "peach"])).toEqual([12]);
  });

  it("grants one rare without touching coins or dumping the roster", () => {
    const first = applyUnlock([], "galaxy-narwhal");
    expect(first).toEqual({ ok: true, reason: "ok", squishees: ["galaxy-narwhal"] });
    expect(applyUnlock(first.squishees, "galaxy-narwhal").ok).toBe(false);
    expect(applyUnlock([], "nope").reason).toBe("missing");
    expect(first.squishees).toHaveLength(1);
  });
});
