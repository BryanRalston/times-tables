import type { Rng } from "@/lib/rng";
import type { Grade } from "../model";
import type { PhonicsBoard } from "./boards";
import { sceneQuestion, uniqueChoices } from "./pick";
import { SceneCard, sceneModule } from "./scene-ui";
import { SpeakerBar } from "./speaker";
import type { ChoiceQ, PromptProps, SheetItem } from "./types";

export const PHONICS_LEVELS = ["sounds", "begin", "rhyme", "cvc", "end"] as const;
export type PhonicsLevel = (typeof PHONICS_LEVELS)[number];

const LEVELS = [
  { id: "sounds", label: "Letter sounds", num: 1 },
  { id: "begin", label: "Beginning sounds", num: 2 },
  { id: "rhyme", label: "Rhyming words", num: 3 },
  { id: "cvc", label: "CVC blending", num: 4 },
  { id: "end", label: "Ending sounds", num: 5 },
] as const;

const BARS = [
  { key: "phonics:sounds", label: "Letter sounds" },
  { key: "phonics:begin", label: "Beginning sounds" },
  { key: "phonics:rhyme", label: "Rhyming words" },
  { key: "phonics:cvc", label: "CVC blending" },
  { key: "phonics:end", label: "Ending sounds" },
];

export const SOUND_BANK = [
  { letter: "M", phoneme: "mmm", word: "moon", emoji: "🌙" },
  { letter: "S", phoneme: "sss", word: "sun", emoji: "🌞" },
  { letter: "T", phoneme: "tuh", word: "tiger", emoji: "🐯" },
  { letter: "B", phoneme: "buh", word: "bear", emoji: "🐻" },
  { letter: "P", phoneme: "puh", word: "pig", emoji: "🐷" },
  { letter: "F", phoneme: "fff", word: "fish", emoji: "🐟" },
  { letter: "N", phoneme: "nnn", word: "nest", emoji: "🪺" },
  { letter: "D", phoneme: "duh", word: "dog", emoji: "🐶" },
  { letter: "L", phoneme: "lll", word: "lion", emoji: "🦁" },
  { letter: "R", phoneme: "rrr", word: "rabbit", emoji: "🐰" },
  { letter: "G", phoneme: "guh", word: "goat", emoji: "🐐" },
  { letter: "H", phoneme: "huh", word: "house", emoji: "🏠" },
  { letter: "C", phoneme: "kuh", word: "cat", emoji: "🐱" },
  { letter: "K", phoneme: "kuh", word: "kite", emoji: "🪁" },
  { letter: "J", phoneme: "juh", word: "jar", emoji: "🫙" },
  { letter: "W", phoneme: "wuh", word: "watermelon", emoji: "🍉" },
  { letter: "V", phoneme: "vvv", word: "violin", emoji: "🎻" },
  { letter: "Y", phoneme: "yuh", word: "yoyo", emoji: "🪀" },
  { letter: "Z", phoneme: "zzz", word: "zebra", emoji: "🦓" },
  { letter: "A", phoneme: "aaa", word: "apple", emoji: "🍎" },
  { letter: "E", phoneme: "eh", word: "egg", emoji: "🥚" },
  { letter: "I", phoneme: "ih", word: "igloo", emoji: "🧊" },
  { letter: "O", phoneme: "ah", word: "octopus", emoji: "🐙" },
  { letter: "U", phoneme: "uh", word: "umbrella", emoji: "☂️" },
] as const;

export const PHONEME: Record<string, string> = {
  a: "aaa",
  e: "eh",
  i: "ih",
  o: "ah",
  u: "uh",
  b: "buh",
  c: "kuh",
  d: "duh",
  f: "fff",
  g: "guh",
  h: "huh",
  j: "juh",
  k: "kuh",
  l: "lll",
  m: "mmm",
  n: "nnn",
  p: "puh",
  r: "rrr",
  s: "sss",
  t: "tuh",
  v: "vvv",
  w: "wuh",
  y: "yuh",
  z: "zzz",
};

