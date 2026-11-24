import type { Rng } from "@/lib/rng";
import { BOSS_LENGTH, type Grade } from "../model";
import { balanceGame } from "./balance";
import { fractionsGame } from "./fractions";
import { patternsGame } from "./patterns";
import { variablesGame } from "./variables";
import type { ChoiceQ, GameModule, SheetItem } from "./types";

/**
 * Grade 6 Keystone: one boss that mixes the grade 6 levels that are live.
 * Every card comes from its own game, so its picture, tiles, and checks are
 * the same ones the child already met on that island.
 */
export interface KeystoneStrand {
  game: GameModule;
  /** Grade 6 levels of that game this strand may ask. */
  levels: readonly string[];
}

export const KEYSTONE_STRANDS: readonly KeystoneStrand[] = [
  { game: variablesGame, levels: ["exprEval"] },
  { game: variablesGame, levels: ["exponents"] },
  { game: fractionsGame, levels: ["fracDiv"] },
  { game: patternsGame, levels: ["gcfLcm"] },
  { game: balanceGame, levels: ["addsub", "times", "divide", "mix"] },
];

/** Every skill the Keystone can serve, as `game:level`. */
export const KEYSTONE_SKILLS: readonly string[] = KEYSTONE_STRANDS.flatMap((row) =>
  row.levels.map((level) => `${row.game.id}:${level}`),
);

export const KEYSTONE_GRADE: Grade = "6";

function strandFor(level: string): KeystoneStrand | undefined {
  return KEYSTONE_STRANDS.find((row) => row.levels.includes(level) || (row.levels.length === 1 && row.game.id === level));
}

function fromStrand(rng: Rng, strand: KeystoneStrand, level: string | undefined, prefer: string[] = []): ChoiceQ {
  const use = level && strand.levels.includes(level) ? level : rng.pick(strand.levels);
  return strand.game.makeQuestion(rng, use, prefer);
}

/** "review" draws any strand; a strand's own level id (from "Try one like it") stays in that strand.
 *  The Keystone island is "review", not "mix", so a Balance Scale "mix" card can be tried again. */
export function makeKeystoneQuestion(rng: Rng, level: string, prefer: string[] = []): ChoiceQ {
  const strand = level === "review" ? undefined : strandFor(level);
  if (strand) return fromStrand(rng, strand, level, prefer);
  return fromStrand(rng, rng.pick(KEYSTONE_STRANDS), undefined, prefer);
}

/**
 * The boss round: five different strands, so a fight always mixes skills.
 * Grades below 6 never get a Keystone fight.
 */
export function makeKeystoneBossRound(rng: Rng, grade: Grade | undefined, prefer: string[] = []): ChoiceQ[] {
  if (grade !== KEYSTONE_GRADE) return [];
  const strands = rng.shuffle(KEYSTONE_STRANDS).slice(0, Math.min(BOSS_LENGTH, KEYSTONE_STRANDS.length));
  return strands.map((strand) => fromStrand(rng, strand, undefined, prefer));
}

/** One worksheet row from a random strand; a page of ten covers most of them. */
export function makeKeystoneSheetItem(rng: Rng): SheetItem {
  const strand = rng.pick(KEYSTONE_STRANDS);
  return strand.game.makeSheetItem(rng, rng.pick(strand.levels));
}
