import { isSchoolDay, lastSchoolDayOnOrBefore, prevSchoolDay } from "./calendar";
import type { DaySession } from "./types";

export function schoolStreak(sessions: Record<string, DaySession>, today: string): number {
  const todaySchool = lastSchoolDayOnOrBefore(today);
  if (!todaySchool) return 0;
  let cur: string | null = todaySchool;
  if (isSchoolDay(today) && !sessions[today]?.completed) {
    cur = prevSchoolDay(todaySchool);
  }
  let n = 0;
  while (cur) {
    if (sessions[cur]?.completed) {
      n += 1;
      cur = prevSchoolDay(cur);
    } else {
      break;
    }
  }
  return n;
}
