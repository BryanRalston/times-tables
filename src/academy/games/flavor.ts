import type { Rng } from "@/lib/rng";
import { t } from "../i18n";

const NAMES = ["Peach", "Frog", "Bunny", "Bear", "Panda", "Fox", "Owl", "Penguin", "Cat", "Chick", "Otter", "Cookie"] as const;

export function buddyName(rng: Rng): string {
  return rng.pick([...NAMES]);
}

export function pickLine(rng: Rng, lines: readonly string[]): string {
  return rng.pick([...lines]);
}

/** One RNG draw, same as pickLine. The Spanish line is the pair's second string. */
export function pickTalk(rng: Rng, pairs: readonly (readonly [string, string])[]): string {
  const pair = rng.pick([...pairs]);
  return t(pair[0], pair[1]);
}
