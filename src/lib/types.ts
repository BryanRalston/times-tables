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
  | "fluency";

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
  mode: "place" | "value" | "expanded";
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
  visual?: "shape" | "none";
  shape?: string;
  rotation?: number;
  isPolygon?: boolean;
  sides?: number;
}

export interface FractionData {
  num: number;
  den: number;
  num2?: number;
  den2?: number;
  mode: "name" | "unit" | "mixed" | "compare" | "benchmark" | "equiv" | "leftover";
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
  target?: number;
  mode: "count" | "make" | "compare" | "change";
  pay?: number;
  cost?: number;
  otherCents?: number;
}

export type Coin = "penny" | "nickel" | "dime" | "quarter" | "dollar";

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
  rows: { label: string; value: number }[];
  ask: "greatest" | "least" | "value" | "more" | "total";
  focus?: string;
  focusB?: string;
}

export interface PatternData {
  seq: (number | null)[];
  step: number;
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
    | FluencyData;
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

export interface SaveState {
  version: number;
  name: string;
  stars: number;
  seenWelcome: boolean;
  classUnitId: string;
  skipWeekend: boolean;
  activities: Record<string, ActivitySave>;
  badges: string[];
  shaky: Record<string, number>;
  sessions: Record<string, DaySession>;
}
