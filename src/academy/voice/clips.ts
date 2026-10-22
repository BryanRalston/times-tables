import { getLocale } from "../i18n";

type VoiceMap = Record<string, string>;

let englishFiles: VoiceMap | null = null;
let englishLoad: Promise<VoiceMap> | null = null;
let spanishFiles: VoiceMap | null = null;
let spanishLoad: Promise<VoiceMap> | null = null;
let portugueseFiles: VoiceMap | null = null;
let portugueseLoad: Promise<VoiceMap> | null = null;
let frenchFiles: VoiceMap | null = null;
let frenchLoad: Promise<VoiceMap> | null = null;
let chineseFiles: VoiceMap | null = null;
let chineseLoad: Promise<VoiceMap> | null = null;

/** The English clip map is a large file. It loads on first speech, not with the home screen. */
export function loadEnglishVoice(): Promise<VoiceMap> {
  if (englishFiles) return Promise.resolve(englishFiles);
  if (!englishLoad) {
    englishLoad = import("./manifest").then((mod) => {
      englishFiles = mod.VOICE_FILES;
      return englishFiles;
    });
  }
  return englishLoad;
}

/** Spanish clips stay out of the English download. The map loads on first Spanish speech. */
export function loadSpanishVoice(): Promise<VoiceMap> {
  if (spanishFiles) return Promise.resolve(spanishFiles);
  if (!spanishLoad) {
    spanishLoad = import("./manifest-es").then((mod) => {
      spanishFiles = mod.VOICE_FILES_ES;
      return spanishFiles;
    });
  }
  return spanishLoad;
}

export function englishVoiceReady(): boolean {
  return englishFiles != null;
}

/** Portuguese clips stay out of the English download. The map loads on first Portuguese speech. */
export function loadPortugueseVoice(): Promise<VoiceMap> {
  if (portugueseFiles) return Promise.resolve(portugueseFiles);
  if (!portugueseLoad) {
    portugueseLoad = import("./manifest-pt").then((mod) => {
      portugueseFiles = mod.VOICE_FILES_PT;
      return portugueseFiles;
    });
  }
  return portugueseLoad;
}

export function spanishVoiceReady(): boolean {
  return spanishFiles != null;
}

export function portugueseVoiceReady(): boolean {
  return portugueseFiles != null;
}

/** French clips stay out of the English download. The map loads on first French speech. */
export function loadFrenchVoice(): Promise<VoiceMap> {
  if (frenchFiles) return Promise.resolve(frenchFiles);
  if (!frenchLoad) {
    frenchLoad = import("./manifest-fr").then((mod) => {
      frenchFiles = mod.VOICE_FILES_FR;
      return frenchFiles;
    });
  }
  return frenchLoad;
}

export function frenchVoiceReady(): boolean {
  return frenchFiles != null;
}

/** Chinese clips stay out of the English download. The map loads on first Chinese speech. */
export function loadChineseVoice(): Promise<VoiceMap> {
  if (chineseFiles) return Promise.resolve(chineseFiles);
  if (!chineseLoad) {
    chineseLoad = import("./manifest-zh").then((mod) => {
      chineseFiles = mod.VOICE_FILES_ZH;
      return chineseFiles;
    });
  }
  return chineseLoad;
}

export function chineseVoiceReady(): boolean {
  return chineseFiles != null;
}

function voiceMap(): VoiceMap | null {
  const locale = getLocale();
  if (locale === "es") return spanishFiles;
  if (locale === "pt") return portugueseFiles;
  if (locale === "fr") return frenchFiles;
  if (locale === "zh") return chineseFiles;
  return englishFiles;
}

function loadVoiceMap(): Promise<VoiceMap> {
  const locale = getLocale();
  if (locale === "es") return loadSpanishVoice();
  if (locale === "pt") return loadPortugueseVoice();
  if (locale === "fr") return loadFrenchVoice();
  if (locale === "zh") return loadChineseVoice();
  return loadEnglishVoice();
}

/** Load the clip map for the language on screen. */
export function ensureVoice(): Promise<void> {
  return loadVoiceMap().then(() => undefined);
}

export function hasVoiceClip(key: string): boolean {
  const files = voiceMap();
  return files != null && Object.prototype.hasOwnProperty.call(files, key);
}

export function voiceFile(key: string): string | undefined {
  return voiceMap()?.[key];
}

/** Clip URL for this build. Pages and the academy domain each set their own base. */
export function voiceClipUrl(file: string, base = import.meta.env.BASE_URL || "/"): string {
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}voice/${file.replace(/^\/+/, "")}`;
}