export const RHYME_FAMILIES = [
  { family: "at", words: ["cat", "bat", "hat", "mat", "rat", "sat"] },
  { family: "an", words: ["can", "man", "pan", "ran", "van", "fan"] },
  { family: "ig", words: ["pig", "dig", "wig", "big", "fig"] },
  { family: "op", words: ["hop", "mop", "top", "pop"] },
  { family: "ug", words: ["bug", "hug", "mug", "rug", "jug", "tug"] },
  { family: "ed", words: ["bed", "red", "fed", "led"] },
  { family: "in", words: ["pin", "bin", "fin", "win", "tin"] },
  { family: "ot", words: ["hot", "pot", "cot", "dot", "lot", "not"] },
  { family: "ap", words: ["cap", "map", "nap", "tap", "gap", "lap"] },
  { family: "un", words: ["sun", "run", "fun", "bun"] },
] as const;

const CVC_WORDS = RHYME_FAMILIES.flatMap((row) => row.words);
const END_LETTERS = ["t", "n", "g", "p", "d", "b", "m", "r", "s"] as const;

type SoundRow = (typeof SOUND_BANK)[number];

export function isPhonicsLevel(value: unknown): value is PhonicsLevel {
  return typeof value === "string" && (PHONICS_LEVELS as readonly string[]).includes(value);
}

function defaultLevel(grade: Grade): PhonicsLevel {
  switch (grade) {
    case "K":
      return "sounds";
    case "1":
      return "begin";
    case "2":
      return "cvc";
    case "3":
      return "cvc";
    default: {
      const neverGrade: never = grade;
      return neverGrade;
    }
  }
}

function pickSounds(rng: Rng, count: number): SoundRow[] {
  const picked: SoundRow[] = [];
  const used = new Set<string>();
  for (const row of rng.shuffle([...SOUND_BANK])) {
    if (used.has(row.phoneme)) continue;
    used.add(row.phoneme);
    picked.push(row);
    if (picked.length === count) break;
  }
  return picked;
}

function pictureMaps(rows: SoundRow[]): { pictures: Record<string, string>; labels: Record<string, string> } {
  const pictures: Record<string, string> = {};
  const labels: Record<string, string> = {};
  for (const row of rows) {
    pictures[row.word] = row.emoji;
    labels[row.word] = "";
  }
  return { pictures, labels };
}

function makeSounds(rng: Rng): ChoiceQ {
  const rows = pickSounds(rng, 4);
  const target = rng.pick(rows);
  const maps = pictureMaps(rows);
  const board: PhonicsBoard = {
    game: "phonics",
    mode: "sounds",
    letter: target.letter,
    phoneme: target.phoneme,
    word: target.word,
    emoji: target.emoji,
  };
  return sceneQuestion(rng, {
    game: "phonics",
    title: "Which picture starts with this sound?",
    hint: "Tap the speaker if you want to hear it again",
    answer: target.word,
    choices: uniqueChoices(rng, target.word, [], rows.map((row) => row.word)),
    skill: "phonics:sounds",
    tags: ["sounds"],
    solved: `${target.letter} says ${target.phoneme}, like ${target.word}`,
    picture: target.letter,
    hands: true,
    quietChoices: false,
    labels: maps.labels,
    pictures: maps.pictures,
    board,
    factKey: `sounds:${target.letter}:${target.word}`,
  });
}

