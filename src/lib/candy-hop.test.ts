import { describe, expect, it } from "vitest";
import {
  HOP_MS,
  LAND_MS,
  OBSTACLE_HOP_MS,
  OBSTACLE_LIFT_PERCENT,
  clamp01,
  easeHopTravel,
  hopAlong,
  hopLandSettle,
  hopLandSquash,
  hopLiftPercent,
  hopSpanIsObstacle,
  hopSpanMs,
  hopProgressAt,
  hopSquash,
  hopTravelMs,
  hopIsOneSpace,
  hopUnitStops,
  pathHopSfxKind,
  restHopPose,
  warpPose,
  warpProgressAt,
  WARP_MS,
  WARP_OUT_MS,
} from "./candy-hop";
import { GRADE3_PATH_NODES, TALL_MAP_DECORATIVE_PAD, mapToViewPos } from "./grade-path";
import { START_PAD, adjacentPadIds } from "./radial-web";

describe("candy hop", () => {
  it("lists only the current pad or one adjacent pad", () => {
    const next = adjacentPadIds(START_PAD)[0]!;
    expect(hopUnitStops(1, 1)).toEqual([1]);
    expect(hopUnitStops(START_PAD, next)).toEqual([START_PAD, next]);
    expect(hopIsOneSpace(START_PAD, next)).toBe(true);
    expect(hopUnitStops(START_PAD, 40)).toEqual([START_PAD]);
    expect(hopUnitStops(1, 13)).toHaveLength(1);
  });

  it("times multi-hop travel with a land settle after every hop", () => {
    expect(hopTravelMs([3])).toBe(0);
    expect(hopTravelMs([1, 2])).toBe(HOP_MS + LAND_MS);
    expect(hopTravelMs([1, 2, 3])).toBe((HOP_MS + LAND_MS) * 2);
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

  it("keeps the ground shadow on the pad path, not the airborne y", () => {
    const a = mapToViewPos(GRADE3_PATH_NODES[0]!);
    const b = mapToViewPos(GRADE3_PATH_NODES[1]!);
    const mid = hopAlong(a, b, 0.5);
    const u = easeHopTravel(0.5);
    expect(mid.shadowX).toBeCloseTo(a.x + (b.x - a.x) * u, 5);
    expect(mid.shadowY).toBeCloseTo(a.y + (b.y - a.y) * u, 5);
    expect(mid.y).toBeLessThan(mid.shadowY);
    expect(mid.shadowScale).toBeGreaterThan(1);
    expect(mid.shadowOpacity).toBeGreaterThan(0);
    expect(mid.shadowOpacity).toBeLessThan(0.22);
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

  it("settles on the landing pad without sliding", () => {
    const pad = mapToViewPos(GRADE3_PATH_NODES[2]!);
    const impact = hopLandSettle(pad, 0);
    const mid = hopLandSettle(pad, 0.25);
    const rest = hopLandSettle(pad, 1);
    expect(impact.x).toBeCloseTo(pad.x, 5);
    expect(impact.y).toBeCloseTo(pad.y, 5);
    expect(mid.x).toBeCloseTo(pad.x, 5);
    expect(mid.y).toBeCloseTo(pad.y, 5);
    expect(rest.x).toBeCloseTo(pad.x, 5);
    expect(rest.y).toBeCloseTo(pad.y, 5);
    expect(impact.squashX).toBeCloseTo(hopSquash(1).x, 5);
    expect(mid.squashY).toBeLessThan(impact.squashY);
    expect(rest.squashX).toBeCloseTo(1, 5);
    expect(rest.squashY).toBeCloseTo(1, 5);
    expect(hopLandSquash(0).x).toBeCloseTo(hopSquash(1).x, 5);
    expect(hopLandSquash(1)).toEqual({ x: 1, y: 1 });
  });

  it("reports hop index, land phase, and done across a two-hop trip", () => {
    expect(hopProgressAt(0, 2)).toEqual({ hopIndex: 0, t: 0, phase: "air", done: false });
    expect(hopProgressAt(HOP_MS / 2, 2).hopIndex).toBe(0);
    expect(hopProgressAt(HOP_MS / 2, 2).t).toBeCloseTo(0.5);
    expect(hopProgressAt(HOP_MS / 2, 2).phase).toBe("air");
    expect(hopProgressAt(HOP_MS + 8, 2).phase).toBe("land");
    expect(hopProgressAt(HOP_MS + 8, 2).hopIndex).toBe(0);
    expect(hopProgressAt(HOP_MS + LAND_MS + 10, 2).hopIndex).toBe(1);
    expect(hopProgressAt(HOP_MS + LAND_MS + 10, 2).phase).toBe("air");
    expect(hopProgressAt(hopTravelMs([1, 2, 3]) - 4, 2).phase).toBe("land");
    expect(hopProgressAt(hopTravelMs([1, 2, 3]) - 4, 2).done).toBe(false);
    expect(hopProgressAt(hopTravelMs([1, 2, 3]), 2).done).toBe(true);
    expect(hopProgressAt(HOP_MS + 4, 1).phase).toBe("land");
    expect(hopProgressAt(HOP_MS + 4, 1).done).toBe(false);
    expect(hopProgressAt(0, 0).done).toBe(true);
    const rest = restHopPose({ x: 10, y: 20 });
    expect(rest).toMatchObject({ x: 10, y: 20, squashX: 1, squashY: 1, shadowX: 10, shadowY: 20 });
    expect(rest.shadowOpacity).toBeGreaterThan(0);
  });

  it("plays one hop and one land per pad, not every frame", () => {
    const samples = [
      0,
      12,
      HOP_MS / 2,
      HOP_MS,
      HOP_MS + 8,
      HOP_MS + LAND_MS,
      HOP_MS + LAND_MS + 10,
      hopTravelMs([1, 2, 3]) - 4,
      hopTravelMs([1, 2, 3]),
    ];
    let prev: { hopIndex: number; phase: "air" | "land" } | null = null;
    const kinds = samples.map((elapsed) => {
      const next = hopProgressAt(elapsed, 2);
      const kind = pathHopSfxKind(prev, next);
      if (!next.done) prev = { hopIndex: next.hopIndex, phase: next.phase };
      return kind;
    });
    expect(kinds.filter((k) => k === "hop")).toHaveLength(2);
    expect(kinds.filter((k) => k === "land")).toHaveLength(2);
    expect(pathHopSfxKind(null, hopProgressAt(0, 0))).toBeNull();
  });

  it("does not mark radial hops as water vaults", () => {
    expect(hopSpanIsObstacle(4, 5)).toBe(false);
    expect(hopSpanIsObstacle(8, 9)).toBe(false);
    expect(hopSpanMs(4, 5)).toBe(HOP_MS);
    expect(hopSpanMs(1, 2)).toBe(HOP_MS);
    expect(hopTravelMs([4, 5])).toBe(HOP_MS + LAND_MS);
    const a = mapToViewPos(GRADE3_PATH_NODES[3]!);
    const b = mapToViewPos(GRADE3_PATH_NODES[4]!);
    const obs = mapToViewPos(TALL_MAP_DECORATIVE_PAD);
    const mid = hopAlong(a, b, 0.5, true);
    const low = hopAlong(a, b, 0.5, false);
    expect(hopLiftPercent(a, b, true)).toBe(OBSTACLE_LIFT_PERCENT);
    expect(hopLiftPercent(a, b, true)).toBeGreaterThan(hopLiftPercent(a, b, false));
    expect(mid.y).toBeLessThan(low.y - 1.4);
    expect(mid.y).toBeLessThan(obs.y - 4);
    expect(mid.shadowY).toBeGreaterThan(mid.y);
    const midProg = hopProgressAt(OBSTACLE_HOP_MS / 2, 1, [OBSTACLE_HOP_MS]);
    expect(midProg.phase).toBe("air");
    expect(midProg.t).toBeCloseTo(0.5);
    expect(hopProgressAt(OBSTACLE_HOP_MS + 8, 1, [OBSTACLE_HOP_MS]).phase).toBe("land");
  });

  it("fades the hopper off the entry pad and onto the exit pad", () => {
    const a = { x: 20, y: 40 };
    const b = { x: 80, y: 40 };
    expect(warpProgressAt(0).phase).toBe("out");
    expect(warpProgressAt(0).opacity).toBeCloseTo(1);
    expect(warpProgressAt(WARP_OUT_MS / 2).opacity).toBeLessThan(1);
    expect(warpProgressAt(WARP_OUT_MS + 10).phase).toBe("flash");
    expect(warpProgressAt(WARP_OUT_MS + 10).opacity).toBe(0);
    expect(warpProgressAt(WARP_MS - 8).phase).toBe("in");
    expect(warpProgressAt(WARP_MS).done).toBe(true);
    expect(warpPose(a, b, "out").x).toBe(a.x);
    expect(warpPose(a, b, "flash").x).toBe(b.x);
    expect(warpPose(a, b, "in").x).toBe(b.x);
  });
});
