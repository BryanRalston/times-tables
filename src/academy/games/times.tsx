import { parseTimesKey, timesKey } from "@/lib/practice";
import { makeFluencyItem } from "@/lib/questions";
import type { Rng } from "@/lib/rng";
import type { FluencyData, Question } from "@/lib/types";
import { bandFor } from "../grade-map";
import type { Grade } from "../model";
import { Equation, Groups, SquisheeImg, cx } from "../ui/bits";
import { fourChoices, qid } from "./choices";
import { TIMES, type ChoiceQ, type GameModule, type SheetItem } from "./types";

export const TIMES_LEVELS = ["count", "twos", "mix", "toTen"] as const;
export type TimesLevel = (typeof TIMES_LEVELS)[number];

export const TIMES_SPEC: Record<TimesLevel, { factors: number[]; max: number }> = {
  count: { factors: [2, 5, 10], max: 5 },
  twos: { factors: [2, 5, 10], max: 10 },
  mix: { factors: [2, 3, 4, 5, 10], max: 10 },
  toTen: { factors: [2, 3, 4, 5, 6, 7, 8, 9, 10], max: 10 },
};

/** 6, 7, 8, and 9 are grade 3 facts (3.OA). Earlier levels may still use 10. */
const LATER_FACTORS = [6, 7, 8, 9];

const LEVELS = [
  { id: "count", label: "2s, 5s, 10s · small", num: 1 },
  { id: "twos", label: "2s, 5s, 10s", num: 2 },
  { id: "mix", label: "Mix through 5s", num: 3 },
  { id: "toTen", label: "Up to 10s", num: 4 },
] as const;

const BARS = ["2", "5", "10", "3", "4", "6", "7", "8", "9"].map((n) => ({ key: `table:${n}`, label: `×${n}` }));
const CHIPS = ["2", "3", "4", "5", "6", "7", "8", "9", "10"].map((n) => ({ key: `table:${n}`, label: `×${n}` }));

export function isTimesLevel(v: unknown): v is TimesLevel {
  return typeof v === "string" && (TIMES_LEVELS as readonly string[]).includes(v);
}

function defaultLevel(grade: Grade): TimesLevel {
  const start = bandFor("times", grade)?.start;
  if (isTimesLevel(start)) return start;
  switch (grade) {
    case "K":
      return "count";
    case "1":
      return "count";
    case "2":
      return "twos";
    case "3":
      return "toTen";
    default: {
      const neverGrade: never = grade;
      return neverGrade;
    }
  }
}

function fluencyTimes(q: Question): { a: number; b: number } | null {
  const data = q.data;
  if (!data || typeof data !== "object") return null;
  if (!("op" in data) || !("a" in data) || !("b" in data) || "mode" in data) return null;
  const row = data as FluencyData;
  if (row.op !== "×") return null;
  if (!Number.isInteger(row.a) || !Number.isInteger(row.b)) return null;
  return { a: row.a, b: row.b };
}

function partnerOk(level: TimesLevel, partner: number, spec: { max: number }): boolean {
  if (partner < 1 || partner > spec.max) return false;
  if (level === "toTen") return true;
  return !LATER_FACTORS.includes(partner);
}

function partnersFor(level: TimesLevel, spec: { max: number }): number[] {
  const partners: number[] = [];
  for (let n = 1; n <= spec.max; n++) {
    if (partnerOk(level, n, spec)) partners.push(n);
  }
  return partners;
}

function orientFactors(
  level: TimesLevel,
  a: number,
  b: number,
  spec: { factors: number[]; max: number },
): { a: number; b: number } | null {
  const aOk = spec.factors.includes(a) && partnerOk(level, b, spec);
  const bOk = spec.factors.includes(b) && partnerOk(level, a, spec);
  if (aOk) return { a, b };
  if (bOk) return { a: b, b: a };
  return null;
}

function preferInLevel(keys: string[], level: TimesLevel, spec: { factors: number[]; max: number }): string[] {
  return keys.filter((key) => {
    const parsed = parseTimesKey(key);
    if (!parsed) return false;
    return orientFactors(level, parsed.a, parsed.b, spec) !== null;
  });
}

/** Equal groups of 2, 5, or 10 stay small enough to count. */
function countFactOk(level: TimesLevel, fact: { a: number; b: number }): boolean {
  if (level !== "count") return true;
  return fact.a * fact.b <= 20;
}

