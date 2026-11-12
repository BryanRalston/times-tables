import type { Rng } from "@/lib/rng";
import { BOSS_LENGTH, type Grade } from "../model";
import { addGame } from "./add";
import { cubesGame } from "./cubes";
import { fractionsGame } from "./fractions";
import { gridGame } from "./grid";
import { patternsGame } from "./patterns";
import { shareGame } from "./share";
import type { ChoiceQ, GameModule, SheetItem } from "./types";

/**
 * Grade 5 Summit: one boss that mixes the grade 5 levels that are live.
 * Every card comes from its own game, so its picture, tiles, and checks are
 * the same ones the child already met on that island.
 */
export interface SummitStrand {
  game: GameModule;
  /** Grade 5 levels of that game this strand may ask. */
  levels: readonly string[];
}

export const SUMMIT_STRANDS: readonly SummitStrand[] = [
  { game: fractionsGame, levels: ["addUnlike"] },
  { game: addGame as GameModule, levels: ["decimalOps"] },
  { game: shareGame, levels: ["longDiv"] },
  { game: gridGame, levels: ["coords"] },
  { game: patternsGame, levels: ["twoRules"] },
  // Build a box is a hands-on builder, so the Summit keeps to the tap-a-tile cube cards.
  { game: cubesGame, levels: ["count", "formula", "two"] },
];

/** Every skill the Summit can serve, as `game:level`. */
export const SUMMIT_SKILLS: readonly string[] = SUMMIT_STRANDS.flatMap((row) => row.levels.map((level) => `${row.game.id}:${level}`));

export const SUMMIT_GRADE: Grade = "5";

function strandFor(level: string): SummitStrand | undefined {
  return SUMMIT_STRANDS.find((row) => row.levels.includes(level) || row.game.id === level);
}

function fromStrand(rng: Rng, strand: SummitStrand, level: string | undefined, prefer: string[] = []): ChoiceQ {
  const use = level && strand.levels.includes(level) ? level : rng.pick(strand.levels);
  return strand.game.makeQuestion(rng, use, prefer);
}

/** "mix" draws any strand; a strand's own level id (from "Try one like it") stays in that strand. */
export function makeSummitQuestion(rng: Rng, level: string, prefer: string[] = []): ChoiceQ {
  const strand = level === "mix" ? undefined : strandFor(level);
  if (strand) return fromStrand(rng, strand, level, prefer);
  return fromStrand(rng, rng.pick(SUMMIT_STRANDS), undefined, prefer);
}

/**
 * The boss round: five different strands, so a fight always mixes skills.
 * Grades below 5 never get a Summit fight.
 */
export function makeSummitBossRound(rng: Rng, grade: Grade | undefined, prefer: string[] = []): ChoiceQ[] {
  if (grade !== SUMMIT_GRADE) return [];
  const strands = rng.shuffle(SUMMIT_STRANDS).slice(0, Math.min(BOSS_LENGTH, SUMMIT_STRANDS.length));
  return strands.map((strand) => fromStrand(rng, strand, undefined, prefer));
}

/** One worksheet row from a random strand; a page of ten covers most of them. */
export function makeSummitSheetItem(rng: Rng): SheetItem {
  const strand = rng.pick(SUMMIT_STRANDS);
  return strand.game.makeSheetItem(rng, rng.pick(strand.levels));
}
