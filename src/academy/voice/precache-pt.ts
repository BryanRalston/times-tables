import { collectClipSpecs, collectSpokenLines, isSpanishPrecacheKey, type SpokenLine } from "./catalog";
import { VOICE_FILES_PT } from "./manifest-pt";

/** Paths under `voice/`, such as `pt/7-424e42c9.mp3`, that the offline install should fetch. */
export function portuguesePrecacheVoiceFiles(lines: readonly SpokenLine[] = collectSpokenLines()): string[] {
  const files = new Set<string>();
  for (const spec of collectClipSpecs(lines)) {
    if (!isSpanishPrecacheKey(spec.key, new Set(spec.games))) continue;
    const file = VOICE_FILES_PT[spec.key];
    if (file) files.add(file);
  }
  return [...files].sort();
}
