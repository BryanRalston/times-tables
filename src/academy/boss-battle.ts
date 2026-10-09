import { gameById } from "./games/registry";
import { bandFor, playWindow } from "./grade-map";
import { bossForGame } from "./bosses";
import { BOSS_LENGTH, BOSS_PASS, type Child, type Grade } from "./model";

export type BossPhase = "rally" | "cards" | "super";

/** Candy energy. A correct answer spends it. A miss does not. */
export const BOSS_HIT = 10;
export const BOSS_COMBO_BONUS = 4;
export const BOSS_SUPER_BONUS = 4;

/**
 * Kindergarten and grade 1 boss fights are not on a clock.
 * Older grades keep the usual round timer. It never costs a life.
 */
export function bossIsTimed(grade: Grade): boolean {
  switch (grade) {
    case "K":
    case "1":
      return false;
    case "2":
    case "3":
      return true;
    default: {
      const neverGrade: never = grade;
      return neverGrade;
    }
  }
}

/**
 * Question index → phase. The last question is the super question.
 * The middle of the round is hands-on cards. The opening is the rally.
 */
export function phaseForIndex(index: number, total: number): BossPhase {
  const count = Math.max(1, Math.floor(total));
  const at = Math.max(0, Math.floor(index));
  if (count <= 1 || at >= count - 1) return "super";
  const rallyCount = Math.max(1, Math.ceil((count - 1) / 2));
  if (at < rallyCount) return "rally";
  return "cards";
}

export function bossPhaseLabel(phase: BossPhase): string {
  switch (phase) {
    case "rally":
      return "Boss rally";
    case "cards":
      return "Hands-on cards";
    case "super":
      return "Super question";
    default: {
      const neverPhase: never = phase;
      return neverPhase;
    }
  }
}

/** Hits that meet the pass line. Combo damage can empty the bar a little sooner. */
export function bossMaxEnergy(total: number, crown: boolean): number {
  const safeTotal = Math.max(1, Math.floor(total));
  const hitsToPass = Math.max(1, Math.ceil(safeTotal * BOSS_PASS));
  const base = hitsToPass * BOSS_HIT;
  return crown ? base + BOSS_HIT : base;
}

export function bossDamage(combo: number, phase: BossPhase): number {
  const streak = Math.max(0, Math.floor(combo));
  let damage = BOSS_HIT;
  if (streak >= 2) damage += BOSS_COMBO_BONUS;
  if (streak >= 4) damage += BOSS_COMBO_BONUS;
  if (phase === "super") damage += BOSS_SUPER_BONUS;
  return damage;
}

export function bossEnergyAfterHit(
  energy: number,
  max: number,
  combo: number,
  phase: BossPhase,
  correct: boolean,
): number {
  const cap = Math.max(0, max);
  const current = Math.max(0, Math.min(cap, energy));
  if (!correct) return current;
  return Math.max(0, current - bossDamage(combo, phase));
}

/**
 * Levels this grade may see, including the one-step play window.
 * A "later" game with an empty window falls back to the core band
 * so a boss still has something kind to ask.
 */
export function bossAllowedLevels(gameId: string, grade: Grade, challengeAhead: boolean): string[] {
  const game = gameById(gameId);
  if (!game || game.levels.length === 0) return [];
  const ids = game.levels.map((row) => row.id);
  const window = playWindow(ids, gameId, grade, challengeAhead);
  if (window.ids.length > 0) return [...window.ids];
  const core = (bandFor(gameId, grade)?.levels ?? []).filter((id) => ids.includes(id));
  return core.length > 0 ? [...core] : ids.slice(0, 1);
}

/**
 * Level id for each boss question. Gold Crown uses the top of the allowed window.
 * A normal boss steps up once only when that step is still inside the window.
 */
export function bossQuestionLevels(
  gameId: string,
  level: string,
  grade: Grade,
  crown: boolean,
  count = BOSS_LENGTH,
  challengeAhead = false,
): string[] {
  const allowed = bossAllowedLevels(gameId, grade, challengeAhead);
  if (allowed.length === 0) return [];
  const current = Math.max(0, allowed.indexOf(level));
  const at = allowed.includes(level) ? current : 0;
  const hardIndex = crown ? allowed.length - 1 : Math.min(allowed.length - 1, at + 1);
  const safeId = allowed[at]!;
  const hardId = allowed[hardIndex]!;
  const total = Math.max(1, Math.floor(count));
  const out: string[] = [];
  for (let i = 0; i < total; i++) {
    const phase = phaseForIndex(i, total);
    const useHard = crown || phase === "super" || i % 2 === 0 || safeId === hardId;
    out.push(useHard ? hardId : safeId);
  }
  return out;
}

/** First befriend grants a trophy and a look. A Gold Crown win adds the crown. */
export function grantBossPrize(child: Child, gameId: string, won: boolean, crown: boolean): Child {
  if (!won) return child;
  const boss = bossForGame(gameId);
  const trophies = child.trophies.includes(boss.trophyId) ? child.trophies : [...child.trophies, boss.trophyId];
  const bossLooks = child.bossLooks.includes(boss.cosmeticId) ? child.bossLooks : [...child.bossLooks, boss.cosmeticId];
  const equippedLook = child.equippedLook || boss.cosmeticId;
  const goldCrowns = crown && !child.goldCrowns.includes(gameId) ? [...child.goldCrowns, gameId] : child.goldCrowns;
  if (
    trophies === child.trophies &&
    bossLooks === child.bossLooks &&
    equippedLook === child.equippedLook &&
    goldCrowns === child.goldCrowns
  ) {
    return child;
  }
  return { ...child, trophies, bossLooks, equippedLook, goldCrowns };
}

export function wearBossLook(child: Child, id: string): Child {
  if (id === "") return child.equippedLook ? { ...child, equippedLook: "" } : child;
  if (!child.bossLooks.includes(id)) return child;
  if (child.equippedLook === id) return child;
  return { ...child, equippedLook: id };
}
