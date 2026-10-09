import type { Rng } from "@/lib/rng";
import type { Grade } from "../model";
import { DotModel, Equation, SquisheeImg, cx } from "../ui/bits";
import { fourChoices, qid } from "./choices";
import { MINUS, type ChoiceQ, type GameModule, type SheetItem } from "./types";

export const ADD_LEVELS = ["within5", "within10", "within20", "within100"] as const;
export type AddLevel = (typeof ADD_LEVELS)[number];

export const ADD_MAX: Record<AddLevel, number> = {
  within5: 5,
  within10: 10,
  within20: 20,
  within100: 100,
};

const LEVELS = [
  { id: "within5", label: "Within 5", num: 1 },
  { id: "within10", label: "Within 10", num: 2 },
  { id: "within20", label: "Within 20", num: 3 },
  { id: "within100", label: "Within 100", num: 4 },
] as const;

const BARS = [
  { key: "add:within5", label: "Add within 5" },
  { key: "add:within10", label: "Add within 10" },
  { key: "add:within20", label: "Add within 20" },
  { key: "add:within100", label: "Add within 100" },
];

const CHIPS = [
  { key: "doubles", label: "Doubles" },
  { key: "make10", label: "Make 10" },
  { key: "add:within5", label: "Within 5" },
  { key: "add:within10", label: "Within 10" },
  { key: "add:within20", label: "Within 20" },
  { key: "add:within100", label: "Within 100" },
];

export function isAddLevel(v: unknown): v is AddLevel {
  return typeof v === "string" && (ADD_LEVELS as readonly string[]).includes(v);
}

function defaultLevel(grade: Grade): AddLevel {
  switch (grade) {
    case "K":
      return "within5";
    case "1":
      return "within10";
    case "2":
      return "within20";
    case "3":
      return "within100";
    default: {
      const neverGrade: never = grade;
      return neverGrade;
    }
  }
}

export function makeAddQuestion(rng: Rng, level: AddLevel): ChoiceQ {
  const max = ADD_MAX[level];
  const sub = rng.next() < (max <= 10 ? 0.28 : 0.45);
  const roll = rng.next();
  let op: "+" | "-" = "+";
  let pink = 0;
  let teal = 0;
  let left: number | null = 0;
  let right: number | null = 0;
  let result: number | null = 0;
  let hidden = 0;
  let solved = "";

  if (!sub) {
    const sum = rng.int(1, max);
    pink = rng.int(0, sum);
    teal = sum - pink;
    solved = `${pink} + ${teal} = ${sum}`;
    if (roll < 0.5) {
      left = pink;
      right = null;
      result = sum;
      hidden = teal;
    } else if (roll < 0.82) {
      left = pink;
      right = teal;
      result = null;
      hidden = sum;
    } else {
      left = null;
      right = teal;
      result = sum;
      hidden = pink;
    }
  } else {
    op = "-";
    const total = rng.int(1, max);
    teal = rng.int(0, total);
    pink = total - teal;
    solved = `${total} ${MINUS} ${teal} = ${pink}`;
    if (roll < 0.55) {
      left = total;
      right = teal;
      result = null;
      hidden = pink;
    } else if (roll < 0.85) {
      left = total;
      right = null;
      result = pink;
      hidden = teal;
    } else {
      left = null;
      right = teal;
      result = pink;
      hidden = total;
    }
  }

  const tags: string[] = [];
  if (op === "+" && pink === teal) tags.push("doubles");
  if (op === "+" && pink + teal === 10) tags.push("make10");

  const wild = op === "+" ? pink + (pink + teal) : (pink + teal) + teal;
  return {
    id: qid(rng),
    game: "add",
    title: "Tap the missing number!",
    hint: max <= 20 ? "Count the dots" : "Count the tens and the ones",
    praise: `Yes! ${solved}`,
    almost: `Almost! ${solved}`,
    answer: String(hidden),
    choices: fourChoices(rng, hidden, [hidden - 1, hidden + 1, wild, hidden + 2, hidden - 2]),
    skill: `add:${level}`,
    tags,
    visual: { kind: "add", op, left, right, result, pink, teal, max, hidden, solved },
  };
}

function sheetItem(rng: Rng, level: string): SheetItem {
  const max = ADD_MAX[isAddLevel(level) ? level : "within20"];
  if (rng.next() < 0.42) {
    const left = rng.int(0, max);
    const right = rng.int(0, left);
    return { prompt: `${left} ${MINUS} ${right} =`, answer: String(left - right) };
  }
  const sum = rng.int(0, max);
  const a = rng.int(0, sum);
  const b = sum - a;
  return { prompt: `${a} + ${b} =`, answer: String(sum) };
}

function labelFor(rows: { key: string; label: string }[], key: string): string | null {
  return rows.find((row) => row.key === key)?.label ?? null;
}

export function AddPrompt({ question, reveal, mascot, happy }: { question: ChoiceQ; reveal: boolean; mascot: string; happy: boolean }) {
  return (
    <section className="ac-qcard">
      <h1>{question.title}</h1>
      <SquisheeImg id={mascot} className={cx("ac-mascot", happy && "is-happy")} />
      <Equation visual={question.visual} reveal={reveal} answer={question.answer} />
      {question.visual.kind === "add" ? <DotModel visual={question.visual} /> : null}
      <p className="ac-hint">{question.hint}</p>
    </section>
  );
}

export function AddSheet({ items }: { items: SheetItem[] }) {
  return (
    <ol className="ac-problems">
      {items.map((item, i) => (
        <li key={`${item.prompt}-${i}`}>{item.prompt}</li>
      ))}
    </ol>
  );
}

export const addGame = {
  id: "add",
  title: "Add & Subtract",
  audience: "K–2",
  tint: "mint",
  mascot: "frog",
  sheetSlug: "add-subtract",
  sheetScreen: "sheet-add",
  blurb: "Free printable addition and subtraction for grades K–2. Facts within 5, 10, 20, or 100, plus an answer key.",
  sheetCount: 16,
  layout: "card",
  levels: [...LEVELS],
  defaultLevel,
  sheetDefaultLevel: "within20",
  isLevel: isAddLevel,
  pill: (level) => `Add & Subtract · Level ${level.num}`,
  makeQuestion: (rng, level) => makeAddQuestion(rng, isAddLevel(level) ? level : "within5"),
  makeSheetItem: sheetItem,
  Prompt: AddPrompt,
  SheetBody: AddSheet,
  bars: BARS,
  chips: CHIPS,
  skillLabel: (key) => labelFor(BARS, key) ?? labelFor(CHIPS, key),
  chipLabel: (key) => labelFor(CHIPS, key),
} satisfies GameModule;
