export type Grade = "K" | "1" | "2" | "3";

/**
 * Grade the hello screen starts on. The middle of K–3 is still gentle,
 * and the first round drops one level so a new kid wins quickly.
 */
export const DEFAULT_START_GRADE: Grade = "1";

export interface SkillStat {
  ok: number;
  miss: number;
}

/** Per-word memory for sight words and spelling. A miss resets `box` so the word is due again. */
export interface WordCard {
  box: number;
  ok: number;
  miss: number;
  streak: number;
}

/** Where the child is standing on the island. `bosses` are beaten area ids. */
export interface Journey {
  areaId: string;
  stop: number;
  bosses: string[];
}

export type DailyGiftState = "none" | "closed" | "open";

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
  bestStars: Record<string, number>;
  rounds: number;
  /** Level id per game id. Missing games are filled from the registry on load. */
  levels: Record<string, string>;
  /** Play coins. Spent on outfits. Not real money. */
  coins: number;
  cosmetics: string[];
  equipped: string;
  /** Squishees granted by a daily gift, in addition to star unlocks. */
  gifted: string[];
  /** Trophy ids from befriended bosses. */
  trophies: string[];
  /** Boss looks the child can wear. Separate from shop outfits. */
  bossLooks: string[];
  /** Equipped boss look, or empty. */
  equippedLook: string;
  /** Island ids whose Gold Crown rematch was won. */
  goldCrowns: string[];
  journey: Journey;
  dailyDate: string | null;
  dailyRounds: number;
  dailyGift: DailyGiftState;
  /** Island hosts befriended by beating their boss. */
  friends: string[];
  /** Squishees that hatched from the island egg. */
  hatched: string[];
  /** Mystery egg on the map. Ready after the daily goal. */
  egg: DailyGiftState;
  /** Practice rounds with each buddy. Friendship grows from playing. */
  bonds: Record<string, number>;
  /** Sight-word and spelling cards, keyed `sw:` or `sp:`. */
  words: Record<string, WordCard>;
  /** A grown-up opened levels past this grade. Adaptive play stays in band until this is on. */
  challengeAhead: boolean;
}

export interface AnswerMark {
  skill: string;
  tags: string[];
  factKey?: string;
  ok: boolean;
  /** The child missed once and saw a worked example before this mark. */
  taught?: boolean;
  /** The try was finished with a letter hint. Counted correct, and the word stays due. */
  hint?: boolean;
  /**
   * A learning miss. It brings the skill back later, and it does not fail the card.
   * Stars use the scored `correct` count, not these marks.
   */
  unscored?: boolean;
}

/** Kindergarten and grade 1 hear each prompt. Older grades tap the speaker. */
export function autoSpeakGrade(grade: Grade): boolean {
  return grade === "K" || grade === "1";
}

/** A countdown is opt-in, and only from grade 2 up. */
export function speedRoundGrade(grade: Grade): boolean {
  return grade === "2" || grade === "3";
}

export interface RoundResult {
  game: string;
  correct: number;
  total: number;
  seconds: number;
  answers: AnswerMark[];
  /** Longest run of correct answers in the round. */
  bestCombo?: number;
  /** True when this round was the area boss. */
  boss?: boolean;
  /** Gold Crown rematch. Harder questions, still inside the grade band. */
  crown?: boolean;
}

export interface Save {
  /** Schema version. Bump it in storage.ts and add a migration. */
  version: number;
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
/** Practice stops before the boss. The last index is the boss. */
export const STOPS_PER_AREA = 4;
export const BOSS_LENGTH = 5;
export const DAILY_GOAL = 3;
/** Share of a boss round that opens the next island. */
export const BOSS_PASS = 0.6;

const GRADES: readonly Grade[] = ["K", "1", "2", "3"];

export function isGrade(v: unknown): v is Grade {
  return typeof v === "string" && (GRADES as readonly string[]).includes(v);
}

export function isSquadId(v: unknown): v is SquadId {
  return typeof v === "string" && (SQUAD_IDS as readonly string[]).includes(v);
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
