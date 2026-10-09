let ctx: AudioContext | null = null;

function tone(freq: number, dur: number, delay: number, type: OscillatorType, volume: number) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const start = ctx.currentTime + delay;
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

function withAudio(enabled: boolean, play: () => void) {
  if (!enabled || typeof window === "undefined") return;
  const Ctx = window.AudioContext;
  if (!Ctx) return;
  try {
    if (!ctx) ctx = new Ctx();
    if (ctx.state === "suspended") void ctx.resume();
    play();
  } catch {
    ctx = null;
  }
}

export function blip(ok: boolean, enabled: boolean) {
  withAudio(enabled, () => {
    if (ok) {
      tone(660, 0.08, 0, "sine", 0.03);
      tone(880, 0.1, 0.08, "sine", 0.03);
      return;
    }
    tone(320, 0.14, 0, "triangle", 0.02);
  });
}

/** Short celebration tones. Generated here so the app needs no sound files. */
export function chime(kind: "cheer" | "coin" | "gift", enabled: boolean) {
  withAudio(enabled, () => {
    if (kind === "coin") {
      tone(880, 0.08, 0, "sine", 0.03);
      tone(1174, 0.12, 0.07, "sine", 0.03);
      return;
    }
    if (kind === "gift") {
      tone(523, 0.1, 0, "sine", 0.03);
      tone(659, 0.1, 0.1, "sine", 0.03);
      tone(784, 0.16, 0.2, "sine", 0.03);
      return;
    }
    tone(523, 0.1, 0, "sine", 0.03);
    tone(659, 0.1, 0.09, "sine", 0.03);
    tone(784, 0.1, 0.18, "sine", 0.03);
    tone(1046, 0.18, 0.27, "sine", 0.03);
  });
}
