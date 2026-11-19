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

/**
 * Grades 1 and 2 start the Math path on Add & Subtract; Times Tables comes next.
 * Every other grade keeps island order.
 */
const ADD_FIRST: readonly string[] = ["1", "2"];

/** Indexes into GAME_CARDS of one subject's games, in path order for this grade. */
export function subjectIndexes(key: SubjectKey, grade?: string): number[] {
  const out: number[] = [];
  GAMES.forEach((game, index) => {
    if (subjectKeyOf(game.id) === key) out.push(index);
  });
  if (key === "math" && grade && ADD_FIRST.includes(grade)) {
    const add = GAMES.findIndex((game) => game.id === "add");
    const times = GAMES.findIndex((game) => game.id === "times");
    const a = out.indexOf(add);
    const t = out.indexOf(times);
    if (a > t && t >= 0) {
      out.splice(a, 1);
      out.splice(t, 0, add);
    }
  }
  return out;
}
