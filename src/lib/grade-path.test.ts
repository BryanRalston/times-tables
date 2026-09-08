import { describe, expect, it } from "vitest";
import { UNITS } from "./curriculum";
import {
  CANDY_ZONE_FILES,
  CANDY_ZONE_STACK,
  GRADE3_PATH_NODES,
  displayUnitStars,
  fogCoverPercent,
  lastClearUnitNumber,
  nodeIsFogged,
  plateToMapPos,
  zoneForUnitNumber,
  zoneIsFogged,
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

  it("stacks painted plates and sits nodes on each zone’s cream path", () => {
    expect(CANDY_ZONE_STACK).toEqual(["forest", "cove", "meadow"]);
    expect(CANDY_ZONE_FILES.meadow).toBe("candy-zones/meadow.png");
    expect(CANDY_ZONE_FILES.cove).toBe("candy-zones/cove.png");
    expect(CANDY_ZONE_FILES.forest).toBe("candy-zones/forest.png");
    expect(plateToMapPos("forest", { x: 50, y: 0 })).toEqual({ x: 50, y: 0 });
    expect(plateToMapPos("cove", { x: 50, y: 0 }).y).toBeCloseTo(100 / 3);
    expect(plateToMapPos("meadow", { x: 50, y: 100 }).y).toBe(100);
    expect(GRADE3_PATH_NODES[0]!.y).toBeGreaterThan(90);
    expect(GRADE3_PATH_NODES[12]!.y).toBeLessThan(8);
    for (let i = 0; i < 4; i++) expect(GRADE3_PATH_NODES[i]!.y).toBeGreaterThan(66);
    for (let i = 4; i < 8; i++) {
      expect(GRADE3_PATH_NODES[i]!.y).toBeGreaterThan(33);
      expect(GRADE3_PATH_NODES[i]!.y).toBeLessThan(67);
    }
    for (let i = 8; i < 13; i++) expect(GRADE3_PATH_NODES[i]!.y).toBeLessThan(34);
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
    expect(fogCoverPercent(1)).toBeGreaterThan(50);
    expect(fogCoverPercent(13)).toBe(0);
  });

  it("hops the last owned squishee, else the familiar first peek face", () => {
    expect(pathHopperId([])).toBe("peach");
    expect(pathHopperId(["frog", "cat"])).toBe("cat");
    expect(pathHopperId(["not-a-toy"])).toBe("peach");
  });
});
