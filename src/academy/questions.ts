import { formatClockTime } from "@/lib/clock";
import { parseTimesKey, timesKey } from "@/lib/practice";
import { makeFluencyItem } from "@/lib/questions";
import type { Rng } from "@/lib/rng";
import type { FluencyData, Question } from "@/lib/types";
import {
  ROUND_LENGTH,
  type AddLevel,
  type GameId,
  type TimeLevel,
  type TimesLevel,
  isAddLevel,
  isTimeLevel,
  isTimesLevel,
} from "./model";

export const MINUS = "−";
export const TIMES = "×";

export const TIMES_SPEC: Record<TimesLevel, { factors: number[]; max: number }> = {
  count: { factors: [2, 5, 10], max: 5 },
  twos: { factors: [2, 5, 10], max: 10 },
  mix: { factors: [2, 3, 4, 5, 10], max: 10 },
  toTen: { factors: [2, 3, 4, 5, 6, 7, 8, 9, 10], max: 10 },
};

export const ADD_MAX: Record<AddLevel, number> = {
  within5: 5,
  within10: 10,
  within20: 20,
  within100: 100,
};

export const TIME_MINUTES: Record<TimeLevel, readonly number[]> = {
  hour: [0],
  half: [0, 30],
  quarter: [0, 15, 30, 45],
  fives: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
};

export interface AddVisual {
  kind: "add";
  op: "+" | "-";
  left: number | null;
  right: number | null;
  result: number | null;
  pink: number;
  teal: number;
  max: number;
  hidden: number;
  solved: string;
}

export interface TimesVisual {
  kind: "times";
  a: number;
  b: number;
  hidden: number;
  solved: string;
}

export interface TimeVisual {
  kind: "time";
  hours: number;
  minutes: number;
  level: TimeLevel;
}

export type Visual = AddVisual | TimesVisual | TimeVisual;

export interface ChoiceQ {
  id: string;
  game: GameId;
  title: string;
  hint: string;
  praise: string;
  almost: string;
  answer: string;
  choices: string[];
  skill: string;
  tags: string[];
  factKey?: string;
  visual: Visual;
}

export interface SheetItem {
  prompt: string;
  answer: string;
  clock?: { hours: number; minutes: number };
}

function qid(rng: Rng): string {
  return `ac-${Math.floor(rng.next() * 1e9).toString(36)}`;
}

export function fourChoices(rng: Rng, answer: number, preferred: number[]): string[] {
  const picked: number[] = [];
  const used = new Set<number>([answer]);
  const consider = (n: number) => {
    if (picked.length >= 3) return;
    if (!Number.isInteger(n) || n < 0 || n > 500 || used.has(n)) return;
    used.add(n);
    picked.push(n);
  };
  for (const n of preferred) consider(n);
  let delta = 1;
  while (picked.length < 3 && delta < 80) {
    consider(answer + delta);
    consider(answer - delta);
    delta += 1;
  }
  return rng.shuffle([answer, ...picked]).map(String);
}

