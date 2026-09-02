import { describe, expect, it } from "vitest";
import { activityById } from "./curriculum";
import { makeQuestion } from "./questions";
import { rngFromSeed } from "./rng";
import type { ClockData } from "./types";
import { answersMatch, questionCorrect } from "./utils";
import {
  applyHandAngle,
  clockAngleFromPoint,
  clockTimesMatch,
  displayedClockTime,
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

  it("minute plus/minus wraps the hour", () => {
    expect(formatClockTime(9, 60)).toBe("10:00");
    expect(formatClockTime(9, -1)).toBe("8:59");
    expect(formatClockTime(12, 60)).toBe("1:00");
    expect(formatClockTime(1, -1)).toBe("12:59");
    expect(formatClockTime(12, -1)).toBe("11:59");
    expect(formatClockTime(9, 59)).toBe("9:59");
  });

  it("hour plus/minus wraps 1–12", () => {
    expect(formatClockTime(12, 5)).toBe("12:05");
    expect(formatClockTime(13, 5)).toBe("1:05");
    expect(formatClockTime(0, 5)).toBe("12:05");
  });

  it("matches the answer face to ClockData hours and minutes", () => {
    expect(clockTimesMatch("9:05", 9, 5)).toBe(true);
    expect(clockTimesMatch("09:05", 9, 5)).toBe(true);
    expect(clockTimesMatch("9:5", 9, 5)).toBe(true);
    expect(clockTimesMatch("9:06", 9, 5)).toBe(false);
    expect(clockTimesMatch("8:05", 9, 5)).toBe(false);
    expect(clockTimesMatch("12:00", 12, 0)).toBe(true);
    expect(answersMatch("9:05", "9:05")).toBe(true);
    expect(displayedClockTime("", "3:15")).toBe("12:00");
    expect(displayedClockTime("9:05", "3:15")).toBe("9:05");
    const data = { hours: 9, minutes: 5, mode: "read" as const, find: "time" as const };
    expect(questionCorrect("9:05", { input: "clock", answer: "8:00", alts: [], data })).toBe(true);
    expect(questionCorrect("9:06", { input: "clock", answer: "9:05", alts: [], data })).toBe(false);
    const q = makeQuestion(activityById("u11-clock")!.activity, rngFromSeed("face:check"));
    const cd = q.data as ClockData;
    expect(questionCorrect(formatClockTime(cd.hours, cd.minutes), q)).toBe(true);
  });
});
