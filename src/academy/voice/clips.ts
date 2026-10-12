import { VOICE_FILES, VOICE_MODEL } from "./manifest";

export { VOICE_FILES, VOICE_MODEL };

export function hasVoiceClip(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(VOICE_FILES, key);
}

export function voiceFile(key: string): string | undefined {
  return VOICE_FILES[key];
}

/** Clip URL for this build. Pages and the academy domain each set their own base. */
export function voiceClipUrl(file: string, base = import.meta.env.BASE_URL || "/"): string {
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}voice/${file.replace(/^\/+/, "")}`;
}
