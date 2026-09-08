import { describe, expect, it } from "vitest";
import {
  HOP_MS,
  LAND_MS,
  clamp01,
  easeHopTravel,
  hopAlong,
  hopLiftPercent,
  hopProgressAt,
  hopSquash,
  hopTravelMs,
  hopUnitStops,
  restHopPose,
} from "./candy-hop";
import { GRADE3_PATH_NODES, mapToViewPos } from "./grade-path";

describe("candy hop", () => {
  it("walks every intermediate pad, both directions", () => {
    expect(hopUnitStops(1, 1)).toEqual([1]);
    expect(hopUnitStops(2, 5)).toEqual([2, 3, 4, 5]);
    expect(hopUnitStops(8, 6)).toEqual([8, 7, 6]);
    expect(hopUnitStops(1, 13)).toHaveLength(13);
    expect(hopUnitStops(0, 99)).toEqual(hopUnitStops(1, 13));
  });

  it("times multi-hop travel with a land pause between hops", () => {
    expect(hopTravelMs([3])).toBe(0);
    expect(hopTravelMs([1, 2])).toBe(HOP_MS);
    expect(hopTravelMs([1, 2, 3])).toBe(HOP_MS * 2 + LAND_MS);
  });

  it("keeps t=0 and t=1 on the pads and lifts at mid-hop", () => {
    const a = mapToViewPos(GRADE3_PATH_NODES[0]!);
    const b = mapToViewPos(GRADE3_PATH_NODES[1]!);
    const start = hopAlong(a, b, 0);
    const end = hopAlong(a, b, 1);
    const mid = hopAlong(a, b, 0.5);
    const lerpY = (a.y + b.y) / 2;
    expect(start.x).toBeCloseTo(a.x, 5);
    expect(start.y).toBeCloseTo(a.y, 5);
    expect(end.x).toBeCloseTo(b.x, 5);
    expect(end.y).toBeCloseTo(b.y, 5);
    expect(mid.y).toBeLessThan(lerpY - 2);
    expect(hopLiftPercent(a, b)).toBeGreaterThan(3);
    expect(easeHopTravel(0)).toBe(0);
    expect(easeHopTravel(1)).toBe(1);
    expect(easeHopTravel(0.5)).toBeCloseTo(0.5);
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
  });

  it("squashes on takeoff and landing, stretches at the apex", () => {
    const takeoff = hopSquash(0);
    const apex = hopSquash(0.5);
    const land = hopSquash(1);
    expect(takeoff.x).toBeGreaterThan(1);
    expect(takeoff.y).toBeLessThan(1);
    expect(apex.y).toBeGreaterThan(1);
    expect(apex.x).toBeLessThan(1);
    expect(land.x).toBeGreaterThan(1);
    expect(land.y).toBeLessThan(1);
  });

  it("reports hop index and done across a two-hop trip", () => {
    expect(hopProgressAt(0, 2)).toEqual({ hopIndex: 0, t: 0, done: false });
    expect(hopProgressAt(HOP_MS / 2, 2).hopIndex).toBe(0);
    expect(hopProgressAt(HOP_MS / 2, 2).t).toBeCloseTo(0.5);
    expect(hopProgressAt(HOP_MS + LAND_MS + 10, 2).hopIndex).toBe(1);
    expect(hopProgressAt(hopTravelMs([1, 2, 3]), 2).done).toBe(true);
    expect(hopProgressAt(0, 0).done).toBe(true);
    const rest = restHopPose({ x: 10, y: 20 });
    expect(rest).toEqual({ x: 10, y: 20, squashX: 1, squashY: 1 });
  });
});
