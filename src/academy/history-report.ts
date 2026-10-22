import { attemptLabel, parentSkillLabel } from "./family-report";
import { isMonthKey, monthKey, type SkillHistory } from "./history";
import { getLocale, t } from "./i18n";
import type { Child, SkillStat } from "./model";
import { formatMinutes } from "./rewards";
import { barKeys, chipKeys } from "./games/registry";
import { standardForSkill, standardLine } from "./standards";

export interface HistorySkillRow {
  key: string;
  label: string;
  pct: number;
  attempts: number;
  rounds: number;
  seconds: number;
  /** Tries, rounds, and time in plain words. Accuracy is `pct`. */
  line: string;
  standardCode: string;
  standardName: string;
  standardLabel: string;
}

export interface HistoryMonth {
  key: string;
  title: string;
  seconds: number;
  rounds: number;
  summary: string;
  emptyNote: string;
  skills: HistorySkillRow[];
  moreNote: string;
}

export interface HistoryReport {
  months: HistoryMonth[];
  foldedNote: string;
}

const FACT_CAP = 8;

function monthTitle(key: string): string {
  if (!isMonthKey(key)) return t("Saved practice", "Práctica guardada");
  const year = Number(key.slice(0, 4));
  const month = Number(key.slice(5, 7)) - 1;
  const date = new Date(Date.UTC(year, month, 1));
  const locale = getLocale() === "es" ? "es" : getLocale() === "pt" ? "pt-BR" : getLocale() === "fr" ? "fr-FR" : getLocale() === "zh" ? "zh-CN" : "en";
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

function roundPhrase(rounds: number): string {
  if (rounds === 1) return t("1 round", "1 ronda", "1 rodada");
  return t(`${rounds} rounds`, `${rounds} rondas`, `${rounds} rodadas`, `${rounds} manches`, `${rounds}轮`);
}

function practiceLine(attempts: number, rounds: number, seconds: number): string {
  const parts: string[] = [];
  if (rounds > 0) parts.push(roundPhrase(rounds));
  else parts.push(attemptLabel(attempts));
  if (seconds > 0) parts.push(formatMinutes(seconds));
  return parts.join(" · ");
}

function monthSummary(seconds: number, rounds: number): string {
  const parts: string[] = [];
  if (seconds > 0) parts.push(formatMinutes(seconds));
  if (rounds > 0) parts.push(roundPhrase(rounds));
  return parts.join(" · ");
}

function showKey(key: string): boolean {
  if (!key || key.startsWith("story:")) return false;
  if (standardForSkill(key)) return true;
  if (barKeys().includes(key) || chipKeys().includes(key)) return true;
  return false;
}

function byNeed(a: HistorySkillRow, b: HistorySkillRow): number {
  const aOpen = a.attempts >= 2 && a.pct < 80 ? 0 : 1;
  const bOpen = b.attempts >= 2 && b.pct < 80 ? 0 : 1;
  return aOpen - bOpen || a.pct - b.pct || b.attempts - a.attempts || a.key.localeCompare(b.key);
}

function rowFrom(key: string, ok: number, miss: number, rounds: number, seconds: number): HistorySkillRow | null {
  const attempts = ok + miss;
  if (attempts <= 0 || !showKey(key)) return null;
  const named = standardForSkill(key);
  return {
    key,
    label: parentSkillLabel(key),
    pct: Math.round((ok / attempts) * 100),
    attempts,
    rounds,
    seconds,
    line: practiceLine(attempts, rounds, seconds),
    standardCode: named?.code ?? "",
    standardName: named?.name ?? "",
    standardLabel: standardLine(key),
  };
}

function rowsFromStats(
  stats: Record<string, { ok: number; miss: number; rounds?: number; seconds?: number }>,
): { skills: HistorySkillRow[]; moreNote: string } {
  const rest: HistorySkillRow[] = [];
  const facts: HistorySkillRow[] = [];
  for (const [key, stat] of Object.entries(stats)) {
    const row = rowFrom(key, stat.ok, stat.miss, stat.rounds ?? 0, stat.seconds ?? 0);
    if (!row) continue;
    if (key.startsWith("fact:")) facts.push(row);
    else rest.push(row);
  }
  rest.sort(byNeed);
  facts.sort(byNeed);
  const shown = facts.slice(0, FACT_CAP);
  const more = facts.length - shown.length;
  const moreNote =
    more > 0
      ? t("More facts are saved on this device.", "Hay más operaciones guardadas en este aparato.")
      : "";
  return { skills: [...rest, ...shown], moreNote };
}

function secondsByMonth(secondsByDay: Record<string, number>): Map<string, number> {
  const totals = new Map<string, number>();
  for (const [day, value] of Object.entries(secondsByDay)) {
    const month = monthKey(day);
    if (!month) continue;
    const seconds = Math.max(0, Math.floor(value));
    if (seconds <= 0) continue;
    totals.set(month, (totals.get(month) ?? 0) + seconds);
  }
  return totals;
}

function monthBlock(
  key: string,
  seconds: number,
  rounds: number,
  stats: Record<string, { ok: number; miss: number; rounds?: number; seconds?: number }>,
): HistoryMonth {
  const built = rowsFromStats(stats);
  return {
    key,
    title: monthTitle(key),
    seconds,
    rounds,
    summary: monthSummary(seconds, rounds),
    emptyNote:
      built.skills.length === 0 && seconds > 0
        ? t("This month has practice time.", "Este mes tiene tiempo de práctica.")
        : "",
    skills: built.skills,
    moreNote: built.moreNote,
  };
}

/** Month-by-month practice for the grown-ups report. Newest month first. */
export function skillHistoryReport(
  child: Pick<Child, "skills" | "secondsByDay" | "history" | "roundsByMonth" | "foldedMonth">,
): HistoryReport {
  const history: SkillHistory = child.history ?? {};
  const seconds = secondsByMonth(child.secondsByDay ?? {});
  const keys = new Set<string>([...seconds.keys()]);
  for (const key of Object.keys(history)) {
    if (isMonthKey(key)) keys.add(key);
  }
  const months: HistoryMonth[] = [...keys]
    .sort((a, b) => b.localeCompare(a))
    .map((key) => monthBlock(key, seconds.get(key) ?? 0, child.roundsByMonth?.[key] ?? 0, history[key] ?? {}));

  const anySkill = months.some((month) => month.skills.length > 0);
  if (!anySkill) {
    const saved: Record<string, SkillStat> = {};
    for (const [key, stat] of Object.entries(child.skills ?? {})) {
      if (stat.ok + stat.miss > 0) saved[key] = stat;
    }
    if (Object.keys(saved).length > 0) {
      months.push(monthBlock("saved", 0, 0, saved));
    }
  }

  const folded = child.foldedMonth && isMonthKey(child.foldedMonth) ? monthTitle(child.foldedMonth) : "";
  return {
    months,
    foldedNote: folded
      ? t(
          `Older practice is included in ${folded}. New play is kept month by month.`,
          `La práctica anterior está en ${folded}. Lo nuevo se guarda mes a mes.`, `A prática anterior está em ${folded}. O novo fica salvo mês a mês.`,
        `La pratique d'avant est dans ${folded}. Le nouveau jeu est gardé mois par mois.`, `更早的练习算在${folded}里。新的游玩按月分开保存。`)
      : "",
  };
}
