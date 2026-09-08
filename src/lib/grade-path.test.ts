import { describe, expect, it } from "vitest";
import { UNITS } from "./curriculum";
import {
  CANDY_ZONE_FILES,
  CANDY_ZONE_STACK,
  GRADE3_PATH_NODES,
  GRADE3_PATH_PADS,
  PLATE_OVERLAP,
  ZONE_PAD_COUNTS,
  displayUnitStars,
  fogCoverPercent,
  lastClearUnitNumber,
  nodeIsFogged,
  padIsFogged,
  plateSpan,
  plateToMapPos,
  zoneForUnitNumber,
  zoneIsFogged,
  zoneLabelIsFogged,
} from "./grade-path";
import { pathHopperId } from "./squishees";

describe("grade path", () => {
  it("places every Grade 3 unit on the trail and none from Grade 4", () => {
    expect(UNITS).toHaveLength(13);
    expect(GRADE3_PATH_NODES).toHaveLength(UNITS.length);
    expect(UNITS.every((u) => !u.id.startsWith("g4-"))).toBe(true);
    expect(zoneForUnitNumber(1)).toBe("meadow");
    expect(zoneForUnitNumber(4)).toBe("meadow");
    expect(zoneForUnitNumber(5)).toBe("cove");
    expect(zoneForUnitNumber(8)).toBe("cove");
    expect(zoneForUnitNumber(9)).toBe("forest");
    expect(zoneForUnitNumber(13)).toBe("forest");
  });

  it("stacks painted plates and sits a node on every cream pad", () => {
    expect(CANDY_ZONE_STACK).toEqual(["forest", "cove", "meadow"]);
    expect(CANDY_ZONE_FILES.meadow).toBe("candy-zones/meadow.png");
    expect(CANDY_ZONE_FILES.cove).toBe("candy-zones/cove.png");
    expect(CANDY_ZONE_FILES.forest).toBe("candy-zones/forest.png");
    expect(ZONE_PAD_COUNTS.meadow).toBe(14);
    expect(ZONE_PAD_COUNTS.cove).toBe(14);
    expect(ZONE_PAD_COUNTS.forest).toBe(13);
    expect(GRADE3_PATH_PADS).toHaveLength(41);
    expect(GRADE3_PATH_PADS.filter((p) => p.zone === "meadow")).toHaveLength(14);
    expect(GRADE3_PATH_PADS.filter((p) => p.zone === "cove")).toHaveLength(14);
    expect(GRADE3_PATH_PADS.filter((p) => p.zone === "forest")).toHaveLength(13);
    expect(GRADE3_PATH_PADS.filter((p) => p.unitNumber !== null)).toHaveLength(13);
    expect(plateToMapPos("forest", { x: 50, y: 0 })).toEqual({ x: 50, y: 0 });
    expect(plateToMapPos("meadow", { x: 50, y: 100 }).y).toBeCloseTo(100);
    expect(plateToMapPos("cove", { x: 50, y: 0 }).y).toBeCloseTo(((1 - PLATE_OVERLAP) / plateSpan()) * 100);
    expect(GRADE3_PATH_NODES[0]!.y).toBeGreaterThan(88);
    expect(GRADE3_PATH_NODES[12]!.y).toBeLessThan(8);
    expect(displayUnitStars(0, 15)).toBe(0);
    expect(displayUnitStars(5, 15)).toBe(1);
    expect(displayUnitStars(15, 15)).toBe(3);
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
    expect(padIsFogged({ x: 50, y: 2 }, 1)).toBe(true);
    expect(fogCoverPercent(1)).toBeGreaterThan(40);
    expect(fogCoverPercent(13)).toBe(0);
  });

  it("hops the last owned squishee, else the familiar first peek face", () => {
    expect(pathHopperId([])).toBe("peach");
    expect(pathHopperId(["frog", "cat"])).toBe("cat");
    expect(pathHopperId(["not-a-toy"])).toBe("peach");
  });
});
