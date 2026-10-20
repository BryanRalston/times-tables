import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { setLocale } from "../i18n";
import type { Grade } from "../model";
import { storyBrief } from "../family-report";
import { applyStory } from "../rewards";
import { blankChild } from "../storage";
import { clipStartMs } from "../voice/player";
import { VOICE_FILES } from "../voice/clips";
import { planSpeech } from "../voice/plan";
import { wordAllowed } from "./band";
import { STORIES, storyById } from "./catalog";
import { openStory, stepReader, storiesForGrade, storyScore, storyViolations } from "./engine";
import { lineTokens } from "./read";
import { HomeScreen } from "../ui/home";
import { StoriesShelf } from "../ui/stories";

const hasClip = (key: string) => Object.prototype.hasOwnProperty.call(VOICE_FILES, key);

afterEach(() => {
  setLocale("en");
});

describe("story grade bands", () => {
  it("keeps every book inside its sight-word and phonics band", () => {
    expect(STORIES.length).toBeGreaterThanOrEqual(8);
    for (const grade of ["PK", "K", "1", "2"] as const) {
      expect(STORIES.filter((story) => story.grade === grade).length).toBeGreaterThanOrEqual(2);
    }
    const problems = STORIES.flatMap((story) => storyViolations(story).map((row) => `${story.id}: ${row}`));
    expect(problems).toEqual([]);
  });

  it("refuses a later-grade word and allows a name only for that cast", () => {
    expect(wordAllowed("PK", "on", [])).toBe(false);
    expect(wordAllowed("PK", "has", [])).toBe(false);
    expect(wordAllowed("PK", "cat", [])).toBe(true);
    expect(wordAllowed("PK", "peach", [])).toBe(false);
    expect(wordAllowed("PK", "peach", ["peach"])).toBe(true);
    expect(wordAllowed("K", "cup", [])).toBe(true);
    expect(wordAllowed("K", "has", [])).toBe(false);
    expect(wordAllowed("1", "kite", [])).toBe(true);
    expect(wordAllowed("1", "night", [])).toBe(false);
    expect(wordAllowed("2", "night", [])).toBe(true);
    expect(wordAllowed("2", "habitat", [])).toBe(false);
    expect(wordAllowed("2", "predict", [])).toBe(false);
  });

  it("opens books at the child's grade and every easier book", () => {
    expect(storiesForGrade("PK").map((story) => story.grade)).toEqual(["PK", "PK"]);
    expect(storiesForGrade("K").some((story) => story.grade === "1")).toBe(false);
    expect(storiesForGrade("1").some((story) => story.grade === "2")).toBe(false);
    expect(storiesForGrade("1").some((story) => story.grade === "PK")).toBe(true);
    for (const grade of ["2", "3", "4"] as const) {
      expect(storiesForGrade(grade)).toHaveLength(STORIES.length);
      expect(storiesForGrade(grade)[0]?.grade).toBe("2");
    }
  });
});

