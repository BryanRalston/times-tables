import { activityById, UNITS, unitById } from "./curriculum";
import { START_PAD, clampPad } from "./radial-web";
import type { ActivitySave, DaySession, UnitDef } from "./types";

export type NodeStatus = "now" | "open" | "locked";

export function unitStatus(unit: UnitDef, suggestedId: string): NodeStatus {
  if (unit.id === suggestedId) return "now";
  const suggested = unitById(suggestedId);
  if (suggested && unit.number > suggested.number) return "locked";
  return "open";
}

/** Lessons and unit pages stay open. The Home map may still mark later nodes locked. */
export function isUnitOpen(_unit?: UnitDef, _suggestedId?: string): boolean {
  return true;
}

function unitNumberOfId(id: string): number {
  return unitById(id)?.number ?? 0;
}

/** Highest Grade 3 unit the kid has actually finished (walk or activity). */
export function farthestClearedUnitNumber(
  sessions: Record<string, DaySession>,
  activities: Record<string, ActivitySave>,
): number {
  let max = 0;
  for (const session of Object.values(sessions)) {
    if (!session.completed) continue;
    const n = unitNumberOfId(session.unitId);
    if (n > max) max = n;
  }
  for (const [activityId, save] of Object.entries(activities)) {
    if (!save.plays) continue;
    if (activityId === "welcome" || activityId.startsWith("daily:")) continue;
    const n = activityById(activityId)?.unit.number ?? 0;
    if (n > max) max = n;
  }
  return max;
}

/**
 * Lessons "now" pad: calendar/class unit, or the next pad after the last
 * finished unit — so returning from unit 1 lands on unit 2.
 */
export function pathNowUnitId(
  suggestedId: string,
  sessions: Record<string, DaySession>,
  activities: Record<string, ActivitySave>,
  total = UNITS.length,
): string {
  const suggestedN = Math.min(total, Math.max(1, unitNumberOfId(suggestedId) || 1));
  const cleared = farthestClearedUnitNumber(sessions, activities);
  const now = Math.min(total, Math.max(suggestedN, cleared > 0 ? cleared + 1 : suggestedN));
  return UNITS[now - 1]?.id ?? suggestedId;
}

/**
 * Unit for Home / Lessons Start. Class-is-on wins. Same-day replay keeps
 * today's completed walk so pathNow advancing cannot mint a new daily key.
 */
export function dailyStartUnitId(
  classUnitId: string | undefined,
  calendarId: string,
  sessions: Record<string, DaySession>,
  activities: Record<string, ActivitySave>,
  date: string,
): string {
  if (classUnitId) return classUnitId;
  const today = sessions[date];
  if (today?.unitId && !today.unitId.startsWith("g4-")) return today.unitId;
  return pathNowUnitId(calendarId, sessions, activities);
}

/** Pad the hopper should leave from when Lessons mounts. Never the calendar frontier. */
export function lessonsHopFrom(hopperAt: number, _nowNumber?: number, _cleared?: number): number {
  if (hopperAt > 0) return clampPad(hopperAt);
  return START_PAD;
}

/**
 * Pad to stand on. Replay / return never auto-hops to a frontier.
 * A hop happens only when the kid picks one adjacent space.
 */
export function lessonsHopTo(
  hopperAt: number,
  nowNumber?: number,
  _nowSeen?: number,
  cleared?: number,
): number {
  return lessonsHopFrom(hopperAt, nowNumber, cleared);
}
