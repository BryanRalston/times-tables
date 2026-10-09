import type { Rng } from "@/lib/rng";

const NAMES = ["Peach", "Frog", "Bunny", "Bear", "Panda", "Fox", "Owl", "Penguin", "Cat", "Chick", "Otter", "Cookie"] as const;

export function buddyName(rng: Rng): string {
  return rng.pick([...NAMES]);
}

export function pickLine(rng: Rng, lines: readonly string[]): string {
  return rng.pick([...lines]);
}
