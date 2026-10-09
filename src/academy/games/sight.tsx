import type { Rng } from "@/lib/rng";
import { bandFor } from "../grade-map";
import type { Grade } from "../model";
import { SquisheeImg, cx } from "../ui/bits";
import { qid } from "./choices";
import { SpeakerBar } from "./speaker";
import {
  ALL_SIGHT,
  isSightList,
  sightWords,
  SIGHT_LEVELS,
  type SightList,
  type SightWord,
} from "./sight-data";
import type { ChoiceProps, ChoiceQ, GameModule, SheetItem, SightMode } from "./types";
import { WordSheet } from "./word-sheet";
import { blankOut, dueWordIds, pickFromPrefer } from "./words";

const LEVELS = [
  { id: "preprimer", label: "Pre-primer", num: 1 },
  { id: "primer", label: "Primer", num: 2 },
  { id: "first", label: "1st grade", num: 3 },
  { id: "second", label: "2nd grade", num: 4 },
  { id: "third", label: "3rd grade", num: 5 },
] as const;

const BARS = [
  { key: "sight:preprimer", label: "Pre-primer words" },
  { key: "sight:primer", label: "Primer words" },
  { key: "sight:first", label: "1st grade words" },
  { key: "sight:second", label: "2nd grade words" },
  { key: "sight:third", label: "3rd grade words" },
];

const CHIPS = BARS;

export function pickSightMode(rng: Rng, level: SightList): SightMode {
  const roll = rng.next();
  switch (level) {
    case "preprimer":
    case "primer":
    case "first":
      return roll < 0.58 ? "hear" : "match";
    case "second":
      if (roll < 0.28) return "hear";
      if (roll < 0.48) return "match";
      return "fill";
    case "third":
      if (roll < 0.22) return "hear";
      if (roll < 0.36) return "match";
      return "fill";
    default: {
      const neverLevel: never = level;
      return neverLevel;
    }
  }
}

function concreteOthers(list: readonly SightWord[], word: SightWord): SightWord[] {
  return list.filter((item) => item.emoji && item.id !== word.id);
}

function resolveMode(rng: Rng, level: SightList, word: SightWord, list: readonly SightWord[]): SightMode {
  const rolled = pickSightMode(rng, level);
  if (rolled !== "match") return rolled;
  if (word.emoji && concreteOthers(list, word).length >= 3) return "match";
  if (level === "second" || level === "third") return "fill";
  return "hear";
}

function otherWords(rng: Rng, list: readonly SightWord[], word: SightWord, take: SightWord[]): SightWord[] {
  const used = new Set(take.map((item) => item.id));
  used.add(word.id);
  return rng.shuffle(list.filter((item) => !used.has(item.id))).slice(0, 3);
}

export function makeSightQuestion(rng: Rng, level: SightList, prefer: string[] = []): ChoiceQ {
  const list = sightWords(level);
  const word = pickFromPrefer(rng, list, prefer);
  const mode = resolveMode(rng, level, word, list);
  const sentenceMatch =
    mode === "match" && (level === "second" || level === "third") && rng.next() < 0.45;
  const spoken =
    mode === "fill" ? blankOut(word.sentence, word.word).replaceAll("___", "blank") : word.word;
  let answer = word.word;
  let choices: string[] = [];
  let pictures: Record<string, string> | undefined;
  let title = "Tap what you hear";
  let hint = "Tap the speaker to hear it again.";
  let sentence = "";

  if (mode === "hear") {
    const others = otherWords(rng, list, word, []);
    choices = rng.shuffle([word.word, ...others.map((item) => item.word)]);
  } else if (mode === "match" && sentenceMatch) {
    title = "Tap the sentence";
    hint = "Find the sentence for this word.";
    const others = rng.shuffle(list.filter((item) => item.sentence !== word.sentence)).slice(0, 3);
    answer = word.sentence;
    choices = rng.shuffle([word.sentence, ...others.map((item) => item.sentence)]);
  } else if (mode === "match") {
    title = "Tap the picture";
    hint = "Tap the speaker if you want to hear it.";
    const others = rng.shuffle(concreteOthers(list, word)).slice(0, 3);
    pictures = { [word.word]: word.emoji };
    for (const item of others) pictures[item.word] = item.emoji;
    choices = rng.shuffle([word.word, ...others.map((item) => item.word)]);
  } else {
    title = "Tap the missing word";
    hint = "Listen, then tap the word that fits.";
    sentence = blankOut(word.sentence, word.word);
    const others = otherWords(rng, list, word, []);
    choices = rng.shuffle([word.word, ...others.map((item) => item.word)]);
  }

  return {
    id: qid(rng),
    game: "sight",
    title,
    hint,
    praise: `Yes! ${word.word}`,
    almost: `Almost! The word is ${word.word}.`,
    answer,
    choices,
    skill: `sight:${level}`,
    tags: [mode],
    factKey: word.id,
    replay: true,
    visual: {
      kind: "sight",
      mode,
      word: word.word,
      spoken,
      sentence,
      pictures,
      fallback: mode === "hear" ? word.word : "Ask someone to read this one.",
      caption: mode === "hear" ? "No speaker. The word is" : "No speaker on this device.",
      bigFallback: mode === "hear",
    },
  };
}

