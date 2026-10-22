import { getLocale } from "../i18n";

/** English letter games. Mandarin, Hindi, and Arabic hide them instead of translating the alphabet. */
const ALPHABET_GAMES = new Set(["phonics", "sight", "spelling"]);

export function gameOffered(id: string): boolean {
  const locale = getLocale();
  if (locale !== "zh" && locale !== "hi" && locale !== "ar") return true;
  return !ALPHABET_GAMES.has(id);
}
