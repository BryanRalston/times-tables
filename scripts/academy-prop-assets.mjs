import { cpSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

export const STORY_PROP_IDS = ["hat", "mat", "sun", "bug", "cup", "kite", "fish", "log", "snack", "moon", "house", "boat"];
export const PROBLEM_OBJECT_IDS = ["apple", "fish", "star", "cookie", "ball", "frog"];
export const PROP_ART_FILES = [
  ...STORY_PROP_IDS.map((id) => `art/story-props/${id}.png`),
  ...PROBLEM_OBJECT_IDS.map((id) => `art/problem-objects/${id}.png`),
];

/** Explicit manifest: dynamic image URLs must not rely on bundle string scanning. */
export function copyPropArt(outDir) {
  for (const rel of PROP_ART_FILES) {
    const dest = resolve(outDir, rel);
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(resolve("public", rel), dest);
  }
}
