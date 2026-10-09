import type { ReactNode } from "react";
import type { Rng } from "@/lib/rng";
import type { Grade } from "../model";

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

export type Visual = AddVisual | TimesVisual | TimeVisual;

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
  visual: Visual;
}

export interface SheetItem {
  prompt: string;
  answer: string;
  clock?: { hours: number; minutes: number };
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
  Aside?: (props: { question: ChoiceQ }) => ReactNode;
  SheetBody: (props: { items: SheetItem[] }) => ReactNode;
  focus?: SheetFocus;
  /** Parent progress bars, most-practiced first when counts tie. */
  bars: SkillRow[];
  /** Mastered chips. `label` is the short chip text. */
  chips: SkillRow[];
  skillLabel: (key: string) => string | null;
  chipLabel: (key: string) => string | null;
}
