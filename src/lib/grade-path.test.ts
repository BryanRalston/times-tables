import { describe, expect, it } from "vitest";
import { UNITS } from "./curriculum";
import {
  CANDY_WORLD_ASPECT,
  GRADE3_PATH_NODES,
  GRADE3_PATH_PADS,
  TALL_MAP_DECORATIVE_PAD,
  TALL_MAP_FILE,
  TALL_MAP_OVERLAYS,
  TALL_MAP_SIZE,
  TRAIL_PEEK_SPOTS,
  displayUnitStars,
  fogCoverPercent,
  lastClearUnitNumber,
  mapToViewPos,
  nodeIsFogged,
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
    expect(TALL_MAP_OVERLAYS.map((p) => p.id)).toEqual([
      "tenframe-a",
      "tenframe-b",
      "waterfall",
      "palm",
      "coins",
      "fraction-pie",
    ]);
    expect(TALL_MAP_OVERLAYS.every((p) => p.map.x > 38 && p.map.x < 62)).toBe(true);
    expect(TRAIL_PEEK_SPOTS).toHaveLength(3);
    expect(TRAIL_PEEK_SPOTS.every((p) => p.map.x > 38 && p.map.x < 62)).toBe(true);
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
