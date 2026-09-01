export type Locale = "en" | "es" | "pt-BR";

export type PathGrade = 3 | 4;

export function parsePathGrade(v: unknown): PathGrade {
  return v === 4 || v === "4" ? 4 : 3;
}

export type QuarterId = 1 | 2 | 3 | 4;

export type Kind =
  | "tenframe"
  | "groups"
  | "array"
  | "placevalue"
  | "build"
  | "compare"
  | "order"
  | "choice"
  | "fraction"
  | "clock"
  | "money"
  | "area"
  | "perimeter"
  | "graph"
  | "pattern"
  | "word"
  | "fluency"
  | "measure"
  | "compute"
  | "jumps"
  | "decimal"
  | "fracop"
  | "lines";

export type InputMode =
  | "keypad"
  | "choice"
  | "compare"
  | "order"
  | "fraction"
  | "clock"
  | "money";

export type ItemSource = "fresh" | "review" | "fluency" | "friday";

export interface ActivityDef {
  id: string;
  title: string;
  blurb: string;
  sol: string[];
  kind: Kind;
  rounds: number;
  params?: Record<string, unknown>;
}

export interface UnitDef {
  id: string;
  number: number;
  quarter: QuarterId;
  title: string;
  short: string;
  sol: string[];
  blurb: string;
  activities: ActivityDef[];
}

export interface TenFrameData {
  total: number;
  shown: number;
  equation: string;
}

export interface GroupsData {
  groups: number;
  size: number;
  hide: "groups" | "size" | "product";
  equation: string;
}

export interface ArrayData {
  rows: number;
  cols: number;
  hide: "rows" | "cols" | "product";
}

export interface PlaceValueData {
  number: number;
  digit: number;
  place: string;
  mode: "place" | "value" | "expanded" | "word";
  words?: string;
}

export interface BuildData {
  target: number;
}

export interface CompareData {
  a: number;
  b: number;
  visual?: "bars" | "none";
}

export interface OrderData {
  numbers: number[];
  dir: "asc" | "desc";
}

export interface ChoiceData {
  visual?: "shape" | "none" | "combine" | "subdivide";
  shape?: string;
  rotation?: number;
  isPolygon?: boolean;
  sides?: number;
  parts?: string[];
  result?: string;
}

export interface FractionData {
  num: number;
  den: number;
  num2?: number;
  den2?: number;
  mode: "name" | "unit" | "mixed" | "compare" | "benchmark" | "equiv" | "leftover" | "line";
  shaded?: number;
}

export interface ClockData {
  hours: number;
  minutes: number;
  mode: "read" | "elapsed";
  elapsedHours?: number;
  elapsedMinutes?: number;
  find: "time" | "end" | "start" | "elapsed";
}

export interface MoneyData {
  coins: Partial<Record<Coin, number>>;
  otherCoins?: Partial<Record<Coin, number>>;
  target?: number;
  mode: "count" | "make" | "compare" | "change";
  pay?: number;
  cost?: number;
  otherCents?: number;
}

export type Coin = "penny" | "nickel" | "dime" | "quarter" | "dollar" | "five";

export interface AreaData {
  cells: boolean[][];
  unit: string;
  hideCount?: number;
}

export interface PerimeterData {
  sides: number[];
  unit: string;
  name: string;
  hideIndex?: number;
}

export interface GraphData {
  title: string;
  kind: "picto" | "bar";
  key: number;
  symbol: string;
  rows: { label: string; value: number; symbol?: string }[];
  ask: "greatest" | "least" | "value" | "more" | "total";
  focus?: string;
  focusB?: string;
  collect?: boolean;
  tray?: { id: string; label: string; symbol?: string }[];
}

export interface PatternData {
  seq: (number | null)[];
  step: number;
  dir?: "up" | "down";
  rule?: string;
}

export interface WordData {
  story: string;
  model?: "tenframe" | "groups" | "none";
}

export interface FluencyData {
  a: number;
  b: number;
  op: "×" | "÷" | "+" | "−";
}

export interface MeasureData {
  attribute: "length" | "mass" | "volume";
  system: "us" | "metric";
  unit: string;
  value: number;
  max: number;
  mode: "read" | "estimate" | "unit" | "convert";
}

export interface ComputeData {
  a: number;
  b: number;
  op: "+" | "−";
  mode: "exact" | "estimate";
}

export interface JumpsData {
  size: number;
  jumps: number;
  hide: "product" | "jumps" | "size";
}

export interface DecimalData {
  whole: number;
  tenths: number;
  hundredths: number;
  thousandths?: number;
  mode: "read" | "add" | "sub";
  b?: { whole: number; tenths: number; hundredths: number };
}

export interface FracOpData {
  a: number;
  b: number;
  den: number;
  op: "+" | "−";
}

export interface LinesData {
  figure: "point" | "line" | "ray" | "segment" | "angle" | "parallel" | "perpendicular";
  degrees?: number;
  pair?: "parallel" | "perpendicular" | "neither";
}

export interface Question {
  id: string;
  kind: Kind;
  prompt: string;
  hint?: string;
  answer: string;
  alts?: string[];
  input: InputMode;
  choices?: string[];
  needsInteract?: boolean;
  factKey?: string;
  source?: ItemSource;
  sol?: string[];
  data:
    | TenFrameData
    | GroupsData
    | ArrayData
    | PlaceValueData
    | BuildData
    | CompareData
    | OrderData
    | ChoiceData
    | FractionData
    | ClockData
    | MoneyData
    | AreaData
    | PerimeterData
    | GraphData
    | PatternData
    | WordData
    | FluencyData
    | MeasureData
    | ComputeData
    | JumpsData
    | DecimalData
    | FracOpData
    | LinesData;
}

export interface ActivitySave {
  plays: number;
  best: number;
  last: number;
  stars: number;
  misses: string[];
}

export interface DaySession {
  date: string;
  unitId: string;
  schoolDay: number;
  correct: number;
  total: number;
  fresh: number;
  review: number;
  completed: boolean;
}

export interface LearnerSlice {
  name: string;
  stars: number;
  seenWelcome: boolean;
  activities: Record<string, ActivitySave>;
  badges: string[];
  shaky: Record<string, number>;
  sessions: Record<string, DaySession>;
  squishees: string[];
  coins: number;
  attempts: Record<string, number>;
  perfectWalks: number;
}

export interface SaveState extends LearnerSlice {
  version: number;
  learnerId: string;
  classUnitId: string;
  pathGrade: PathGrade;
  skipWeekend: boolean;
  locale: Locale;
  learners: Record<string, LearnerSlice>;
}
