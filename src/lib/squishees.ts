import { asset } from "@/lib/art";

export type Rarity = "common" | "rare";

export interface Squishee {
  id: string;
  name: string;
  theme: "animal" | "food";
  file: string;
  poke: string | null;
  rarity: Rarity;
}

const COMMON: Squishee[] = [
  { id: "avocado", name: "Avocado", theme: "food", file: "avocado.png", poke: null, rarity: "common" },
  { id: "bear", name: "Bear", theme: "animal", file: "bear.png", poke: null, rarity: "common" },
  { id: "bun", name: "Bun", theme: "food", file: "bun.png", poke: null, rarity: "common" },
  { id: "bunny", name: "Bunny", theme: "animal", file: "bunny.png", poke: null, rarity: "common" },
  { id: "cat", name: "Cat", theme: "animal", file: "cat.png", poke: "cat-poke.mp4", rarity: "common" },
  { id: "chick", name: "Chick", theme: "animal", file: "chick.png", poke: null, rarity: "common" },
  { id: "corn", name: "Corn", theme: "food", file: "corn.png", poke: null, rarity: "common" },
  { id: "donut", name: "Donut", theme: "food", file: "donut.png", poke: null, rarity: "common" },
  { id: "duck", name: "Duck", theme: "animal", file: "duck.png", poke: null, rarity: "common" },
  { id: "frog", name: "Frog", theme: "animal", file: "frog.png", poke: "frog-poke.mp4", rarity: "common" },
  { id: "grape", name: "Grape", theme: "food", file: "grape.png", poke: null, rarity: "common" },
  { id: "melon", name: "Melon", theme: "food", file: "melon.png", poke: null, rarity: "common" },
  { id: "owl", name: "Owl", theme: "animal", file: "owl.png", poke: null, rarity: "common" },
  { id: "panda", name: "Panda", theme: "animal", file: "panda.png", poke: null, rarity: "common" },
  { id: "peach", name: "Peach", theme: "food", file: "peach.png", poke: null, rarity: "common" },
  { id: "pig", name: "Pig", theme: "animal", file: "pig.png", poke: null, rarity: "common" },
  { id: "shark", name: "Shark", theme: "animal", file: "shark.png", poke: null, rarity: "common" },
  { id: "taco", name: "Taco", theme: "food", file: "taco.png", poke: null, rarity: "common" },
  { id: "whale", name: "Whale", theme: "animal", file: "whale.png", poke: null, rarity: "common" },
  { id: "lemon", name: "Lemon", theme: "food", file: "lemon.png", poke: null, rarity: "common" },
  { id: "penguin", name: "Penguin", theme: "animal", file: "penguin.png", poke: null, rarity: "common" },
  { id: "strawberry", name: "Strawberry", theme: "food", file: "strawberry.png", poke: null, rarity: "common" },
  { id: "otter", name: "Otter", theme: "animal", file: "otter.png", poke: null, rarity: "common" },
  { id: "waffle", name: "Waffle", theme: "food", file: "waffle.png", poke: null, rarity: "common" },
  { id: "cookie", name: "Cookie", theme: "food", file: "cookie.png", poke: null, rarity: "common" },
];

const RARE: Squishee[] = [
  { id: "crystal-axolotl", name: "Crystal Axolotl", theme: "animal", file: "crystal-axolotl.png", poke: null, rarity: "rare" },
  { id: "galaxy-narwhal", name: "Galaxy Narwhal", theme: "animal", file: "galaxy-narwhal.png", poke: null, rarity: "rare" },
  { id: "golden-dragon", name: "Golden Dragon", theme: "animal", file: "golden-dragon.png", poke: null, rarity: "rare" },
  { id: "rainbow-cupcake", name: "Rainbow Cupcake", theme: "food", file: "rainbow-cupcake.png", poke: null, rarity: "rare" },
  { id: "aurora-jelly", name: "Aurora Jelly", theme: "animal", file: "aurora-jelly.png", poke: null, rarity: "rare" },
  { id: "star-mochi", name: "Star Mochi", theme: "food", file: "star-mochi.png", poke: null, rarity: "rare" },
];

export const SQUISHEES: Squishee[] = [...COMMON, ...RARE];
export const COMMON_SQUISHEES = COMMON;
export const RARE_SQUISHEES = RARE;
export const SQUISHEE_IDS = SQUISHEES.map((s) => s.id);

export function squisheeById(id: string): Squishee | undefined {
  return SQUISHEES.find((s) => s.id === id);
}

export function squisheeSrc(id: string): string {
  const s = squisheeById(id) ?? SQUISHEES[0]!;
  return asset(`squishees/${s.file}`);
}

export function squisheePokeSrc(id: string): string | null {
  const s = squisheeById(id);
  return s?.poke ? asset(`squishees/${s.poke}`) : null;
}
