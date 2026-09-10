import { describe, expect, it } from "vitest";
import { UNITS } from "./curriculum";
import {
  PORTAL_PAIRS,
  RADIAL_EDGES,
  RADIAL_MAP_FILE,
  RADIAL_PAD_COUNT,
  RADIAL_PADS,
  START_PAD,
  adjacentPadIds,
  areAdjacent,
  hopCreditsOf,
  portalPartner,
  radialHopStops,
  smallLessonsCompleted,
} from "./radial-web";

describe("radial web", () => {
  it("is a connected ring-and-spoke graph on the locked map", () => {
    expect(RADIAL_MAP_FILE).toBe("candy-zones/radial-web-locked.jpg");
    expect(RADIAL_PADS).toHaveLength(RADIAL_PAD_COUNT);
    expect(RADIAL_PADS[0]!.id).toBe(START_PAD);
    expect(RADIAL_PADS.every((p) => p.id >= 1 && p.map.x > 8 && p.map.x < 92)).toBe(true);
    expect(RADIAL_PADS.filter((p) => p.ring === 0)).toHaveLength(1);
    expect(RADIAL_PADS.filter((p) => p.ring === 1)).toHaveLength(8);
    expect(RADIAL_PADS.filter((p) => p.ring === 2)).toHaveLength(16);
    expect(RADIAL_PADS.filter((p) => p.ring === 3)).toHaveLength(16);
    expect(RADIAL_PADS.filter((p) => p.ring === 4)).toHaveLength(40);
    expect(RADIAL_EDGES.length).toBeGreaterThan(RADIAL_PAD_COUNT);
    for (const pad of RADIAL_PADS) {
      expect(adjacentPadIds(pad.id).length).toBeGreaterThan(0);
    }
    expect(adjacentPadIds(START_PAD)).toHaveLength(8);
    expect(UNITS.every((u) => !u.id.startsWith("g4-"))).toBe(true);
  });

  it("hops exactly one adjacent space and never skips pads", () => {
    const next = adjacentPadIds(START_PAD)[0]!;
    expect(areAdjacent(START_PAD, next)).toBe(true);
    expect(radialHopStops(START_PAD, next)).toEqual([START_PAD, next]);
    expect(radialHopStops(START_PAD, START_PAD)).toEqual([START_PAD]);
    const far = RADIAL_PADS.find((p) => p.ring === 4 && !areAdjacent(START_PAD, p.id))!;
    expect(radialHopStops(START_PAD, far.id)).toEqual([START_PAD]);
    expect(radialHopStops(START_PAD, far.id)).toHaveLength(1);
    expect(radialHopStops(1, 13).length).toBeLessThanOrEqual(2);
  });

  it("pairs portals as a hidden involution without self-warps", () => {
    expect(PORTAL_PAIRS).toHaveLength(6);
    const seen = new Set<number>();
    for (const [a, b] of PORTAL_PAIRS) {
      expect(a).not.toBe(b);
      expect(portalPartner(a)).toBe(b);
      expect(portalPartner(b)).toBe(a);
      expect(seen.has(a)).toBe(false);
      expect(seen.has(b)).toBe(false);
      seen.add(a);
      seen.add(b);
    }
    expect(portalPartner(START_PAD)).toBeUndefined();
    expect(RADIAL_PADS.filter((p) => p.portal)).toHaveLength(12);
  });

  it("grants one hop credit per first small lesson, not a whole unit or replay", () => {
    const leftover = { plays: 1, best: 4, last: 4, stars: 3, misses: [] };
    expect(smallLessonsCompleted({})).toBe(0);
    expect(smallLessonsCompleted({ "u1-leftover": leftover })).toBe(1);
    expect(smallLessonsCompleted({ "u1-leftover": leftover, "u1-friends": leftover })).toBe(2);
    expect(smallLessonsCompleted({ welcome: leftover, "daily:u1": leftover, "g4-u1-place": leftover })).toBe(0);
    expect(hopCreditsOf({ "u1-leftover": leftover }, 0)).toBe(1);
    expect(hopCreditsOf({ "u1-leftover": leftover }, 1)).toBe(0);
    expect(hopCreditsOf({ "u1-leftover": leftover, "u1-friends": leftover }, 1)).toBe(1);
  });
});
