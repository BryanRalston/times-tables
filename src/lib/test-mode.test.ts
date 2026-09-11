import { describe, expect, it } from "vitest";
import { holdPathGrade, isTestMode, parseTestMode, TEST_MODE, testAllowsGrade4, testFreeMove } from "./test-mode";

describe("test mode flag", () => {
  it("is off unless the persisted flag is exactly true", () => {
    expect(TEST_MODE).toBe("testMode");
    expect(parseTestMode(true)).toBe(true);
    expect(isTestMode(true)).toBe(true);
    expect(parseTestMode(false)).toBe(false);
    expect(parseTestMode("true")).toBe(false);
    expect(parseTestMode(1)).toBe(false);
    expect(parseTestMode(undefined)).toBe(false);
    expect(testFreeMove(true)).toBe(true);
    expect(testFreeMove(false)).toBe(false);
    expect(testAllowsGrade4(true)).toBe(true);
    expect(testAllowsGrade4(false)).toBe(false);
  });

  it("holds Grade 4 unless Test mode is on", () => {
    expect(holdPathGrade(false, 4)).toBe(3);
    expect(holdPathGrade(false, 3)).toBe(3);
    expect(holdPathGrade(true, 4)).toBe(4);
    expect(holdPathGrade(true, 3)).toBe(3);
    expect(holdPathGrade(true, "4")).toBe(4);
  });
});
