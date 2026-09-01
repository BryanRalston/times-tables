let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  return ctx;
}

export function unlockAudio() {
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
