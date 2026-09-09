import { describe, expect, it } from "vitest";
import { UNITS } from "./curriculum";
import {
  CANDY_WORLD_ASPECT,
  GRADE3_PATH_NODES,
  GRADE3_PATH_PADS,
  PATH_OBSTACLE,
  TALL_MAP_DECORATIVE_PAD,
  TALL_MAP_FILE,
  TALL_MAP_OVERLAYS,
  TALL_MAP_SIZE,
  overlayClearsPads,
  overlayInOpenCoveWater,
  overlayOnCoveShoreLip,
  overlayOnDryCoveBank,
  overlaysHaveBreathingRoom,
  overlaySeatClass,
  padChromeStars,
  TRAIL_PEEK_ARM_MS,
  TRAIL_PEEK_ARM_SPREAD_MS,
  TRAIL_PEEK_MIN_HOPPER_DIST,
  TRAIL_PEEK_MIN_PAD_DIST,
  TRAIL_PEEK_NEARBY_Y,
  TRAIL_PEEK_SPOTS,
  displayUnitStars,
  fogCoverPercent,
  lastClearUnitNumber,
  mapToViewPos,
  nearbyTrailPeekSpots,
  nodeIsFogged,
  pickTrailPeekSpot,
  trailPeekClearsHopper,
  trailPeekClearsPads,
  trailPeekHash,
  zoneForUnitNumber,
  zoneIsFogged,
  zoneLabelIsFogged,
} from "./grade-path";
import { pathHopperId } from "./squishees";

