import { skillHeat, skillKeyForLevel } from "./adapt";
import { gameCard } from "./games/catalog";
import { tierKey, tierWindow, type Tier } from "./grade-map";
import { bossReady, normalizeJourney, subjectSpot } from "./journey";
import { STOPS_PER_AREA, type Child, type Grade, type Journey } from "./model";
import { subjectKeyOf } from "./subject-games";

export type StoneState = "done" | "now" | "open" | "locked";

export interface Stone {
  level: string;
  num: number;
  label: string;
  state: StoneState;
}

type StoneKid = Pick<Child, "grade" | "levels" | "skills" | "challengeAhead" | "tiers">;

/**
 * A game's levels as one row of stepping stones, strictly in level order.
 * Only levels open for this grade and difficulty appear (Hard adds exactly one
 * past the grade). Every stone before the saved level is done, the saved level
 * is now (glows), the next one is open (or further, as far as mastery reached
 * plus one), and the rest stay locked. Never a checked stone after "now".
 */
export function levelStones(child: StoneKid, gameId: string): Stone[] {
  const game = gameCard(gameId);
  if (!game) return [];
  const tier: Tier = child.tiers?.[tierKey(child.grade, gameId)] ?? "medium";
  const window = tierWindow(game.levels.map((row) => row.id), gameId, child.grade, child.challengeAhead === true, tier);
  if (window.offer === "later" || window.ids.length === 0) return [];
  const rows = game.levels.filter((row) => window.ids.includes(row.id));
  const saved = child.levels[gameId] ?? "";
  const nowAt = Math.max(0, rows.findIndex((row) => row.id === (window.ids.includes(saved) ? saved : window.start)));
  let reach = nowAt;
  rows.forEach((row, i) => {
    if (skillHeat(child.skills[skillKeyForLevel(gameId, row.id)]) === "mastered") reach = Math.max(reach, i);
  });
  return rows.map((row, i) => ({
    level: row.id,
    num: row.num,
    label: row.label,
    state: i < nowAt ? "done" : i === nowAt ? "now" : i <= reach + 1 ? "open" : "locked",
  }));
}

export type BossStoneState = "done" | "now" | "locked";

/** The Boss stone that ends the path: beaten = done, ready = now, else locked. */
export function bossStoneState(journey: Journey, gameId: string, grade: Grade): BossStoneState {
  if (journey.bosses.includes(gameId)) return "done";
  return bossReady(journey, gameId, grade) ? "now" : "locked";
}

/** Rounds left on this island before its boss shows up (0 when ready or not here). */
export function roundsToBoss(journey: Journey, gameId: string, grade: Grade): number {
  if (journey.bosses.includes(gameId)) return 0;
  const spot = subjectSpot(normalizeJourney(journey, grade), subjectKeyOf(gameId));
  if (spot.areaId !== gameId) return 0;
  return Math.max(0, STOPS_PER_AREA - 1 - spot.stop);
}
