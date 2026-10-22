import { skillHeat, skillKeyForLevel, openingIndex, type SkillHeat } from "./adapt";
import { GAME_CARDS as GAMES } from "./games/catalog";
import { playWindow } from "./grade-map";
import { gradeText, t } from "./i18n";
import type { Grade, SkillStat } from "./model";

/** A clock idea and the level that practices it. */
const IDEA_LEVEL: Record<string, { game: string; level: string }> = {
  oclock: { game: "time", level: "hour" },
  halfpast: { game: "time", level: "half" },
  quarterpast: { game: "time", level: "quarter" },
  quarterto: { game: "time", level: "quarter" },
  fives: { game: "time", level: "fives" },
};

export type PlacementReason = "start" | "weak" | "stretch" | "review";

export interface Placement {
  game: string;
  level: string;
  reason: PlacementReason;
}

interface SkillRow {
  game: string;
  level: string;
  heat: SkillHeat;
  acc: number;
  miss: number;
  n: number;
}

/** The line on the one Play button. The title is already in the child's language. */
export function todayPlayLine(title: string, grade: Grade): string {
  return t(`Today: ${title} · ${gradeText(grade)}`, `Hoy: ${title} · ${gradeText(grade)}`, `Hoje: ${title} · ${gradeText(grade)}`, `Aujourd'hui : ${title} · ${gradeText(grade)}`, `今天：${title} · ${gradeText(grade)}`);
}

function dueStats(stat: SkillStat | undefined): { acc: number; miss: number; n: number } | null {
  if (!stat) return null;
  const n = stat.ok + stat.miss;
  if (n < 2 || stat.miss < 1) return null;
  if (stat.ok / n >= 0.8) return null;
  return { acc: stat.ok / n, miss: stat.miss, n };
}

/**
 * One tap, no quiz. A new child starts a step easier than the grade default.
 * A skill they are still missing comes back. A mastered skill steps up.
 */
function windowFor(gameId: string, levelIds: readonly string[], grade: Grade, challengeAhead: boolean) {
  return playWindow(levelIds, gameId, grade, challengeAhead);
}

export function nextPlacement(child: {
  grade: Grade;
  rounds: number;
  skills: Record<string, SkillStat>;
  levels: Record<string, string>;
  challengeAhead?: boolean;
}): Placement {
  const challenge = child.challengeAhead === true;
  const rows: SkillRow[] = [];
  for (const game of GAMES) {
    const allowed = windowFor(game.id, game.levels.map((level) => level.id), child.grade, challenge);
    if (allowed.ids.length === 0) continue;
    for (const level of game.levels) {
      if (!allowed.ids.includes(level.id)) continue;
      const stat = child.skills[skillKeyForLevel(game.id, level.id)];
      const heat = skillHeat(stat);
      if (heat === "new") continue;
      const n = (stat?.ok ?? 0) + (stat?.miss ?? 0);
      rows.push({
        game: game.id,
        level: level.id,
        heat,
        acc: n > 0 ? (stat?.ok ?? 0) / n : 0,
        miss: stat?.miss ?? 0,
        n,
      });
    }
  }

  for (const [tag, home] of Object.entries(IDEA_LEVEL)) {
    const due = dueStats(child.skills[tag]);
    if (!due) continue;
    const game = GAMES.find((row) => row.id === home.game);
    if (!game) continue;
    const allowed = windowFor(game.id, game.levels.map((level) => level.id), child.grade, challenge);
    if (!allowed.ids.includes(home.level)) continue;
    const existing = rows.find((row) => row.game === home.game && row.level === home.level);
    if (!existing) {
      rows.push({ game: home.game, level: home.level, heat: "learning", acc: due.acc, miss: due.miss, n: due.n });
      continue;
    }
    if (existing.heat !== "learning" || due.acc < existing.acc) {
      existing.heat = "learning";
      existing.acc = Math.min(existing.acc, due.acc);
      existing.miss = Math.max(existing.miss, due.miss);
      existing.n = Math.max(existing.n, due.n);
    }
  }

  const weak = rows
    .filter((row) => row.heat === "learning" && row.n >= 2 && row.acc < 0.8)
    .sort((a, b) => a.acc - b.acc || b.miss - a.miss || b.n - a.n);
  const weakest = weak[0];
  if (weakest) return { game: weakest.game, level: weakest.level, reason: "weak" };

  for (const game of GAMES) {
    const ids = game.levels.map((level) => level.id);
    const allowed = windowFor(game.id, ids, child.grade, challenge);
    if (allowed.ids.length === 0) continue;
    const saved = child.levels[game.id] ?? allowed.start;
    const currentId = allowed.ids.includes(saved) ? saved : allowed.start;
    const index = Math.max(0, game.levels.findIndex((level) => level.id === currentId));
    const current = game.levels[index];
    if (!current) continue;
    const heat = skillHeat(child.skills[skillKeyForLevel(game.id, current.id)]);
    const next = game.levels[index + 1];
    if (heat === "mastered" && next && allowed.ids.includes(next.id)) {
      return { game: game.id, level: next.id, reason: "stretch" };
    }
  }

  const starters = GAMES.filter((game) => windowFor(game.id, game.levels.map((level) => level.id), child.grade, challenge).ids.length > 0);
  const game = starters.find((row) => row.id === "add") ?? starters.find((row) => row.id === "count") ?? starters[0];
  if (!game || rows.length === 0) {
    const startGame = game ?? GAMES[0];
    if (!startGame) return { game: "add", level: "within5", reason: "start" };
    const allowed = windowFor(startGame.id, startGame.levels.map((level) => level.id), child.grade, challenge);
    const base = Math.max(0, startGame.levels.findIndex((level) => level.id === (allowed.start || startGame.defaultLevel(child.grade))));
    const index = openingIndex(base < 0 ? 0 : base, child.rounds, false, { min: Math.max(0, allowed.min), max: Math.max(0, allowed.max) });
    const level = startGame.levels[index] ?? startGame.levels[0];
    return { game: startGame.id, level: level?.id ?? allowed.start, reason: "start" };
  }

  const review = [...rows].sort((a, b) => a.acc - b.acc || b.n - a.n)[0];
  return review
    ? { game: review.game, level: review.level, reason: "review" }
    : { game: "add", level: "within5", reason: "start" };
}
