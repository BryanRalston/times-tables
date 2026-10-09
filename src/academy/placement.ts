import { skillHeat, skillKeyForLevel, openingIndex, type SkillHeat } from "./adapt";
import { GAMES } from "./games/registry";
import { playWindow } from "./grade-map";
import type { Grade, SkillStat } from "./model";

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

/**
 * One tap, no quiz. A new child starts a step easier than the grade default.
 * A skill they are still learning comes back. A mastered skill steps up.
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

  const weak = rows
    .filter((row) => row.heat === "learning")
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
  const game = starters.find((row) => row.id === "add") ?? starters[0];
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
