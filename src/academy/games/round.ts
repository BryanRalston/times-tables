import type { Rng } from "@/lib/rng";
import { ROUND_LENGTH } from "../model";
import { gameById } from "./registry";
import type { ChoiceQ, SheetItem } from "./types";

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
