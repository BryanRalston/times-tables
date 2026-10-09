import { skillHeat, skillKeyForLevel, openingIndex, type SkillHeat } from "./adapt";
import { GAMES } from "./games/registry";
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
export function nextPlacement(child: {
  grade: Grade;
  rounds: number;
  skills: Record<string, SkillStat>;
  levels: Record<string, string>;
}): Placement {
  const rows: SkillRow[] = [];
  for (const game of GAMES) {
    for (const level of game.levels) {
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
    const saved = child.levels[game.id] ?? game.defaultLevel(child.grade);
    const index = Math.max(0, game.levels.findIndex((level) => level.id === saved));
    const current = game.levels[index];
    if (!current) continue;
    const heat = skillHeat(child.skills[skillKeyForLevel(game.id, current.id)]);
    const next = game.levels[index + 1];
    if (heat === "mastered" && next) return { game: game.id, level: next.id, reason: "stretch" };
  }

  if (rows.length === 0) {
    const game = GAMES.find((row) => row.id === "add") ?? GAMES[0];
    const base = Math.max(0, game.levels.findIndex((level) => level.id === game.defaultLevel(child.grade)));
    const index = openingIndex(base < 0 ? 0 : base, child.rounds, false);
    const level = game.levels[index] ?? game.levels[0];
    return { game: game.id, level: level?.id ?? game.defaultLevel(child.grade), reason: "start" };
  }

  const review = [...rows].sort((a, b) => a.acc - b.acc || b.n - a.n)[0];
  return review
    ? { game: review.game, level: review.level, reason: "review" }
    : { game: "add", level: "within5", reason: "start" };
}
