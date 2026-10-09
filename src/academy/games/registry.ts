import { sheetHref as sheetPath } from "../paths";
import type { Grade } from "../model";
import { addGame } from "./add";
import { timeGame } from "./time";
import { timesGame } from "./times";
import type { GameModule, LevelDef } from "./types";

/**
 * Launch games, in home-card order. Adding a game is: implement a GameModule,
 * append it here, and add a worksheet HTML entry. See docs/ADDING_A_GAME.md.
 */
export const GAMES = [timesGame, addGame, timeGame] as const;

export type GameId = (typeof GAMES)[number]["id"];

const BY_ID = new Map<string, GameModule>(GAMES.map((game) => [game.id, game]));

export function isGameId(value: unknown): value is GameId {
  return typeof value === "string" && BY_ID.has(value);
}

export function gameById(id: string | undefined): GameModule | undefined {
  if (!id) return undefined;
  return BY_ID.get(id);
}

export function gameForScreen(screen: string | undefined): GameModule | undefined {
  if (!screen) return undefined;
  return GAMES.find((game) => game.sheetScreen === screen);
}

export function defaultLevels(grade: Grade): Record<GameId, string> {
  const out = {} as Record<GameId, string>;
  for (const game of GAMES) out[game.id] = game.defaultLevel(grade);
  return out;
}

export function levelsFor(id: string): LevelDef[] {
  return gameById(id)?.levels ?? [];
}

export function pillLabel(id: string, levelId: string): string {
  const game = gameById(id);
  if (!game) return levelId;
  const level = game.levels.find((row) => row.id === levelId) ?? game.levels[0];
  if (!level) return game.title;
  return game.pill(level);
}

export function gameTitle(id: string): string {
  return gameById(id)?.title ?? id;
}

export function mascotFor(id: string): string {
  return gameById(id)?.mascot ?? "peach";
}

export function sheetHref(id: string, query = ""): string {
  return sheetPath(gameById(id)?.sheetSlug ?? id, query);
}

export function barKeys(): string[] {
  return GAMES.flatMap((game) => game.bars.map((row) => row.key));
}

export function chipKeys(): string[] {
  return GAMES.flatMap((game) => game.chips.map((row) => row.key));
}

export function skillLabel(key: string): string {
  for (const game of GAMES) {
    const label = game.skillLabel(key);
    if (label) return label;
  }
  return key;
}

export function chipLabel(key: string): string {
  for (const game of GAMES) {
    const label = game.chipLabel(key);
    if (label) return label;
  }
  return skillLabel(key);
}
