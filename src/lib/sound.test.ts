import { describe, expect, it } from "vitest";
import {
  hopChainGain,
  playCorrect,
  playHop,
  playLand,
  playPeek,
  playStreak,
  playWrong,
  setSoundMuted,
  soundMuted,
} from "./sound";

describe("optional sounds", () => {
  it("mutes the dings without throwing", () => {
    setSoundMuted(true);
    expect(soundMuted()).toBe(true);
    expect(() => playCorrect()).not.toThrow();
    expect(() => playWrong()).not.toThrow();
    expect(() => playStreak()).not.toThrow();
    expect(() => playHop(1, 4)).not.toThrow();
    expect(() => playLand(1, 4)).not.toThrow();
    expect(() => playPeek()).not.toThrow();
    setSoundMuted(false);
    expect(soundMuted()).toBe(false);
    expect(() => playHop()).not.toThrow();
    expect(() => playLand()).not.toThrow();
    expect(() => playPeek()).not.toThrow();
  });

  it("softens mid-chain hops so long jumps stay quiet", () => {
    expect(hopChainGain(0, 1, 0.024)).toBe(0.024);
    expect(hopChainGain(0, 2, 0.024)).toBe(0.024);
    expect(hopChainGain(1, 2, 0.024)).toBe(0.024);
    expect(hopChainGain(0, 4, 0.024)).toBe(0.024);
    expect(hopChainGain(3, 4, 0.024)).toBe(0.024);
    expect(hopChainGain(1, 4, 0.024)).toBeCloseTo(0.01632);
    expect(hopChainGain(2, 4, 0.012)).toBeLessThan(0.012);
  });
});
