import { hashSeed } from "@/lib/rng";
import {
  SQUAD_IDS,
  addDays,
  weekDates,
  type Child,
  type GameId,
  type RoundResult,
  type SkillStat,
} from "./model";

/** Finishing a round always earns a star. 6 right earns 2. 9 right earns 3. */
export function starsForRound(correct: number, _total = 10): 1 | 2 | 3 {
  const c = Math.max(0, Math.floor(correct));
  if (c >= 9) return 3;
  if (c >= 6) return 2;
  return 1;
}

export function nextStreak(
  prev: { count: number; lastPlayed: string | null },
  today: string,
): { count: number; lastPlayed: string } {
  if (prev.lastPlayed === today) return { count: Math.max(1, prev.count), lastPlayed: today };
  if (prev.lastPlayed === addDays(today, -1) && prev.count > 0) {
    return { count: prev.count + 1, lastPlayed: today };
  }
  return { count: 1, lastPlayed: today };
}

/** Stars required before squad slot `index` is unlocked. The first three are free. */
export function starsNeeded(index: number): number {
  if (index < 3) return 0;
  const n = index - 2;
  return 2 * n * n + 3 * n + 1;
}

export function unlockedCount(stars: number): number {
  const safe = Math.max(0, Math.floor(stars));
  let n = 0;
  for (let i = 0; i < SQUAD_IDS.length; i++) {
    if (safe >= starsNeeded(i)) n += 1;
  }
  return n;
}

export function newestUnlock(prevStars: number, nextStars: number): string | null {
  const before = unlockedCount(prevStars);
  const after = unlockedCount(nextStars);
  if (after <= before) return null;
  return SQUAD_IDS[after - 1] ?? null;
}

export function giftCount(child: Pick<Child, "stars" | "opened">): number {
  return Math.max(0, unlockedCount(child.stars) - child.opened);
}

export function acknowledgeUnlocks(child: Child): Child {
  const opened = Math.max(child.opened, unlockedCount(child.stars));
  if (opened === child.opened) return child;
  return { ...child, opened };
}

export function gameOfDay(today: string): GameId {
  const games: GameId[] = ["times", "add", "time"];
  return games[hashSeed(today) % 3]!;
}

function bump(skills: Record<string, SkillStat>, key: string, ok: boolean) {
  if (!key) return;
  const prev = skills[key] ?? { ok: 0, miss: 0 };
  skills[key] = {
    ok: prev.ok + (ok ? 1 : 0),
    miss: prev.miss + (ok ? 0 : 1),
  };
}

const DAY_CAP_SECONDS = 4 * 60 * 60;

export function applyRound(child: Child, result: RoundResult, today: string): Child {
  const stars = starsForRound(result.correct, result.total);
  const streak = nextStreak({ count: child.streak, lastPlayed: child.lastPlayed }, today);
  const skills: Record<string, SkillStat> = { ...child.skills };
  for (const mark of result.answers) {
    bump(skills, mark.skill, mark.ok);
    for (const tag of mark.tags) bump(skills, tag, mark.ok);
    if (mark.factKey) bump(skills, `fact:${mark.factKey}`, mark.ok);
  }
  const secondsByDay = { ...child.secondsByDay };
  const add = Math.max(0, Math.min(180, Math.round(result.seconds)));
  secondsByDay[today] = Math.min(DAY_CAP_SECONDS, (secondsByDay[today] ?? 0) + add);
  return {
    ...child,
    stars: child.stars + stars,
    streak: streak.count,
    lastPlayed: streak.lastPlayed,
    skills,
    secondsByDay,
    bestStars: {
      ...child.bestStars,
      [result.game]: Math.max(child.bestStars[result.game] ?? 0, stars),
    },
    rounds: child.rounds + 1,
  };
}

export function secondsThisWeek(map: Record<string, number>, today: string): number {
  return weekDates(today).reduce((sum, day) => sum + (map[day] ?? 0), 0);
}

export function formatMinutes(seconds: number): string {
  const safe = Math.max(0, seconds);
  const minutes = Math.round((safe / 60) * 10) / 10;
  const text = Number.isInteger(minutes) ? String(minutes) : minutes.toFixed(1);
  return `${text}m`;
}

export function isMastered(stat: SkillStat | undefined): boolean {
  if (!stat) return false;
  const n = stat.ok + stat.miss;
  return n >= 5 && stat.ok / n >= 0.8;
}

export function skillPercent(stat: SkillStat | undefined): number | null {
  if (!stat) return null;
  const n = stat.ok + stat.miss;
  if (n <= 0) return null;
  return Math.round((stat.ok / n) * 100);
}

