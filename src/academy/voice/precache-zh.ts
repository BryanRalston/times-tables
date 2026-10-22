import { collectClipSpecs, collectSpokenLines, isSpanishPrecacheKey, type SpokenLine } from "./catalog";
import { VOICE_FILES_ZH } from "./manifest-zh";

/** Paths under `voice/`, such as `zh/7-424e42c9.mp3`, that the offline install should fetch. */
export function chinesePrecacheVoiceFiles(lines: readonly SpokenLine[] = collectSpokenLines()): string[] {
  const files = new Set<string>();
  for (const spec of collectClipSpecs(lines)) {
    if (!isSpanishPrecacheKey(spec.key, new Set(spec.games))) continue;
    const file = VOICE_FILES_ZH[spec.key];
    if (file) files.add(file);
  }
  return [...files].sort();
}
