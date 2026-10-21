import type { AnswerMark, SkillMonth, SkillStat } from "./model";

/** `yyyy-mm` → skill key → practice that month. */
export type SkillHistory = Record<string, Record<string, SkillMonth>>;

const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_KEY = /^(\d{4})-(\d{2})$/;

export function monthKey(iso: string): string | null {
  const match = DATE_KEY.exec(iso);
  if (!match) return null;
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${match[1]}-${match[2]}`;
}

export function isMonthKey(value: string): boolean {
  if (!MONTH_KEY.test(value)) return false;
  const month = Number(value.slice(5, 7));
  return month >= 1 && month <= 12;
}

function clampCount(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(100000, Math.floor(n));
}

function skillKeys(mark: AnswerMark): string[] {
  const keys = [mark.skill, ...mark.tags];
  if (mark.factKey) keys.push(`fact:${mark.factKey}`);
  const out: string[] = [];
  for (const key of keys) {
    if (!key || out.includes(key)) continue;
    out.push(key);
  }
  return out;
}

/**
 * Add one round to the month of `today`. Seconds are split across the skills
 * in the round so a month's skill times add up to the round.
 */
export function recordRoundHistory(
  history: SkillHistory,
  today: string,
  marks: readonly AnswerMark[],
  seconds: number,
): SkillHistory {
  const month = monthKey(today);
  if (!month) return history;
  const bumps = new Map<string, { ok: number; miss: number }>();
  const order: string[] = [];
  for (const mark of marks) {
    const scoredOk = mark.unscored === true ? false : mark.ok;
    for (const key of skillKeys(mark)) {
      if (key.length > 40) continue;
      const row = bumps.get(key) ?? { ok: 0, miss: 0 };
      if (!bumps.has(key)) order.push(key);
      if (scoredOk) row.ok += 1;
      else row.miss += 1;
      bumps.set(key, row);
    }
  }
  if (order.length === 0) return history;
  const add = Math.max(0, Math.min(180, Math.round(seconds)));
  const base = Math.floor(add / order.length);
  const extra = add - base * order.length;
  const bucket = { ...(history[month] ?? {}) };
  order.forEach((key, index) => {
    const prev = bucket[key] ?? { ok: 0, miss: 0, rounds: 0, seconds: 0 };
    const bump = bumps.get(key) ?? { ok: 0, miss: 0 };
    bucket[key] = {
      ok: prev.ok + bump.ok,
      miss: prev.miss + bump.miss,
      rounds: prev.rounds + 1,
      seconds: prev.seconds + base + (index < extra ? 1 : 0),
    };
  });
  return { ...history, [month]: bucket };
}

/** Count the round in its month. Skill rows keep their own round counts. */
export function noteMonthRound(roundsByMonth: Record<string, number>, today: string): Record<string, number> {
  const month = monthKey(today);
  if (!month) return roundsByMonth;
  return { ...roundsByMonth, [month]: Math.min(100000, (roundsByMonth[month] ?? 0) + 1) };
}

export interface FoldedHistory {
  history: SkillHistory;
  roundsByMonth: Record<string, number>;
  foldedMonth: string;
}

function monthsTouched(secondsByDay: Record<string, unknown>, lastPlayed: string | null): string[] {
  const found = new Set<string>();
  for (const [day, value] of Object.entries(secondsByDay)) {
    if (clampCount(value) <= 0) continue;
    const month = monthKey(day);
    if (month) found.add(month);
  }
  if (lastPlayed) {
    const month = monthKey(lastPlayed);
    if (month) found.add(month);
  }
  return [...found].sort();
}

/**
 * Older saves stored one running total per skill. Copy those totals into the
 * latest month that already has practice, and keep the round count there.
 * A single month needs no "folded" note. Several months get one, because this
 * device cannot split the old totals apart.
 */
export function foldSkillHistory(input: {
  skills: Record<string, unknown>;
  secondsByDay: Record<string, unknown>;
  lastPlayed: string | null;
  rounds: number;
}): FoldedHistory {
  const empty: FoldedHistory = { history: {}, roundsByMonth: {}, foldedMonth: "" };
  const months = monthsTouched(input.secondsByDay, input.lastPlayed);
  const anchor = months[months.length - 1] ?? null;
  const bucket: Record<string, SkillMonth> = {};
  for (const [key, value] of Object.entries(input.skills)) {
    if (!key || key.length > 40 || !value || typeof value !== "object") continue;
    const row = value as { ok?: unknown; miss?: unknown };
    const ok = clampCount(row.ok);
    const miss = clampCount(row.miss);
    if (ok + miss <= 0) continue;
    bucket[key] = { ok, miss, rounds: 0, seconds: 0 };
  }
  const rounds = clampCount(input.rounds);
  if (!anchor) return empty;
  const history = Object.keys(bucket).length > 0 ? { [anchor]: bucket } : {};
  const roundsByMonth = rounds > 0 ? { [anchor]: rounds } : {};
  const foldedMonth = Object.keys(bucket).length > 0 && months.length > 1 ? anchor : "";
  return { history, roundsByMonth, foldedMonth };
}

export function skillTotals(history: SkillHistory): Record<string, SkillStat> {
  const out: Record<string, SkillStat> = {};
  for (const bucket of Object.values(history)) {
    for (const [key, row] of Object.entries(bucket)) {
      const prev = out[key] ?? { ok: 0, miss: 0 };
      out[key] = { ok: prev.ok + row.ok, miss: prev.miss + row.miss };
    }
  }
  return out;
}
