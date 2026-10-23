import { hasVoiceClip, voiceClipUrl, voiceFile } from "./clips";
import { planSpeech, type SpeechPiece } from "./plan";

let audioCtx: AudioContext | null = null;
let generation = 0;
const active: AudioBufferSourceNode[] = [];
const buffers = new Map<string, Promise<AudioBuffer>>();
const timers: ReturnType<typeof setTimeout>[] = [];

export interface WordCue {
  key: string;
  gapAfterMs: number;
}

/**
 * When each clip starts, in milliseconds. `leadMs` is the offset before the
 * first word, matching the audio schedule in `startWordClips`.
 */
export function clipStartMs(durationsMs: readonly number[], gapsAfterMs: readonly number[], leadMs = 0): number[] {
  const starts: number[] = [];
  let at = leadMs;
  for (let i = 0; i < durationsMs.length; i += 1) {
    starts.push(at);
    at += Math.max(0, durationsMs[i] ?? 0) + Math.max(0, gapsAfterMs[i] ?? 0);
  }
  return starts;
}

function clearTimers(): void {
  if (typeof window === "undefined") {
    timers.length = 0;
    return;
  }
  for (const id of timers) window.clearTimeout(id);
  timers.length = 0;
}

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
}

/** Call from a tap so later auto-speak is allowed to play. */
export function unlockVoiceAudio(): void {
  const audio = context();
  if (!audio) return;
  if (audio.state === "suspended") void audio.resume();
  try {
    const buffer = audio.createBuffer(1, 1, audio.sampleRate);
    const src = audio.createBufferSource();
    src.buffer = buffer;
    src.connect(audio.destination);
    src.start();
  } catch {
    /* a locked device still has the caption */
  }
}

function installUnlock(): void {
  if (typeof window === "undefined") return;
  const kick = () => unlockVoiceAudio();
  window.addEventListener("pointerdown", kick, { capture: true });
  window.addEventListener("keydown", kick, { capture: true });
}

installUnlock();

export function clipsCover(text: string): boolean {
  const plan = planSpeech(text, hasVoiceClip);
  return plan != null && plan.length > 0;
}

export function stopClipSpeech(): void {
  generation += 1;
  clearTimers();
  for (const src of active) {
    try {
      src.stop();
    } catch {
      /* already ended */
    }
  }
  active.length = 0;
}

function loadBuffer(key: string, audio: AudioContext): Promise<AudioBuffer> {
  const file = voiceFile(key);
  if (!file) return Promise.reject(new Error(key));
  const url = voiceClipUrl(file);
  const cached = buffers.get(url);
  if (cached) return cached;
  const pending = fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(url);
      return res.arrayBuffer();
    })
    .then((bytes) => audio.decodeAudioData(bytes))
    .catch((err: unknown) => {
      buffers.delete(url);
      throw err;
    });
  buffers.set(url, pending);
  return pending;
}

async function run(plan: SpeechPiece[], rate: number, mine: number, audio: AudioContext): Promise<void> {
  if (audio.state === "suspended") await audio.resume();
  if (mine !== generation) return;
  const clips = await Promise.all(plan.map((piece) => loadBuffer(piece.key, audio)));
  if (mine !== generation) return;
  let when = audio.currentTime + 0.04;
  for (let i = 0; i < plan.length; i += 1) {
    const piece = plan[i];
    const buffer = clips[i];
    if (!piece || !buffer) return;
    const src = audio.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    src.connect(audio.destination);
    src.start(when);
    src.onended = () => {
      const at = active.indexOf(src);
      if (at >= 0) active.splice(at, 1);
    };
    active.push(src);
    when += buffer.duration / rate + piece.gapMs / 1000;
  }
}

const WORD_LEAD_MS = 40;

async function runWords(
  words: readonly WordCue[],
  mine: number,
  audio: AudioContext,
  onWord: (index: number) => void,
  onEnd: () => void,
): Promise<void> {
  if (audio.state === "suspended") await audio.resume();
  if (mine !== generation) return;
  const clips = await Promise.all(words.map((word) => loadBuffer(word.key, audio)));
  if (mine !== generation) return;
  const durations = clips.map((buffer) => (buffer ? buffer.duration * 1000 : 0));
  const gaps = words.map((word) => word.gapAfterMs);
  const starts = clipStartMs(durations, gaps, WORD_LEAD_MS);
  const last = words.length - 1;
  const endAt = (starts[last] ?? WORD_LEAD_MS) + (durations[last] ?? 0) + (gaps[last] ?? 0);
  let when = audio.currentTime + WORD_LEAD_MS / 1000;
  for (let i = 0; i < words.length; i += 1) {
    const word = words[i];
    const buffer = clips[i];
    if (!word || !buffer) return;
    const src = audio.createBufferSource();
    src.buffer = buffer;
    src.connect(audio.destination);
    src.start(when);
    src.onended = () => {
      const at = active.indexOf(src);
      if (at >= 0) active.splice(at, 1);
    };
    active.push(src);
    const delay = starts[i] ?? 0;
    timers.push(
      window.setTimeout(() => {
        if (mine !== generation) return;
        onWord(i);
      }, delay),
    );
    when += buffer.duration + word.gapAfterMs / 1000;
  }
  timers.push(
    window.setTimeout(() => {
      if (mine !== generation) return;
      onEnd();
    }, endAt),
  );
}

