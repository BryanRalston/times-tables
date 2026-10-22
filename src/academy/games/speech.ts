import { arabicVoiceReady, chineseVoiceReady, englishVoiceReady, ensureVoice, frenchVoiceReady, hindiVoiceReady, portugueseVoiceReady, spanishVoiceReady } from "../voice/clips";
import { startClipSpeech, stopClipSpeech } from "../voice/player";
import { getLocale } from "../i18n";

export interface SpeechProbe {
  synthesis: boolean;
  voices: number;
  settled: boolean;
}

let voicesSettled = false;
let speechBroken = false;

/** True when play should show the words instead of waiting on a voice. */
export function needsSpeechFallback(probe: SpeechProbe): boolean {
  if (!probe.synthesis) return true;
  if (probe.settled && probe.voices === 0) return true;
  return false;
}

export function markVoicesSettled(): void {
  voicesSettled = true;
}

export function markSpeechBroken(): void {
  speechBroken = true;
}

export function readSpeechProbe(): SpeechProbe {
  if (speechBroken) return { synthesis: false, voices: 0, settled: true };
  if (typeof window === "undefined" || !window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") {
    return { synthesis: false, voices: 0, settled: true };
  }
  const voices = window.speechSynthesis.getVoices();
  const settled = voicesSettled || voices.length > 0;
  return { synthesis: true, voices: voices.length, settled };
}

export function slowPreference(): boolean {
  return preferSlow;
}

export function setSlowPreference(next: boolean): void {
  preferSlow = next;
}

let preferSlow = false;

export function speakRate(slow: boolean): number {
  return slow ? 0.68 : 0.95;
}

function speakWithDevice(text: string, slow: boolean, onFail?: () => void): boolean {
  const probe = readSpeechProbe();
  if (needsSpeechFallback(probe)) return false;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = speakRate(slow);
    const locale = getLocale();
    utter.lang = locale === "es" ? "es-MX" : locale === "pt" ? "pt-BR" : locale === "fr" ? "fr-FR" : locale === "zh" ? "zh-CN" : locale === "hi" ? "hi-IN" : locale === "ar" ? "ar" : "en-US";
    const voice = synth.getVoices().find((item) => item.lang.toLowerCase().startsWith(locale === "en" ? "en" : locale));
    if (voice) utter.voice = voice;
    utter.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "interrupted" || event.error === "canceled") return;
      markSpeechBroken();
      onFail?.();
    };
    synth.speak(utter);
    return true;
  } catch {
    markSpeechBroken();
    return false;
  }
}

function cancelDevice(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* the caption stays */
  }
}

/** Speak `text` from a clip when one exists. Returns false when nothing can talk, so the caller can show text. */
export function speakText(text: string, slow: boolean, onFail?: () => void): boolean {
  const locale = getLocale();
  const ready = locale === "es" ? spanishVoiceReady() : locale === "pt" ? portugueseVoiceReady() : locale === "fr" ? frenchVoiceReady() : locale === "zh" ? chineseVoiceReady() : locale === "hi" ? hindiVoiceReady() : locale === "ar" ? arabicVoiceReady() : englishVoiceReady();
  if (!ready) {
    void ensureVoice().then(() => {
      speakText(text, slow, onFail);
    });
    return true;
  }
  cancelDevice();
  const rate = slow ? 0.78 : 1;
  if (
    startClipSpeech(text, rate, () => {
      if (!speakWithDevice(text, slow, onFail)) onFail?.();
    })
  ) {
    return true;
  }
  return speakWithDevice(text, slow, onFail);
}

export function stopSpeech(): void {
  stopClipSpeech();
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}
