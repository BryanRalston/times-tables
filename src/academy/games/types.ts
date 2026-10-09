import type { ReactNode } from "react";
import type { Rng } from "@/lib/rng";
import type { Grade, WordCard } from "../model";

export const MINUS = "−";
export const TIMES = "×";

export interface LevelDef {
  id: string;
  label: string;
  num: number;
}

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
  level: string;
}

export type CoinKind = "penny" | "nickel" | "dime" | "quarter" | "dollar";

export interface CoinPile {
  penny: number;
  nickel: number;
  dime: number;
  quarter: number;
  dollar: number;
}

export type MoneyMode = "name" | "count" | "make" | "change" | "dollars";

export type SightMode = "hear" | "match" | "fill";

export interface SightVisual {
  kind: "sight";
  mode: SightMode;
  word: string;
  spoken: string;
  /** Sentence with a blank, when the mode shows one. */
  sentence: string;
  /** Choice text to emoji, for picture matching. */
  pictures?: Record<string, string>;
  fallback: string;
  caption: string;
  bigFallback: boolean;
}

export interface SpellVisual {
  kind: "spell";
  word: string;
  spoken: string;
  sentence: string;
  pattern: string;
  patternLabel: string;
  tiles: { id: string; letter: string }[];
  fallback: string;
  caption: string;
  bigFallback: boolean;
}

export interface MoneyVisual {
  kind: "money";
  mode: MoneyMode;
  /** Coins on the table. For "make", the target is `priceCents` and choices are `piles`. */
  coins: CoinPile;
  priceCents?: number;
  piles?: Record<string, CoinPile>;
  labels?: Record<string, string>;
}

export type Visual = AddVisual | TimesVisual | TimeVisual | MoneyVisual | SightVisual | SpellVisual;

export interface ChoiceQ {
  id: string;
  game: string;
  title: string;
  hint: string;
  praise: string;
  almost: string;
  answer: string;
  choices: string[];
  skill: string;
  tags: string[];
  factKey?: string;
  /** A miss of this question should be asked again soon in the same round. */
  replay?: boolean;
  visual: Visual;
}

export interface SheetItem {
  prompt: string;
  answer: string;
  clock?: { hours: number; minutes: number };
  /** Dotted handwriting model. Sentence rows leave this off so the answer stays in the key. */
  trace?: string;
}

export interface SkillRow {
  key: string;
  label: string;
}

export interface SheetFocus {
  param: string;
  label: string;
  blank: string;
  options: { value: string; label: string }[];
  read: (raw: string | null) => number | undefined;
}

export interface PromptProps {
  question: ChoiceQ;
  reveal: boolean;
  mascot: string;
  happy: boolean;
}

export interface ChoiceProps {
  question: ChoiceQ;
  reveal: boolean;
  picked: string | null;
  onChoose: (value: string, hint?: boolean) => void;
}

/**
 * One playable game. Shared rounds, stars, streaks, unlocks, and the parent
 * page do not need edits when this object is added to the registry.
 */
export interface GameModule {
  id: string;
  title: string;
  audience: string;
  tint: string;
  mascot: string;
  sheetSlug: string;
  /** Matches `<body data-screen>` on the worksheet HTML entry. */
  sheetScreen: string;
  blurb: string;
  sheetCount: number;
  /** Wide layout puts an aside (the clock) beside the question. */
  layout: "card" | "wide";
  levels: LevelDef[];
  defaultLevel: (grade: Grade) => string;
  sheetDefaultLevel: string;
  isLevel: (value: unknown) => boolean;
  pill: (level: LevelDef) => string;
  makeQuestion: (rng: Rng, level: string, prefer?: string[]) => ChoiceQ;
  makeSheetItem: (rng: Rng, level: string, focus?: number) => SheetItem;
  Prompt: (props: PromptProps) => ReactNode;
  /** Replaces the four answer buttons when a game builds its own taps. */
  Choices?: (props: ChoiceProps) => ReactNode;
  Aside?: (props: { question: ChoiceQ }) => ReactNode;
  SheetBody: (props: { items: SheetItem[] }) => ReactNode;
  /** Word ids that should be practiced sooner. Times tables keep using skill facts. */
  reviewKeys?: (words: Record<string, WordCard>) => string[];
  focus?: SheetFocus;
  /** Parent progress bars, most-practiced first when counts tie. */
  bars: SkillRow[];
  /** Mastered chips. `label` is the short chip text. */
  chips: SkillRow[];
  skillLabel: (key: string) => string | null;
  chipLabel: (key: string) => string | null;
}
