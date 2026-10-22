import { getLocale } from "../i18n";

/** English letter games. Mandarin hides them instead of translating the alphabet. */
const ALPHABET_GAMES = new Set(["phonics", "sight", "spelling"]);

export function gameOffered(id: string): boolean {
  if (getLocale() !== "zh") return true;
  return !ALPHABET_GAMES.has(id);
}