const MISSING_WORD_MS = 280;

/**
 * Read a story line one word at a time. A missing clip still moves the
 * highlight, on a short silent beat, so one gap does not stop the page.
 * Returns false when no word has a clip. Does not use the device voice.
 */
export function startReadAlong(
  words: readonly WordCue[],
  onWord: (index: number) => void,
  onEnd: () => void,
  onFail: () => void,
): boolean {
  stopClipSpeech();
  if (words.length === 0 || words.every((word) => !hasVoiceClip(word.key))) return false;
  const audio = context();
  if (!audio) return false;
  const mine = generation;
  void runReadAlong(words, mine, audio, onWord, onEnd).catch(() => {
    if (mine !== generation) return;
    onFail();
  });
  return true;
}

async function runReadAlong(
  words: readonly WordCue[],
  mine: number,
  audio: AudioContext,
  onWord: (index: number) => void,
  onEnd: () => void,
): Promise<void> {
  if (audio.state === "suspended") await audio.resume();
  if (mine !== generation) return;
  const clips = await Promise.all(
    words.map((word) => (hasVoiceClip(word.key) ? loadBuffer(word.key, audio) : Promise.resolve(null))),
  );
  if (mine !== generation) return;
  const durations = clips.map((buffer) => (buffer ? buffer.duration * 1000 : MISSING_WORD_MS));
  const gaps = words.map((word) => word.gapAfterMs);
  const starts = clipStartMs(durations, gaps, WORD_LEAD_MS);
  const last = words.length - 1;
  const endAt = (starts[last] ?? WORD_LEAD_MS) + (durations[last] ?? 0) + (gaps[last] ?? 0);
  let when = audio.currentTime + WORD_LEAD_MS / 1000;
  for (let i = 0; i < words.length; i += 1) {
    const word = words[i];
    const buffer = clips[i];
    if (!word) return;
    if (buffer) {
      const src = audio.createBufferSource();
      src.buffer = buffer;
      src.connect(audio.destination);
      src.start(when);
      src.onended = () => {
        const at = active.indexOf(src);
        if (at >= 0) active.splice(at, 1);
      };
      active.push(src);
      when += buffer.duration + word.gapAfterMs / 1000;
    } else {
      when += MISSING_WORD_MS / 1000 + word.gapAfterMs / 1000;
    }
    const delay = starts[i] ?? 0;
    timers.push(
      window.setTimeout(() => {
        if (mine !== generation) return;
        onWord(i);
      }, delay),
    );
  }
  timers.push(
    window.setTimeout(() => {
      if (mine !== generation) return;
      onEnd();
    }, endAt),
  );
}

/**
 * Play one clip per word and report the word index as each clip starts.
 * Returns false when a clip is missing. Does not use the device voice.
 */
export function startWordClips(
  words: readonly WordCue[],
  onWord: (index: number) => void,
  onEnd: () => void,
  onFail: () => void,
): boolean {
  stopClipSpeech();
  if (words.length === 0 || words.some((word) => !hasVoiceClip(word.key))) return false;
  const audio = context();
  if (!audio) return false;
  const mine = generation;
  void runWords(words, mine, audio, onWord, onEnd).catch(() => {
    if (mine !== generation) return;
    onFail();
  });
  return true;
}

/**
 * Play `text` from clips. Returns false when any piece is missing so the
 * caller can use the device voice. `onFail` runs if a clip file will not load.
 */
export function startClipSpeech(text: string, rate: number, onFail: () => void): boolean {
  stopClipSpeech();
  const plan = planSpeech(text, hasVoiceClip);
  if (!plan || plan.length === 0) return false;
  const audio = context();
  if (!audio) return false;
  const mine = generation;
  void run(plan, rate, mine, audio).catch(() => {
    if (mine !== generation) return;
    onFail();
  });
  return true;
}
