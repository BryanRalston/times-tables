import type { AnswerMark, SkillStat } from "./model";

/** Clean correct answers in a row before the next question steps up a level. */
export const STEP_UP_AT = 3;

export interface Ladder {
  index: number;
  streak: number;
}

export type SkillHeat = "new" | "learning" | "mastered";
export type ServeReason = "stay" | "review" | "stretch";

export function startLadder(index: number): Ladder {
  return { index: Math.max(0, index), streak: 0 };
}

/**
 * A brand-new kid starts one level under the grade default so the first
 * round feels easy. Later rounds, and boss rounds, start where they left off.
 */
export function openingIndex(
  levelIndex: number,
  roundsPlayed: number,
  boss: boolean,
  bounds?: { min: number; max: number },
): number {
  const min = Math.max(0, bounds?.min ?? 0);
  const max = bounds?.max ?? Number.POSITIVE_INFINITY;
  const index = Math.max(min, Math.min(max, Math.max(0, levelIndex)));
  if (boss || roundsPlayed > 0) return index;
  return Math.max(min, index - 1);
}

/**
 * First round of a game drops one level under the grade start.
 * If Play already saved that easier level, do not drop again.
 */
export function openingForRound(opts: {
  savedIndex: number;
  startIndex: number;
  roundsPlayed: number;
  boss: boolean;
  bounds?: { min: number; max: number };
}): number {
  const min = Math.max(0, opts.bounds?.min ?? 0);
  const max = opts.bounds?.max ?? Number.POSITIVE_INFINITY;
  const saved = Math.max(min, Math.min(max, Math.max(0, opts.savedIndex)));
  const placed = opts.roundsPlayed <= 0 && !opts.boss && opts.startIndex > saved;
  if (placed) return saved;
  return openingIndex(saved, opts.roundsPlayed, opts.boss, opts.bounds);
}

/** Step up after a clean streak. Step down after a miss. Stay inside the ladder. */
export function stepLadder(ladder: Ladder, levelCount: number, ok: boolean, bounds?: { min: number; max: number }): Ladder {
  const count = Math.max(1, levelCount);
  const min = Math.max(0, Math.min(count - 1, bounds?.min ?? 0));
  const max = Math.max(min, Math.min(count - 1, bounds?.max ?? count - 1));
  const index = Math.max(min, Math.min(max, ladder.index));
  if (!ok) return { index: Math.max(min, index - 1), streak: 0 };
  const streak = ladder.streak + 1;
  if (streak >= STEP_UP_AT && index < max) return { index: index + 1, streak: 0 };
  return { index, streak };
}

/** Same bar as mastery on the grown-ups page: 80% across at least five tries. */
export function skillHeat(stat: SkillStat | undefined): SkillHeat {
  if (!stat) return "new";
  const n = stat.ok + stat.miss;
  if (n <= 0) return "new";
  if (n >= 5 && stat.ok / n >= 0.8) return "mastered";
  return "learning";
}

export function skillKeyForLevel(gameId: string, levelId: string): string {
  return `${gameId}:${levelId}`;
}

/**
 * Mostly follow the ladder. About one question in five revisits a lower skill
 * that has already been seen (the rustiest one). A mastered rung stretches up.
 */
export function pickServeIndex(opts: {
  ladderIndex: number;
  levelCount: number;
  heats: readonly SkillHeat[];
  roll: number;
  minIndex?: number;
  maxIndex?: number;
}): { index: number; reason: ServeReason } {
  const count = Math.max(1, opts.levelCount);
  const min = Math.max(0, Math.min(count - 1, opts.minIndex ?? 0));
  const max = Math.max(min, Math.min(count - 1, opts.maxIndex ?? count - 1));
  const ladder = Math.max(min, Math.min(max, opts.ladderIndex));
  const roll = Math.min(0.999, Math.max(0, opts.roll));
  const seenBelow: number[] = [];
  for (let i = min; i < ladder; i++) {
    const heat = opts.heats[i] ?? "new";
    if (heat !== "new") seenBelow.push(i);
  }
  if (roll < 0.2 && seenBelow.length > 0) {
    let pick = seenBelow[0]!;
    let best = reviewRank(opts.heats[pick] ?? "new");
    for (const i of seenBelow) {
      const rank = reviewRank(opts.heats[i] ?? "new");
      if (rank < best) {
        best = rank;
        pick = i;
      }
    }
    return { index: pick, reason: "review" };
  }
  const here = opts.heats[ladder] ?? "new";
  if (here === "mastered" && ladder < max && roll < 0.75) {
    return { index: ladder + 1, reason: "stretch" };
  }
  return { index: ladder, reason: "stay" };
}

function reviewRank(heat: SkillHeat): number {
  switch (heat) {
    case "learning":
      return 0;
    case "mastered":
      return 1;
    case "new":
      return 2;
    default: {
      const neverHeat: never = heat;
      return neverHeat;
    }
  }
}

/**
 * Level index for each question. `heats` is a snapshot; the ladder still
 * moves with each outcome. Rolls are in 0..1, one per question.
 */
