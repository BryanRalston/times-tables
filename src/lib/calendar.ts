import type { QuarterId } from "./types";

export const YEAR_LABEL = "2026–27";
export const YEAR_START = "2026-08-17";
export const YEAR_END = "2027-06-11";

/** LCPS student holidays / non-instructional weekdays, 2026–27. */
export const HOLIDAYS = new Set<string>([
  "2026-09-04",
  "2026-09-07",
  "2026-09-21",
  "2026-10-12",
  "2026-10-29",
  "2026-10-30",
  "2026-11-02",
  "2026-11-03",
  "2026-11-09",
  "2026-11-25",
  "2026-11-26",
  "2026-11-27",
  "2026-12-21",
  "2026-12-22",
  "2026-12-23",
  "2026-12-24",
  "2026-12-25",
  "2026-12-28",
  "2026-12-29",
  "2026-12-30",
  "2026-12-31",
  "2027-01-01",
  "2027-01-18",
  "2027-01-25",
  "2027-02-05",
  "2027-02-15",
  "2027-03-08",
  "2027-03-09",
  "2027-03-22",
  "2027-03-23",
  "2027-03-24",
  "2027-03-25",
  "2027-03-26",
  "2027-04-12",
  "2027-05-31",
]);

export const QUARTER_ENDS: { id: QuarterId; end: string; days: number }[] = [
  { id: 1, end: "2026-10-28", days: 49 },
  { id: 2, end: "2027-01-22", days: 43 },
  { id: 3, end: "2027-04-09", days: 45 },
  { id: 4, end: "2027-06-11", days: 43 },
];

const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayIso(): string {
  return isoDate(new Date());
}

export function prevSchoolDay(iso: string): string | null {
  const idx = schoolDayIndex(iso);
  if (idx <= 0) return null;
  return SCHOOL_DAYS[idx - 1] ?? null;
}

export function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

function addDays(iso: string, n: number): string {
  const d = parseIso(iso);
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

export function weekdayName(iso: string): string {
  return WEEKDAY[parseIso(iso).getDay()] ?? "";
}

export function isWeekend(iso: string): boolean {
  const day = parseIso(iso).getDay();
  return day === 0 || day === 6;
}

export function isSchoolDay(iso: string): boolean {
  if (iso < YEAR_START || iso > YEAR_END) return false;
  if (isWeekend(iso)) return false;
  if (HOLIDAYS.has(iso)) return false;
  return true;
}

function buildSchoolDays(): string[] {
  const out: string[] = [];
  let cur = YEAR_START;
  while (cur <= YEAR_END) {
    if (isSchoolDay(cur)) out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

export const SCHOOL_DAYS = buildSchoolDays();

export function schoolDayIndex(iso: string): number {
  return SCHOOL_DAYS.indexOf(iso);
}

export function schoolDayNumber(iso: string): number {
  const i = schoolDayIndex(iso);
  return i >= 0 ? i + 1 : 0;
}

export function lastSchoolDayOnOrBefore(iso: string): string | null {
  if (iso < YEAR_START) return null;
  let cur = iso > YEAR_END ? YEAR_END : iso;
  for (let i = 0; i < 20; i++) {
    if (isSchoolDay(cur)) return cur;
    cur = addDays(cur, -1);
    if (cur < YEAR_START) return null;
  }
  return null;
}

export function nextSchoolDayAfter(iso: string): string | null {
  let cur = addDays(iso, 1);
  for (let i = 0; i < 20; i++) {
    if (isSchoolDay(cur)) return cur;
    cur = addDays(cur, 1);
    if (cur > YEAR_END) return null;
  }
  return null;
}

export function quarterForSchoolIndex(index: number): QuarterId {
  let acc = 0;
  for (const q of QUARTER_ENDS) {
    acc += q.days;
    if (index < acc) return q.id;
  }
  return 4;
}

export function isFriday(iso: string): boolean {
  return parseIso(iso).getDay() === 5;
}

export function monthCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const d of SCHOOL_DAYS) {
    const key = d.slice(0, 7);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function prettyDate(iso: string): string {
  const d = parseIso(iso);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
}
