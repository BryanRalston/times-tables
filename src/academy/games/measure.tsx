import type { Rng } from "@/lib/rng";
import type { Grade } from "../model";
import type { MeasureBoard, MeasureItem } from "./boards";
import { distinctInts, nearChoices, sceneQuestion, uniqueChoices } from "./pick";
import { BarGraph, PictureGraph, Ruler, SceneCard, sceneModule } from "./scene-ui";
import type { ChoiceQ, PromptProps, SheetItem } from "./types";

export const MEASURE_LEVELS = ["compare", "ruler", "picture", "bar", "more"] as const;
export type MeasureLevel = (typeof MEASURE_LEVELS)[number];

const LEVELS = [
  { id: "compare", label: "Longer or shorter", num: 1 },
  { id: "ruler", label: "Measure with a ruler", num: 2 },
  { id: "picture", label: "Picture graph", num: 3 },
  { id: "bar", label: "Bar graph", num: 4 },
  { id: "more", label: "How many more", num: 5 },
] as const;

const BARS = [
  { key: "measure:compare", label: "Longer or shorter" },
  { key: "measure:ruler", label: "Measure with a ruler" },
  { key: "measure:picture", label: "Picture graph" },
  { key: "measure:bar", label: "Bar graph" },
  { key: "measure:more", label: "How many more" },
];

const THINGS = [
  { name: "banana", emoji: "🍌" },
  { name: "snake", emoji: "🐍" },
  { name: "carrot", emoji: "🥕" },
  { name: "bone", emoji: "🦴" },
  { name: "candy", emoji: "🍭" },
  { name: "bug", emoji: "🐛" },
] as const;

export function isMeasureLevel(value: unknown): value is MeasureLevel {
  return typeof value === "string" && (MEASURE_LEVELS as readonly string[]).includes(value);
}

function defaultLevel(grade: Grade): MeasureLevel {
  switch (grade) {
    case "K":
      return "compare";
    case "1":
      return "picture";
    case "2":
      return "ruler";
    case "3":
      return "bar";
    default: {
      const neverGrade: never = grade;
      return neverGrade;
    }
  }
}

function namedItems(rng: Rng, count: number, values: number[]): MeasureItem[] {
  const things = rng.shuffle([...THINGS]).slice(0, count);
  return things.map((thing, i) => ({ name: thing.name, emoji: thing.emoji, value: values[i] ?? 1 }));
}

function makeCompare(rng: Rng): ChoiceQ {
  const values = distinctInts(rng, 4, 2, 9);
  const items = namedItems(rng, 4, values);
  const askLong = rng.next() < 0.5;
  const target = askLong ? Math.max(...values) : Math.min(...values);
  const answer = items[values.indexOf(target)]!.name;
  const board: MeasureBoard = { game: "measure", mode: "compare", items, ask: askLong ? "longest" : "shortest" };
  return sceneQuestion(rng, {
    game: "measure",
    title: askLong ? "Which is longer?" : "Which is shorter?",
    hint: "Look at the bars",
    answer,
    choices: uniqueChoices(rng, answer, [], items.map((item) => item.name)),
    skill: "measure:compare",
    tags: ["compare"],
    solved: `The ${answer} is ${askLong ? "longer" : "shorter"}`,
    picture: items.find((item) => item.name === answer)?.emoji ?? "📏",
    hands: true,
    quietChoices: false,
    labels: Object.fromEntries(items.map((item) => [item.name, item.name])),
    board,
    factKey: `compare:${items.map((item) => `${item.name}${item.value}`).join("-")}:${board.ask}`,
  });
}

function makeRuler(rng: Rng): ChoiceQ {
  const inches = rng.int(1, 12);
  const board: MeasureBoard = { game: "measure", mode: "ruler", inches };
  return sceneQuestion(rng, {
    game: "measure",
    title: "How many inches long is the ribbon?",
    hint: "Start at 0",
    answer: String(inches),
    choices: nearChoices(rng, inches, 1, 12),
    skill: "measure:ruler",
    tags: ["ruler"],
    solved: `${inches} inches`,
    picture: `${inches} in`,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `ruler:${inches}`,
  });
}

function makeGraph(rng: Rng, mode: "picture" | "bar"): ChoiceQ {
  const askMost = rng.next() < 0.5;
  const values = askMost ? distinctInts(rng, 4, 1, 8) : [rng.int(1, 8), rng.int(1, 8), rng.int(1, 8), rng.int(1, 8)];
  const items = namedItems(rng, 4, values);
  const focus = askMost ? values.indexOf(Math.max(...values)) : rng.int(0, 3);
  const focusItem = items[focus]!;
  const answer = askMost ? focusItem.name : String(focusItem.value);
  const board: MeasureBoard = { game: "measure", mode, items, ask: askMost ? "most" : "count", focus };
  const graph = mode === "picture" ? "picture graph" : "bar graph";
  return sceneQuestion(rng, {
    game: "measure",
    title: askMost ? `Which has the most on the ${graph}?` : `How many ${focusItem.name}s are on the ${graph}?`,
    hint: askMost ? "Find the tallest or fullest row" : "Count that row",
    answer,
    choices: askMost
      ? uniqueChoices(rng, answer, [], items.map((item) => item.name))
      : nearChoices(rng, focusItem.value, 0, 10),
    skill: `measure:${mode}`,
    tags: [mode],
    solved: askMost ? `${answer} has the most` : `${focusItem.value} ${focusItem.name}s`,
    picture: focusItem.emoji.repeat(focusItem.value),
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `${mode}:${items.map((item) => item.value).join("-")}:${board.ask}:${focus}`,
  });
}