const BAR_KEYS = [
  "table:2",
  "table:5",
  "table:10",
  "table:3",
  "table:4",
  "table:6",
  "table:7",
  "table:8",
  "table:9",
  "add:within5",
  "add:within10",
  "add:within20",
  "add:within100",
  "time:hour",
  "time:half",
  "time:quarter",
  "time:fives",
] as const;

const CHIP_KEYS = [
  "table:2",
  "table:3",
  "table:4",
  "table:5",
  "table:6",
  "table:7",
  "table:8",
  "table:9",
  "table:10",
  "doubles",
  "make10",
  "oclock",
  "halfpast",
  "quarterpast",
  "quarterto",
  "add:within5",
  "add:within10",
  "add:within20",
  "add:within100",
  "time:hour",
  "time:half",
  "time:quarter",
  "time:fives",
] as const;

export function skillLabel(key: string): string {
  if (key.startsWith("table:")) return `×${key.slice(6)}`;
  switch (key) {
    case "add:within5":
      return "Add within 5";
    case "add:within10":
      return "Add within 10";
    case "add:within20":
      return "Add within 20";
    case "add:within100":
      return "Add within 100";
    case "time:hour":
      return "Time: hours";
    case "time:half":
      return "Time: half hour";
    case "time:quarter":
      return "Time: quarter hour";
    case "time:fives":
      return "Time: 5 minutes";
    case "doubles":
      return "Doubles";
    case "make10":
      return "Make 10";
    case "oclock":
      return "O'clock";
    case "halfpast":
      return "Half past";
    case "quarterpast":
      return "Quarter past";
    case "quarterto":
      return "Quarter to";
    default:
      return key;
  }
}

export function chipLabel(key: string): string {
  switch (key) {
    case "add:within5":
      return "Within 5";
    case "add:within10":
      return "Within 10";
    case "add:within20":
      return "Within 20";
    case "add:within100":
      return "Within 100";
    case "time:hour":
      return "Hours";
    case "time:half":
      return "Half hours";
    case "time:quarter":
      return "Quarter hours";
    case "time:fives":
      return "5 minutes";
    default:
      return skillLabel(key);
  }
}

export interface SkillBar {
  key: string;
  label: string;
  pct: number;
}

export function skillBars(skills: Record<string, SkillStat>): SkillBar[] {
  const rows: { key: string; pct: number; n: number }[] = [];
  for (const key of BAR_KEYS) {
    const stat = skills[key];
    const pct = skillPercent(stat);
    if (pct == null || !stat) continue;
    rows.push({ key, pct, n: stat.ok + stat.miss });
  }
  rows.sort((a, b) => b.n - a.n || a.key.localeCompare(b.key));
  return rows.slice(0, 5).map((row) => ({ key: row.key, label: skillLabel(row.key), pct: row.pct }));
}

export function masteredChips(skills: Record<string, SkillStat>): string[] {
  const chips: string[] = [];
  for (const key of CHIP_KEYS) {
    if (isMastered(skills[key])) chips.push(chipLabel(key));
  }
  return chips;
}

export function weakTimesFacts(skills: Record<string, SkillStat>): string[] {
  const rows: { key: string; score: number }[] = [];
  for (const [key, stat] of Object.entries(skills)) {
    if (!key.startsWith("fact:")) continue;
    const fact = key.slice(5);
    if (!/^\d+×\d+$/.test(fact)) continue;
    const n = stat.ok + stat.miss;
    if (n < 2 || stat.miss < 1) continue;
    if (stat.ok / n >= 0.8) continue;
    rows.push({ key: fact, score: stat.miss / n + stat.miss * 0.01 });
  }
  rows.sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
  return rows.map((row) => row.key);
}

export function practiceTip(
  name: string,
  skills: Record<string, SkillStat>,
): { text: string; factor: number | null } {
  const who = name.trim() || "Your child";
  const weak = weakTimesFacts(skills);
  if (weak.length >= 2) {
    const factor = Number(weak[0]!.split("×")[0]);
    return {
      text: `${who} keeps missing ${weak[0]} and ${weak[1]}. Try the free times tables worksheet tonight.`,
      factor: Number.isFinite(factor) ? factor : null,
    };
  }
  if (weak.length === 1) {
    const factor = Number(weak[0]!.split("×")[0]);
    return {
      text: `${who} keeps missing ${weak[0]}. Try the free times tables worksheet tonight.`,
      factor: Number.isFinite(factor) ? factor : null,
    };
  }
  return {
    text: `${who} can print a free worksheet and play it together tonight.`,
    factor: null,
  };
}
