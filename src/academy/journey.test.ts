import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { GAMES } from "./games/registry";
import { makeBossRound } from "./games/round";
import { advanceJourney, areaOpen, blankJourney, bossReady, normalizeJourney } from "./journey";
import { BOSS_LENGTH, STOPS_PER_AREA } from "./model";
import { blankChild } from "./storage";
import { applyRound } from "./rewards";

describe("island map", () => {
  it("hops one stop per round and opens the next island after a boss win", () => {
    const first = GAMES[0]!.id;
    const second = GAMES[1]!.id;
    let journey = blankJourney();
    expect(journey.areaId).toBe(first);
    expect(bossReady(journey, first)).toBe(false);
    expect(areaOpen(journey, 0)).toBe(true);
    expect(areaOpen(journey, 1)).toBe(false);

    for (let i = 0; i < STOPS_PER_AREA - 1; i++) {
      journey = advanceJourney(journey, { game: first, correct: 8, total: 10, boss: false });
    }
    expect(journey.stop).toBe(STOPS_PER_AREA - 1);
    expect(bossReady(journey, first)).toBe(true);

    const missed = advanceJourney(journey, { game: first, correct: 1, total: BOSS_LENGTH, boss: true });
    expect(missed).toEqual(journey);

    const practice = advanceJourney(journey, { game: second, correct: 10, total: 10, boss: false });
    expect(practice).toEqual(journey);

    const next = advanceJourney(journey, { game: first, correct: 4, total: BOSS_LENGTH, boss: true });
    expect(next.areaId).toBe(second);
    expect(next.stop).toBe(0);
    expect(next.bosses).toContain(first);
    expect(areaOpen(next, 1)).toBe(true);
    expect(bossReady(next, first)).toBe(false);
  });

  it("stays on the last island after its boss and ignores a saved area that is still locked", () => {
    let journey = blankJourney();
    for (const game of GAMES) {
      for (let i = 0; i < STOPS_PER_AREA - 1; i++) {
        journey = advanceJourney(journey, { game: game.id, correct: 8, total: 10, boss: false });
      }
      journey = advanceJourney(journey, { game: game.id, correct: 5, total: BOSS_LENGTH, boss: true });
    }
    const last = GAMES[GAMES.length - 1]!.id;
    expect(journey.areaId).toBe(last);
    expect(journey.bosses).toEqual(GAMES.map((game) => game.id));
    const again = advanceJourney(journey, { game: last, correct: 10, total: 10, boss: false });
    expect(again.areaId).toBe(last);

    const clamped = normalizeJourney({ areaId: last, stop: 9, bosses: [] });
    expect(clamped.areaId).toBe(GAMES[0]!.id);
    expect(clamped.stop).toBe(STOPS_PER_AREA - 1);
  });

  it("moves the saved journey when a round in the current area ends", () => {
    const child = blankChild({ id: "kid", name: "Maya", grade: "1" });
    const next = applyRound(
      child,
      { game: GAMES[0]!.id, correct: 8, total: 10, seconds: 40, answers: [], bestCombo: 2, boss: false },
      "2026-10-09",
    );
    expect(next.journey.stop).toBe(1);
    expect(next.journey.areaId).toBe(GAMES[0]!.id);
  });

  it("mixes a short boss round that is one level harder", () => {
    const round = makeBossRound("times", "count", rngFromSeed("boss"));
    expect(round).toHaveLength(BOSS_LENGTH);
    const skills = round.map((q) => q.skill);
    expect(skills.filter((skill) => skill === "times:twos").length).toBeGreaterThanOrEqual(3);
    expect(skills).toContain("times:count");
    for (const q of round) {
      expect(q.choices).toHaveLength(4);
      expect(q.choices).toContain(q.answer);
    }
    const top = makeBossRound("add", "within100", rngFromSeed("top"));
    expect(top.every((q) => q.skill === "add:within100")).toBe(true);
  });
});