/** Multiplication fact from Squishee Math's fluency engine, kept inside the level. */
export function nextTimesFact(rng: Rng, level: TimesLevel, prefer: string[] = []): { a: number; b: number } {
  const spec = TIMES_SPEC[level];
  const usable = preferInLevel(prefer, level, spec);
  for (let i = 0; i < 8; i++) {
    const q = makeFluencyItem(rng, spec.factors, i === 0 && usable.length ? usable : undefined);
    const fact = fluencyTimes(q);
    if (!fact) continue;
    const oriented = orientFactors(level, fact.a, fact.b, spec);
    if (oriented && countFactOk(level, oriented)) return oriented;
  }
  const partners = partnersFor(level, spec);
  for (let i = 0; i < 20; i++) {
    const fact = { a: rng.pick(spec.factors), b: rng.pick(partners) };
    if (countFactOk(level, fact)) return fact;
  }
  return { a: 2, b: 2 };
}

function tableTags(a: number, b: number): string[] {
  const tags: string[] = [];
  if (a >= 2 && a <= 12) tags.push(`table:${a}`);
  if (b >= 2 && b <= 12 && b !== a) tags.push(`table:${b}`);
  return tags;
}

export function makeTimesQuestion(rng: Rng, level: TimesLevel, prefer: string[] = []): ChoiceQ {
  const { a, b } = nextTimesFact(rng, level, prefer);
  const product = a * b;
  const solved = `${a} ${TIMES} ${b} = ${product}`;
  return {
    id: qid(rng),
    game: "times",
    title: "Tap the answer!",
    hint: a <= 6 ? `${a} groups of ${b}` : "Tap the product",
    praise: `Yes! ${solved}`,
    almost: `Almost! ${solved}`,
    answer: String(product),
    choices: fourChoices(rng, product, [a * (b + 1), a * Math.max(0, b - 1), (a + 1) * b, a + b, product + a]),
    skill: `times:${level}`,
    tags: tableTags(a, b),
    factKey: timesKey(a, b),
    visual: { kind: "times", a, b, hidden: product, solved },
  };
}

function sheetItem(rng: Rng, level: string, focus?: number): SheetItem {
  const safe = isTimesLevel(level) ? level : "toTen";
  const fact =
    focus && focus >= 2 && focus <= 12 ? { a: focus, b: rng.int(1, 10) } : nextTimesFact(rng, safe, []);
  return { prompt: `${fact.a} ${TIMES} ${fact.b} =`, answer: String(fact.a * fact.b) };
}

function labelFor(key: string): string | null {
  const row = BARS.find((bar) => bar.key === key) ?? CHIPS.find((chip) => chip.key === key);
  return row?.label ?? null;
}

export function TimesPrompt({ question, reveal, mascot, happy }: { question: ChoiceQ; reveal: boolean; mascot: string; happy: boolean }) {
  return (
    <section className="ac-qcard">
      <h1>{question.title}</h1>
      <SquisheeImg id={mascot} className={cx("ac-mascot", happy && "is-happy")} />
      <Equation visual={question.visual} reveal={reveal} answer={question.answer} />
      {question.visual.kind === "times" ? <Groups a={question.visual.a} b={question.visual.b} /> : null}
      <p className="ac-hint">{question.hint}</p>
    </section>
  );
}

export function TimesSheet({ items }: { items: SheetItem[] }) {
  return (
    <ol className="ac-problems">
      {items.map((item, i) => (
        <li key={`${item.prompt}-${i}`}>{item.prompt}</li>
      ))}
    </ol>
  );
}

export const timesGame = {
  id: "times",
  title: "Times Tables",
  audience: "Grade 2–3",
  tint: "pink",
  mascot: "peach",
  sheetSlug: "times-tables",
  sheetScreen: "sheet-times",
  blurb: "Free printable multiplication practice for grades K–3. Random problems and an answer key. No signup.",
  sheetCount: 16,
  layout: "card",
  levels: [...LEVELS],
  defaultLevel,
  sheetDefaultLevel: "toTen",
  isLevel: isTimesLevel,
  pill: (level) => `Times Tables · Level ${level.num}`,
  makeQuestion: (rng, level, prefer) => makeTimesQuestion(rng, isTimesLevel(level) ? level : "count", prefer),
  makeSheetItem: sheetItem,
  Prompt: TimesPrompt,
  SheetBody: TimesSheet,
  focus: {
    param: "factor",
    label: "Table",
    blank: "Mix",
    options: Array.from({ length: 9 }, (_, i) => {
      const n = i + 2;
      return { value: String(n), label: `×${n}` };
    }),
    read: (raw: string | null) => {
      const n = Number(raw);
      return Number.isInteger(n) && n >= 2 && n <= 12 ? n : undefined;
    },
  },
  bars: BARS,
  chips: CHIPS,
  skillLabel: labelFor,
  chipLabel: () => null,
} satisfies GameModule;
