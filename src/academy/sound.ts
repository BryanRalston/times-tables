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

export interface SquishVoice {
  bodyHz: number;
  bodyGain: number;
  noiseGain: number;
  noiseHz: number;
  squelchHz: number;
  squelchGain: number;
}

/** Quiet squish: a low body plus filtered noise, with a little squelch variation. */
export function squishVoice(id: string, which: "down" | "up", vary = 0): SquishVoice {
  const base = squishPitch(id);
  const wobble = ((vary % 1) + 1) % 1;
  if (which === "down") {
    return {
      bodyHz: base * 0.25,
      bodyGain: 0.038,
      noiseGain: 0.042,
      noiseHz: 620 + wobble * 140,
      squelchHz: 980 + wobble * 220,
      squelchGain: 0.011,
    };
  }
  return {
    bodyHz: base * 0.31,
    bodyGain: 0.026,
    noiseGain: 0.024,
    noiseHz: 860 + wobble * 120,
    squelchHz: 1320 + wobble * 180,
    squelchGain: 0.006,
  };
}

let noiseBuffer: AudioBuffer | null = null;

function softNoise(audio: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === audio.sampleRate) return noiseBuffer;
  const length = Math.floor(audio.sampleRate * 0.32);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  let pink = 0;
  for (let i = 0; i < length; i += 1) {
    pink = pink * 0.965 + (Math.random() * 2 - 1) * 0.035;
    data[i] = pink * 3.4;
  }
  noiseBuffer = buffer;
  return buffer;
}

function envGain(audio: AudioContext, start: number, peak: number, attack: number, dur: number): GainNode {
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  return gain;
}

/** Soft toy squish. Filtered noise and a low body, not a beep. Silent when muted. */
export function squishTone(id: string, enabled: boolean, which: "down" | "up") {
  withAudio(enabled, () => {
    const audio = ctx;
    if (!audio) return;
    const vary = (audio.currentTime * 17.3) % 1;
    const voice = squishVoice(id, which, vary);
    const now = audio.currentTime;
    const body = audio.createOscillator();
    const bodyGain = envGain(audio, now, voice.bodyGain, 0.012, which === "down" ? 0.16 : 0.2);
    body.type = "sine";
    body.frequency.setValueAtTime(voice.bodyHz, now);
    body.frequency.exponentialRampToValueAtTime(Math.max(40, voice.bodyHz * 0.62), now + 0.12);
    body.connect(bodyGain);
    bodyGain.connect(audio.destination);
    body.start(now);
    body.stop(now + 0.22);

    const buffer = softNoise(audio);
    const noise = audio.createBufferSource();
    noise.buffer = buffer;
    const low = audio.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.setValueAtTime(voice.noiseHz, now);
    low.frequency.exponentialRampToValueAtTime(which === "down" ? 240 : 360, now + 0.14);
    low.Q.value = 0.7;
    const noiseGain = envGain(audio, now, voice.noiseGain, 0.01, which === "down" ? 0.13 : 0.17);
    noise.connect(low);
    low.connect(noiseGain);
    noiseGain.connect(audio.destination);
    noise.start(now);
    noise.stop(now + 0.2);

    const wet = audio.createBufferSource();
    wet.buffer = buffer;
    const band = audio.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = voice.squelchHz;
    band.Q.value = 2.1;
    const wetGain = envGain(audio, now, voice.squelchGain, 0.008, 0.07);
    wet.connect(band);
    band.connect(wetGain);
    wetGain.connect(audio.destination);
    wet.start(now, vary * 0.04);
    wet.stop(now + 0.09);
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
