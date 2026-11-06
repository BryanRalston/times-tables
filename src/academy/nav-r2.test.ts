import { describe, expect, it } from "vitest";
import { GAME_CARDS as GAMES, gameCard } from "./games/catalog";
import { tierKey, tierWindow, type Tier } from "./grade-map";
import { advanceJourney, areaOpen, bossReady, gateBefore, normalizeJourney, parseJourney, subjectSpot } from "./journey";
import { BOSS_LENGTH, STOPS_PER_AREA, type Grade, type Journey } from "./model";

const GRADES: Grade[] = ["PK", "K", "1", "2", "3", "4", "5"];
import { bossStoneState, levelStones, roundsToBoss } from "./stones";
import { blankChild, parseSave, SAVE_VERSION } from "./storage";
import { subjectIndexes, subjectKeyOf, SUBJECT_KEYS } from "./subject-games";
import { nextFor } from "./subjects";

const indexOf = (id: string) => GAMES.findIndex((game) => game.id === id);

function beat(journey: Journey, id: string, grade?: Grade): Journey {
  let j = journey;
  for (let i = 0; i < STOPS_PER_AREA - 1; i++) j = advanceJourney(j, { game: id, correct: 8, total: 10, boss: false }, grade);
  return advanceJourney(j, { game: id, correct: BOSS_LENGTH, total: BOSS_LENGTH, boss: true }, grade);
}

describe("per-subject unlock chains", () => {
  it("opens the first island of every subject with no bosses beaten", () => {
    const fresh: Journey = { areaId: GAMES[0]!.id, stop: 0, bosses: [] };
    for (const key of SUBJECT_KEYS) {
      const chain = subjectIndexes(key);
      if (chain.length === 0) continue;
      expect(areaOpen(fresh, chain[0]!)).toBe(true);
    }
    expect(areaOpen(fresh, indexOf("spelling"))).toBe(true);
  });

  it("never locks Spelling or Reading behind Math bosses", () => {
    const fresh: Journey = { areaId: GAMES[0]!.id, stop: 0, bosses: [] };
    for (const grade of GRADES) {
      expect(areaOpen(fresh, indexOf("spelling"), grade)).toBe(true);
      expect(areaOpen(fresh, subjectIndexes("reading")[0]!, grade)).toBe(true);
    }
  });

  it("only beating a Math boss opens the next Math island, and leaves other subjects alone", () => {
    const math = subjectIndexes("math");
    const first = GAMES[math[0]!]!.id;
    const second = math[1]!;
    let j = normalizeJourney({ areaId: first, stop: 0, bosses: [] });
    expect(areaOpen(j, second)).toBe(false);
    j = beat(j, first);
    expect(areaOpen(j, second)).toBe(true);
    expect(subjectSpot(j, "math").areaId).toBe(GAMES[second]!.id);
    expect(subjectSpot(j, "spelling").areaId).toBe("spelling");
    expect(subjectSpot(j, "spelling").stop).toBe(0);
  });

  it("keeps a separate stop per subject", () => {
    let j = normalizeJourney({ areaId: GAMES[0]!.id, stop: 0, bosses: [] });
    j = advanceJourney(j, { game: "spelling", correct: 8, total: 10, boss: false });
    j = advanceJourney(j, { game: "spelling", correct: 8, total: 10, boss: false });
    j = advanceJourney(j, { game: subjectSpot(j, "math").areaId, correct: 8, total: 10, boss: false });
    expect(subjectSpot(j, "spelling").stop).toBe(2);
    expect(subjectSpot(j, "math").stop).toBe(1);
  });

  it("puts the Spelling boss on Spelling's own trail", () => {
    let j = normalizeJourney({ areaId: GAMES[0]!.id, stop: 0, bosses: [] }, "2");
    for (let i = 0; i < STOPS_PER_AREA - 1; i++) j = advanceJourney(j, { game: "spelling", correct: 8, total: 10, boss: false }, "2");
    expect(bossReady(j, "spelling", "2")).toBe(true);
    const child = { ...blankChild({ name: "Ada", grade: "2" }), journey: j };
    const next = nextFor(child, "spelling");
    if (next.reason !== "weak") expect(next.game).toBe("spelling");
  });
});

describe("same-subject boss hints", () => {
  it("names only a game in the locked island's own subject", () => {
    const fresh: Journey = { areaId: GAMES[0]!.id, stop: 0, bosses: [] };
    for (const grade of [undefined, ...GRADES] as (Grade | undefined)[]) {
      GAMES.forEach((game, index) => {
        if (areaOpen(fresh, index, grade)) return;
        const gate = gateBefore(fresh, index, grade);
        expect(gate).not.toBe("");
        expect(subjectKeyOf(gate)).toBe(subjectKeyOf(game.id));
      });
    }
  });
});