describe("grade path", () => {
  it("places every Grade 3 unit on the trail and none from Grade 4", () => {
    expect(UNITS).toHaveLength(13);
    expect(GRADE3_PATH_NODES).toHaveLength(UNITS.length);
    expect(GRADE3_PATH_PADS).toHaveLength(13);
    expect(UNITS.every((u) => !u.id.startsWith("g4-"))).toBe(true);
    expect(zoneForUnitNumber(1)).toBe("meadow");
    expect(zoneForUnitNumber(4)).toBe("meadow");
    expect(zoneForUnitNumber(5)).toBe("cove");
    expect(zoneForUnitNumber(8)).toBe("cove");
    expect(zoneForUnitNumber(9)).toBe("forest");
    expect(zoneForUnitNumber(13)).toBe("forest");
  });

  it("sits the 13 units on painted cream pads of one tall map", () => {
    expect(TALL_MAP_FILE).toBe("candy-zones/tall-map.png");
    expect(TALL_MAP_SIZE).toEqual({ w: 1536, h: 1024 });
    expect(CANDY_WORLD_ASPECT).toBeCloseTo(2 / 5);
    expect(GRADE3_PATH_PADS.filter((p) => p.zone === "meadow")).toHaveLength(4);
    expect(GRADE3_PATH_PADS.filter((p) => p.zone === "cove")).toHaveLength(4);
    expect(GRADE3_PATH_PADS.filter((p) => p.zone === "forest")).toHaveLength(5);
    expect(GRADE3_PATH_PADS.map((p) => p.unitNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    expect(GRADE3_PATH_NODES[0]!.y).toBeGreaterThan(88);
    expect(GRADE3_PATH_NODES[12]!.y).toBeLessThan(8);
    expect(GRADE3_PATH_NODES.every((n, i, all) => i === 0 || n.y < all[i - 1]!.y)).toBe(true);
    expect(TALL_MAP_DECORATIVE_PAD.y).toBeGreaterThan(GRADE3_PATH_PADS[8]!.map.y);
    expect(TALL_MAP_DECORATIVE_PAD.y).toBeLessThan(GRADE3_PATH_PADS[7]!.map.y);
    expect(PATH_OBSTACLE.map).toEqual(TALL_MAP_DECORATIVE_PAD);
    expect(PATH_OBSTACLE.id).toBe("cove-boulder");
    expect(PATH_OBSTACLE.file).toBe("cove-boulder.png");
    expect(PATH_OBSTACLE.map).toEqual({ x: 46.7, y: 32.7 });
    expect(PATH_OBSTACLE.width).toBe(20);
    expect(PATH_OBSTACLE.width).toBeGreaterThan(16);
    expect(PATH_OBSTACLE.width).toBeLessThan(26);
    expect(TALL_MAP_OVERLAYS.some((p) => p.id === PATH_OBSTACLE.id)).toBe(false);
    expect(GRADE3_PATH_PADS.some((p) => p.map.x === PATH_OBSTACLE.map.x && p.map.y === PATH_OBSTACLE.map.y)).toBe(false);
    const mid = mapToViewPos({ x: 50, y: 50 });
    expect(mid.x).toBeCloseTo(50);
    expect(mid.y).toBeCloseTo(50);
    const left = mapToViewPos({ x: 45.05, y: 92.69 });
    expect(left.x).toBeGreaterThan(20);
    expect(left.x).toBeLessThan(45.05);
    expect(left.y).toBeCloseTo(92.69);
    expect(displayUnitStars(0, 15)).toBe(0);
    expect(displayUnitStars(5, 15)).toBe(1);
    expect(displayUnitStars(15, 15)).toBe(3);
    expect(padChromeStars(0, { now: false, locked: false })).toBe(0);
    expect(padChromeStars(3, { now: true, locked: false })).toBe(0);
    expect(padChromeStars(2, { now: false, locked: true })).toBe(0);
    expect(padChromeStars(2, { now: false, locked: false })).toBe(2);
    expect(TALL_MAP_OVERLAYS.map((p) => p.id)).toEqual([
      "tenframe-a",
      "tenframe-b",
      "tenframe-c",
      "tenframe-d",
      "tenframe-e",
      "flowers",
      "daisies",
      "waterfall",
      "palm",
      "dock",
      "sailboat",
      "sailboat-b",
      "coins",
      "coins-b",
      "coins-c",
      "fraction-tree",
      "fraction-tree-b",
      "fraction-tree-c",
      "fraction-tree-d",
      "fraction-tree-e",
    ]);
    expect(TALL_MAP_OVERLAYS.some((p) => p.id === "candy-cane" || p.file === "candy-cane.png")).toBe(false);
    expect(TALL_MAP_OVERLAYS.filter((p) => p.file === "tenframe-mound.png")).toHaveLength(5);
    expect(TALL_MAP_OVERLAYS.filter((p) => p.file === "sailboat.png")).toHaveLength(2);
    expect(TALL_MAP_OVERLAYS.filter((p) => p.file === "coin-stack.png")).toHaveLength(3);
    expect(TALL_MAP_OVERLAYS.filter((p) => p.file === "fraction-tree.png")).toHaveLength(5);
    expect(TALL_MAP_OVERLAYS.filter((p) => p.zone === "meadow").length).toBe(7);
    expect(TALL_MAP_OVERLAYS.filter((p) => p.zone === "cove").length).toBe(8);
    expect(TALL_MAP_OVERLAYS.filter((p) => p.zone === "forest").length).toBe(5);
    expect(
      TALL_MAP_OVERLAYS.filter((p) => p.file === "tenframe-mound.png" && p.id !== "tenframe-a").every((p) => p.map.y < 88),
    ).toBe(true);
    expect(TALL_MAP_OVERLAYS.every((p) => p.map.x > 38 && p.map.x < 62)).toBe(true);
    expect(TALL_MAP_OVERLAYS.every((p) => overlayClearsPads(p))).toBe(true);
    expect(overlaysHaveBreathingRoom(TALL_MAP_OVERLAYS, "tenframe-mound.png")).toBe(true);
    expect(overlaysHaveBreathingRoom(TALL_MAP_OVERLAYS, "coin-stack.png")).toBe(true);
    expect(overlaysHaveBreathingRoom(TALL_MAP_OVERLAYS, "fraction-tree.png")).toBe(true);
    expect(new Set(TALL_MAP_OVERLAYS.map((p) => p.file))).toEqual(
      new Set([
        "tenframe-mound.png",
        "meadow-flowers.png",
        "daisies.png",
        "waterfall.png",
        "palm.png",
        "dock.png",
        "sailboat.png",
        "coin-stack.png",
        "fraction-tree.png",
      ]),
    );
    expect(TALL_MAP_OVERLAYS.every((p) => p.seat === "land" || p.seat === "water" || p.seat === "shore")).toBe(true);
    expect(overlaySeatClass("land")).toBe("candy-prop-land");
    expect(overlaySeatClass("water")).toBe("candy-prop-water");
    expect(overlaySeatClass("shore")).toBe("candy-prop-shore");
    const fall = TALL_MAP_OVERLAYS.find((p) => p.id === "waterfall")!;
    expect(fall.map).toEqual({ x: 40.9, y: 28.5 });
    expect(fall.width).toBe(14);
    expect(fall.seat).toBe("shore");
    expect(fall.map.y).toBeGreaterThan(27.8);
    expect(fall.map.y).toBeLessThan(30);
    expect(overlayOnCoveShoreLip(fall)).toBe(true);
    expect(overlayOnDryCoveBank(fall)).toBe(false);
    expect(overlayInOpenCoveWater(fall)).toBe(false);
    expect(overlayOnDryCoveBank({ ...fall, map: { x: 40.2, y: 25.55 } })).toBe(true);
    expect(overlayOnCoveShoreLip({ ...fall, map: { x: 40.2, y: 25.55 } })).toBe(false);
    expect(overlayInOpenCoveWater({ ...fall, map: { x: 39.2, y: 51.15 } })).toBe(true);
    expect(TALL_MAP_OVERLAYS.find((p) => p.id === "sailboat")?.motion).toBe("bob");
    expect(TALL_MAP_OVERLAYS.find((p) => p.id === "dock")?.file).toBe("dock.png");
    expect(TALL_MAP_OVERLAYS.find((p) => p.id === "coins")?.motion).toBe("bob");
    expect(TALL_MAP_OVERLAYS.find((p) => p.id === "coins")?.file).toBe("coin-stack.png");
    expect(TALL_MAP_OVERLAYS.some((p) => p.file === "coin-spin.png")).toBe(false);
    expect(TALL_MAP_OVERLAYS.find((p) => p.id === "flowers")?.file).toBe("meadow-flowers.png");
    expect(TALL_MAP_OVERLAYS.find((p) => p.id === "fraction-tree")?.file).toBe("fraction-tree.png");
    expect(TALL_MAP_OVERLAYS.find((p) => p.id === "palm")?.motion).toBe("sway");
    expect(TALL_MAP_OVERLAYS.find((p) => p.id === "daisies")?.motion).toBe("bob");
    expect(TRAIL_PEEK_SPOTS).toHaveLength(9);
    expect(TRAIL_PEEK_SPOTS.every((p) => p.map.x > 38 && p.map.x < 62)).toBe(true);
    expect(TRAIL_PEEK_MIN_HOPPER_DIST).toBeGreaterThan(TRAIL_PEEK_MIN_PAD_DIST);
    expect(TRAIL_PEEK_SPOTS.every((p) => trailPeekClearsPads(p))).toBe(true);
    expect(TRAIL_PEEK_SPOTS.every((p) => GRADE3_PATH_PADS.every((pad) => Math.hypot(pad.map.x - p.map.x, pad.map.y - p.map.y) >= TRAIL_PEEK_MIN_PAD_DIST))).toBe(true);
    expect(TRAIL_PEEK_ARM_MS + TRAIL_PEEK_ARM_SPREAD_MS).toBeLessThan(2000);
  });

  it("picks exactly one nearby hide spot on the clear stretch for every unit", () => {
    for (let n = 1; n <= GRADE3_PATH_NODES.length; n++) {
      const nowY = GRADE3_PATH_NODES[n - 1]!.y;
      const nearby = nearbyTrailPeekSpots(n);
      expect(nearby.length).toBeGreaterThan(0);
      expect(nearby.every((s) => Math.abs(s.map.y - nowY) <= TRAIL_PEEK_NEARBY_Y)).toBe(true);
      const picked = pickTrailPeekSpot(n, trailPeekHash("2026-09-08", n));
      expect(picked).toBeDefined();
      expect(nearby).toContainEqual(picked);
      expect(trailPeekClearsHopper(picked!, n)).toBe(true);
      expect(trailPeekClearsPads(picked!)).toBe(true);
    }
    const early = pickTrailPeekSpot(1, 0);
    expect(early?.zone).toBe("meadow");
    const midIds = new Set(
      [0, 1, 2, 3, 4, 5].map((h) => pickTrailPeekSpot(5, h)?.id).filter(Boolean),
    );
    expect(midIds.size).toBeGreaterThan(1);
  });

  it("hides the far trail under fog and keeps a short lookahead", () => {
    expect(lastClearUnitNumber(1)).toBe(3);
    expect(nodeIsFogged(1, 1)).toBe(false);
    expect(nodeIsFogged(3, 1)).toBe(false);
    expect(nodeIsFogged(4, 1)).toBe(true);
    expect(nodeIsFogged(13, 1)).toBe(true);
    expect(zoneIsFogged("meadow", 1)).toBe(false);
    expect(zoneIsFogged("cove", 1)).toBe(true);
    expect(zoneIsFogged("forest", 1)).toBe(true);
    expect(zoneIsFogged("forest", 8)).toBe(false);
    expect(zoneLabelIsFogged("cove", 1)).toBe(false);
    expect(zoneLabelIsFogged("forest", 1)).toBe(false);
    expect(zoneLabelIsFogged("forest", 9)).toBe(false);
    expect(fogCoverPercent(1)).toBeGreaterThan(40);
    expect(fogCoverPercent(13)).toBe(0);
  });

  it("hops the last owned squishee, else the familiar first peek face", () => {
    expect(pathHopperId([])).toBe("peach");
    expect(pathHopperId(["frog", "cat"])).toBe("cat");
    expect(pathHopperId(["not-a-toy"])).toBe("peach");
  });
});
