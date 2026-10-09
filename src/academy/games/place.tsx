import type { Rng } from "@/lib/rng";
import type { Grade } from "../model";
import { buddyName, pickLine } from "./flavor";
import { blockPhrase, expandedForm, roundHalfUp, type PlaceBoard } from "./boards";
import { extremeChoices, nearChoices, sceneQuestion, uniqueChoices } from "./pick";
import { BaseTen, SceneCard, sceneModule } from "./scene-ui";
import type { ChoiceQ, PromptProps, SheetItem } from "./types";

export const PLACE_LEVELS = ["blocks", "expanded", "compare", "round10", "round100", "build"] as const;
export type PlaceLevel = (typeof PLACE_LEVELS)[number];

const LEVELS = [
  { id: "blocks", label: "Tens and ones", num: 1 },
  { id: "expanded", label: "Expanded form", num: 2 },
  { id: "compare", label: "Compare numbers", num: 3 },
  { id: "round10", label: "Round to 10", num: 4 },
  { id: "round100", label: "Round to 100", num: 5 },
  { id: "build", label: "Build a number", num: 6 },
] as const;

const BARS = [
  { key: "place:blocks", label: "Tens and ones" },
  { key: "place:expanded", label: "Expanded form" },
  { key: "place:compare", label: "Compare numbers" },
  { key: "place:round10", label: "Round to 10" },
  { key: "place:round100", label: "Round to 100" },
  { key: "place:build", label: "Build a number" },
];

export function isPlaceLevel(value: unknown): value is PlaceLevel {
  return typeof value === "string" && (PLACE_LEVELS as readonly string[]).includes(value);
}

function defaultLevel(grade: Grade): PlaceLevel {
  switch (grade) {
    case "K":
    case "1":
      return "blocks";
    case "2":
      return "expanded";
    case "3":
      return "round10";
    default: {
      const neverGrade: never = grade;
      return neverGrade;
    }
  }
}

function different(rng: Rng, n: number, lo: number, hi: number): number {
  let next = rng.int(lo, hi);
  let guard = 0;
  while (next === n && guard < 8) {
    next = rng.int(lo, hi);
    guard += 1;
  }
  if (next === n) next = n === hi ? lo : n + 1;
  return next;
}

function makeBlocks(rng: Rng): ChoiceQ {
  const n = rng.int(10, 99);
  const board: PlaceBoard = { game: "place", mode: "blocks", n };
  return sceneQuestion(rng, {
    game: "place",
    title: pickLine(rng, ["How many blocks?", `${buddyName(rng)} built with tens and ones. What number is that?`]),
    hint: "A rod is a ten. A cube is a one.",
    answer: String(n),
    choices: nearChoices(rng, n, 0, 120),
    skill: "place:blocks",
    tags: ["blocks"],
    solved: blockPhrase(n),
    picture: String(n),
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `blocks:${n}`,
  });
}

function makeExpanded(rng: Rng): ChoiceQ {
  const n = rng.next() < 0.55 ? rng.int(10, 99) : rng.int(100, 999);
  const answer = expandedForm(n);
  const pool = [n + 1, n - 1, n + 10, n - 10, n + 100, n - 100]
    .filter((item) => item >= 0 && item <= 999 && item !== n)
    .map((item) => expandedForm(item));
  const tens = Math.floor((n % 100) / 10);
  const ones = n % 10;
  pool.push(`${ones} + ${tens * 10}`);
  pool.push(`${tens} + ${ones}`);
  const board: PlaceBoard = { game: "place", mode: "expanded", n };
  return sceneQuestion(rng, {
    game: "place",
    title: `What is ${n} in expanded form?`,
    hint: "Hundreds, then tens, then ones",
    answer,
    choices: uniqueChoices(rng, answer, pool),
    skill: "place:expanded",
    tags: ["expanded"],
    solved: `${n} = ${answer}`,
    picture: String(n),
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `expanded:${n}`,
  });
}

function makeCompare(rng: Rng): ChoiceQ {
  const wide = rng.next() < 0.45;
  const lo = 10;
  const hi = wide ? 999 : 99;
  let left = rng.int(lo, hi);
  let right = different(rng, left, lo, hi);
  let askGreater = rng.next() < 0.5;
  let answer = askGreater ? Math.max(left, right) : Math.min(left, right);
  let other = answer === left ? right : left;
  let choices = extremeChoices(rng, answer, other, askGreater, 0, 999);
  if (choices.some((choice) => choice.startsWith("no "))) {
    askGreater = true;
    left = rng.int(lo, hi - 1);
    right = different(rng, left, lo, hi);
    answer = Math.max(left, right);
    other = Math.min(left, right);
    choices = extremeChoices(rng, answer, other, true, 0, 999);
  }
  const board: PlaceBoard = { game: "place", mode: "compare", left, right, ask: askGreater ? "greater" : "less" };
  return sceneQuestion(rng, {
    game: "place",
    title: askGreater ? "Which number is greater?" : "Which number is less?",
    hint: "Look at the hundreds, then the tens",
    answer: String(answer),
    choices,
    skill: "place:compare",
    tags: ["compare"],
    solved: `${answer} is ${askGreater ? "greater" : "less"}`,
    picture: `${left} ${right}`,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `compare:${left}:${right}:${board.ask}`,
  });
}

