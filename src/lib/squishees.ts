import { asset } from "@/lib/art";
import { rngFromSeed } from "@/lib/rng";

export interface Squishee {
  id: string;
  name: string;
  theme: "animal" | "food";
  file: string;
  poke: string | null;
}

/** Chroma-keyed PNG toys. JPEG style refs stay out of the shelf. */
export const SQUISHEES: Squishee[] = [
  { id: "avocado", name: "Avocado", theme: "food", file: "avocado.png", poke: null },
  { id: "bear", name: "Bear", theme: "animal", file: "bear.png", poke: null },
  { id: "bun", name: "Bun", theme: "food", file: "bun.png", poke: null },
  { id: "bunny", name: "Bunny", theme: "animal", file: "bunny.png", poke: null },
  { id: "cat", name: "Cat", theme: "animal", file: "cat.png", poke: "cat-poke.mp4" },
  { id: "chick", name: "Chick", theme: "animal", file: "chick.png", poke: null },
  { id: "corn", name: "Corn", theme: "food", file: "corn.png", poke: null },
  { id: "donut", name: "Donut", theme: "food", file: "donut.png", poke: null },
  { id: "duck", name: "Duck", theme: "animal", file: "duck.png", poke: null },
  { id: "frog", name: "Frog", theme: "animal", file: "frog.png", poke: "frog-poke.mp4" },
  { id: "grape", name: "Grape", theme: "food", file: "grape.png", poke: null },
  { id: "melon", name: "Melon", theme: "food", file: "melon.png", poke: null },
  { id: "owl", name: "Owl", theme: "animal", file: "owl.png", poke: null },
  { id: "panda", name: "Panda", theme: "animal", file: "panda.png", poke: null },
  { id: "peach", name: "Peach", theme: "food", file: "peach.png", poke: null },
  { id: "pig", name: "Pig", theme: "animal", file: "pig.png", poke: null },
  { id: "shark", name: "Shark", theme: "animal", file: "shark.png", poke: null },
  { id: "taco", name: "Taco", theme: "food", file: "taco.png", poke: null },
];

export const SQUISHEE_IDS = SQUISHEES.map((s) => s.id);

export function squisheeById(id: string): Squishee | undefined {
  return SQUISHEES.find((s) => s.id === id);
}

export function squisheeSrc(id: string): string {
  const s = squisheeById(id) ?? SQUISHEES[0]!;
  return asset(`squishees/${s.file}`);
}

export function nextSquishee(earned: string[], learnerId: string, count: number): string | null {
  const locked = SQUISHEES.filter((s) => !earned.includes(s.id));
  if (!locked.length) return null;
  const rng = rngFromSeed(`squishee:${learnerId}:${count}:${earned.join(",")}`);
  return rng.pick(locked).id;
}
