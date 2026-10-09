import type { Rng } from "@/lib/rng";
import type { Grade } from "../model";
import { fractionText, type FractionBoard } from "./boards";
import { sceneQuestion, uniqueChoices } from "./pick";
import { FractionBar, FractionLine, SceneCard, sceneModule } from "./scene-ui";
import type { ChoiceQ, PromptProps, SheetItem } from "./types";

export const FRACTION_LEVELS = ["parts", "unit", "line", "compare", "equivalent", "shade"] as const;
export type FractionLevel = (typeof FRACTION_LEVELS)[number];

const LEVELS = [
  { id: "parts", label: "Parts of a whole", num: 1 },
  { id: "unit", label: "Unit fractions", num: 2 },
  { id: "line", label: "Number line", num: 3 },
  { id: "compare", label: "Compare fractions", num: 4 },
  { id: "equivalent", label: "Equivalent fractions", num: 5 },
  { id: "shade", label: "Shade a fraction", num: 6 },
] as const;

const BARS = [
  { key: "fractions:parts", label: "Parts of a whole" },
  { key: "fractions:unit", label: "Unit fractions" },
  { key: "fractions:line", label: "Fractions on a line" },
  { key: "fractions:compare", label: "Compare fractions" },
  { key: "fractions:equivalent", label: "Equivalent fractions" },
  { key: "fractions:shade", label: "Shade a fraction" },
];

const PAIRS: Array<[number, number, number, number]> = [
  [1, 2, 2, 4],
  [1, 2, 3, 6],
  [1, 2, 4, 8],
  [1, 3, 2, 6],
  [1, 4, 2, 8],
  [2, 3, 4, 6],
  [3, 4, 6, 8],
  [2, 4, 1, 2],
  [2, 6, 1, 3],
  [4, 8, 1, 2],
  [3, 6, 1, 2],
  [2, 8, 1, 4],
];

export function isFractionLevel(value: unknown): value is FractionLevel {
  return typeof value === "string" && (FRACTION_LEVELS as readonly string[]).includes(value);
}

function defaultLevel(grade: Grade): FractionLevel {
  switch (grade) {
    case "K":
    case "1":
      return "parts";
    case "2":
      return "line";
    case "3":
      return "equivalent";
    default: {
      const neverGrade: never = grade;
      return neverGrade;
    }
  }
}

const HALF_FOURTHS = ["1/2", "2/2", "1/4", "2/4", "3/4", "4/4"];
const THROUGH_FOURTHS = ["1/2", "2/2", "1/3", "2/3", "1/4", "2/4", "3/4", "4/4"];
const THROUGH_EIGHTHS = ["1/2", "1/3", "1/4", "2/3", "2/4", "3/4", "1/6", "2/6", "3/6", "1/8", "2/8", "3/8", "4/8", "6/8"];

function fractionValue(text: string): number | null {
  if (text === "0") return 0;
  if (text === "1") return 1;
  const match = /^(\d+)\/(\d+)$/.exec(text);
  if (!match) return null;
  return Number(match[1]) / Number(match[2]);
}

function notEquivalent(answer: string, items: readonly string[]): string[] {
  const target = fractionValue(answer);
  const seen = new Set<number>();
  if (target != null) seen.add(target);
  const out: string[] = [];
  for (const item of items) {
    if (!item || item === answer || out.includes(item)) continue;
    const value = fractionValue(item);
    if (value == null || seen.has(value)) continue;
    const parts = /^(\d+)\/(\d+)$/.exec(item);
    if (parts && Number(parts[1]) > Number(parts[2])) continue;
    seen.add(value);
    out.push(item);
  }
  return out;
}

function fracChoices(rng: Rng, answer: string, extras: string[], pool: readonly string[]): string[] {
  return uniqueChoices(rng, answer, notEquivalent(answer, pool), notEquivalent(answer, extras));
}

const COMPARE_POOL = ["1/4", "1/3", "1/2", "2/3", "3/4", "1"];

function compareFractionChoices(rng: Rng, left: string, right: string, answer: string, askGreater: boolean): string[] {
  const answerValue = fractionValue(answer) ?? 0;
  const pool = notEquivalent(answer, COMPARE_POOL).filter((item) => {
    if (item === left || item === right) return false;
    const value = fractionValue(item) ?? 0;
    return askGreater ? value < answerValue : value > answerValue;
  });
  return uniqueChoices(rng, answer, pool, [left, right].filter((item) => item !== answer));
}

function makeParts(rng: Rng): ChoiceQ {
  const den = rng.pick([2, 4]);
  const num = rng.int(1, den);
  const answer = `${num}/${den}`;
  const board: FractionBoard = { game: "fractions", mode: "parts", num, den };
  return sceneQuestion(rng, {
    game: "fractions",
    title: "What fraction is shaded?",
    hint: "Count the shaded parts and the equal parts",
    answer,
    choices: fracChoices(rng, answer, [`${Math.max(1, num - 1)}/${den}`, `${Math.min(den, num + 1)}/${den}`], HALF_FOURTHS),
    skill: "fractions:parts",
    tags: ["parts"],
    solved: `${answer} is shaded`,
    picture: answer,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `parts:${answer}`,
  });
}