export function servePlan(opts: {
  startIndex: number;
  levelCount: number;
  heats: readonly SkillHeat[];
  outcomes: readonly boolean[];
  rolls: readonly number[];
}): { index: number; reason: ServeReason }[] {
  let ladder = startLadder(opts.startIndex);
  const out: { index: number; reason: ServeReason }[] = [];
  const n = opts.outcomes.length + 1;
  for (let i = 0; i < n; i++) {
    out.push(
      pickServeIndex({
        ladderIndex: ladder.index,
        levelCount: opts.levelCount,
        heats: opts.heats,
        roll: opts.rolls[i] ?? 0.5,
      }),
    );
    if (i >= opts.outcomes.length) break;
    ladder = stepLadder(ladder, opts.levelCount, opts.outcomes[i]!);
  }
  return out;
}

/** Clean answers in one round before the ladder steps up. Short rounds use 5. */
export const CLEAN_UP_AT = 8;

/** Misses of one idea before the ladder steps down. */
export const IDEA_DOWN_AT = 2;

export type Ease = "gentle" | "steady" | "firm";

/** This game already has a scored try, so the next round can start where it left off. */
export function gameHasMarks(skills: Record<string, { ok: number; miss: number }>, gameId: string): boolean {
  const prefix = `${gameId}:`;
  for (const [key, stat] of Object.entries(skills)) {
    if (!key.startsWith(prefix)) continue;
    if (stat.ok + stat.miss > 0) return true;
  }
  return false;
}

/**
 * After a miss, the next questions use the easier half of the same level.
 * A clean run of four uses the harder half. The level itself still waits
 * for the mastery clock.
 */
export function easeFromRound(opts: { combo: number; missed: boolean }): Ease {
  if (opts.missed && opts.combo < 2) return "gentle";
  if (opts.combo >= 4) return "firm";
  return "steady";
}

export function easeOf(prefer: readonly string[]): Ease {
  if (prefer.includes("ease:gentle")) return "gentle";
  if (prefer.includes("ease:firm")) return "firm";
  return "steady";
}

/** Inclusive range. Steady returns the inputs. Gentle keeps the lower half. Firm keeps the upper half. */
export function easeSpan(lo: number, hi: number, ease: Ease): { lo: number; hi: number } {
  const low = Math.min(lo, hi);
  const high = Math.max(lo, hi);
  if (ease === "steady" || high <= low) return { lo: low, hi: high };
  const span = high - low;
  if (ease === "gentle") return { lo: low, hi: low + Math.floor(span / 2) };
  return { lo: Math.min(high, low + Math.ceil(span / 2)), hi: high };
}

export interface MasteryClock {
  clean: number;
  answered: number;
  promoted: boolean;
  ideaMisses: Record<string, number>;
}

export type MasteryShift = "up" | "down" | "stay";

export function freshMastery(): MasteryClock {
  return { clean: 0, answered: 0, promoted: false, ideaMisses: {} };
}

/**
 * 8 clean answers out of 10, with those answers not using the worked example,
 * steps up once. Two misses on the same idea steps down. A short first round
 * uses five clean answers instead of eight.
 */
export function clockMastery(
  clock: MasteryClock,
  event: { ok: boolean; idea: string; assisted: boolean },
  stepUpAt = CLEAN_UP_AT,
): { clock: MasteryClock; shift: MasteryShift } {
  const ideaMisses = { ...clock.ideaMisses };
  let clean = clock.clean;
  let promoted = clock.promoted;
  const answered = clock.answered + 1;
  let shift: MasteryShift = "stay";
  if (event.ok && !event.assisted) {
    clean += 1;
    const bar = Math.max(1, stepUpAt);
    if (!promoted && clean >= bar && clean / answered >= 0.8) {
      promoted = true;
      shift = "up";
    }
  } else if (!event.ok) {
    const next = (ideaMisses[event.idea] ?? 0) + 1;
    ideaMisses[event.idea] = next;
    if (next >= IDEA_DOWN_AT && next % IDEA_DOWN_AT === 0) shift = "down";
  }
  return { clock: { clean, answered, promoted, ideaMisses }, shift };
}

/** Move one rung and clear the streak. Stays inside the grade window. */
export function moveLadder(ladder: Ladder, levelCount: number, dir: -1 | 1, bounds?: { min: number; max: number }): Ladder {
  const count = Math.max(1, levelCount);
  const min = Math.max(0, Math.min(count - 1, bounds?.min ?? 0));
  const max = Math.max(min, Math.min(count - 1, bounds?.max ?? count - 1));
  const index = Math.max(min, Math.min(max, ladder.index));
  const next = Math.max(min, Math.min(max, index + dir));
  return { index: next, streak: 0 };
}

export function cloneSkills(skills: Record<string, SkillStat>): Record<string, SkillStat> {
  const out: Record<string, SkillStat> = {};
  for (const [key, stat] of Object.entries(skills)) out[key] = { ok: stat.ok, miss: stat.miss };
  return out;
}

function bump(skills: Record<string, SkillStat>, key: string, ok: boolean) {
  if (!key) return;
  const prev = skills[key] ?? { ok: 0, miss: 0 };
  skills[key] = { ok: prev.ok + (ok ? 1 : 0), miss: prev.miss + (ok ? 0 : 1) };
}

/**
 * Record one outcome. An unscored learning miss is a single miss so the skill
 * can return. It does not also count as a failed try.
 */
export function noteMark(skills: Record<string, SkillStat>, mark: AnswerMark): void {
  const keys = [mark.skill, ...mark.tags];
  if (mark.factKey) keys.push(`fact:${mark.factKey}`);
  const ok = mark.unscored === true ? false : mark.ok;
  for (const key of keys) bump(skills, key, ok);
}
