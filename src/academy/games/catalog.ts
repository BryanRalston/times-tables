import { show } from "../i18n";
import type { Grade } from "../model";
import { sheetHref as sheetPath } from "../paths";
import { GAME_CARDS, type GameId } from "./cards";
import type { GameCard, LevelDef } from "./types";

export { GAME_CARDS, type GameId } from "./cards";

const BY_ID = new Map<string, GameCard>(GAME_CARDS.map((game) => [game.id, game]));

export function isGameId(value: unknown): value is GameId {
  return typeof value === "string" && BY_ID.has(value);
}

export function gameCard(id: string | undefined): GameCard | undefined {
  if (!id) return undefined;
  return BY_ID.get(id);
}

export function gameForScreen(screen: string | undefined): GameCard | undefined {
  if (!screen) return undefined;
  return GAME_CARDS.find((game) => game.sheetScreen === screen);
}

export function defaultLevels(grade: Grade): Record<GameId, string> {
  const out = {} as Record<GameId, string>;
  for (const game of GAME_CARDS) out[game.id] = game.defaultLevel(grade);
  return out;
}

export function levelsFor(id: string): LevelDef[] {
  return gameCard(id)?.levels ?? [];
}

export function pillLabel(id: string, levelId: string): string {
  const game = gameCard(id);
  if (!game) return levelId;
  const level = game.levels.find((row) => row.id === levelId) ?? game.levels[0];
  if (!level) return game.title;
  return game.pill(level);
}

export function gameTitle(id: string): string {
  return gameCard(id)?.title ?? id;
}

export function mascotFor(id: string): string {
  return gameCard(id)?.mascot ?? "peach";
}

export function sheetHref(id: string, query = ""): string {
  return sheetPath(gameCard(id)?.sheetSlug ?? id, query);
}

export function barKeys(): string[] {
  return GAME_CARDS.flatMap((game) => game.bars.map((row) => row.key));
}

export function chipKeys(): string[] {
  return GAME_CARDS.flatMap((game) => game.chips.map((row) => row.key));
}

export function skillLabel(key: string): string {
  for (const game of GAME_CARDS) {
    const label = game.skillLabel(key);
    if (label) return show(label);
  }
  return key;
}

export function chipLabel(key: string): string {
  for (const game of GAME_CARDS) {
    const label = game.chipLabel(key);
    if (label) return show(label);
  }
  return skillLabel(key);
}