function makeUnit(rng: Rng): ChoiceQ {
  const dens = [2, 3, 4];
  const den = rng.pick(dens);
  const answer = `1/${den}`;
  const other = rng.pick(dens.filter((item) => item !== den));
  const board: FractionBoard = { game: "fractions", mode: "unit", num: 1, den };
  return sceneQuestion(rng, {
    game: "fractions",
    title: "What unit fraction is shaded?",
    hint: "One shaded part",
    answer,
    choices: fracChoices(rng, answer, [`2/${den}`, `1/${other}`], THROUGH_FOURTHS),
    skill: "fractions:unit",
    tags: ["unit"],
    solved: answer,
    picture: answer,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `unit:${den}`,
  });
}

function makeLine(rng: Rng): ChoiceQ {
  const den = rng.pick([2, 3, 4]);
  const num = rng.int(0, den);
  const answer = fractionText(num, den);
  const ticks = Array.from({ length: den + 1 }, (_, i) => fractionText(i, den));
  const board: FractionBoard = { game: "fractions", mode: "line", num, den };
  return sceneQuestion(rng, {
    game: "fractions",
    title: "Which fraction is the dot?",
    hint: "Read the tick under the dot",
    answer,
    choices: uniqueChoices(rng, answer, notEquivalent(answer, [...ticks, "1/2", "3/4"])),
    skill: "fractions:line",
    tags: ["line"],
    solved: `The dot is at ${answer}`,
    picture: answer,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `line:${num}/${den}`,
  });
}

function value(num: number, den: number): number {
  return num / den;
}

