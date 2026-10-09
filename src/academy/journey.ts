import { GAMES, gameById } from "./games/registry";
import {
  BOSS_PASS,
  DAILY_GOAL,
  STOPS_PER_AREA,
  type Child,
  type DailyGiftState,
  type Journey,
} from "./model";

export function blankJourney(): Journey {
  return { areaId: GAMES[0]?.id ?? "times", stop: 0, bosses: [] };
}

export function areaIndex(journey: Journey): number {
  const index = GAMES.findIndex((game) => game.id === journey.areaId);
  return index < 0 ? 0 : index;
}

/** The first island is open. Each later island opens when the previous boss is beaten. */
export function areaOpen(journey: Journey, index: number): boolean {
  if (index <= 0) return true;
  const prev = GAMES[index - 1];
  if (!prev) return false;
  return journey.bosses.includes(prev.id);
}

export function normalizeJourney(journey: Journey): Journey {
  const bosses: string[] = [];
  for (const id of journey.bosses) {
    if (gameById(id) && !bosses.includes(id)) bosses.push(id);
  }
  const draft: Journey = { areaId: journey.areaId, stop: journey.stop, bosses };
  let index = GAMES.findIndex((game) => game.id === draft.areaId);
  if (index < 0) index = 0;
  if (!areaOpen(draft, index)) {
    index = 0;
    for (let i = 0; i < GAMES.length; i++) {
      if (areaOpen(draft, i)) index = i;
      else break;
    }
  }
  const stop = Math.max(0, Math.min(STOPS_PER_AREA - 1, Math.floor(journey.stop) || 0));
  return { areaId: GAMES[index]!.id, stop, bosses };
}

export function parseJourney(raw: unknown): Journey {
  if (!raw || typeof raw !== "object") return blankJourney();
  const o = raw as Record<string, unknown>;
  const bosses = Array.isArray(o.bosses) ? o.bosses.filter((id): id is string => typeof id === "string") : [];
  const areaId = typeof o.areaId === "string" ? o.areaId : "";
  const stop = typeof o.stop === "number" ? o.stop : 0;
  return normalizeJourney({ areaId, stop, bosses });
}

export function bossReady(journey: Journey, gameId: string): boolean {
  const here = normalizeJourney(journey);
  if (here.areaId !== gameId) return false;
  if (here.bosses.includes(gameId)) return false;
  return here.stop >= STOPS_PER_AREA - 1;
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
export function advanceJourney(journey: Journey, step: RoundStep): Journey {
  const here = normalizeJourney(journey);
  if (step.game !== here.areaId) return here;
  const atBoss = bossReady(here, step.game);
  if (atBoss) {
    if (!step.boss || !bossWon(step.correct, step.total)) return here;
    const bosses = here.bosses.includes(step.game) ? here.bosses : [...here.bosses, step.game];
    const next = GAMES[areaIndex(here) + 1];
    if (!next) return { areaId: here.areaId, stop: STOPS_PER_AREA - 1, bosses };
    return { areaId: next.id, stop: 0, bosses };
  }
  if (here.stop >= STOPS_PER_AREA - 1) return here;
  return { ...here, stop: here.stop + 1 };
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
