import { weekDates, type Child } from "./model";
import { formatMinutes, masteredChips, secondsThisWeek } from "./rewards";

export interface WeeklyCard {
  name: string;
  minutesLabel: string;
  days: number;
  streak: number;
  mastered: number;
  line: string;
}

export function weeklyCard(child: Pick<Child, "name" | "secondsByDay" | "streak" | "skills">, today: string): WeeklyCard {
  const name = child.name.trim() || "Your child";
  const days = weekDates(today).filter((day) => (child.secondsByDay[day] ?? 0) > 0).length;
  const minutesLabel = formatMinutes(secondsThisWeek(child.secondsByDay, today));
  const mastered = masteredChips(child.skills).length;
  const dayWord = days === 1 ? "day" : "days";
  return {
    name,
    minutesLabel,
    days,
    streak: child.streak,
    mastered,
    line: `${name} practiced ${minutesLabel} on ${days} ${dayWord} this week.`,
  };
}
