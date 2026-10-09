import { squisheePokeSrc, squisheePokeStrip, type PokeStripMeta } from "@/lib/squishees";

export interface PokePlayback {
  clip: string | null;
  strip: PokeStripMeta | null;
}

/**
 * Squishee Math poke art.
 * Fine desktop pointers play the chroma-key mp4. iOS and coarse pointers play the sprite strip.
 * Toys with neither stay on the still and use the CSS squash.
 */
export function pokePlayback(id: string, skipVideo: boolean): PokePlayback {
  const clip = squisheePokeSrc(id);
  const strip = squisheePokeStrip(id);
  if (clip && !skipVideo) return { clip, strip: null };
  if (strip) return { clip: null, strip };
  return { clip: null, strip: null };
}

/** Reduced motion keeps the still picture. A normal poke plays the clip or strip when one exists. */
export function pokeMotion(reduced: boolean, playback: PokePlayback): PokePlayback & { squash: boolean } {
  if (reduced) return { squash: false, clip: null, strip: null };
  return { squash: true, clip: playback.clip, strip: playback.strip };
}