function makeBegin(rng: Rng): ChoiceQ {
  const rows = pickSounds(rng, 4);
  const target = rng.pick(rows);
  const maps = pictureMaps(rows);
  const board: PhonicsBoard = {
    game: "phonics",
    mode: "begin",
    letter: target.letter,
    phoneme: target.phoneme,
    word: target.word,
    emoji: target.emoji,
  };
  return sceneQuestion(rng, {
    game: "phonics",
    title: `Which picture starts with ${target.phoneme}?`,
    hint: "Listen for the first sound",
    answer: target.word,
    choices: uniqueChoices(rng, target.word, [], rows.map((row) => row.word)),
    skill: "phonics:begin",
    tags: ["begin"],
    solved: `${target.word} starts with ${target.phoneme}`,
    picture: target.emoji,
    hands: true,
    quietChoices: false,
    labels: maps.labels,
    pictures: maps.pictures,
    board,
    factKey: `begin:${target.phoneme}:${target.word}`,
  });
}

function makeRhyme(rng: Rng): ChoiceQ {
  const families = rng.shuffle([...RHYME_FAMILIES]).slice(0, 4);
  const home = families[0]!;
  const cue = rng.pick([...home.words]);
  const mates = home.words.filter((word) => word !== cue);
  const answer = rng.pick([...mates]);
  const distractors = families.slice(1).map((row) => rng.pick([...row.words]));
  const board: PhonicsBoard = { game: "phonics", mode: "rhyme", cue, family: home.family };
  return sceneQuestion(rng, {
    game: "phonics",
    title: `Which word rhymes with ${cue}?`,
    hint: "The ending sounds the same",
    answer,
    choices: uniqueChoices(rng, answer, [], [answer, ...distractors]),
    skill: "phonics:rhyme",
    tags: ["rhyme"],
    solved: `${answer} rhymes with ${cue}`,
    picture: cue,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `rhyme:${cue}:${answer}`,
  });
}

export function blendOf(word: string): string {
  return word
    .split("")
    .map((letter) => PHONEME[letter] ?? letter)
    .join(" ");
}

function makeCvc(rng: Rng): ChoiceQ {
  const word = rng.pick(CVC_WORDS);
  const ending = word.slice(1);
  const pool = CVC_WORDS.filter((item) => item !== word && item.slice(1) !== ending);
  const blend = blendOf(word);
  const letters = word.toUpperCase().split("").join(" ");
  const board: PhonicsBoard = { game: "phonics", mode: "cvc", word, blend, letters };
  return sceneQuestion(rng, {
    game: "phonics",
    title: "Which word do these sounds make?",
    hint: "Say each sound, then put them together",
    answer: word,
    choices: uniqueChoices(rng, word, pool),
    skill: "phonics:cvc",
    tags: ["cvc"],
    solved: `${blend} makes ${word}`,
    picture: letters,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `cvc:${word}`,
  });
}

function makeEnd(rng: Rng): ChoiceQ {
  const word = rng.pick(CVC_WORDS);
  const letter = word[2] ?? "t";
  const phoneme = PHONEME[letter] ?? letter;
  const others = rng.shuffle([...END_LETTERS].filter((item) => item !== letter)).slice(0, 3);
  const labels: Record<string, string> = {};
  for (const item of [letter, ...others]) labels[item] = `${item} ${PHONEME[item] ?? item}`;
  const board: PhonicsBoard = { game: "phonics", mode: "end", letter, phoneme, word };
  return sceneQuestion(rng, {
    game: "phonics",
    title: `Which sound ends ${word}?`,
    hint: "Listen to the last sound",
    answer: letter,
    choices: uniqueChoices(rng, letter, [], [letter, ...others.slice(0, 3)]),
    skill: "phonics:end",
    tags: ["end"],
    solved: `${word} ends with ${phoneme}`,
    picture: word,
    hands: false,
    quietChoices: false,
    labels,
    board,
    factKey: `end:${word}:${letter}`,
  });
}

export function makePhonicsQuestion(rng: Rng, level: PhonicsLevel): ChoiceQ {
  switch (level) {
    case "sounds":
      return makeSounds(rng);
    case "begin":
      return makeBegin(rng);
    case "rhyme":
      return makeRhyme(rng);
    case "cvc":
      return makeCvc(rng);
    case "end":
      return makeEnd(rng);
    default: {
      const neverLevel: never = level;
      return neverLevel;
    }
  }
}

