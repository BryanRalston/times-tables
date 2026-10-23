import { getLocale, type Locale } from "../i18n";
import { STORY_COPY, type StoryLang } from "./copy";
import type { Story } from "./catalog";

function isStoryLang(locale: Locale): locale is StoryLang {
  return locale === "es" || locale === "pt" || locale === "fr" || locale === "zh" || locale === "hi" || locale === "ar";
}

/** The book a child reads in the language on screen. English stays the source copy. */
export function presentStory(story: Story): Story {
  const locale = getLocale();
  if (!isStoryLang(locale)) return story;
  const copy = STORY_COPY[locale][story.id];
  if (!copy) return story;
  return {
    ...story,
    title: copy.title,
    pages: story.pages.map((page, index) => ({ ...page, text: copy.pages[index] ?? page.text })),
    checks: story.checks.map((check, index) => {
      const row = copy.checks[index];
      const left = check.choices[0];
      const right = check.choices[1];
      if (!row || !left || !right) return check;
      return {
        ...check,
        prompt: row.prompt,
        choices: [
          { ...left, label: row.labels[0] },
          { ...right, label: row.labels[1] },
        ],
      };
    }),
  };
}

/** Lines the recorded voice has to cover for the book in this language. */
export function storySpeechLines(story: Story): string[] {
  const shown = presentStory(story);
  return [
    ...shown.pages.map((page) => page.text),
    ...shown.checks.map((check) => check.prompt),
    ...shown.checks.flatMap((check) => check.choices.map((choice) => choice.label)),
  ];
}
