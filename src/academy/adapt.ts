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
export function openingIndex(levelIndex: number, roundsPlayed: number, boss: boolean): number {
  const index = Math.max(0, levelIndex);
  if (boss || roundsPlayed > 0) return index;
  return Math.max(0, index - 1);
}

/** Step up after a clean streak. Step down after a miss. Stay inside the ladder. */
export function stepLadder(ladder: Ladder, levelCount: number, ok: boolean): Ladder {
  const count = Math.max(1, levelCount);
  const index = Math.max(0, Math.min(count - 1, ladder.index));
  if (!ok) return { index: Math.max(0, index - 1), streak: 0 };
  const streak = ladder.streak + 1;
  if (streak >= STEP_UP_AT && index < count - 1) return { index: index + 1, streak: 0 };
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
}): { index: number; reason: ServeReason } {
  const count = Math.max(1, opts.levelCount);
  const ladder = Math.max(0, Math.min(count - 1, opts.ladderIndex));
  const roll = Math.min(0.999, Math.max(0, opts.roll));
  const seenBelow: number[] = [];
  for (let i = 0; i < ladder; i++) {
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
  if (here === "mastered" && ladder < count - 1 && roll < 0.75) {
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

/** Record a mark. A taught retry also counts the miss that opened the example. */
export function noteMark(skills: Record<string, SkillStat>, mark: AnswerMark): void {
  const keys = [mark.skill, ...mark.tags];
  if (mark.factKey) keys.push(`fact:${mark.factKey}`);
  for (const key of keys) {
    if (mark.taught) bump(skills, key, false);
    bump(skills, key, mark.ok);
  }
}
