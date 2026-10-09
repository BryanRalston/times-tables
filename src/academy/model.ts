export type Grade = "K" | "1" | "2" | "3";
export type GameId = "times" | "add" | "time";
export type TimesLevel = "count" | "twos" | "mix" | "toTen";
export type AddLevel = "within5" | "within10" | "within20" | "within100";
export type TimeLevel = "hour" | "half" | "quarter" | "fives";

export interface Levels {
  times: TimesLevel;
  add: AddLevel;
  time: TimeLevel;
}

export interface SkillStat {
  ok: number;
  miss: number;
}

export interface Child {
  id: string;
  name: string;
  grade: Grade;
  avatarId: string;
  stars: number;
  streak: number;
  lastPlayed: string | null;
  /** How many squad slots the child has already met. Starters count as met. */
  opened: number;
  skills: Record<string, SkillStat>;
  secondsByDay: Record<string, number>;
  bestStars: Record<GameId, number>;
  rounds: number;
  levels: Levels;
}

export interface AnswerMark {
  skill: string;
  tags: string[];
  factKey?: string;
  ok: boolean;
}

export interface RoundResult {
  game: GameId;
  correct: number;
  total: number;
  seconds: number;
  answers: AnswerMark[];
}

export interface Save {
  version: 1;
  activeId: string;
  sound: boolean;
  children: Child[];
}

export const SQUAD_IDS = [
  "peach",
  "frog",
  "bunny",
  "melon",
  "grape",
  "bear",
  "cat",
  "panda",
  "owl",
  "chick",
  "duck",
  "pig",
  "penguin",
  "whale",
  "avocado",
  "donut",
  "corn",
  "lemon",
  "strawberry",
  "cookie",
  "boba",
  "fox",
  "otter",
  "capybara",
] as const;

export type SquadId = (typeof SQUAD_IDS)[number];

export const MAX_CHILDREN = 4;
export const ROUND_SECONDS = 120;
export const ROUND_LENGTH = 10;

const TIMES_LEVELS: readonly TimesLevel[] = ["count", "twos", "mix", "toTen"];
const ADD_LEVELS: readonly AddLevel[] = ["within5", "within10", "within20", "within100"];
const TIME_LEVELS: readonly TimeLevel[] = ["hour", "half", "quarter", "fives"];
const GRADES: readonly Grade[] = ["K", "1", "2", "3"];
const GAMES: readonly GameId[] = ["times", "add", "time"];

export function isGrade(v: unknown): v is Grade {
  return typeof v === "string" && (GRADES as readonly string[]).includes(v);
}

export function isGameId(v: unknown): v is GameId {
  return typeof v === "string" && (GAMES as readonly string[]).includes(v);
}

export function isTimesLevel(v: unknown): v is TimesLevel {
  return typeof v === "string" && (TIMES_LEVELS as readonly string[]).includes(v);
}

export function isAddLevel(v: unknown): v is AddLevel {
  return typeof v === "string" && (ADD_LEVELS as readonly string[]).includes(v);
}

export function isTimeLevel(v: unknown): v is TimeLevel {
  return typeof v === "string" && (TIME_LEVELS as readonly string[]).includes(v);
}

export function isSquadId(v: unknown): v is SquadId {
  return typeof v === "string" && (SQUAD_IDS as readonly string[]).includes(v);
}

export function defaultLevels(grade: Grade): Levels {
  switch (grade) {
    case "K":
      return { times: "count", add: "within5", time: "hour" };
    case "1":
      return { times: "twos", add: "within10", time: "half" };
    case "2":
      return { times: "mix", add: "within20", time: "quarter" };
    case "3":
      return { times: "toTen", add: "within100", time: "fives" };
    default: {
      const neverGrade: never = grade;
      return neverGrade;
    }
  }
}

export interface LevelOption {
  id: string;
  label: string;
  num: number;
}

export function levelsFor(game: GameId): LevelOption[] {
  switch (game) {
    case "times":
      return [
        { id: "count", label: "2s, 5s, 10s · small", num: 1 },
        { id: "twos", label: "2s, 5s, 10s", num: 2 },
        { id: "mix", label: "Mix through 5s", num: 3 },
        { id: "toTen", label: "Up to 10s", num: 4 },
      ];
    case "add":
      return [
        { id: "within5", label: "Within 5", num: 1 },
        { id: "within10", label: "Within 10", num: 2 },
        { id: "within20", label: "Within 20", num: 3 },
        { id: "within100", label: "Within 100", num: 4 },
      ];
    case "time":
      return [
        { id: "hour", label: "Hours", num: 1 },
        { id: "half", label: "Half hours", num: 2 },
        { id: "quarter", label: "Quarter hours", num: 3 },
        { id: "fives", label: "5 minutes", num: 4 },
      ];
    default: {
      const neverGame: never = game;
      return neverGame;
    }
  }
}

export function pillLabel(game: GameId, level: string): string {
  const meta = levelsFor(game).find((row) => row.id === level);
  const num = meta?.num ?? 1;
  switch (game) {
    case "times":
      return `Times Tables · Level ${num}`;
    case "add":
      return `Add & Subtract · Level ${num}`;
    case "time":
      return `Telling Time · ${meta?.label ?? "Hours"}`;
    default: {
      const neverGame: never = game;
      return neverGame;
    }
  }
}

export function mascotFor(game: GameId): SquadId {
  switch (game) {
    case "times":
      return "peach";
    case "add":
      return "frog";
    case "time":
      return "melon";
    default: {
      const neverGame: never = game;
      return neverGame;
    }
  }
}

export function gameTitle(game: GameId): string {
  switch (game) {
    case "times":
      return "Times Tables";
    case "add":
      return "Add & Subtract";
    case "time":
      return "Telling Time";
    default: {
      const neverGame: never = game;
      return neverGame;
    }
  }
}

export function gradeLabel(grade: Grade): string {
  switch (grade) {
    case "K":
      return "K";
    case "1":
      return "Gr 1";
    case "2":
      return "Gr 2";
    case "3":
      return "Gr 3";
    default: {
      const neverGrade: never = grade;
      return neverGrade;
    }
  }
}

export function cleanName(raw: string): string {
  return raw
    .replace(/[^\p{L}\p{N} '\-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12);
}

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayIso(d = new Date()): string {
  return isoDate(d);
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y || 2026, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + days);
  return isoDate(dt);
}

/** Monday = 0 … Sunday = 6. */
export function mondayIndex(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y || 2026, (m || 1) - 1, d || 1);
  return (dt.getDay() + 6) % 7;
}

export function weekDates(today: string): string[] {
  const start = addDays(today, -mondayIndex(today));
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export const WEEKDAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"] as const;
export const WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
