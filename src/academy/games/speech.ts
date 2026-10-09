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

/** Speak `text`. Returns false when the device has no voice, so the caller can show text. */
export function speakText(text: string, slow: boolean, onFail?: () => void): boolean {
  const probe = readSpeechProbe();
  if (needsSpeechFallback(probe)) return false;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = speakRate(slow);
    utter.lang = "en-US";
    const voice = synth.getVoices().find((item) => item.lang.toLowerCase().startsWith("en"));
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

export function stopSpeech(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}
