import { cpSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

export const STORY_BACKGROUND_IDS = ["meadow", "garden", "night", "shore", "dock", "room", "kitchen", "bedroom"];
export const STORY_BACKGROUND_FILES = STORY_BACKGROUND_IDS.map((id) => `art/story-backgrounds/${id}.webp`);

/** Dynamic scene URLs must ship in both Academy builds and offline precache. */
export function copyStoryBackgrounds(outDir) {
  for (const rel of STORY_BACKGROUND_FILES) {
    const dest = resolve(outDir, rel);
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(resolve("public", rel), dest);
  }
}