function capPhrase(phrase: string): string {
  if (!phrase) return phrase;
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

export function timeTalk(hours: number, minutes: number): string {
  if (minutes === 0) return `${hours} o'clock`;
  if (minutes === 30) return `half past ${hours}`;
  if (minutes === 15) return `quarter past ${hours}`;
  if (minutes === 45) {
    const next = hours === 12 ? 1 : hours + 1;
    return `quarter to ${next}`;
  }
  return formatClockTime(hours, minutes);
}

export function timeHint(_hours: number, minutes: number): string {
  const pointed = Math.round(minutes / 5) % 12;
  const number = pointed === 0 ? 12 : pointed;
  if (minutes === 30) return "The long hand points to 6 = half past";
  if (minutes === 0) return "The long hand points to 12 = o'clock";
  if (minutes === 15) return "The long hand points to 3 = quarter past";
  if (minutes === 45) return "The long hand points to 9 = quarter to";
  return `The long hand points to ${number}. Count by fives.`;
}

export function fourTimeChoices(rng: Rng, hours: number, minutes: number): string[] {
  const correct = formatClockTime(hours, minutes);
  const pool: string[] = [];
  const push = (h: number, m: number) => {
    if (pool.length >= 3) return;
    const label = formatClockTime(h, m);
    if (label === correct || pool.includes(label)) return;
    pool.push(label);
  };
  const pointed = Math.round(minutes / 5) % 12;
  const asHour = pointed === 0 ? 12 : pointed;
  push(asHour, minutes);
  if (minutes === 15) push(hours, 45);
  else if (minutes === 45) push(hours, 15);
  else if (minutes === 30) push(hours, 0);
  else if (minutes === 0) push(hours, 30);
  else push(hours, 0);
  push(hours + 1, minutes);
  push(hours, minutes + 5);
  push(hours, minutes - 5);
  push(hours - 1, minutes);
  push(asHour, 0);
  let extra = 0;
  while (pool.length < 3 && extra < 24) {
    extra += 1;
    push(hours, extra);
    push((hours + extra) % 12 || 12, 0);
  }
  return rng.shuffle([correct, ...pool.slice(0, 3)]);
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

function orientFactors(
  a: number,
  b: number,
  spec: { factors: number[]; max: number },
): { a: number; b: number } | null {
  const aOk = spec.factors.includes(a) && b >= 1 && b <= spec.max;
  const bOk = spec.factors.includes(b) && a >= 1 && a <= spec.max;
  if (aOk) return { a, b };
  if (bOk) return { a: b, b: a };
  return null;
}

function preferInLevel(keys: string[], spec: { factors: number[]; max: number }): string[] {
  return keys.filter((key) => {
    const parsed = parseTimesKey(key);
    if (!parsed) return false;
    const aOk = spec.factors.includes(parsed.a) && parsed.b >= 1 && parsed.b <= spec.max;
    const bOk = spec.factors.includes(parsed.b) && parsed.a >= 1 && parsed.a <= spec.max;
    return aOk || bOk;
  });
}

/** Multiplication fact from Squishee Math's fluency engine, kept inside the level. */
export function nextTimesFact(rng: Rng, level: TimesLevel, prefer: string[] = []): { a: number; b: number } {
  const spec = TIMES_SPEC[level];
  const usable = preferInLevel(prefer, spec);
  for (let i = 0; i < 8; i++) {
    const q = makeFluencyItem(rng, spec.factors, i === 0 && usable.length ? usable : undefined);
    const fact = fluencyTimes(q);
    if (!fact) continue;
    const oriented = orientFactors(fact.a, fact.b, spec);
    if (oriented) return oriented;
  }
  return { a: rng.pick(spec.factors), b: rng.int(1, spec.max) };
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
    hint: max <= 10 ? "Count the dots" : max <= 20 ? "Count the dots" : "Count the tens and the ones",
    praise: `Yes! ${solved}`,
    almost: `Almost! ${solved}`,
    answer: String(hidden),
    choices: fourChoices(rng, hidden, [hidden - 1, hidden + 1, wild, hidden + 2, hidden - 2]),
    skill: `add:${level}`,
    tags,
    visual: { kind: "add", op, left, right, result, pink, teal, max, hidden, solved },
  };
}

function timeTags(minutes: number): string[] {
  if (minutes === 0) return ["oclock"];
  if (minutes === 30) return ["halfpast"];
  if (minutes === 15) return ["quarterpast"];
  if (minutes === 45) return ["quarterto"];
  return ["fives"];
}

export function makeTimeQuestion(rng: Rng, level: TimeLevel): ChoiceQ {
  const hours = rng.int(1, 12);
  const minutes = rng.pick(TIME_MINUTES[level]);
  const phrase = timeTalk(hours, minutes);
  const answer = formatClockTime(hours, minutes);
  return {
    id: qid(rng),
    game: "time",
    title: "What time is it?",
    hint: timeHint(hours, minutes),
    praise: `Yes! ${capPhrase(phrase)}`,
    almost: `Almost! It is ${phrase}.`,
    answer,
    choices: fourTimeChoices(rng, hours, minutes),
    skill: `time:${level}`,
    tags: timeTags(minutes),
    visual: { kind: "time", hours, minutes, level },
  };
}

export function makeQuestion(game: GameId, level: string, rng: Rng, prefer: string[] = []): ChoiceQ {
  switch (game) {
    case "times":
      return makeTimesQuestion(rng, isTimesLevel(level) ? level : "count", prefer);
    case "add":
      return makeAddQuestion(rng, isAddLevel(level) ? level : "within5");
    case "time":
      return makeTimeQuestion(rng, isTimeLevel(level) ? level : "hour");
    default: {
      const neverGame: never = game;
      return neverGame;
    }
  }
}

export function makeRound(game: GameId, level: string, rng: Rng, count = ROUND_LENGTH, prefer: string[] = []): ChoiceQ[] {
  const out: ChoiceQ[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (out.length < count && guard < count * 8) {
    guard += 1;
    const q = makeQuestion(game, level, rng, prefer);
    const key = `${q.praise}|${q.answer}`;
    if (seen.has(key) && guard < count * 6) continue;
    seen.add(key);
    out.push(q);
  }
  while (out.length < count) out.push(makeQuestion(game, level, rng, prefer));
  return out;
}

function sheetTimes(rng: Rng, level: TimesLevel, focus?: number): SheetItem {
  const fact =
    focus && focus >= 2 && focus <= 12
      ? { a: focus, b: rng.int(1, 10) }
      : nextTimesFact(rng, level, []);
  return { prompt: `${fact.a} ${TIMES} ${fact.b} =`, answer: String(fact.a * fact.b) };
}

function sheetAdd(rng: Rng, level: AddLevel): SheetItem {
  const max = ADD_MAX[level];
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

function sheetTime(rng: Rng, level: TimeLevel): SheetItem {
  const hours = rng.int(1, 12);
  const minutes = rng.pick(TIME_MINUTES[level]);
  return {
    prompt: "What time is it?",
    answer: formatClockTime(hours, minutes),
    clock: { hours, minutes },
  };
}

export function makeSheet(opts: {
  game: GameId;
  level: string;
  rng: Rng;
  count?: number;
  focus?: number;
}): SheetItem[] {
  const count = opts.count ?? (opts.game === "time" ? 6 : 16);
  const out: SheetItem[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (out.length < count && guard < count * 8) {
    guard += 1;
    let item: SheetItem;
    switch (opts.game) {
      case "times":
        item = sheetTimes(opts.rng, isTimesLevel(opts.level) ? opts.level : "toTen", opts.focus);
        break;
      case "add":
        item = sheetAdd(opts.rng, isAddLevel(opts.level) ? opts.level : "within20");
        break;
      case "time":
        item = sheetTime(opts.rng, isTimeLevel(opts.level) ? opts.level : "half");
        break;
      default: {
        const neverGame: never = opts.game;
        return neverGame;
      }
    }
    const key = `${item.prompt}|${item.answer}|${item.clock?.hours ?? ""}|${item.clock?.minutes ?? ""}`;
    if (seen.has(key) && guard < count * 6) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function grownupGate(rng: Rng): { a: number; b: number; answer: number } {
  const a = rng.int(6, 12);
  const b = rng.int(5, 9);
  return { a, b, answer: a + b };
}
