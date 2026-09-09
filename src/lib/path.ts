import { activityById, UNITS, unitById } from "./curriculum";
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

/** Pad the hopper should leave from when Lessons mounts. */
export function lessonsHopFrom(hopperAt: number, nowNumber: number, cleared: number): number {
  const now = Math.max(1, Math.round(nowNumber));
  if (hopperAt > 0) return Math.max(1, Math.round(hopperAt));
  if (cleared > 0) return Math.min(now, Math.max(1, Math.round(cleared)));
  return now;
}

/**
 * Pad to stand on / hop to.
 * Auto-travel to the frontier only when that now pad is newly unlocked
 * (now > nowSeen). Replay returns stay on the pad the kid just left.
 */
export function lessonsHopTo(
  hopperAt: number,
  nowNumber: number,
  nowSeen: number,
  cleared: number,
): number {
  const now = Math.max(1, Math.round(nowNumber));
  const from = lessonsHopFrom(hopperAt, now, cleared);
  if (now > Math.max(0, Math.round(nowSeen))) return now;
  return from;
}
