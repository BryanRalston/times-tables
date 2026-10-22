import { collectClipSpecs, collectSpokenLines, isSpanishPrecacheKey, type SpokenLine } from "./catalog";
import { VOICE_FILES_FR } from "./manifest-fr";

/** Paths under `voice/`, such as `fr/7-424e42c9.mp3`, that the offline install should fetch. */
export function frenchPrecacheVoiceFiles(lines: readonly SpokenLine[] = collectSpokenLines()): string[] {
  const files = new Set<string>();
  for (const spec of collectClipSpecs(lines)) {
    if (!isSpanishPrecacheKey(spec.key, new Set(spec.games))) continue;
    const file = VOICE_FILES_FR[spec.key];
    if (file) files.add(file);
  }
  return [...files].sort();
}
