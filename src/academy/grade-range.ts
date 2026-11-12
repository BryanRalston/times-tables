import { GRADE_BANDS } from "./grade-map";
import type { Grade } from "./model";

/**
 * Range labels come from the grade map, not from where a game is playable.
 * A level belongs to the first grade whose band plays it (or gives it as a gentle
 * intro). A later grade that keeps the level is reviewing it, so it adds nothing.
 */
export const GRADES_IN_ORDER: readonly Grade[] = ["PK", "K", "1", "2", "3", "4", "5"];

/** The grade that first teaches this level, or undefined when no grade band uses it. */
export function levelHomeGrade(gameId: string, levelId: string): Grade | undefined {
  const bands = GRADE_BANDS[gameId];
  if (!bands) return undefined;
  for (const grade of GRADES_IN_ORDER) {
    const band = bands[grade];
    if (band && band.offer !== "later" && band.levels.includes(levelId)) return grade;
  }
  return undefined;
}

/** Grades with content of their own, for the whole game or for the given levels. */
export function contentGrades(gameId: string, levels?: readonly string[]): Grade[] {
  const bands = GRADE_BANDS[gameId];
  if (!bands) return [];
  const ids = levels ?? [...new Set(GRADES_IN_ORDER.flatMap((grade) => bands[grade]?.levels ?? []))];
  const homes = new Set(ids.map((id) => levelHomeGrade(gameId, id)).filter((grade): grade is Grade => Boolean(grade)));
  return GRADES_IN_ORDER.filter((grade) => homes.has(grade));
}

/** Every grade from the lowest to the highest content grade. */
export function gradeSpan(grades: readonly Grade[]): Grade[] {
  if (grades.length === 0) return [];
  const lo = GRADES_IN_ORDER.indexOf(grades[0]!);
  const hi = GRADES_IN_ORDER.indexOf(grades[grades.length - 1]!);
  return GRADES_IN_ORDER.slice(lo, hi + 1);
}

function gradeName(grade: Grade): string {
  return grade === "PK" ? "Pre-K" : grade;
}

/** Home card label: "Pre-K–4", "K–5", "Grades 2–5", "Grade 3". */
export function gameRangeLabel(grades: readonly Grade[]): string {
  const span = gradeSpan(grades);
  const lo = span[0];
  const hi = span[span.length - 1];
  if (!lo || !hi) return "";
  if (lo === hi) return lo === "PK" ? "Pre-K" : lo === "K" ? "Kindergarten" : `Grade ${lo}`;
  if (lo === "PK" || lo === "K") return `${gradeName(lo)}–${hi}`;
  return `Grades ${lo}–${hi}`;
}

/** Worksheet title label, the part in parentheses: "(Grade 2)", "(K–1)", "(Pre-K and K)". */
export function sheetRangeLabel(grades: readonly Grade[]): string {
  const span = gradeSpan(grades);
  if (span.length === 2 && span[0] === "PK" && span[1] === "K") return "Pre-K and K";
  return gameRangeLabel(span);
}