function makeMore(rng: Rng): ChoiceQ {
  const high = rng.int(2, 8);
  const low = rng.int(1, high - 1);
  const items = namedItems(rng, 2, [high, low]);
  const board: MeasureBoard = { game: "measure", mode: "more", items, left: 0, right: 1 };
  const answer = high - low;
  return sceneQuestion(rng, {
    game: "measure",
    title: `How many more ${items[0]!.name}s than ${items[1]!.name}s?`,
    hint: "Subtract the smaller number",
    answer: String(answer),
    choices: nearChoices(rng, answer, 0, 8),
    skill: "measure:more",
    tags: ["more"],
    solved: `${answer} more`,
    picture: `${high} ${low}`,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `more:${items[0]!.name}${high}:${items[1]!.name}${low}`,
  });
}

export function makeMeasureQuestion(rng: Rng, level: MeasureLevel): ChoiceQ {
  switch (level) {
    case "compare":
      return makeCompare(rng);
    case "ruler":
      return makeRuler(rng);
    case "picture":
      return makeGraph(rng, "picture");
    case "bar":
      return makeGraph(rng, "bar");
    case "more":
      return makeMore(rng);
    default: {
      const neverLevel: never = level;
      return neverLevel;
    }
  }
}

function sheetItem(rng: Rng, level: string): SheetItem {
  const safe: MeasureLevel = isMeasureLevel(level) ? level : "compare";
  switch (safe) {
    case "compare": {
      const a = rng.int(1, 12);
      let b = rng.int(1, 12);
      if (b === a) b = a === 12 ? 1 : a + 1;
      const longer = rng.next() < 0.5;
      return {
        prompt: `Which is ${longer ? "longer" : "shorter"}, ${a} units or ${b} units?`,
        answer: String(longer ? Math.max(a, b) : Math.min(a, b)),
      };
    }
    case "ruler": {
      const inches = rng.int(1, 12);
      return { prompt: `The ribbon goes from 0 to ${inches} on the ruler. How many inches?`, answer: String(inches) };
    }
    case "picture":
    case "bar": {
      const n = rng.int(1, 8);
      const icon = safe === "picture" ? "🍎" : "▮";
      return { prompt: `The graph shows ${icon.repeat(n)} apples. How many apples?`, answer: String(n) };
    }
    case "more": {
      const cats = rng.int(2, 8);
      const dogs = rng.int(1, cats - 1);
      return { prompt: `There are ${cats} cats and ${dogs} dogs. How many more cats?`, answer: String(cats - dogs) };
    }
    default: {
      const neverLevel: never = safe;
      return neverLevel;
    }
  }
}

export function MeasurePrompt({ question, reveal, mascot, happy }: PromptProps) {
  void reveal;
  if (question.visual.kind !== "scene" || question.visual.board.game !== "measure") return null;
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
      <MeasureArt board={board} />
    </SceneCard>
  );
}

function MeasureArt({ board }: { board: MeasureBoard }) {
  switch (board.mode) {
    case "compare":
      return <p className="ac-big-num">{board.ask === "longest" ? "Longer" : "Shorter"}</p>;
    case "ruler":
      return <Ruler inches={board.inches} />;
    case "picture":
      return <PictureGraph items={board.items} />;
    case "bar":
      return <BarGraph items={board.items} />;
    case "more":
      return <PictureGraph items={board.items} />;
    default: {
      const neverBoard: never = board;
      return neverBoard;
    }
  }
}

export const measureGame = sceneModule({
  id: "measure",
  title: "Measurement",
  short: "Measurement",
  audience: "1–3",
  tint: "aqua",
  mascot: "penguin",
  sheetSlug: "measurement",
  sheetScreen: "sheet-measure",
  blurb:
    "Free measurement and data practice for grades 1–3. Compare longer and shorter, measure inches on a ruler, and read picture graphs and bar graphs.",
  levels: [...LEVELS],
  defaultLevel,
  sheetDefaultLevel: "compare",
  isLevel: isMeasureLevel,
  bars: BARS,
  chips: BARS,
  makeQuestion: (rng, level) => makeMeasureQuestion(rng, isMeasureLevel(level) ? level : "compare"),
  makeSheetItem: sheetItem,
  Prompt: MeasurePrompt,
});
