import type { Rng } from "@/lib/rng";
import type { Grade } from "../model";
import { countName, type CountBoard } from "./boards";
import { distinctInts, nearChoices, sceneQuestion } from "./pick";
import { DotClusters, EmojiRow, SceneCard, TenFrames, sceneModule } from "./scene-ui";
import type { ChoiceQ, PromptProps, SheetItem } from "./types";

export const COUNT_LEVELS = ["objects", "to20", "compare", "neighbor", "subitize", "tenframe", "build"] as const;
export type CountLevel = (typeof COUNT_LEVELS)[number];

const LEVELS = [
  { id: "objects", label: "Count to 10", num: 1 },
  { id: "to20", label: "Count to 20", num: 2 },
  { id: "compare", label: "More or less", num: 3 },
  { id: "neighbor", label: "Before and after", num: 4 },
  { id: "subitize", label: "Dot patterns", num: 5 },
  { id: "tenframe", label: "Ten-frames", num: 6 },
  { id: "build", label: "Build a ten-frame", num: 7 },
] as const;

const BARS = [
  { key: "count:objects", label: "Count to 10" },
  { key: "count:to20", label: "Count to 20" },
  { key: "count:compare", label: "More or less" },
  { key: "count:neighbor", label: "Before and after" },
  { key: "count:subitize", label: "Dot patterns" },
  { key: "count:tenframe", label: "Ten-frames" },
  { key: "count:build", label: "Build a ten-frame" },
];

const THINGS = [
  { name: "stars", emoji: "⭐" },
  { name: "fish", emoji: "🐟" },
  { name: "apples", emoji: "🍎" },
  { name: "balls", emoji: "⚽" },
  { name: "flowers", emoji: "🌸" },
  { name: "frogs", emoji: "🐸" },
] as const;

const DOTS: number[][][] = [
  [[1]],
  [[2], [1, 1]],
  [[3], [2, 1]],
  [[2, 2], [4]],
  [[2, 1, 2], [5]],
  [[3, 3], [2, 2, 2]],
];

export function isCountLevel(value: unknown): value is CountLevel {
  return typeof value === "string" && (COUNT_LEVELS as readonly string[]).includes(value);
}

function defaultLevel(grade: Grade): CountLevel {
  switch (grade) {
    case "K":
      return "objects";
    case "1":
      return "to20";
    case "2":
      return "tenframe";
    case "3":
      return "neighbor";
    default: {
      const neverGrade: never = grade;
      return neverGrade;
    }
  }
}

function ask(rng: Rng, spec: Parameters<typeof sceneQuestion>[1]): ChoiceQ {
  return sceneQuestion(rng, spec);
}

function makeObjects(rng: Rng, max: number, level: "objects" | "to20"): ChoiceQ {
  const thing = rng.pick(THINGS);
  const lo = level === "to20" ? 8 : 1;
  const n = rng.int(lo, max);
  const board: CountBoard = { game: "count", mode: level, emoji: thing.emoji, name: thing.name, n };
  return ask(rng, {
    game: "count",
    title: `How many ${thing.name}?`,
    hint: "Count each one",
    answer: String(n),
    choices: nearChoices(rng, n, 0, max),
    skill: `count:${level}`,
    tags: [level],
    solved: `${n} ${countName(thing.name, n)}`,
    picture: thing.emoji,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `${level}:${thing.name}:${n}`,
  });
}

