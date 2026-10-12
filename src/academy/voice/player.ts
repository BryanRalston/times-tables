import { hasVoiceClip, voiceClipUrl, voiceFile } from "./clips";
import { planSpeech, type SpeechPiece } from "./plan";

let audioCtx: AudioContext | null = null;
let generation = 0;
const active: AudioBufferSourceNode[] = [];
const buffers = new Map<string, Promise<AudioBuffer>>();

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
