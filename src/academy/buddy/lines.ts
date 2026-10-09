import { personaOf } from "./persona";

/** The line a squishee says. Kept off the game registry so a squish cannot cycle the app. */
export function catchphrase(id: string): string {
  return personaOf(id).line;
}
