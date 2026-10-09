import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import {
  BOSS_COMBO_BONUS,
  BOSS_HIT,
  BOSS_SUPER_BONUS,
  bossDamage,
  bossEnergyAfterHit,
  bossIsTimed,
  bossMaxEnergy,
  bossQuestionLevels,
  grantBossPrize,
  phaseForIndex,
} from "./boss-battle";
import { bossForGame } from "./bosses";
import { GAMES } from "./games/registry";
import { makeBossRound } from "./games/round";
import { bandFor, playWindow } from "./grade-map";
import { BOSS_LENGTH, STOPS_PER_AREA, type Grade } from "./model";
import { applyRound } from "./rewards";
import { SAVE_VERSION, blankChild, parseSave } from "./storage";

describe("boss battle", () => {
  it("drops energy on a hit, adds combo and super damage, and ignores a miss", () => {
    const max = bossMaxEnergy(BOSS_LENGTH, false);
    expect(max).toBe(Math.ceil(BOSS_LENGTH * 0.6) * BOSS_HIT);
    expect(bossDamage(1, "rally")).toBe(BOSS_HIT);
    expect(bossDamage(2, "rally")).toBe(BOSS_HIT + BOSS_COMBO_BONUS);
    expect(bossDamage(4, "super")).toBe(BOSS_HIT + BOSS_COMBO_BONUS + BOSS_COMBO_BONUS + BOSS_SUPER_BONUS);

    let energy = max;
    energy = bossEnergyAfterHit(energy, max, 1, "rally", false);
    expect(energy).toBe(max);
    energy = bossEnergyAfterHit(energy, max, 1, "rally", true);
    expect(energy).toBe(max - BOSS_HIT);
    energy = bossEnergyAfterHit(energy, max, 2, "cards", true);
    expect(energy).toBe(max - BOSS_HIT - (BOSS_HIT + BOSS_COMBO_BONUS));
    energy = bossEnergyAfterHit(0, max, 3, "super", true);
    expect(energy).toBe(0);

    const crown = bossMaxEnergy(BOSS_LENGTH, true);
    expect(crown).toBe(max + BOSS_HIT);
    const plain = BOSS_HIT * 3;
    expect(plain).toBeLessThan(crown);
  });

  it("uses a rally, hands-on cards, and a super question", () => {
    expect([0, 1, 2, 3, 4].map((i) => phaseForIndex(i, 5))).toEqual(["rally", "rally", "cards", "cards", "super"]);
    expect(phaseForIndex(0, 1)).toBe("super");
    expect(bossIsTimed("K")).toBe(false);
    expect(bossIsTimed("1")).toBe(false);
    expect(bossIsTimed("2")).toBe(true);
    expect(bossIsTimed("3")).toBe(true);
  });

  it("keeps boss questions inside the grade band", () => {
    const grades: Grade[] = ["K", "1", "2", "3"];
    for (const game of GAMES) {
      for (const grade of grades) {
        const ids = game.levels.map((row) => row.id);
        const window = playWindow(ids, game.id, grade, false);
        const core = (bandFor(game.id, grade)?.levels ?? []).filter((id) => ids.includes(id));
        const allowed = window.ids.length > 0 ? window.ids : core.length > 0 ? core : ids.slice(0, 1);
        for (const level of game.levels) {
          for (const crown of [false, true]) {
            const plan = bossQuestionLevels(game.id, level.id, grade, crown);
            expect(plan).toHaveLength(BOSS_LENGTH);
            for (const id of plan) expect(allowed).toContain(id);
            if (crown) expect(new Set(plan)).toEqual(new Set([allowed[allowed.length - 1]]));
          }
        }
        const round = makeBossRound(game.id, game.levels[game.levels.length - 1]!.id, rngFromSeed(`${game.id}-${grade}`), [], undefined, {
          grade,
        });
        expect(round).toHaveLength(BOSS_LENGTH);
        for (const question of round) {
          const skillLevel = question.skill.split(":")[1] ?? "";
          expect(allowed).toContain(skillLevel);
          expect(question.choices).toContain(question.answer);
        }
      }
    }

    const kinder = makeBossRound("times", "toTen", rngFromSeed("kinder"), [], undefined, { grade: "K" });
    expect(kinder.every((question) => question.skill === "times:count")).toBe(true);
    const crown = makeBossRound("times", "count", rngFromSeed("crown"), [], undefined, { grade: "2", crown: true });
    expect(crown.every((question) => question.skill === "times:mix")).toBe(true);
    const moneyWindow = playWindow(
      GAMES.find((game) => game.id === "money")!.levels.map((row) => row.id),
      "money",
      "2",
      false,
    );
    const money = makeBossRound("money", "dollars", rngFromSeed("coins"), [], undefined, { grade: "2" });
    for (const question of money) {
      const skillLevel = question.skill.split(":")[1] ?? "";
      expect(moneyWindow.ids).toContain(skillLevel);
    }
  });

  it("gives every island a boss, including one that is not authored yet", () => {
    const ids = new Set<string>();
    for (const game of GAMES) {
      const boss = bossForGame(game.id);
      expect(boss.gameId).toBe(game.id);
      expect(boss.name.length).toBeGreaterThan(0);
      expect(boss.taunt.length).toBeGreaterThan(0);
      expect(ids.has(boss.cosmeticId)).toBe(false);
      expect(ids.has(boss.trophyId)).toBe(false);
      ids.add(boss.cosmeticId);
      ids.add(boss.trophyId);
    }
    const generated = bossForGame("not-a-game");
    expect(generated.name).toContain("Boss");
    expect(generated.cosmeticId).toBe("boss-look-not-a-game");
    expect(bossForGame("not-a-game").look).toBe(generated.look);
  });

  it("unlocks a trophy, a look, and a Gold Crown", () => {
    const child = blankChild({ id: "kid", name: "Maya", grade: "1" });
    const missed = grantBossPrize(child, "times", false, false);
    expect(missed).toBe(child);

    const friend = grantBossPrize(child, "times", true, false);
    const boss = bossForGame("times");
    expect(friend.trophies).toEqual([boss.trophyId]);
    expect(friend.bossLooks).toEqual([boss.cosmeticId]);
    expect(friend.equippedLook).toBe(boss.cosmeticId);
    expect(friend.goldCrowns).toEqual([]);
    expect(grantBossPrize(friend, "times", true, false)).toBe(friend);

    const today = "2026-10-09";
    const ready = { ...child, journey: { areaId: "times", stop: STOPS_PER_AREA - 1, bosses: [] } };
    const played = applyRound(
      ready,
      { game: "times", correct: 4, total: BOSS_LENGTH, seconds: 40, answers: [], boss: true },
      today,
    );
    expect(played.trophies).toContain(boss.trophyId);
    expect(played.bossLooks).toContain(boss.cosmeticId);
    expect(played.journey.bosses).toContain("times");

    const rematch = applyRound(
      played,
      { game: "times", correct: 4, total: BOSS_LENGTH, seconds: 30, answers: [], boss: true, crown: true },
      today,
    );
    expect(rematch.goldCrowns).toEqual(["times"]);
    expect(rematch.trophies).toEqual(played.trophies);

    const short = applyRound(
      child,
      { game: "add", correct: 1, total: BOSS_LENGTH, seconds: 20, answers: [], boss: true, crown: true },
      today,
    );
    expect(short.trophies).toEqual([]);
    expect(short.goldCrowns).toEqual([]);
  });

  it("migrates a version 3 save and keeps bosses already beaten", () => {
    const migrated = parseSave({
      version: 3,
      activeId: "maya",
      sound: true,
      children: [
        {
          id: "maya",
          name: "Maya",
          grade: "2",
          stars: 8,
          journey: { areaId: "add", stop: 1, bosses: ["times"] },
          levels: { times: "mix", add: "within20", time: "half", money: "make" },
        },
      ],
    });
    expect(migrated.version).toBe(SAVE_VERSION);
    const child = migrated.children[0];
    const boss = bossForGame("times");
    expect(child?.journey.bosses).toEqual(["times"]);
    expect(child?.trophies).toEqual([boss.trophyId]);
    expect(child?.bossLooks).toEqual([boss.cosmeticId]);
    expect(child?.equippedLook).toBe(boss.cosmeticId);
    expect(child?.goldCrowns).toEqual([]);
    expect(child?.stars).toBe(8);

    const fresh = parseSave({
      version: 1,
      activeId: "ava",
      children: [{ id: "ava", name: "Ava", grade: "K" }],
    });
    expect(fresh.version).toBe(SAVE_VERSION);
    expect(fresh.children[0]?.trophies).toEqual([]);
    expect(fresh.children[0]?.bossLooks).toEqual([]);
    expect(fresh.children[0]?.equippedLook).toBe("");
    expect(fresh.children[0]?.goldCrowns).toEqual([]);

    const fromV6 = parseSave({
      version: 6,
      activeId: "maya",
      sound: true,
      children: [
        {
          id: "maya",
          name: "Maya",
          grade: "2",
          journey: { areaId: "time", stop: 0, bosses: ["times"] },
          words: { "sw:the": { box: 1, ok: 1, miss: 0, streak: 1 } },
          friends: ["panda"],
          hatched: [],
          egg: "none",
        },
      ],
    });
    expect(fromV6.version).toBe(SAVE_VERSION);
    expect(fromV6.children[0]?.words["sw:the"]?.box).toBe(1);
    expect(fromV6.children[0]?.friends).toContain("panda");
    expect(fromV6.children[0]?.trophies).toEqual([boss.trophyId]);
    expect(fromV6.children[0]?.bossLooks).toEqual([boss.cosmeticId]);
    expect(fromV6.children[0]?.goldCrowns).toEqual([]);
  });
});