function sheetItem(rng: Rng, level: string): SheetItem {
  const list = sightWords(isSightList(level) ? level : "preprimer");
  const word = rng.pick(list);
  if (rng.next() < 0.65) {
    return { prompt: "Trace and write:", answer: word.word, trace: word.word };
  }
  return { prompt: blankOut(word.sentence, word.word), answer: word.word };
}

function labelFor(rows: { key: string; label: string }[], key: string): string | null {
  return rows.find((row) => row.key === key)?.label ?? null;
}

function defaultLevel(grade: Grade): SightList {
  const start = bandFor("sight", grade)?.start;
  if (isSightList(start)) return start;
  switch (grade) {
    case "K":
      return "preprimer";
    case "1":
      return "primer";
    case "2":
      return "second";
    case "3":
      return "third";
    default: {
      const neverGrade: never = grade;
      return neverGrade;
    }
  }
}

function SightCue({ mode, word, sentence }: { mode: SightMode; word: string; sentence: string }) {
  switch (mode) {
    case "hear":
      return null;
    case "match":
      return <p className="ac-sight-word">{word}</p>;
    case "fill":
      return <p className="ac-fill-sentence">{sentence}</p>;
    default: {
      const neverMode: never = mode;
      return neverMode;
    }
  }
}

export function SightPrompt({
  question,
  mascot,
  happy,
}: {
  question: ChoiceQ;
  reveal: boolean;
  mascot: string;
  happy: boolean;
}) {
  if (question.visual.kind !== "sight") return null;
  const visual = question.visual;
  return (
    <section className="ac-qcard" data-mode={visual.mode} data-answer={visual.word} data-solution={question.answer}>
      <h1>{question.title}</h1>
      <SquisheeImg id={mascot} className={cx("ac-mascot", happy && "is-happy")} />
      <SpeakerBar
        text={visual.spoken}
        fallback={visual.fallback}
        caption={visual.caption}
        large={visual.bigFallback}
        label="Hear it again"
      />
      <SightCue mode={visual.mode} word={visual.word} sentence={visual.sentence} />
      <p className="ac-hint">{question.hint}</p>
    </section>
  );
}

export function SightChoices({ question, reveal, picked, onChoose }: ChoiceProps) {
  if (question.visual.kind !== "sight") return null;
  const visual = question.visual;
  const pictures = visual.pictures;
  const stack = visual.mode === "match" && !pictures;
  return (
    <div className={cx("ac-choices", stack && "is-stack")}>
      {question.choices.map((choice) => {
        const cls =
          !reveal ? "" : choice === question.answer ? "is-yes" : choice === picked ? "is-no" : "is-dim";
        const emoji = pictures?.[choice];
        return (
          <button
            key={choice}
            type="button"
            className={cx("ac-choice", emoji ? "is-picture" : stack ? "is-sentence" : "is-word", cls)}
            data-choice={choice}
            aria-label={emoji ? `${emoji} ${choice}` : choice}
            onClick={() => onChoose(choice)}
          >
            {emoji ? <span aria-hidden="true">{emoji}</span> : choice}
          </button>
        );
      })}
    </div>
  );
}

export const sightGame = {
  id: "sight",
  title: "Sight Words",
  audience: "K–3",
  tint: "lav",
  mascot: "grape",
  sheetSlug: "sight-words",
  sheetScreen: "sheet-sight",
  blurb:
    "Free Dolch and Fry sight word practice for grades K–3. Hear a word, match a picture, and fill a sentence. Trace the list, then check the answer key.",
  sheetCount: 12,
  layout: "card",
  levels: [...LEVELS],
  defaultLevel,
  sheetDefaultLevel: "preprimer",
  isLevel: isSightList,
  pill: (level) => `Sight Words · Level ${level.num}`,
  makeQuestion: (rng, level, prefer) => makeSightQuestion(rng, isSightList(level) ? level : "preprimer", prefer),
  makeSheetItem: sheetItem,
  Prompt: SightPrompt,
  Choices: SightChoices,
  SheetBody: WordSheet,
  bars: BARS,
  chips: CHIPS,
  skillLabel: (key) => labelFor(BARS, key),
  chipLabel: (key) => labelFor(CHIPS, key),
  reviewKeys: (words) => dueWordIds(words, ALL_SIGHT.map((word) => word.id)),
} satisfies GameModule;

export { SIGHT_LEVELS };
