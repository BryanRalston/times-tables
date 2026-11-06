import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { setLocale } from "../i18n";
import { STORIES, STORY_BACKGROUNDS } from "../stories/catalog";
import { storyViolations } from "../stories/engine";
import { presentStory } from "../stories/localize";
import { StoryScene } from "./story-scene";
import { STORY_BACKGROUND_FILES, STORY_BACKGROUND_IDS } from "../../../scripts/academy-background-assets.mjs";
import { artPaths } from "../../../scripts/academy-precache.mjs";

afterEach(() => setLocale("en"));

describe("Imagine story backgrounds", () => {
  it("maps every page of every book to existing, explicitly shipped art", () => {
    expect(STORY_BACKGROUND_IDS).toEqual([...STORY_BACKGROUNDS]);
    const used = new Set<string>();
    for (const story of STORIES) {
      for (const page of story.pages) {
        const rel = `art/story-backgrounds/${page.background}.webp`;
        expect(STORY_BACKGROUND_FILES, `${story.id}: ${page.text}`).toContain(rel);
        expect(artPaths()).toContain(rel);
        expect(existsSync(resolve("public", rel)), rel).toBe(true);
        used.add(page.background);
        if (page.mood === "night") expect(["night", "bedroom"]).toContain(page.background);
        if (page.mood === "water") expect(["shore", "dock"]).toContain(page.background);
      }
    }
    expect([...used].sort()).toEqual([...STORY_BACKGROUNDS].sort());
    for (const rel of STORY_BACKGROUND_FILES) {
      const file = resolve("public", rel);
      expect(statSync(file).size).toBeLessThan(150_000);
      expect(readFileSync(file).subarray(8, 12).toString()).toBe("WEBP");
    }
  });

  it("keeps the same page settings in all seven locales including RTL", () => {
    for (const locale of ["en", "es", "pt", "fr", "zh", "hi", "ar"] as const) {
      setLocale(locale);
      for (const story of STORIES) {
        expect(presentStory(story).pages.map((page) => page.background)).toEqual(story.pages.map((page) => page.background));
      }
    }
  });

  it("renders decorative backgrounds behind the stage without changing art", () => {
    for (const story of STORIES) {
      for (const page of story.pages) {
        const html = renderToStaticMarkup(<StoryScene {...page} />);
        expect(html).toContain(`art/story-backgrounds/${page.background}.webp`);
        expect(html).toContain('alt="" width="1200" height="900"');
        expect(html.indexOf('class="ac-story-background"')).toBeLessThan(html.indexOf('class="ac-story-stage"'));
        expect(html).not.toContain('ac-story-sky');
        expect(html).not.toContain('ac-story-ground');
      }
    }
  });

  it("preserves every book's grade guardrails", () => {
    expect(STORIES.flatMap((story) => storyViolations(story))).toEqual([]);
  });
});
