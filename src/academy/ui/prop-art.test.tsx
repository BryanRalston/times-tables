import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { STORY_PROPS, STORIES } from "../stories/catalog";
import { storyViolations } from "../stories/engine";
import { PropArt, StoryPicture } from "./story-scene";
import { PROBLEM_OBJECTS, ProblemObjects, ProblemPicture } from "./problem-object";
import { StoryGroups } from "../games/scene-ui";
import { PROP_ART_FILES, STORY_PROP_IDS, PROBLEM_OBJECT_IDS } from "../../../scripts/academy-prop-assets.mjs";

describe("Imagine lesson objects", () => {
  it("ships every story and counting object through the explicit build manifest", () => {
    expect([...STORY_PROP_IDS].sort()).toEqual([...STORY_PROPS].sort());
    expect([...PROBLEM_OBJECT_IDS].sort()).toEqual(Object.values(PROBLEM_OBJECTS).sort());
    expect(PROP_ART_FILES).toHaveLength(18);
    for (const rel of PROP_ART_FILES) {
      expect(existsSync(resolve("public", rel)), rel).toBe(true);
      const png = readFileSync(resolve("public", rel));
      expect(png.readUInt32BE(16)).toBe(512);
      expect(png.readUInt32BE(20)).toBe(512);
    }
  });
  it("renders every story prop with accessible image dimensions and translated choice labels", () => {
    for (const id of STORY_PROPS) {
      const html = renderToStaticMarkup(<PropArt id={id} />);
      expect(html).toContain(`art/story-props/${id}.png`);
      expect(html).toContain(`alt="${id}"`);
      expect(html).toContain('width="512" height="512"');
      expect(html).not.toContain("<svg");
    }
    expect(renderToStaticMarkup(<StoryPicture picture={{ kind: "prop", id: "hat" }} label="sombrero" />)).toContain('alt="sombrero"');
  });
  it("renders counted images without changing arithmetic or equal-group boundaries", () => {
    for (const [token, id] of Object.entries(PROBLEM_OBJECTS)) {
      const html = renderToStaticMarkup(<ProblemObjects token={token} count={4} />);
      expect((html.match(/<img /g) ?? [])).toHaveLength(4);
      expect(html).toContain(`art/problem-objects/${id}.png`);
      expect(html).not.toContain(token);
    }
    for (const [op, expected] of [["+", 7], ["-", 5], ["×", 10], ["÷", 4]] as const) {
      const html = renderToStaticMarkup(<StoryGroups op={op} a={5} b={2} emoji="🍪" />);
      expect((html.match(/<img /g) ?? [])).toHaveLength(expected);
    }
    const html = renderToStaticMarkup(<ProblemPicture picture="🐸🐸🐸 🐸🐸🐸" />);
    expect((html.match(/<img /g) ?? [])).toHaveLength(6);
    expect((html.match(/class="ac-object-set"/g) ?? [])).toHaveLength(2);
  });
  it("keeps the existing story grade guardrails intact", () => {
    expect(STORIES.flatMap((story) => storyViolations(story))).toEqual([]);
  });
});
