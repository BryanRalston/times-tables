import { describe, expect, it } from "vitest";
import { playCorrect, playStreak, playWrong, setSoundMuted, soundMuted } from "./sound";

describe("optional sounds", () => {
  it("mutes the dings without throwing", () => {
    setSoundMuted(true);
    expect(soundMuted()).toBe(true);
    expect(() => playCorrect()).not.toThrow();
    expect(() => playWrong()).not.toThrow();
    expect(() => playStreak()).not.toThrow();
    setSoundMuted(false);
    expect(soundMuted()).toBe(false);
  });
});
