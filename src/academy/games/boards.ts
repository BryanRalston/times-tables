import { getLocale } from "../i18n";

export type CountBoard =
  | { game: "count"; mode: "objects" | "to20"; emoji: string; name: string; n: number }
  | { game: "count"; mode: "compare"; emoji: string; name: string; groups: number[]; ask: "more" | "less" }
  | { game: "count"; mode: "neighbor"; n: number; ask: "before" | "after" }
  | { game: "count"; mode: "subitize"; clusters: number[] }
  | { game: "count"; mode: "tenframe"; frames: number[] }
  | { game: "count"; mode: "build"; n: number };

export type PlaceBoard =
  | { game: "place"; mode: "blocks" | "expanded" | "round10" | "round100" | "build"; n: number }
  | { game: "place"; mode: "compare"; left: number; right: number; ask: "greater" | "less" }
  | { game: "place"; mode: "big"; n: number; digit: number; place: number }
  | { game: "place"; mode: "roundBig"; n: number; place: number };

export type ShapeName =
  | "circle"
  | "triangle"
  | "square"
  | "rectangle"
  | "pentagon"
  | "hexagon"
  | "cube"
  | "sphere"
  | "cone"
  | "cylinder";

export type ShapeColor = "red" | "blue" | "yellow" | "green";

export type AngleKind = "acute" | "right" | "obtuse" | "straight";

export type ShapeBoard =
  | { game: "shapes"; mode: "flat" | "solid"; shape: ShapeName }
  | { game: "shapes"; mode: "sides"; shape: ShapeName; ask: "sides" | "corners" }
  | { game: "shapes"; mode: "symmetry"; shape: "square" | "rectangle" | "triangle" | "circle" }
  | { game: "shapes"; mode: "parts"; parts: "halves" | "thirds" | "fourths" | "unequal" }
  | { game: "shapes"; mode: "color"; color: ShapeColor }
  | { game: "shapes"; mode: "match"; shape: ShapeName }
  | { game: "shapes"; mode: "pattern"; items: ShapeColor[]; next: ShapeColor }
  | { game: "shapes"; mode: "angles"; kind: AngleKind; ask: "kind" | "degrees" };

export type FractionBoard =
  | { game: "fractions"; mode: "parts" | "unit" | "shade"; num: number; den: number }
  | { game: "fractions"; mode: "line"; num: number; den: number }
  | {
      game: "fractions";
      mode: "compare";
      num: number;
      den: number;
      num2: number;
      den2: number;
      ask: "greater" | "less";
    }
  | { game: "fractions"; mode: "equivalent"; num: number; den: number; num2: number; den2: number }
  | { game: "fractions"; mode: "addLike"; num: number; den: number; num2: number; op: "+" | "-" }
  | {
      game: "fractions";
      mode: "decimals";
      whole: number;
      tenths: number;
      hundredths: number;
      ask: "write" | "compare";
      otherTenths?: number;
      otherHundredths?: number;
    };

export interface MeasureItem {
  name: string;
  emoji: string;
  value: number;
}

export type MeasureBoard =
  | { game: "measure"; mode: "compare"; items: MeasureItem[]; ask: "longest" | "shortest" }
  | { game: "measure"; mode: "size"; ask: "bigger" | "smaller" }
  | { game: "measure"; mode: "ruler"; inches: number }
  | { game: "measure"; mode: "picture" | "bar"; items: MeasureItem[]; ask: "count" | "most"; focus: number }
  | { game: "measure"; mode: "more"; items: MeasureItem[]; left: number; right: number }
  | { game: "measure"; mode: "area" | "perimeter"; length: number; width: number };

export type PhonicsBoard =
  | { game: "phonics"; mode: "letters"; letter: string }
  | { game: "phonics"; mode: "sounds" | "begin"; letter: string; phoneme: string; word: string; emoji: string }
  | { game: "phonics"; mode: "rhyme"; cue: string; family: string }
  | { game: "phonics"; mode: "cvc"; word: string; blend: string; letters: string }
  | { game: "phonics"; mode: "end"; letter: string; phoneme: string; word: string };

export interface ProblemBoard {
  game: "problems";
  mode: "add" | "sub" | "mult" | "div" | "picture" | "steps";
  op: "+" | "-" | "×" | "÷";
  a: number;
  b: number;
  emoji: string;
  thing: string;
  /** Taken away or added after the first step. */
  extra?: number;
}

export type Board = CountBoard | PlaceBoard | ShapeBoard | FractionBoard | MeasureBoard | PhonicsBoard | ProblemBoard;

export function countName(name: string, n: number): string {
  if (n === 1 && name.endsWith("s")) return name.slice(0, -1);
  return name;
}

export function roundHalfUp(n: number, place: 10 | 100): number {
  return Math.floor(n / place + 0.5) * place;
}

export function expandedForm(n: number): string {
  const hundreds = Math.floor(n / 100);
  const tens = Math.floor((n % 100) / 10);
  const ones = n % 10;
  if (hundreds > 0) return `${hundreds * 100} + ${tens * 10} + ${ones}`;
  return `${tens * 10} + ${ones}`;
}

function bit(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function bitEs(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

export function blockPhrase(n: number): string {
  const hundreds = Math.floor(n / 100);
  const tens = Math.floor((n % 100) / 10);
  const ones = n % 10;
  if (getLocale() === "es") {
    const parts: string[] = [];
    if (hundreds > 0) parts.push(bitEs(hundreds, "centena", "centenas"));
    if (tens > 0) parts.push(bitEs(tens, "decena", "decenas"));
    if (ones > 0 || parts.length === 0) parts.push(bitEs(ones, "unidad", "unidades"));
    if (parts.length === 1) return parts[0]!;
    return `${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}`;
  }
  const parts: string[] = [];
  if (hundreds > 0) parts.push(bit(hundreds, "hundred"));
  if (tens > 0) parts.push(bit(tens, "ten"));
  if (ones > 0 || parts.length === 0) parts.push(bit(ones, "one"));
  if (parts.length === 1) return parts[0]!;
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

export function sideCount(shape: ShapeName): number {
  switch (shape) {
    case "triangle":
      return 3;
    case "square":
    case "rectangle":
      return 4;
    case "pentagon":
      return 5;
    case "hexagon":
      return 6;
    case "circle":
    case "cube":
    case "sphere":
    case "cone":
    case "cylinder":
      return 0;
    default: {
      const neverShape: never = shape;
      return neverShape;
    }
  }
}

export function symmetryAnswer(shape: "square" | "rectangle" | "triangle" | "circle"): string {
  switch (shape) {
    case "square":
      return "4";
    case "rectangle":
      return "2";
    case "triangle":
      return "3";
    case "circle":
      return "more than 4";
    default: {
      const neverShape: never = shape;
      return neverShape;
    }
  }
}

export function fractionText(num: number, den: number): string {
  if (num <= 0) return "0";
  if (num >= den) return "1";
  return `${num}/${den}`;
}
