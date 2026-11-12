import { bandFor } from "./grade-map";
import { GAME_CARDS as GAMES, gameCard as gameById } from "./games/catalog";
import { gameOffered } from "./games/offer";
import {
  BOSS_PASS,
  DAILY_GOAL,
  STOPS_PER_AREA,
  type Child,
  type DailyGiftState,
  type Grade,
  type Journey,
  type JourneySpot,
} from "./model";
import { SUBJECT_KEYS, subjectIndexes, subjectKeyOf, type SubjectKey } from "./subject-games";

export function blankJourney(): Journey {
  return { areaId: GAMES[0]?.id ?? "times", stop: 0, bosses: [] };
}

export function areaIndex(journey: Journey, key?: SubjectKey): number {
  const id = key ? subjectSpot(journey, key).areaId : journey.areaId;
  const index = GAMES.findIndex((game) => game.id === id);
  return index < 0 ? 0 : index;
}

/**
 * Islands that do not block the path. Coming-later games are skipped.
 * Pre-K coin-name intros stay on the home screen and do not gate counting.
 */
function skipsGate(gameId: string, grade: Grade | undefined): boolean {
  if (!gameOffered(gameId)) return true;
  if (!grade) return false;
  const offer = bandFor(gameId, grade)?.offer;
  if (offer === "later") return true;
  return grade === "PK" && offer === "intro";
}

/**
 * The first island of each subject is open. A later island opens when every
 * earlier island in the SAME subject has its boss beaten (or skips the gate).
 * Spelling never waits on Math bosses.
 */
export function areaOpen(journey: Journey, index: number, grade?: Grade): boolean {
  const game = GAMES[index];
  if (!game) return index <= 0;
  const chain = subjectIndexes(subjectKeyOf(game.id));
  const pos = chain.indexOf(index);
  if (pos <= 0) return true;
  if (!grade) {
    const prev = GAMES[chain[pos - 1]!];
    return !!prev && journey.bosses.includes(prev.id);
  }
  for (let i = 0; i < pos; i++) {
    const id = GAMES[chain[i]!]!.id;
    if (skipsGate(id, grade)) continue;
    if (!journey.bosses.includes(id)) return false;
  }
  return true;
}

/** The game whose boss must be beaten before this island opens (same subject), or "". */
export function gateBefore(journey: Journey, index: number, grade?: Grade): string {
  const game = GAMES[index];
  if (!game) return "";
  const chain = subjectIndexes(subjectKeyOf(game.id));
  const pos = chain.indexOf(index);
  for (let i = 0; i < pos; i++) {
    const id = GAMES[chain[i]!]!.id;
    if (grade && skipsGate(id, grade)) continue;
    if (!journey.bosses.includes(id)) return id;
  }
  return "";
}

/** Fit a saved spot onto one subject's chain. */
function fitSpot(bossesOnly: Journey, key: SubjectKey, saved: JourneySpot | undefined, grade?: Grade): JourneySpot {
  let raw: JourneySpot = saved ?? { areaId: "", stop: 0 };
  const chain = subjectIndexes(key);
  if (chain.length === 0) return { areaId: GAMES[0]?.id ?? "times", stop: 0 };
  let index = GAMES.findIndex((game) => game.id === raw.areaId);
  if (index < 0 || !chain.includes(index)) {
    // No saved spot here: stand on the furthest open island not yet beaten.
    index = chain[0]!;
    for (const i of chain) {
      if (!areaOpen(bossesOnly, i, grade)) break;
      index = i;
      if (!bossesOnly.bosses.includes(GAMES[i]!.id)) break;
    }
    raw = { areaId: GAMES[index]!.id, stop: 0 };
  }
  if (!areaOpen(bossesOnly, index, grade)) {
    index = chain[0]!;
    for (const i of chain) {
      if (areaOpen(bossesOnly, i, grade)) index = i;
      else break;
    }
  }
  let hopped = false;
  if (grade) {
    let pos = chain.indexOf(index);
    while (pos < chain.length - 1 && skipsGate(GAMES[chain[pos]!]!.id, grade)) {
      const next = chain[pos + 1]!;
      if (!areaOpen(bossesOnly, next, grade)) break;
      pos += 1;
      index = next;
      hopped = true;
    }
  }
  const rawStop = hopped || GAMES[index]!.id !== raw.areaId ? 0 : raw.stop;
  const stop = Math.max(0, Math.min(STOPS_PER_AREA - 1, Math.floor(rawStop) || 0));
  return { areaId: GAMES[index]!.id, stop };
}

export function normalizeJourney(journey: Journey, grade?: Grade): Journey {
  const bosses: string[] = [];
  for (const id of journey.bosses) {
    if (gameById(id) && !bosses.includes(id)) bosses.push(id);
  }
  const base: Journey = { areaId: journey.areaId, stop: journey.stop, bosses };
  const legacyKey = gameById(journey.areaId) ? subjectKeyOf(journey.areaId) : null;
  const trails: Record<SubjectKey, JourneySpot> = {} as Record<SubjectKey, JourneySpot>;
  for (const key of SUBJECT_KEYS) {
    // Older saves had one spot for every subject: it seeds its own subject only.
    const saved = journey.trails?.[key] ?? (legacyKey === key ? { areaId: journey.areaId, stop: journey.stop } : undefined);
    trails[key] = fitSpot(base, key, saved, grade);
  }
  const top = trails[legacyKey ?? subjectKeyOf(GAMES[0]?.id ?? "times")];
  return { areaId: top.areaId, stop: top.stop, bosses, trails };
}

