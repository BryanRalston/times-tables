import { describe, expect, it } from "vitest";
import {
  applyHandAngle,
  clockAngleFromPoint,
  formatClockTime,
  pickHand,
  startClockTime,
} from "./clock";

describe("clock angle to time", () => {
  it("maps 12 / 3 / 6 / 9 o'clock from a point", () => {
    expect(clockAngleFromPoint(0, -1)).toBeCloseTo(0, 5);
    expect(clockAngleFromPoint(1, 0)).toBeCloseTo(90, 5);
    expect(clockAngleFromPoint(0, 1)).toBeCloseTo(180, 5);
    expect(clockAngleFromPoint(-1, 0)).toBeCloseTo(270, 5);
  });

  it("dragging the minute hand to a known angle writes h:mm", () => {
    expect(applyHandAngle(12, 0, "minute", 0)).toEqual({ hours: 12, minutes: 0 });
    expect(applyHandAngle(12, 0, "minute", 90)).toEqual({ hours: 12, minutes: 15 });
    expect(applyHandAngle(4, 0, "minute", 180)).toEqual({ hours: 4, minutes: 30 });
    expect(applyHandAngle(7, 10, "minute", 270)).toEqual({ hours: 7, minutes: 45 });
    expect(formatClockTime(12, 15)).toBe("12:15");
    expect(formatClockTime(4, 30)).toBe("4:30");
  });

  it("dragging the hour hand to a known angle writes the hour", () => {
    expect(applyHandAngle(12, 0, "hour", 90)).toEqual({ hours: 3, minutes: 0 });
    expect(applyHandAngle(12, 0, "hour", 0)).toEqual({ hours: 12, minutes: 0 });
    expect(applyHandAngle(1, 20, "hour", 180)).toEqual({ hours: 6, minutes: 20 });
    expect(formatClockTime(3, 0)).toBe("3:00");
  });

  it("grabbing stacked hands at 12:00 prefers the minute hand", () => {
    expect(pickHand(0, 12, 0)).toBe("minute");
  });

  it("does not start the answer clock on the prompt time", () => {
    expect(startClockTime("3:15")).toBe("12:00");
    expect(startClockTime("12:00")).toBe("3:00");
  });
});
