import { getLocale } from "./i18n";
import { holdPrecache } from "./offline/later";
import { ensureVoice } from "./voice/clips";
import { startClipSpeech, stopClipSpeech } from "./voice/player";

/** Spoken prompts. Recorded clips play first. The device voice is only for a line with no clip. */

export interface VoiceLike {
  lang: string;
  localService?: boolean;
  name?: string;
}

export function canSpeak(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.speechSynthesis !== "undefined" &&
    typeof window.SpeechSynthesisUtterance !== "undefined"
  );
}

/**
 * Prefer a voice that ships on the device. Those speak with no network,
 * which is what a tablet in a classroom actually has.
 */
export function pickLocalVoice(voices: readonly VoiceLike[], prefer = "en"): VoiceLike | null {
  const pref = prefer.toLowerCase();
  const preferred = voices.filter((voice) => voice.lang.toLowerCase().startsWith(pref));
  const localPreferred = preferred.find((voice) => voice.localService);
  if (localPreferred) return localPreferred;
  const anyLocal = voices.find((voice) => voice.localService);
  if (anyLocal) return anyLocal;
  return preferred[0] ?? null;
}

export function silence(): void {
  stopClipSpeech();
  if (!canSpeak()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* a missing voice is fine; the caption stays */
  }
}

function deviceVoices(): SpeechSynthesisVoice[] {
  try {
    return window.speechSynthesis.getVoices();
  } catch {
    return [];
  }
}

let pendingLine = "";

function sayNow(line: string): void {
  const synth = window.speechSynthesis;
  if (synth.paused) synth.resume();
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(line);
  const locale = getLocale();
  const prefer = locale === "es" ? "es" : locale === "pt" ? "pt" : locale === "fr" ? "fr" : locale === "zh" ? "zh" : locale === "hi" ? "hi" : locale === "ar" ? "ar" : "en";
  const voice = pickLocalVoice(deviceVoices(), prefer);
  if (voice) {
    const match = deviceVoices().find((row) => row.lang === voice.lang && row.name === voice.name);
    if (match) utter.voice = match;
    utter.lang = voice.lang;
  } else {
    utter.lang = locale === "es" ? "es-MX" : locale === "pt" ? "pt-BR" : locale === "fr" ? "fr-FR" : locale === "zh" ? "zh-CN" : locale === "hi" ? "hi-IN" : locale === "ar" ? "ar" : "en-US";
  }
  utter.rate = 0.95;
  utter.pitch = 1.08;
  synth.speak(utter);
}

/** Ask the device for its installed voices once, then speak any line that was waiting. */
export function warmVoices(): void {
  if (!canSpeak()) return;
  try {
    deviceVoices();
    window.speechSynthesis.addEventListener("voiceschanged", () => {
      if (!pendingLine) return;
      const line = pendingLine;
      pendingLine = "";
      try {
        sayNow(line);
      } catch {
        /* caption stays */
      }
    });
  } catch {
    /* speech is optional */
  }
}

function cancelDevice(): void {
  if (!canSpeak()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* a missing voice is fine */
  }
}

export function speak(text: string, enabled: boolean): void {
  const line = text.trim();
  if (!enabled || !line) return;
  cancelDevice();
  const release = holdPrecache();
  void ensureVoice()
    .then(() => {
      if (startClipSpeech(line, 1, () => sayWithDevice(line), release)) return;
      sayWithDevice(line);
      release();
    })
    .catch(() => {
      release();
    });
}

function sayWithDevice(line: string): void {
  if (!canSpeak()) return;
  try {
    if (deviceVoices().length === 0) pendingLine = line;
    sayNow(line);
  } catch {
    /* visual caption is the fallback */
  }
}