describe("story read-along", () => {
  it("splits a page into words and keeps the punctuation on the word", () => {
    expect(lineTokens("Hop, hop, hop!").map((token) => [token.text, token.gapAfterMs])).toEqual([
      ["Hop,", 120],
      ["hop,", 120],
      ["hop!", 200],
    ]);
    expect(lineTokens("Peach can see a cat.").map((token) => token.key)).toEqual(["peach", "can", "see", "a", "cat"]);
  });

  it("lines up highlight times with clip lengths", () => {
    expect(clipStartMs([100, 200], [70, 60], 40)).toEqual([40, 210]);
  });

  it("shows the answer page after a miss and only counts a first-try tap", () => {
    const story = storyById("pk-peach-cat");
    expect(story).toBeTruthy();
    if (!story) return;
    let state = openStory(story.checks.length);
    for (let i = 0; i < story.pages.length; i += 1) {
      state = stepReader(state, { type: "next", pages: story.pages.length });
    }
    expect(state.phase).toBe("check");
    const first = story.checks[0];
    const second = story.checks[1];
    expect(first && second).toBeTruthy();
    if (!first || !second) return;
    state = stepReader(state, { type: "answer", choice: "pig", answer: first.answer, page: first.page });
    expect(state).toMatchObject({ phase: "page", page: first.page, returnTo: 0 });
    state = stepReader(state, { type: "next", pages: story.pages.length });
    expect(state).toMatchObject({ phase: "check", check: 0, returnTo: null });
    state = stepReader(state, { type: "answer", choice: first.answer, answer: first.answer, page: first.page });
    expect(state.correct[0]).toBe(false);
    expect(state).toMatchObject({ phase: "check", check: 1 });
    state = stepReader(state, { type: "answer", choice: second.answer, answer: second.answer, page: second.page });
    expect(state.phase).toBe("done");
    expect(storyScore(state)).toEqual({ correct: 1, total: 2 });
  });

  it("has a recorded clip for every word and every page", () => {
    const missing: string[] = [];
    for (const story of STORIES) {
      const lines = [
        ...story.pages.map((page) => page.text),
        ...story.checks.map((check) => check.prompt),
        ...story.checks.flatMap((check) => check.choices.map((choice) => choice.label)),
      ];
      for (const line of lines) {
        if (!planSpeech(line, hasClip)) missing.push(`${story.id}: ${line}`);
        for (const token of lineTokens(line)) {
          const file = VOICE_FILES[token.key];
          const abs = file ? resolve("academy/public/voice", file) : "";
          if (!file || !existsSync(abs) || statSync(abs).size <= 200) missing.push(`${story.id} word ${token.key}`);
        }
      }
    }
    expect(planSpeech("Yes!", hasClip)?.map((piece) => piece.key)).toEqual(["yes"]);
    expect(planSpeech("Let's look together.", hasClip)?.length).toBeGreaterThan(0);
    expect(missing).toEqual([]);
  });
});

describe("story rewards", () => {
  it("adds stars, coins, and friendship without moving the island", () => {
    const child = blankChild({ id: "ada", name: "Ada", grade: "1", avatarId: "peach" });
    const next = applyStory(child, { id: "pk-peach-cat", correct: 2, total: 2, seconds: 40 }, "2026-10-20");
    expect(next.stars).toBe(3);
    expect(next.coins).toBe(6);
    expect(next.bonds.peach).toBe(1);
    expect(next.rounds).toBe(1);
    expect(next.dailyRounds).toBe(1);
    expect(next.skills["story:pk-peach-cat"]).toEqual({ ok: 1, miss: 0 });
    expect(next.journey).toEqual(child.journey);
    expect(next.bestStars).toEqual(child.bestStars);
    const missed = applyStory(child, { id: "pk-frog-hop", correct: 0, total: 2, seconds: 20 }, "2026-10-20");
    expect(missed.stars).toBe(1);
  });

  it("lists finished books for grown-ups and hides the English titles in Spanish", () => {
    const skills = { "story:pk-peach-cat": { ok: 1, miss: 0 }, "story:g2-bear-boat": { ok: 2, miss: 0 } };
    expect(storyBrief(skills)).toMatchObject({
      finishes: 3,
      titles: ["The cat", "The boat"],
    });
    setLocale("es");
    const spanish = storyBrief(skills);
    expect(spanish.finishes).toBe(3);
    expect(spanish.titles).toEqual([]);
    expect(spanish.line.toLowerCase()).not.toContain("cat");
    expect(spanish.line.toLowerCase()).not.toContain("boat");
    expect(spanish.line).toContain("inglés");
  });

  it("hides story text when the language is Spanish", () => {
    const child = blankChild({ id: "ada", name: "Ada", grade: "2" as Grade });
    setLocale("es");
    const home = renderToStaticMarkup(
      <HomeScreen child={child} sound={false} onClaim={() => {}} onPlay={() => {}} />,
    );
    const shelf = renderToStaticMarkup(<StoriesShelf grade="2" skills={{}} />);
    expect(home).not.toContain('href="#/stories"');
    expect(shelf).toContain("inglés");
    for (const story of STORIES) {
      expect(shelf).not.toContain(story.title);
      expect(shelf).not.toContain(story.pages[0]?.text ?? "");
      expect(home).not.toContain(story.title);
    }
  });
});