function makeRound(rng: Rng, place: 10 | 100): ChoiceQ {
  const n = place === 10 ? (rng.next() < 0.6 ? rng.int(10, 99) : rng.int(100, 999)) : rng.int(100, 999);
  const answer = roundHalfUp(n, place);
  const down = Math.floor(n / place) * place;
  const up = down + place;
  const board: PlaceBoard = { game: "place", mode: place === 10 ? "round10" : "round100", n };
  return sceneQuestion(rng, {
    game: "place",
    title: `Round ${n} to the nearest ${place}`,
    hint: place === 10 ? "Look at the ones. 5 or more rounds up." : "Look at the tens. 50 or more rounds up.",
    answer: String(answer),
    choices: nearChoices(rng, answer, 0, 1000, [n, down, up, answer + place, Math.max(0, answer - place)]),
    skill: place === 10 ? "place:round10" : "place:round100",
    tags: [place === 10 ? "round10" : "round100"],
    solved: `${n} rounds to ${answer}`,
    picture: String(n),
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `round${place}:${n}`,
  });
}

function makeBuild(rng: Rng): ChoiceQ {
  const n = rng.int(10, 99);
  const board: PlaceBoard = { game: "place", mode: "build", n };
  return sceneQuestion(rng, {
    game: "place",
    title: `Build ${n}`,
    hint: "Add tens and ones until you make the number",
    answer: String(n),
    choices: nearChoices(rng, n, 0, 120),
    skill: "place:build",
    tags: ["build"],
    solved: blockPhrase(n),
    picture: String(n),
    hands: true,
    quietChoices: true,
    labels: {},
    board,
    factKey: `build:${n}`,
  });
}

export function makePlaceQuestion(rng: Rng, level: PlaceLevel): ChoiceQ {
  switch (level) {
    case "blocks":
      return makeBlocks(rng);
    case "expanded":
      return makeExpanded(rng);
    case "compare":
      return makeCompare(rng);
    case "round10":
      return makeRound(rng, 10);
    case "round100":
      return makeRound(rng, 100);
    case "build":
      return makeBuild(rng);
    default: {
      const neverLevel: never = level;
      return neverLevel;
    }
  }
}

function sheetItem(rng: Rng, level: string): SheetItem {
  const safe: PlaceLevel = isPlaceLevel(level) ? level : "blocks";
  switch (safe) {
    case "blocks":
    case "build": {
      const tens = rng.int(1, 9);
      const ones = rng.int(0, 9);
      return { prompt: `${tens} tens and ${ones} ones =`, answer: String(tens * 10 + ones) };
    }
    case "expanded": {
      const n = rng.next() < 0.5 ? rng.int(10, 99) : rng.int(100, 999);
      return { prompt: `Write ${n} in expanded form.`, answer: expandedForm(n) };
    }
    case "compare": {
      const left = rng.int(10, 99);
      const right = left === 99 ? 10 : left + 1 + rng.int(0, 8);
      const greater = rng.next() < 0.5;
      const a = Math.min(left, right);
      const b = Math.max(left, right);
      return {
        prompt: `Which is ${greater ? "greater" : "less"}, ${a} or ${b}?`,
        answer: String(greater ? b : a),
      };
    }
    case "round10": {
      const n = rng.int(10, 99);
      return { prompt: `Round ${n} to the nearest 10.`, answer: String(roundHalfUp(n, 10)) };
    }
    case "round100": {
      const n = rng.int(100, 999);
      return { prompt: `Round ${n} to the nearest 100.`, answer: String(roundHalfUp(n, 100)) };
    }
    default: {
      const neverLevel: never = safe;
      return neverLevel;
    }
  }
}

export function PlacePrompt({ question, reveal, mascot, happy }: PromptProps) {
  void reveal;
  if (question.visual.kind !== "scene" || question.visual.board.game !== "place") return null;
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
      <PlaceArt board={board} />
    </SceneCard>
  );
}

function PlaceArt({ board }: { board: PlaceBoard }) {
  switch (board.mode) {
    case "blocks":
      return <BaseTen n={board.n} />;
    case "expanded":
      return (
        <>
          <p className="ac-big-num">{board.n}</p>
          <BaseTen n={board.n} />
        </>
      );
    case "compare":
      return (
        <p className="ac-big-num">
          {board.left} · {board.right}
        </p>
      );
    case "round10":
    case "round100":
    case "build":
      return <p className="ac-big-num">{board.n}</p>;
    default: {
      const neverBoard: never = board;
      return neverBoard;
    }
  }
}

export const placeGame = sceneModule({
  id: "place",
  title: "Place Value",
  short: "Place Value",
  audience: "1–3",
  tint: "leaf",
  mascot: "bear",
  sheetSlug: "place-value",
  sheetScreen: "sheet-place",
  blurb:
    "Free place value practice for grades 1–3. Tens and ones with base-ten blocks, expanded form, comparing numbers, and rounding to the nearest 10 or 100.",
  levels: [...LEVELS],
  defaultLevel,
  sheetDefaultLevel: "blocks",
  isLevel: isPlaceLevel,
  bars: BARS,
  chips: BARS,
  makeQuestion: (rng, level) => makePlaceQuestion(rng, isPlaceLevel(level) ? level : "blocks"),
  makeSheetItem: sheetItem,
  Prompt: PlacePrompt,
});
