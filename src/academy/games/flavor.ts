import type { Rng } from "@/lib/rng";
import { t } from "../i18n";

const NAMES = ["Peach", "Frog", "Bunny", "Bear", "Panda", "Fox", "Owl", "Penguin", "Cat", "Chick", "Otter", "Cookie"] as const;

export function buddyName(rng: Rng): string {
  return rng.pick([...NAMES]);
}

export function pickLine(rng: Rng, lines: readonly string[]): string {
  return rng.pick([...lines]);
}

/** One RNG draw. Spanish is the second string. Portuguese is the third when the English line is built, not a dictionary key. */
export function pickTalk(rng: Rng, pairs: readonly (readonly [string, string, ...string[]])[]): string {
  const pair = rng.pick([...pairs]);
  return t(pair[0], pair[1], pair[2]);
}
