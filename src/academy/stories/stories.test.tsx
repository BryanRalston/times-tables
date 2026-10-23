import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { installArabic, installChinese, installFrench, installHindi, installPortuguese, setLocale, type Locale } from "../i18n";
import * as portuguese from "../i18n-pt";
import * as french from "../i18n-fr";
import * as chinese from "../i18n-zh";
import * as hindi from "../i18n-hi";
import * as arabic from "../i18n-ar";
import type { Grade } from "../model";
import { storyBrief } from "../family-report";
import { applyStory } from "../rewards";
import { blankChild } from "../storage";
import { clipStartMs } from "../voice/player";
import { VOICE_FILES } from "../voice/manifest";
import { VOICE_FILES_ES } from "../voice/manifest-es";
import { VOICE_FILES_PT } from "../voice/manifest-pt";
import { VOICE_FILES_FR } from "../voice/manifest-fr";
import { VOICE_FILES_ZH } from "../voice/manifest-zh";
import { VOICE_FILES_HI } from "../voice/manifest-hi";
import { VOICE_FILES_AR } from "../voice/manifest-ar";
import { idealPieces, planSpeech } from "../voice/plan";
import { wordAllowed } from "./band";
import { STORY_COPY, type StoryLang } from "./copy";
import { STORIES, storyById } from "./catalog";
import { openStory, stepReader, storiesForGrade, storyScore, storyViolations } from "./engine";
import { presentStory, storySpeechLines } from "./localize";
import { lineTokens } from "./read";
import { HomeScreen } from "../ui/home";
import { StoriesShelf, StoryReader } from "../ui/stories";

installPortuguese(portuguese);
installFrench(french);
installChinese(chinese);
installHindi(hindi);
installArabic(arabic);

const VOICE_BY_LANG: Record<Locale, Record<string, string>> = {
  en: VOICE_FILES,
  es: VOICE_FILES_ES,
  pt: VOICE_FILES_PT,
  fr: VOICE_FILES_FR,
  zh: VOICE_FILES_ZH,
  hi: VOICE_FILES_HI,
  ar: VOICE_FILES_AR,
};

const STORY_LANGS = ["es", "pt", "fr", "zh", "hi", "ar"] as const satisfies readonly StoryLang[];

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

  it("lists finished books for grown-ups in the language on screen", () => {
    const skills = { "story:pk-peach-cat": { ok: 1, miss: 0 }, "story:g2-bear-boat": { ok: 2, miss: 0 } };
    expect(storyBrief(skills)).toMatchObject({
      finishes: 3,
      titles: ["The cat", "The boat"],
    });
    setLocale("es");
    const spanish = storyBrief(skills);
    expect(spanish.finishes).toBe(3);
    expect(spanish.titles).toEqual(["La gatita", "El barco"]);
    expect(spanish.line).toContain("cuentos");
    expect(spanish.line.toLowerCase()).not.toContain("inglés");
  });

  it("opens the Spanish shelf and the Spanish book from the home language", () => {
    const child = blankChild({ id: "ada", name: "Ada", grade: "2" as Grade });
    setLocale("es");
    const home = renderToStaticMarkup(
      <HomeScreen child={child} sound={false} onClaim={() => {}} onPlay={() => {}} />,
    );
    const shelf = renderToStaticMarkup(<StoriesShelf grade="2" skills={{}} />);
    expect(home).toContain('href="#/stories"');
    expect(shelf).toContain('dir="ltr"');
    expect(shelf).toContain("La gatita");
    expect(shelf).toContain("El barco");
    expect(shelf).not.toContain("The cat");
    const book = renderToStaticMarkup(
      <StoryReader story={storyById("pk-peach-cat")!} grade="PK" sound={false} onFinish={() => {}} />,
    );
    expect(book).toContain("gatita.");
    expect(book).toContain("Léemelo");
    expect(book).not.toContain("can see a cat");
  });
});

describe("story languages", () => {
  it("has a full book in every language, with words the clip planner can say", () => {
    const problems: string[] = [];
    for (const lang of STORY_LANGS) {
      setLocale(lang);
      for (const story of STORIES) {
        const copy = STORY_COPY[lang][story.id];
        if (!copy) {
          problems.push(`${lang} ${story.id} missing`);
          continue;
        }
        if (copy.pages.length !== story.pages.length) problems.push(`${lang} ${story.id} pages`);
        if (copy.checks.length !== story.checks.length) problems.push(`${lang} ${story.id} checks`);
        const shown = presentStory(story);
        expect(shown.title).toBe(copy.title);
        for (const line of storySpeechLines(story)) {
          const tokens = lineTokens(line);
          if (tokens.length === 0) problems.push(`${lang} ${story.id} empty ${line}`);
          const pieces = idealPieces(line);
          const planned = pieces?.flatMap((piece) => piece.key.split(" ")) ?? [];
          if (tokens.map((token) => token.key).join("|") !== planned.join("|")) {
            problems.push(`${lang} ${line} :: ${tokens.map((token) => token.key).join("|")} != ${planned.join("|")}`);
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it("keeps Arabic books right to left and Chinese words in their own face", () => {
    const story = storyById("g2-bear-boat");
    expect(story).toBeTruthy();
    if (!story) return;
    setLocale("ar");
    const arabic = renderToStaticMarkup(
      <StoryReader story={story} grade="2" sound={false} onFinish={() => {}} />,
    );
    expect(arabic).toContain('dir="rtl"');
    expect(arabic).toContain('lang="ar"');
    expect(arabic).toContain("قاربا");
    expect(arabic).toContain("التالي");
    expect(arabic).toContain("رجوع");
    const backAt = arabic.indexOf('data-story-back');
    const nextAt = arabic.indexOf('data-story-next');
    expect(backAt).toBeGreaterThan(0);
    expect(nextAt).toBeGreaterThan(backAt);
    setLocale("zh");
    const chinese = renderToStaticMarkup(
      <StoryReader story={story} grade="2" sound={false} onFinish={() => {}} />,
    );
    expect(chinese).toContain('dir="ltr"');
    expect(chinese).toContain("看见");
    expect(chinese).toContain("小船");
    expect(chinese).toContain("下一页");
  });

  it("has a recorded word clip for every book in every language", () => {
    const missing: string[] = [];
    for (const lang of ["en", ...STORY_LANGS] as const) {
      setLocale(lang);
      const files = VOICE_BY_LANG[lang];
      for (const story of STORIES) {
        for (const line of storySpeechLines(story)) {
          const pieces = idealPieces(line);
          if (!pieces) {
            missing.push(`${lang} ${story.id} ${line}`);
            continue;
          }
          for (const piece of pieces) {
            for (const key of piece.key.split(" ")) {
              const file = files[key];
              const abs = file ? resolve("academy/public/voice", file) : "";
              if (!file || !existsSync(abs) || statSync(abs).size <= 200) missing.push(`${lang} ${story.id} ${key}`);
            }
          }
        }
      }
    }
    expect(missing).toEqual([]);
  });
});