function makeCompare(rng: Rng): ChoiceQ {
  const thing = rng.pick(THINGS);
  const groups = distinctInts(rng, 4, 1, 6);
  const askMore = rng.next() < 0.5;
  const target = askMore ? Math.max(...groups) : Math.min(...groups);
  const ids = groups.map((_, i) => `g${i}`);
  const answer = ids[groups.indexOf(target)]!;
  const pictures: Record<string, string> = {};
  const labels: Record<string, string> = {};
  groups.forEach((n, i) => {
    pictures[ids[i]!] = thing.emoji.repeat(n);
    labels[ids[i]!] = `${n} ${thing.name}`;
  });
  const board: CountBoard = {
    game: "count",
    mode: "compare",
    emoji: thing.emoji,
    name: thing.name,
    groups,
    ask: askMore ? "more" : "less",
  };
  return ask(rng, {
    game: "count",
    title: askMore ? "Tap the group with more" : "Tap the group with less",
    hint: "Look at the pictures",
    answer,
    choices: rng.shuffle(ids),
    skill: "count:compare",
    tags: ["compare"],
    solved: `${target} is ${askMore ? "more" : "less"}`,
    picture: thing.emoji.repeat(target),
    hands: true,
    quietChoices: false,
    labels,
    pictures,
    board,
    factKey: `compare:${groups.join("-")}:${board.ask}`,
  });
}

function makeNeighbor(rng: Rng): ChoiceQ {
  const n = rng.int(1, 20);
  const canBefore = n > 1;
  const canAfter = n < 20;
  const askBefore = canBefore && (!canAfter || rng.next() < 0.5);
  const answer = askBefore ? n - 1 : n + 1;
  const board: CountBoard = { game: "count", mode: "neighbor", n, ask: askBefore ? "before" : "after" };
  return ask(rng, {
    game: "count",
    title: askBefore ? `What number comes before ${n}?` : `What number comes after ${n}?`,
    hint: askBefore ? "One less" : "One more",
    answer: String(answer),
    choices: nearChoices(rng, answer, 0, 20),
    skill: "count:neighbor",
    tags: ["neighbor"],
    solved: askBefore ? `${answer} comes before ${n}` : `${answer} comes after ${n}`,
    picture: String(n),
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `neighbor:${n}:${board.ask}`,
  });
}

function makeSubitize(rng: Rng): ChoiceQ {
  const n = rng.int(1, 6);
  const clusters = rng.pick(DOTS[n - 1] ?? [[n]]);
  const board: CountBoard = { game: "count", mode: "subitize", clusters };
  return ask(rng, {
    game: "count",
    title: "How many dots?",
    hint: "Look at the pattern",
    answer: String(n),
    choices: nearChoices(rng, n, 1, 8),
    skill: "count:subitize",
    tags: ["subitize"],
    solved: `${n} dots`,
    picture: "●".repeat(n),
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `dots:${clusters.join("+")}`,
  });
}

function makeTen(rng: Rng): ChoiceQ {
  const n = rng.int(0, 20);
  const frames = n <= 10 ? [n] : [10, n - 10];
  const board: CountBoard = { game: "count", mode: "tenframe", frames };
  return ask(rng, {
    game: "count",
    title: "How many dots in the ten-frame?",
    hint: n > 10 ? "A full frame is 10" : "Count the pink dots",
    answer: String(n),
    choices: nearChoices(rng, n, 0, 20),
    skill: "count:tenframe",
    tags: ["tenframe"],
    solved: `${n} dots`,
    picture: "●".repeat(Math.min(10, n)),
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `ten:${n}`,
  });
}

function makeBuild(rng: Rng): ChoiceQ {
  const n = rng.int(1, 10);
  const board: CountBoard = { game: "count", mode: "build", n };
  return ask(rng, {
    game: "count",
    title: `Show ${n} on the ten-frame`,
    hint: "Tap a dot for each one",
    answer: String(n),
    choices: nearChoices(rng, n, 0, 10),
    skill: "count:build",
    tags: ["build"],
    solved: `${n} dots`,
    picture: String(n),
    hands: true,
    quietChoices: true,
    labels: {},
    board,
    factKey: `build:${n}:${rng.int(1, 9999)}`,
  });
}

