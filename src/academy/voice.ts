/** Spoken prompts. The picture on screen is the fallback when speech is missing or blocked. */

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
export function pickLocalVoice(voices: readonly VoiceLike[]): VoiceLike | null {
  const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
  const localEnglish = english.find((voice) => voice.localService);
  if (localEnglish) return localEnglish;
  const anyLocal = voices.find((voice) => voice.localService);
  if (anyLocal) return anyLocal;
  return english[0] ?? null;
}

export function silence(): void {
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
  const voice = pickLocalVoice(deviceVoices());
  if (voice) {
    const match = deviceVoices().find((row) => row.lang === voice.lang && row.name === voice.name);
    if (match) utter.voice = match;
    utter.lang = voice.lang;
  } else {
    utter.lang = "en-US";
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

export function speak(text: string, enabled: boolean): void {
  const line = text.trim();
  if (!enabled || !line || !canSpeak()) return;
  try {
    if (deviceVoices().length === 0) pendingLine = line;
    sayNow(line);
  } catch {
    /* visual caption is the fallback */
  }
}
