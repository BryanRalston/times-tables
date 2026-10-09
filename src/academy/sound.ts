import { squishPitch } from "./squish/rewards";

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

export function blip(ok: boolean, enabled: boolean, streak = 0) {
  withAudio(enabled, () => {
    if (ok) {
      tone(660, 0.07, 0, "sine", 0.04);
      tone(880, 0.09, 0.06, "sine", 0.04);
      if (streak >= 3) tone(1174, 0.12, 0.14, "triangle", 0.035);
      return;
    }
    tone(294, 0.1, 0, "triangle", 0.018);
    tone(262, 0.12, 0.08, "triangle", 0.014);
  });
}

/** A soft “watch this” before a worked example. */
export function teachTone(enabled: boolean) {
  withAudio(enabled, () => {
    tone(523, 0.08, 0, "sine", 0.025);
    tone(659, 0.1, 0.09, "sine", 0.025);
  });
}

let musicTimer: ReturnType<typeof setInterval> | null = null;

/** Soft boss ostinato. Returns a stop function. Silent when muted. */
export function startBossMusic(enabled: boolean): () => void {
  stopBossMusic();
  if (!enabled || typeof window === "undefined") return stopBossMusic;
  const notes = [392, 494, 587, 494];
  let step = 0;
  withAudio(true, () => {
    musicTimer = setInterval(() => {
      const note = notes[step % notes.length] ?? 392;
      tone(note, 0.16, 0, "sine", 0.018);
      if (step % 4 === 0) tone(196, 0.22, 0, "triangle", 0.01);
      step += 1;
    }, 480);
  });
  return stopBossMusic;
}

export function stopBossMusic(): void {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
}

/** Buddy hit. A combo adds a higher sparkle. */
export function bossStrike(enabled: boolean, combo: number) {
  withAudio(enabled, () => {
    tone(660, 0.05, 0, "triangle", 0.03);
    tone(880, 0.08, 0.04, "sine", 0.028);
    if (combo >= 2) tone(1174, 0.1, 0.1, "sine", 0.026);
  });
}

/** Harmless raspberry. A miss never costs a life. */
export function bossRaspberry(enabled: boolean) {
  withAudio(enabled, () => {
    tone(330, 0.05, 0, "triangle", 0.02);
    tone(247, 0.06, 0.06, "triangle", 0.016);
    tone(196, 0.08, 0.12, "sine", 0.014);
  });
}

export function bossFanfare(enabled: boolean) {
  withAudio(enabled, () => {
    tone(523, 0.1, 0, "sine", 0.03);
    tone(659, 0.1, 0.1, "sine", 0.03);
    tone(784, 0.1, 0.2, "sine", 0.03);
    tone(1046, 0.22, 0.3, "triangle", 0.028);
  });
}

/** Soft toy squish. Pitch follows the squishee. Silent when muted. */
export function squishTone(id: string, enabled: boolean, which: "down" | "up") {
  withAudio(enabled, () => {
    const base = squishPitch(id);
    if (which === "down") {
      tone(base, 0.055, 0, "sine", 0.026);
      tone(base * 0.5, 0.07, 0.01, "triangle", 0.008);
      return;
    }
    tone(base * 1.16, 0.045, 0, "sine", 0.022);
    tone(base * 1.48, 0.06, 0.035, "sine", 0.012);
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
