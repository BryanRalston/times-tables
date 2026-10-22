import { gameAccuracy, practiceTip, storyBrief, stuckLabels, winLabels, type GameAccuracy, type StoryBrief } from "./family-report";
import { t, weekdayLetter, weekdayName } from "./i18n";
import { weekDates, type Child } from "./model";
import { formatMinutes, masteredChips, secondsThisWeek } from "./rewards";

export interface DayLine {
  iso: string;
  name: string;
  letter: string;
  seconds: number;
  label: string;
  played: boolean;
}

export interface WeeklyCard {
  name: string;
  minutesLabel: string;
  days: number;
  streak: number;
  mastered: number;
  line: string;
  headline: string;
  deviceNote: string;
  streakNote: string;
  dayLines: DayLine[];
  wins: string[];
  stuck: string[];
  winsNote: string;
  stuckNote: string;
  suggestion: string;
  sheetHref: string | null;
  sheetTitle: string | null;
}

export function weeklyCard(child: Pick<Child, "name" | "secondsByDay" | "streak" | "skills">, today: string): WeeklyCard {
  const named = child.name.trim();
  const name = named || t("Your child", "Tu hijo o hija");
  const dayLines = weekDates(today).map((iso, i) => {
    const seconds = child.secondsByDay[iso] ?? 0;
    return {
      iso,
      name: weekdayName(i),
      letter: weekdayLetter(i),
      seconds,
      label: seconds > 0 ? formatMinutes(seconds) : "–",
      played: seconds > 0,
    };
  });
  const days = dayLines.filter((day) => day.played).length;
  const minutesLabel = formatMinutes(secondsThisWeek(child.secondsByDay, today));
  const mastered = masteredChips(child.skills).length;
  const dayWord = days === 1 ? "day" : "days";
  const dayEs = days === 1 ? "día" : "días";
  const dayPt = days === 1 ? "dia" : "dias";
  const tip = practiceTip(child.name, child.skills);
  const wins = winLabels(child.skills);
  const stuck = stuckLabels(child.skills);
  return {
    name,
    minutesLabel,
    days,
    streak: child.streak,
    mastered,
    line:
      days === 0
        ? t(
            `${name} has not played yet this week. One short game is a good start.`,
            `${name} todavía no juega esta semana. Un juego cortito es un buen comienzo.`, `${name} ainda não joga nesta semana. Um jogo curtinho é um bom começo.`,
          )
        : t(
            `${name} practiced ${minutesLabel} on ${days} ${dayWord} this week.`,
            `${name} practicó ${minutesLabel} en ${days} ${dayEs} esta semana.`, `${name} praticou ${minutesLabel} em ${days} ${dayPt} nesta semana.`,
          ),
    headline: named
      ? t(`What ${named} learned`, `Qué aprendió ${named}`, `O que ${named} aprendeu`)
      : t("What your child learned", "Qué aprendió tu hijo o hija"),
    deviceNote: t("Saved on this device only.", "Guardado solo en este aparato."),
    streakNote:
      child.streak >= 2
        ? t(`${name} played ${child.streak} days in a row.`, `${name} jugó ${child.streak} días seguidos.`, `${name} jogou ${child.streak} dias seguidos.`)
        : "",
    dayLines,
    wins,
    stuck,
    winsNote: t("Wins show up after a little practice.", "Los logros aparecen después de un poco de práctica."),
    stuckNote: t("Nothing needs extra practice right now.", "Ahora no hace falta práctica extra."),
    suggestion: tip.text,
    sheetHref: tip.sheetHref,
    sheetTitle: tip.sheetTitle,
  };
}

export interface FamilyBrief {
  card: WeeklyCard;
  games: GameAccuracy[];
  stories: StoryBrief;
}

/** What a grown-up sees after school: the week, every game played, and one calm next step. */
export function familyBrief(child: Pick<Child, "name" | "secondsByDay" | "streak" | "skills">, today: string): FamilyBrief {
  return {
    card: weeklyCard(child, today),
    games: gameAccuracy(child.skills),
    stories: storyBrief(child.skills),
  };
}
