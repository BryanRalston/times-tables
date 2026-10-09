export type Grade = "K" | "1" | "2" | "3";

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
  bestStars: Record<string, number>;
  rounds: number;
  /** Level id per game id. Missing games are filled from the registry on load. */
  levels: Record<string, string>;
}

export interface AnswerMark {
  skill: string;
  tags: string[];
  factKey?: string;
  ok: boolean;
}

export interface RoundResult {
  game: string;
  correct: number;
  total: number;
  seconds: number;
  answers: AnswerMark[];
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
