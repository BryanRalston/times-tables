/** Spoken prompts. The picture on screen is the fallback when speech is missing or blocked. */
export function canSpeak(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.speechSynthesis !== "undefined" &&
    typeof window.SpeechSynthesisUtterance !== "undefined"
  );
}

export function silence(): void {
  if (!canSpeak()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* a missing voice is fine; the caption stays */
  }
}

export function speak(text: string, enabled: boolean): void {
  const line = text.trim();
  if (!enabled || !line || !canSpeak()) return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(line);
    utter.rate = 0.95;
    utter.pitch = 1.08;
    utter.lang = "en-US";
    synth.speak(utter);
  } catch {
    /* visual caption is the fallback */
  }
}