describe("save migration to per-subject trails", () => {
  it("keeps every island that was open under the old single path", () => {
    const bosses = GAMES.slice(0, 6).map((game) => game.id);
    const legacy = { areaId: GAMES[6]!.id, stop: 2, bosses };
    const j = parseJourney(legacy, "3");
    expect(j.bosses).toEqual(bosses);
    for (let i = 0; i <= 6; i++) expect(areaOpen(j, i, "3")).toBe(true);
    const key = subjectKeyOf(GAMES[6]!.id);
    expect(subjectSpot(j, key).areaId).toBe(GAMES[6]!.id);
    expect(subjectSpot(j, key).stop).toBe(2);
  });

  it("loads an old v13 save with no trails, keeps progress, and round-trips", () => {
    const old = blankChild({ id: "kid", name: "Maya", grade: "3" });
    const bosses = GAMES.slice(0, 4).map((game) => game.id);
    const raw = {
      version: 13,
      activeId: "kid",
      sound: true,
      lang: "en",
      langChosen: true,
      children: [{ ...old, journey: { areaId: GAMES[4]!.id, stop: 1, bosses } }],
    };
    const save = parseSave(JSON.parse(JSON.stringify(raw)));
    expect(save.version).toBe(SAVE_VERSION);
    const kid = save.children[0]!;
    expect(kid.journey.bosses).toEqual(bosses);
    expect(kid.journey.trails?.spelling?.areaId).toBe("spelling");
    for (let i = 0; i <= 4; i++) expect(areaOpen(kid.journey, i, "3")).toBe(true);
    const again = parseSave(JSON.parse(JSON.stringify(save)));
    expect(again.children[0]!.journey).toEqual(kid.journey);
  });
});

describe("level stones", () => {
  const tiers: Tier[] = ["easy", "medium", "hard"];
  it("shows only grade-open levels for each tier (Hard adds at most one past)", () => {
    for (const grade of GRADES) {
      for (const game of GAMES) {
        for (const tier of tiers) {
          const child = { ...blankChild({ name: "A", grade }), tiers: { [tierKey(grade, game.id)]: tier } };
          const stones = levelStones(child, game.id);
          const win = tierWindow(gameCard(game.id)!.levels.map((row) => row.id), game.id, grade, false, tier);
          if (win.offer === "later") {
            expect(stones).toEqual([]);
            continue;
          }
          for (const stone of stones) expect(win.ids).toContain(stone.level);
          const medium = tierWindow(gameCard(game.id)!.levels.map((row) => row.id), game.id, grade, false, "medium");
          const ids = gameCard(game.id)!.levels.map((row) => row.id);
          const top = Math.max(...stones.map((s) => ids.indexOf(s.level)), -1);
          if (stones.length > 0) expect(top).toBeLessThanOrEqual(medium.max + 1);
          expect(stones.filter((s) => s.state === "now").length).toBe(stones.length > 0 ? 1 : 0);
        }
      }
    }
  });

  it("marks mastered levels done and locks stones far ahead", () => {
    const child = blankChild({ name: "A", grade: "3" });
    const stones = levelStones(child, "times");
    const now = stones.findIndex((s) => s.state === "now");
    stones.forEach((s, i) => {
      if (i > now + 1) expect(s.state).toBe("locked");
      if (i === now + 1) expect(s.state).toBe("open");
    });
  });

  it("keeps stones strictly in order: never a checked stone after the current one", () => {
    for (const grade of GRADES) {
      for (const game of GAMES) {
        const kid = blankChild({ name: "A", grade });
        const skills: Record<string, { ok: number; miss: number }> = {};
        for (const row of gameCard(game.id)!.levels) skills[`${game.id}:${row.id}`] = { ok: 9, miss: 0 };
        const stones = levelStones({ ...kid, skills }, game.id);
        const now = stones.findIndex((s) => s.state === "now");
        stones.forEach((s, i) => {
          if (i < now) expect(s.state).toBe("done");
          if (i > now) expect(s.state).not.toBe("done");
        });
      }
    }
  });
});

describe("one path ends in the boss stone", () => {
  it("is locked, then now when the boss is ready, then done when beaten", () => {
    const id = subjectSpot(normalizeJourney({ areaId: "spelling", stop: 0, bosses: [] }, "2"), "spelling").areaId;
    let j = normalizeJourney({ areaId: GAMES[0]!.id, stop: 0, bosses: [] }, "2");
    expect(bossStoneState(j, id, "2")).toBe("locked");
    expect(roundsToBoss(j, id, "2")).toBe(STOPS_PER_AREA - 1);
    for (let i = 0; i < STOPS_PER_AREA - 1; i++) j = advanceJourney(j, { game: id, correct: 8, total: 10, boss: false }, "2");
    expect(bossStoneState(j, id, "2")).toBe("now");
    expect(roundsToBoss(j, id, "2")).toBe(0);
    j = advanceJourney(j, { game: id, correct: BOSS_LENGTH, total: BOSS_LENGTH, boss: true }, "2");
    expect(bossStoneState(j, id, "2")).toBe("done");
  });
});