export function makeCountQuestion(rng: Rng, level: CountLevel): ChoiceQ {
  switch (level) {
    case "objects":
      return makeObjects(rng, 10, "objects");
    case "to20":
      return makeObjects(rng, 20, "to20");
    case "compare":
      return makeCompare(rng);
    case "neighbor":
      return makeNeighbor(rng);
    case "subitize":
      return makeSubitize(rng);
    case "tenframe":
      return makeTen(rng);
    case "build":
      return makeBuild(rng);
    default: {
      const neverLevel: never = level;
      return neverLevel;
    }
  }
}

function sheetItem(rng: Rng, level: string): SheetItem {
  const safe: CountLevel = isCountLevel(level) ? level : "objects";
  switch (safe) {
    case "objects":
    case "to20": {
      const n = rng.int(1, safe === "objects" ? 10 : 20);
      return { prompt: `Count the stars: ${"★".repeat(n)}`, answer: String(n) };
    }
    case "compare": {
      const a = rng.int(1, 20);
      let b = rng.int(1, 20);
      if (b === a) b = a === 20 ? 1 : a + 1;
      const more = rng.next() < 0.5;
      const answer = more ? Math.max(a, b) : Math.min(a, b);
      return { prompt: `Which is ${more ? "more" : "less"}, ${a} or ${b}?`, answer: String(answer) };
    }
    case "neighbor": {
      const after = rng.next() < 0.5;
      const n = rng.int(after ? 0 : 1, after ? 19 : 20);
      return {
        prompt: after ? `What number comes after ${n}?` : `What number comes before ${n}?`,
        answer: String(after ? n + 1 : n - 1),
      };
    }
    case "subitize": {
      const a = rng.int(1, 3);
      const b = rng.int(1, 3);
      return { prompt: `Dot groups: ${a} and ${b}. How many dots?`, answer: String(a + b) };
    }
    case "tenframe":
    case "build": {
      const n = rng.int(safe === "build" ? 1 : 0, safe === "build" ? 10 : 20);
      return { prompt: `Filled dots: ${"●".repeat(n)}`, answer: String(n) };
    }
    default: {
      const neverLevel: never = safe;
      return neverLevel;
    }
  }
}

export function CountPrompt({ question, reveal, mascot, happy }: PromptProps) {
  void reveal;
  if (question.visual.kind !== "scene" || question.visual.board.game !== "count") return null;
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
      <CountArt board={board} />
    </SceneCard>
  );
}

function CountArt({ board }: { board: CountBoard }) {
  switch (board.mode) {
    case "objects":
    case "to20":
      return <EmojiRow emoji={board.emoji} n={board.n} name={board.name} />;
    case "compare":
      return <p className="ac-big-num">{board.ask === "more" ? "More" : "Less"}</p>;
    case "neighbor":
      return <p className="ac-big-num">{board.ask === "after" ? `${board.n}, ?` : `?, ${board.n}`}</p>;
    case "subitize":
      return <DotClusters clusters={board.clusters} />;
    case "tenframe":
      return <TenFrames frames={board.frames} />;
    case "build":
      return <p className="ac-big-num">{board.n}</p>;
    default: {
      const neverBoard: never = board;
      return neverBoard;
    }
  }
}

export const countGame = sceneModule({
  id: "count",
  title: "Counting",
  short: "Counting",
  audience: "Pre-K–K",
  tint: "coral",
  mascot: "chick",
  sheetSlug: "counting",
  sheetScreen: "sheet-count",
  blurb:
    "Free counting practice for Pre-K and kindergarten. Count objects to 20, compare more and less, find the number before and after, read dot patterns, and fill a ten-frame.",
  levels: [...LEVELS],
  defaultLevel,
  sheetDefaultLevel: "objects",
  isLevel: isCountLevel,
  bars: BARS,
  chips: BARS,
  makeQuestion: (rng, level) => makeCountQuestion(rng, isCountLevel(level) ? level : "objects"),
  makeSheetItem: sheetItem,
  Prompt: CountPrompt,
});
