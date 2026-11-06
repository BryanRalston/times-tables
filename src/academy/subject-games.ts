import { GAME_CARDS as GAMES } from "./games/catalog";

/** Which subject owns a game. Shared by subjects.ts and journey.ts (no import cycle). */
export type SubjectKey = "math" | "reading" | "spelling";
export const SUBJECT_KEYS: readonly SubjectKey[] = ["math", "reading", "spelling"];

export const READING_GAMES: readonly string[] = ["phonics", "sight"];
export const SPELLING_GAMES: readonly string[] = ["spelling"];

export function subjectKeyOf(gameId: string): SubjectKey {
  if (READING_GAMES.includes(gameId)) return "reading";
  if (SPELLING_GAMES.includes(gameId)) return "spelling";
  return "math";
}

/** Indexes into GAME_CARDS of one subject's games, island order. */
export function subjectIndexes(key: SubjectKey): number[] {
  const out: number[] = [];
  GAMES.forEach((game, index) => {
    if (subjectKeyOf(game.id) === key) out.push(index);
  });
  return out;
}
