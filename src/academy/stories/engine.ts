import type { Grade } from "../model";
import { castToken, gradeCap, storyRank, wordAllowed, type StoryGrade } from "./band";
import { STORY_PROPS, storyById, STORIES, type Story, type StoryCheck, type StoryProp } from "./catalog";
import { storyTextError, storyWords } from "./read";

export { storiesOffered } from "./offer";

export interface ReaderState {
  phase: "page" | "check" | "done";
  page: number;
  check: number;
  /** Check to reopen after this page, when a miss sent the child back. */
  returnTo: number | null;
  /** Still the first try for this check. A miss clears it. */
  fresh: boolean[];
  /** True only when the first tap was the answer. */
  correct: boolean[];
}

export type ReaderAction =
  | { type: "next"; pages: number }
  | { type: "back"; pages: number }
  | { type: "answer"; choice: string; answer: string; page: number };

export function openStory(checkCount: number): ReaderState {
  const n = Math.max(0, checkCount);
  return {
    phase: "page",
    page: 0,
    check: 0,
    returnTo: null,
    fresh: Array.from({ length: n }, () => true),
    correct: Array.from({ length: n }, () => false),
  };
}

export function storyScore(state: ReaderState): { correct: number; total: number } {
  return { correct: state.correct.filter(Boolean).length, total: state.correct.length };
}

function copyFlags(flags: boolean[]): boolean[] {
  return flags.slice();
}

export function stepReader(state: ReaderState, action: ReaderAction): ReaderState {
  switch (action.type) {
    case "next": {
      if (state.phase !== "page") return state;
      if (state.returnTo != null) {
        return { ...state, phase: "check", check: state.returnTo, returnTo: null };
      }
      if (state.page + 1 < action.pages) return { ...state, page: state.page + 1 };
      if (state.correct.length === 0) return { ...state, phase: "done" };
      return { ...state, phase: "check", check: 0 };
    }
    case "back": {
      if (state.phase === "done") return { ...state, phase: "page", page: Math.max(0, action.pages - 1), returnTo: null };
      if (state.phase === "check") return { ...state, phase: "page", page: Math.max(0, action.pages - 1), returnTo: null };
      if (state.page <= 0) return state;
      return { ...state, page: state.page - 1, returnTo: null };
    }
    case "answer": {
      if (state.phase !== "check") return state;
      const fresh = copyFlags(state.fresh);
      const correct = copyFlags(state.correct);
      const wasFresh = fresh[state.check] === true;
      fresh[state.check] = false;
      if (action.choice === action.answer) {
        if (wasFresh) correct[state.check] = true;
        const next = state.check + 1;
        if (next >= correct.length) return { ...state, phase: "done", fresh, correct, returnTo: null };
        return { ...state, phase: "check", check: next, fresh, correct, returnTo: null };
      }
      correct[state.check] = false;
      return { ...state, phase: "page", page: action.page, returnTo: state.check, fresh, correct };
    }
    default: {
      const neverAction: never = action;
      return neverAction;
    }
  }
}

export function storiesForGrade(grade: Grade): readonly Story[] {
  const cap = gradeCap(grade);
  return STORIES.filter((story) => storyRank(story.grade) <= cap).sort((a, b) => {
    const byGrade = storyRank(b.grade) - storyRank(a.grade);
    if (byGrade !== 0) return byGrade;
    return a.title.localeCompare(b.title);
  });
}

export function isStoryProp(value: string): value is StoryProp {
  return (STORY_PROPS as readonly string[]).includes(value);
}

function wordsOutOfBand(grade: StoryGrade, cast: readonly string[], text: string): string[] {
  return storyWords(text).filter((word) => !wordAllowed(grade, word, cast));
}

/** Why a book breaks the grade band, or an empty list when it holds. */
export function storyViolations(story: Story): string[] {
  const problems: string[] = [];
  const seenCast = new Set<string>();
  for (const id of story.cast) {
    if (seenCast.has(id)) problems.push(`cast repeat ${id}`);
    seenCast.add(id);
    if (!castToken(id)) problems.push(`cast ${id}`);
  }
  if (story.pages.length < 4 || story.pages.length > 10) problems.push(`pages ${story.pages.length}`);
  if (story.checks.length < 1 || story.checks.length > 2) problems.push(`checks ${story.checks.length}`);
  const cap = story.grade === "PK" ? 8 : 12;
  for (let i = 0; i < story.pages.length; i += 1) {
    const page = story.pages[i];
    if (!page) continue;
    const textError = storyTextError(page.text);
    if (textError) problems.push(`page ${i} ${textError}`);
    const words = storyWords(page.text);
    if (words.length > cap) problems.push(`page ${i} long`);
    for (const word of wordsOutOfBand(story.grade, story.cast, page.text)) problems.push(`page ${i} ${word}`);
    if (page.pals.length === 0) problems.push(`page ${i} no pal`);
    for (const pal of page.pals) {
      if (!story.cast.includes(pal)) problems.push(`page ${i} pal ${pal}`);
    }
    if (page.prop && !isStoryProp(page.prop)) problems.push(`page ${i} prop`);
  }
  for (let i = 0; i < story.checks.length; i += 1) {
    const check = story.checks[i];
    if (!check) continue;
    problems.push(...checkViolations(story, i, check));
  }
  return problems;
}

function checkViolations(story: Story, index: number, check: StoryCheck): string[] {
  const problems: string[] = [];
  const textError = storyTextError(check.prompt);
  if (textError) problems.push(`check ${index} ${textError}`);
  for (const word of wordsOutOfBand(story.grade, story.cast, check.prompt)) problems.push(`check ${index} ${word}`);
  if (check.page < 0 || check.page >= story.pages.length) problems.push(`check ${index} page`);
  const ids = check.choices.map((choice) => choice.id);
  if (new Set(ids).size !== ids.length) problems.push(`check ${index} ids`);
  if (!ids.includes(check.answer)) problems.push(`check ${index} answer`);
  for (const choice of check.choices) {
    const textError = storyTextError(choice.label);
    if (textError) problems.push(`check ${index} label ${textError}`);
    for (const word of wordsOutOfBand(story.grade, story.cast, choice.label)) {
      problems.push(`check ${index} label ${word}`);
    }
    if (choice.picture.kind === "pal") {
      if (!castToken(choice.picture.id)) problems.push(`check ${index} pal ${choice.picture.id}`);
    } else if (choice.picture.kind === "prop") {
      if (!isStoryProp(choice.picture.id)) problems.push(`check ${index} prop`);
    } else {
      const neverPicture: never = choice.picture;
      problems.push(neverPicture);
    }
  }
  return problems;
}

export function knownStory(id: string | undefined): Story | undefined {
  return storyById(id);
}
