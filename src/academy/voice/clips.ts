import { getLocale } from "../i18n";
import { VOICE_FILES, VOICE_MODEL } from "./manifest";

export { VOICE_FILES, VOICE_MODEL };

let spanishFiles: Record<string, string> | null = null;
let spanishLoad: Promise<Record<string, string>> | null = null;

/** Spanish clips stay out of the English download. The map loads on first Spanish speech. */
export function loadSpanishVoice(): Promise<Record<string, string>> {
  if (spanishFiles) return Promise.resolve(spanishFiles);
  if (!spanishLoad) {
    spanishLoad = import("./manifest-es").then((mod) => {
      spanishFiles = mod.VOICE_FILES_ES;
      return spanishFiles;
    });
  }
  return spanishLoad;
}

export function spanishVoiceReady(): boolean {
  return spanishFiles != null;
}

export function hasVoiceClip(key: string): boolean {
  if (getLocale() === "es") return spanishFiles != null && Object.prototype.hasOwnProperty.call(spanishFiles, key);
  return Object.prototype.hasOwnProperty.call(VOICE_FILES, key);
}

export function voiceFile(key: string): string | undefined {
  if (getLocale() === "es") return spanishFiles?.[key];
  return VOICE_FILES[key];
}

/** Clip URL for this build. Pages and the academy domain each set their own base. */
export function voiceClipUrl(file: string, base = import.meta.env.BASE_URL || "/"): string {
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}voice/${file.replace(/^\/+/, "")}`;
}