/** One subject's spot on its own island path. */
export function subjectSpot(journey: Journey, key: SubjectKey, grade?: Grade): JourneySpot {
  const here = journey.trails?.[key] ? journey : normalizeJourney(journey, grade);
  return here.trails![key]!;
}

export function parseJourney(raw: unknown, grade?: Grade): Journey {
  if (!raw || typeof raw !== "object") return normalizeJourney(blankJourney(), grade);
  const o = raw as Record<string, unknown>;
  const bosses = Array.isArray(o.bosses) ? o.bosses.filter((id): id is string => typeof id === "string") : [];
  const areaId = typeof o.areaId === "string" ? o.areaId : "";
  const stop = typeof o.stop === "number" ? o.stop : 0;
  let trails: Journey["trails"];
  if (o.trails && typeof o.trails === "object") {
    trails = {};
    for (const key of SUBJECT_KEYS) {
      const row = (o.trails as Record<string, unknown>)[key] as Record<string, unknown> | undefined;
      if (row && typeof row.areaId === "string" && typeof row.stop === "number") trails[key] = { areaId: row.areaId, stop: row.stop };
    }
  }
  return normalizeJourney({ areaId, stop, bosses, trails }, grade);
}

/**
 * Boss-only islands (the Grade 5 Summit) are not a stop on the path: the boss
 * waits there for a grade 5 child from the first visit until it is beaten.
 */
export const BOSS_ONLY_GAMES: Readonly<Record<string, Grade>> = { summit: "5" };

export function bossReady(journey: Journey, gameId: string, grade?: Grade): boolean {
  const onlyFor = BOSS_ONLY_GAMES[gameId];
  if (onlyFor) return (grade === undefined || grade === onlyFor) && !journey.bosses.includes(gameId);
  const here = normalizeJourney(journey, grade);
  const spot = here.trails![subjectKeyOf(gameId)]!;
  if (spot.areaId !== gameId) return false;
  if (here.bosses.includes(gameId)) return false;
  return spot.stop >= STOPS_PER_AREA - 1;
}

export function bossWon(correct: number, total: number): boolean {
  if (total <= 0) return false;
  return correct / total >= BOSS_PASS;
}

export interface RoundStep {
  game: string;
  correct: number;
  total: number;
  boss: boolean;
}

/**
 * A finished round in the current area moves one stop.
 * The last stop is a boss. Winning it opens the next area.
 * Practice in another game stays where you are.
 */
export function advanceJourney(journey: Journey, step: RoundStep, grade?: Grade): Journey {
  const here = normalizeJourney(journey, grade);
  const key = subjectKeyOf(step.game);
  const spot = here.trails![key]!;
  if (BOSS_ONLY_GAMES[step.game]) {
    // A Summit win is kept, and the path does not move.
    if (!step.boss || !bossReady(here, step.game, grade) || !bossWon(step.correct, step.total)) return here;
    return { ...here, bosses: [...here.bosses, step.game] };
  }
  if (step.game !== spot.areaId) return here;
  const put = (next: JourneySpot, bosses = here.bosses): Journey => ({
    areaId: next.areaId,
    stop: next.stop,
    bosses,
    trails: { ...here.trails, [key]: next },
  });
  if (bossReady(here, step.game, grade)) {
    if (!step.boss || !bossWon(step.correct, step.total)) return here;
    const bosses = here.bosses.includes(step.game) ? here.bosses : [...here.bosses, step.game];
    const chain = subjectIndexes(key);
    let pos = chain.indexOf(GAMES.findIndex((game) => game.id === step.game)) + 1;
    if (grade) {
      while (pos < chain.length && skipsGate(GAMES[chain[pos]!]!.id, grade)) pos += 1;
    }
    const next = pos < chain.length ? GAMES[chain[pos]!] : undefined;
    if (!next) return put({ areaId: spot.areaId, stop: STOPS_PER_AREA - 1 }, bosses);
    return put({ areaId: next.id, stop: 0 }, bosses);
  }
  if (spot.stop >= STOPS_PER_AREA - 1) return here;
  return put({ areaId: spot.areaId, stop: spot.stop + 1 });
}

export function dailySnapshot(child: Pick<Child, "dailyDate" | "dailyRounds" | "dailyGift">, today: string) {
  if (child.dailyDate !== today) {
    return { rounds: 0, goal: DAILY_GOAL, ready: false, claimed: false };
  }
  const rounds = Math.max(0, Math.min(DAILY_GOAL, child.dailyRounds));
  return {
    rounds,
    goal: DAILY_GOAL,
    ready: child.dailyGift === "closed",
    claimed: child.dailyGift === "open",
  };
}

export function withDailyRound(
  child: Pick<Child, "dailyDate" | "dailyRounds" | "dailyGift">,
  today: string,
): { dailyDate: string; dailyRounds: number; dailyGift: DailyGiftState } {
  const same = child.dailyDate === today;
  const rounds = (same ? child.dailyRounds : 0) + 1;
  let gift: DailyGiftState = "none";
  if (same && child.dailyGift === "open") gift = "open";
  else if (rounds >= DAILY_GOAL) gift = "closed";
  return { dailyDate: today, dailyRounds: rounds, dailyGift: gift };
}
