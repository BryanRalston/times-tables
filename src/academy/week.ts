import { t, weekdayLetter, weekdayName } from "./i18n";
import { weekDates } from "./model";

export interface StickerDay {
  iso: string;
  name: string;
  letter: string;
  played: boolean;
  today: boolean;
}

/** Seven days. A played day earns a sticker. An empty day stays empty. */
export function weekStickers(secondsByDay: Record<string, number>, today: string): StickerDay[] {
  return weekDates(today).map((iso, index) => ({
    iso,
    name: weekdayName(index),
    letter: weekdayLetter(index),
    played: (secondsByDay[iso] ?? 0) > 0,
    today: iso === today,
  }));
}

/** How many days in this Monday–Sunday week have any play. A quiet day is not a miss. */
export function daysPlayedThisWeek(secondsByDay: Record<string, number>, today: string): number {
  return weekStickers(secondsByDay, today).filter((day) => day.played).length;
}

/**
 * Kid-facing caption for the weekly sticker card. Zero is an empty sheet,
 * not a broken run. The count resets when the week does.
 */
export function daysPlayedCaption(played: number): string {
  const n = Math.max(0, Math.floor(played));
  if (n <= 0) return t("Days played this week", "Días jugados esta semana");
  if (n === 1) return t("1 day played this week", "1 día jugado esta semana");
  return t(`${n} days played this week`, `${n} días jugados esta semana`, `${n} dias jogados nesta semana`, `${n} jours joués cette semaine`);
}