function makeCompare(rng: Rng): ChoiceQ {
  const dens = [2, 3, 4];
  let sameDen = true;
  let num = 1;
  let den = 2;
  let num2 = 1;
  let den2 = 4;
  let askGreater = true;
  let left = "1/2";
  let right = "1/4";
  let answer = "1/2";
  let choices = compareFractionChoices(rng, left, right, answer, true);
  for (let attempt = 0; attempt < 12; attempt += 1) {
    sameDen = rng.next() < 0.5;
    if (sameDen) {
      den = rng.pick(dens.filter((item) => item >= 3));
      den2 = den;
      num = rng.int(1, den - 1);
      num2 = rng.int(1, den - 1);
      if (num2 === num) num2 = num === 1 ? 2 : num - 1;
    } else {
      num = rng.pick([1, 2]);
      num2 = num;
      const wider = dens.filter((item) => item > num);
      den = rng.pick(wider);
      den2 = rng.pick(wider.filter((item) => item !== den));
    }
    askGreater = rng.next() < 0.5;
    left = `${num}/${den}`;
    right = `${num2}/${den2}`;
    const leftBigger = value(num, den) > value(num2, den2);
    answer = askGreater ? (leftBigger ? left : right) : leftBigger ? right : left;
    choices = compareFractionChoices(rng, left, right, answer, askGreater);
    if (!choices.some((choice) => choice.startsWith("no "))) break;
    askGreater = !askGreater;
    answer = askGreater ? (leftBigger ? left : right) : leftBigger ? right : left;
    choices = compareFractionChoices(rng, left, right, answer, askGreater);
    if (!choices.some((choice) => choice.startsWith("no "))) break;
  }
  const board: FractionBoard = {
    game: "fractions",
    mode: "compare",
    num,
    den,
    num2,
    den2,
    ask: askGreater ? "greater" : "less",
  };
  return sceneQuestion(rng, {
    game: "fractions",
    title: askGreater ? "Which shaded fraction is greater?" : "Which shaded fraction is less?",
    hint: sameDen ? "Same denominator. More parts are greater." : "Same numerator. Bigger pieces are greater.",
    answer,
    choices,
    skill: "fractions:compare",
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

function makeEquivalent(rng: Rng): ChoiceQ {
  const [num, den, num2, den2] = rng.pick(PAIRS);
  const answer = `${num2}/${den2}`;
  const board: FractionBoard = { game: "fractions", mode: "equivalent", num, den, num2, den2 };
  return sceneQuestion(rng, {
    game: "fractions",
    title: `Which fraction matches ${num}/${den}?`,
    hint: "Same amount, different parts",
    answer,
    choices: uniqueChoices(
      rng,
      answer,
      notEquivalent(answer, THROUGH_EIGHTHS).filter((item) => item !== `${num}/${den}`),
    ),
    skill: "fractions:equivalent",
    tags: ["equivalent"],
    solved: `${num}/${den} = ${answer}`,
    picture: `${num}/${den}`,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `eq:${num}/${den}=${answer}`,
  });
}

function makeShade(rng: Rng): ChoiceQ {
  const den = rng.pick([2, 3, 4, 6, 8]);
  const num = rng.int(1, den);
  const answer = `${num}/${den}`;
  const board: FractionBoard = { game: "fractions", mode: "shade", num, den };
  return sceneQuestion(rng, {
    game: "fractions",
    title: `Shade ${num} of the ${den} parts`,
    hint: "Tap a part to shade it",
    answer,
    choices: fracChoices(rng, answer, [], THROUGH_EIGHTHS),
    skill: "fractions:shade",
    tags: ["shade"],
    solved: answer,
    picture: answer,
    hands: true,
    quietChoices: true,
    labels: {},
    board,
    factKey: `shade:${answer}`,
  });
}

export function makeFractionQuestion(rng: Rng, level: FractionLevel): ChoiceQ {
  switch (level) {
    case "parts":
      return makeParts(rng);
    case "unit":
      return makeUnit(rng);
    case "line":
      return makeLine(rng);
    case "compare":
      return makeCompare(rng);
    case "equivalent":
      return makeEquivalent(rng);
    case "shade":
      return makeShade(rng);
    default: {
      const neverLevel: never = level;
      return neverLevel;
    }
  }
}

function sheetItem(rng: Rng, level: string): SheetItem {
  const safe: FractionLevel = isFractionLevel(level) ? level : "parts";
  switch (safe) {
    case "parts":
    case "shade": {
      const den = rng.pick([2, 4]);
      const num = rng.int(1, den);
      return { prompt: `${num} of ${den} equal parts are shaded. What fraction?`, answer: `${num}/${den}` };
    }
    case "unit": {
      const den = rng.pick([2, 3, 4]);
      return { prompt: `1 of ${den} equal parts is shaded. What unit fraction?`, answer: `1/${den}` };
    }
    case "line": {
      const den = rng.pick([2, 3, 4]);
      const num = rng.int(0, den);
      return { prompt: `A number line from 0 to 1 has ${den} equal jumps. The dot is on jump ${num}. What fraction?`, answer: fractionText(num, den) };
    }
    case "compare": {
      const den = rng.pick([2, 3, 4]);
      const num = rng.int(1, den - 1);
      let num2 = rng.int(1, den - 1);
      if (num2 === num) num2 = num === 1 ? 2 : num - 1;
      const greater = num > num2 ? `${num}/${den}` : `${num2}/${den}`;
      return { prompt: `Which is greater, ${num}/${den} or ${num2}/${den}?`, answer: greater };
    }
    case "equivalent": {
      const pair = rng.pick(PAIRS);
      return { prompt: `Which fraction matches ${pair[0]}/${pair[1]}?`, answer: `${pair[2]}/${pair[3]}` };
    }
    default: {
      const neverLevel: never = safe;
      return neverLevel;
    }
  }
}

export function FractionsPrompt({ question, reveal, mascot, happy }: PromptProps) {
  void reveal;
  if (question.visual.kind !== "scene" || question.visual.board.game !== "fractions") return null;
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
      <FractionArt board={board} />
    </SceneCard>
  );
}

function FractionArt({ board }: { board: FractionBoard }) {
  switch (board.mode) {
    case "parts":
    case "unit":
      return <FractionBar num={board.num} den={board.den} />;
    case "line":
      return <FractionLine den={board.den} mark={board.num} />;
    case "compare":
      return (
        <div className="ac-frac-pair">
          <div>
            <FractionBar num={board.num} den={board.den} />
            <p className="ac-frac-name">{fractionText(board.num, board.den)}</p>
          </div>
          <div>
            <FractionBar num={board.num2} den={board.den2} />
            <p className="ac-frac-name">{fractionText(board.num2, board.den2)}</p>
          </div>
        </div>
      );
    case "equivalent":
      return <FractionBar num={board.num} den={board.den} />;
    case "shade":
      return null;
    default: {
      const neverBoard: never = board;
      return neverBoard;
    }
  }
}

export const fractionsGame = sceneModule({
  id: "fractions",
  title: "Fractions",
  short: "Fractions",
  audience: "1–3",
  tint: "sand",
  mascot: "panda",
  sheetSlug: "fractions",
  sheetScreen: "sheet-fractions",
  blurb:
    "Free fraction practice for grades 1–3. Parts of a whole, unit fractions, fractions on a number line, comparing fractions, and equivalent fractions with pictures.",
  levels: [...LEVELS],
  defaultLevel,
  sheetDefaultLevel: "parts",
  isLevel: isFractionLevel,
  bars: BARS,
  chips: BARS,
  makeQuestion: (rng, level) => makeFractionQuestion(rng, isFractionLevel(level) ? level : "parts"),
  makeSheetItem: sheetItem,
  Prompt: FractionsPrompt,
});
