import { hashSeed } from "@/lib/rng";
import { squisheeById } from "@/lib/squishees";
import { DAILY_GOAL, SQUAD_IDS, type DailyGiftState } from "../model";

export const EGG_IDS = ["crystal-axolotl", "rainbow-cupcake", "star-mochi", "galaxy-narwhal"] as const;

export function syncEgg(
  prev: { egg: DailyGiftState; dailyDate: string | null },
  daily: { dailyDate: string; dailyRounds: number },
): DailyGiftState {
  if (daily.dailyDate !== prev.dailyDate) {
    return daily.dailyRounds >= DAILY_GOAL ? "closed" : "none";
  }
  if (prev.egg === "open") return "open";
  if (daily.dailyRounds >= DAILY_GOAL) return "closed";
  return "none";
}

/** Same day, same owned set, same hatch. Rares come out of the egg first. */
export function hatchPick(today: string, owned: readonly string[]): string | null {
  const rares = EGG_IDS.filter((id) => squisheeById(id) && !owned.includes(id));
  const rest = SQUAD_IDS.filter((id) => !owned.includes(id));
  const pool = rares.length ? rares : rest;
  if (!pool.length) return null;
  return pool[hashSeed(`egg:${today}`) % pool.length] ?? null;
}