function sheetItem(rng: Rng, level: string): SheetItem {
  const safe: PhonicsLevel = isPhonicsLevel(level) ? level : "sounds";
  switch (safe) {
    case "sounds":
    case "begin": {
      const rows = pickSounds(rng, 4);
      const target = rows[0]!;
      const words = rows.map((row) => row.word).join(", ");
      return {
        prompt: `Which word starts with the ${target.phoneme} sound: ${words}?`,
        answer: target.word,
      };
    }
    case "rhyme": {
      const home = rng.pick([...RHYME_FAMILIES]);
      const cue = home.words[0]!;
      const answer = home.words[1]!;
      const others = RHYME_FAMILIES.filter((row) => row.family !== home.family)
        .slice(0, 3)
        .map((row) => row.words[0]!);
      return { prompt: `Which word rhymes with ${cue}: ${[answer, ...others].join(", ")}?`, answer };
    }
    case "cvc": {
      const word = rng.pick(CVC_WORDS);
      return { prompt: `Blend ${word.split("").join("-")}.`, answer: word };
    }
    case "end": {
      const word = rng.pick(CVC_WORDS);
      return { prompt: `What letter sound ends ${word}?`, answer: word[2] ?? "" };
    }
    default: {
      const neverLevel: never = safe;
      return neverLevel;
    }
  }
}

export function PhonicsPrompt({ question, reveal, mascot, happy }: PromptProps) {
  void reveal;
  if (question.visual.kind !== "scene" || question.visual.board.game !== "phonics") return null;
  const board = question.visual.board;
  return (
    <SceneCard
      title={question.title}
      mascot={mascot}
      happy={happy}
      hint={question.hint}
      hands={question.visual.hands}
      answer={question.answer}
    >
      <PhonicsArt board={board} />
    </SceneCard>
  );
}

function PhonicsArt({ board }: { board: PhonicsBoard }) {
  switch (board.mode) {
    case "sounds":
      return (
        <>
          <p className="ac-letter">{board.letter}</p>
          <SpeakerBar text={board.phoneme} fallback={board.phoneme} caption="The sound" large={false} label="Hear the sound" />
        </>
      );
    case "begin":
      return (
        <>
          <p className="ac-letter">{board.phoneme}</p>
          <SpeakerBar text={board.phoneme} fallback={board.phoneme} caption="Listen for this sound" large={false} label="Hear the sound" />
        </>
      );
    case "rhyme":
      return <p className="ac-letter">{board.cue}</p>;
    case "cvc":
      return (
        <>
          <p className="ac-letter">{board.letters}</p>
          <SpeakerBar text={board.blend} fallback={board.blend} caption="Blend the sounds" large={false} label="Hear the sounds" />
        </>
      );
    case "end":
      return (
        <>
          <p className="ac-letter">{board.word}</p>
          <SpeakerBar text={board.word} fallback={board.word} caption="The word" large label="Hear the word" />
        </>
      );
    default: {
      const neverBoard: never = board;
      return neverBoard;
    }
  }
}

export const phonicsGame = sceneModule({
  id: "phonics",
  title: "Phonics",
  short: "Phonics",
  audience: "K–3",
  tint: "lilac",
  mascot: "bunny",
  sheetSlug: "phonics",
  sheetScreen: "sheet-phonics",
  blurb:
    "Free phonics practice for kindergarten through grade 3. Letter sounds, beginning sounds with pictures, rhyming words, and CVC blending. A speaker reads the sound, with the sound written out when a voice is not available.",
  levels: [...LEVELS],
  defaultLevel,
  sheetDefaultLevel: "sounds",
  isLevel: isPhonicsLevel,
  bars: BARS,
  chips: BARS,
  makeQuestion: (rng, level) => makePhonicsQuestion(rng, isPhonicsLevel(level) ? level : "sounds"),
  makeSheetItem: sheetItem,
  Prompt: PhonicsPrompt,
});
