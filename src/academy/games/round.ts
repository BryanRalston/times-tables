import type { Rng } from "@/lib/rng";
import { BOSS_LENGTH, ROUND_LENGTH } from "../model";
import { gameById } from "./registry";
import type { ChoiceQ, LevelDef, SheetItem } from "./types";

/** The next level up, or the top level when the child is already there. */
export function harderLevel(levels: readonly LevelDef[], level: string): string {
  const idx = levels.findIndex((row) => row.id === level);
  if (idx < 0) return levels[levels.length - 1]?.id ?? level;
  return levels[Math.min(levels.length - 1, idx + 1)]!.id;
}

/**
 * Five questions. Most use the next level. The rest stay on the current level
 * so the boss is mixed, and a step harder than a normal round.
 */
export function makeBossRound(gameId: string, level: string, rng: Rng, prefer: string[] = [], ceiling?: string): ChoiceQ[] {
  const game = gameById(gameId);
  if (!game) return [];
  let safe = game.isLevel(level) ? level : game.defaultLevel("K");
  let hard = harderLevel(game.levels, safe);
  if (ceiling && game.isLevel(ceiling)) {
    const cap = game.levels.findIndex((row) => row.id === ceiling);
    const safeIndex = game.levels.findIndex((row) => row.id === safe);
    if (cap >= 0 && safeIndex > cap) safe = ceiling;
    hard = harderLevel(game.levels, safe);
    const hardIndex = game.levels.findIndex((row) => row.id === hard);
    if (cap >= 0 && hardIndex > cap) hard = ceiling;
  }
  const out: ChoiceQ[] = [];
  for (let i = 0; i < BOSS_LENGTH; i++) {
    const use = i % 2 === 0 || safe === hard ? hard : safe;
    out.push(game.makeQuestion(rng, use, prefer));
  }
  return out;
}

export function makeQuestion(gameId: string, level: string, rng: Rng, prefer: string[] = []): ChoiceQ {
  const game = gameById(gameId);
  if (!game) throw new Error(`Unknown Academy game: ${gameId}`);
  const safe = game.isLevel(level) ? level : game.defaultLevel("K");
  return game.makeQuestion(rng, safe, prefer);
}

export function makeRound(gameId: string, level: string, rng: Rng, count = ROUND_LENGTH, prefer: string[] = []): ChoiceQ[] {
  const out: ChoiceQ[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (out.length < count && guard < count * 8) {
    guard += 1;
    const q = makeQuestion(gameId, level, rng, prefer);
    const key = `${q.praise}|${q.answer}`;
    if (seen.has(key) && guard < count * 6) continue;
    seen.add(key);
    out.push(q);
  }
  while (out.length < count) out.push(makeQuestion(gameId, level, rng, prefer));
  return out;
}

export function makeSheet(opts: {
  game: string;
  level: string;
  rng: Rng;
  count?: number;
  focus?: number;
}): SheetItem[] {
  const game = gameById(opts.game);
  if (!game) return [];
  const count = opts.count ?? game.sheetCount;
  const level = game.isLevel(opts.level) ? opts.level : game.sheetDefaultLevel;
  const out: SheetItem[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (out.length < count && guard < count * 8) {
    guard += 1;
    const item = game.makeSheetItem(opts.rng, level, opts.focus);
    const key = `${item.prompt}|${item.answer}|${item.clock?.hours ?? ""}|${item.clock?.minutes ?? ""}`;
    if (seen.has(key) && guard < count * 6) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
