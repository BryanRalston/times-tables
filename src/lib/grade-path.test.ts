import { describe, expect, it } from "vitest";
import { UNITS } from "./curriculum";
import {
  GRADE3_PATH_NODES,
  displayUnitStars,
  fogCoverPercent,
  lastClearUnitNumber,
  nodeIsFogged,
  pathSprinkles,
  pathSvgD,
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

  it("draws a climbing SVG trail and scales stars to three", () => {
    const d = pathSvgD();
    expect(d.startsWith("M ")).toBe(true);
    expect(d).toContain("Q ");
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
    expect(pathSprinkles().length).toBeGreaterThan(20);
  });

  it("hops the last owned squishee, else the familiar first peek face", () => {
    expect(pathHopperId([])).toBe("peach");
    expect(pathHopperId(["frog", "cat"])).toBe("cat");
    expect(pathHopperId(["not-a-toy"])).toBe("peach");
  });
});
