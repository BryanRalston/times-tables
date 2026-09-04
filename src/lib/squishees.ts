import { asset } from "@/lib/art";

export type Rarity = "common" | "rare";

export interface PokeStripMeta {
  frames: number;
  fps: number;
  cell: number;
  src: string;
}

export interface Squishee {
  id: string;
  name: string;
  theme: "animal" | "food";
  file: string;
  poke: string | null;
  pokeStrip?: PokeStripMeta | null;
  cheer?: string | null;
  cheerStrip?: PokeStripMeta | null;
  rarity: Rarity;
}

/** Kitchen sprite filename: public/squishees/<id>-poke-strip.png */
export function pokeStripFile(id: string): string {
  return `${id}-poke-strip.png`;
}

export function pokeStripJsonFile(id: string): string {
  return `${id}-poke-strip.json`;
}

export function cheerFile(id: string): string {
  return `${id}-cheer.mp4`;
}

export function cheerStripFile(id: string): string {
  return `${id}-cheer-strip.png`;
}

export function cheerStripJsonFile(id: string): string {
  return `${id}-cheer-strip.json`;
}

function withWiredCheer(s: Squishee): Squishee {
  return {
    ...s,
    cheer: cheerFile(s.id),
    cheerStrip: { frames: 36, fps: 24, cell: 384, src: cheerStripFile(s.id) },
  };
}

export function parsePokeStripJson(raw: unknown): PokeStripMeta | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const frames = Number(o.frames);
  const fps = Number(o.fps);
  const cell = Number(o.cell);
  const src = typeof o.src === "string" ? o.src.replace(/\\/g, "/").trim() : "";
  if (!Number.isInteger(frames) || frames < 2 || frames > 64) return null;
  if (!Number.isFinite(fps) || fps < 1 || fps > 30) return null;
  if (!Number.isInteger(cell) || cell < 16 || cell > 1024) return null;
  if (!src.endsWith(".png") || src.includes("..") || src.includes(":")) return null;
  const file = src.split("/").pop() ?? "";
  if (!file.endsWith("-strip.png")) return null;
  return { frames, fps, cell, src: file };
}

export function pokeStripSrc(meta: PokeStripMeta): string {
  return asset(`squishees/${meta.src}`);
}

const COMMON: Squishee[] = [
  { id: "avocado", name: "Avocado", theme: "food", file: "avocado.png", poke: null, rarity: "common" },
  { id: "bear", name: "Bear", theme: "animal", file: "bear.png", poke: null, rarity: "common" },
  { id: "bun", name: "Bun", theme: "food", file: "bun.png", poke: null, rarity: "common" },
  { id: "bunny", name: "Bunny", theme: "animal", file: "bunny.png", poke: "bunny-poke.mp4", pokeStrip: { frames: 16, fps: 12, cell: 384, src: "bunny-poke-strip.png" }, rarity: "common" },
  { id: "cat", name: "Cat", theme: "animal", file: "cat.png", poke: "cat-poke.mp4", pokeStrip: { frames: 16, fps: 12, cell: 384, src: "cat-poke-strip.png" }, rarity: "common" },
  { id: "chick", name: "Chick", theme: "animal", file: "chick.png", poke: null, rarity: "common" },
  { id: "corn", name: "Corn", theme: "food", file: "corn.png", poke: null, rarity: "common" },
  { id: "donut", name: "Donut", theme: "food", file: "donut.png", poke: null, rarity: "common" },
  { id: "duck", name: "Duck", theme: "animal", file: "duck.png", poke: null, rarity: "common" },
  { id: "frog", name: "Frog", theme: "animal", file: "frog.png", poke: "frog-poke.mp4", pokeStrip: { frames: 16, fps: 12, cell: 384, src: "frog-poke-strip.png" }, rarity: "common" },
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
  { id: "capybara", name: "Capybara", theme: "animal", file: "capybara.png", poke: null, rarity: "common" },
  { id: "axolotl", name: "Axolotl", theme: "animal", file: "axolotl.png", poke: null, rarity: "common" },
  { id: "red-panda", name: "Red Panda", theme: "animal", file: "red-panda.png", poke: null, rarity: "common" },
  { id: "boba", name: "Boba", theme: "food", file: "boba.png", poke: null, rarity: "common" },
  { id: "toast", name: "Toast", theme: "food", file: "toast.png", poke: null, rarity: "common" },
  { id: "cactus", name: "Cactus", theme: "food", file: "cactus.png", poke: null, rarity: "common" },
  { id: "mushroom", name: "Mushroom", theme: "food", file: "mushroom.png", poke: null, rarity: "common" },
  { id: "dumpling", name: "Dumpling", theme: "food", file: "dumpling.png", poke: null, rarity: "common" },
  { id: "matcha", name: "Matcha", theme: "food", file: "matcha.png", poke: null, rarity: "common" },
  { id: "sloth", name: "Sloth", theme: "animal", file: "sloth.png", poke: null, rarity: "common" },
].map(withWiredCheer);

const RARE: Squishee[] = [
  { id: "crystal-axolotl", name: "Crystal Axolotl", theme: "animal", file: "crystal-axolotl.png", poke: null, rarity: "rare" },
  { id: "galaxy-narwhal", name: "Galaxy Narwhal", theme: "animal", file: "galaxy-narwhal.png", poke: null, rarity: "rare" },
  { id: "golden-dragon", name: "Golden Dragon", theme: "animal", file: "golden-dragon.png", poke: null, rarity: "rare" },
  { id: "rainbow-cupcake", name: "Rainbow Cupcake", theme: "food", file: "rainbow-cupcake.png", poke: null, rarity: "rare" },
  { id: "aurora-jelly", name: "Aurora Jelly", theme: "animal", file: "aurora-jelly.png", poke: null, rarity: "rare" },
  { id: "star-mochi", name: "Star Mochi", theme: "food", file: "star-mochi.png", poke: null, rarity: "rare" },
  { id: "sleepy-moon", name: "Sleepy Moon", theme: "animal", file: "sleepy-moon.png", poke: null, rarity: "rare" },
  { id: "blush-cloud", name: "Blush Cloud", theme: "animal", file: "blush-cloud.png", poke: null, rarity: "rare" },
].map(withWiredCheer);

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

export function squisheePokeStrip(id: string): PokeStripMeta | null {
  const s = squisheeById(id);
  const meta = parsePokeStripJson(s?.pokeStrip ?? null);
  if (!meta) return null;
  return { ...meta, src: pokeStripSrc(meta) };
}

export function squisheeCheerSrc(id: string): string | null {
  const s = squisheeById(id);
  return s?.cheer ? asset(`squishees/${s.cheer}`) : null;
}

export function squisheeCheerStrip(id: string): PokeStripMeta | null {
  const s = squisheeById(id);
  const meta = parsePokeStripJson(s?.cheerStrip ?? null);
  if (!meta) return null;
  return { ...meta, src: pokeStripSrc(meta) };
}
