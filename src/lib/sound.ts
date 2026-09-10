let ctx: AudioContext | null = null;
let muted = false;

export function setSoundMuted(on: boolean) {
  muted = Boolean(on);
}

export function soundMuted(): boolean {
  return muted;
}

function ac(): AudioContext | null {
  if (muted) return null;
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  return ctx;
}

export function unlockAudio() {
  if (muted) return;
  const c = ac();
  if (c && c.state === "suspended") void c.resume();
}

function tone(freq: number, start: number, dur: number, type: OscillatorType, gain = 0.05) {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(start);
  o.stop(start + dur + 0.02);
}

export function playCorrect() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  tone(523.25, t, 0.12, "sine", 0.05);
  tone(659.25, t + 0.08, 0.16, "sine", 0.045);
}

export function playWrong() {
  const c = ac();
  if (!c) return;
  tone(196, c.currentTime, 0.14, "triangle", 0.04);
}

export function playStar() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  tone(523.25, t, 0.1, "sine", 0.045);
  tone(659.25, t + 0.08, 0.1, "sine", 0.04);
  tone(783.99, t + 0.16, 0.18, "sine", 0.05);
}

export function playTap() {
  const c = ac();
  if (!c) return;
  tone(880, c.currentTime, 0.04, "sine", 0.025);
}

export function playStreak() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  tone(659.25, t, 0.07, "sine", 0.04);
  tone(783.99, t + 0.06, 0.08, "sine", 0.04);
  tone(1046.5, t + 0.13, 0.12, "sine", 0.045);
}

function chirp(fromFreq: number, toFreq: number, start: number, dur: number, type: OscillatorType, gain: number) {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(fromFreq, start);
  o.frequency.exponentialRampToValueAtTime(Math.max(1, toFreq), start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + Math.min(0.014, dur * 0.28));
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(start);
  o.stop(start + dur + 0.02);
}

/** Mid-chain hops stay a bit quieter so long jumps do not stack. */
export function hopChainGain(index: number, length: number, base: number): number {
  if (length <= 2) return base;
  if (index <= 0 || index >= length - 1) return base;
  return base * 0.68;
}

export function playHop(chainIndex = 0, chainLength = 1) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  const gain = hopChainGain(chainIndex, chainLength, 0.024);
  chirp(370, 523.25, t, 0.08, "sine", gain);
  tone(659.25, t + 0.045, 0.045, "sine", gain * 0.5);
}

export function playLand(chainIndex = 0, chainLength = 1) {
  const c = ac();
  if (!c) return;
  tone(246.94, c.currentTime, 0.032, "triangle", hopChainGain(chainIndex, chainLength, 0.012));
}

export function playPeek() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  tone(698.46, t, 0.045, "sine", 0.026);
  tone(880, t + 0.028, 0.06, "sine", 0.02);
}

export function playWarp() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  chirp(392, 784, t, 0.16, "sine", 0.028);
  chirp(784, 523.25, t + 0.14, 0.18, "sine", 0.022);
  tone(659.25, t + 0.28, 0.08, "sine", 0.018);
}

/** Short playful ticks — not a casino spin. */
export function playDice() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  tone(392, t, 0.045, "triangle", 0.02);
  tone(494, t + 0.07, 0.045, "triangle", 0.018);
  tone(587, t + 0.14, 0.05, "triangle", 0.016);
  tone(659.25, t + 0.28, 0.09, "sine", 0.022);
}
