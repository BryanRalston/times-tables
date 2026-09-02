import { COMMON_SQUISHEES, RARE_SQUISHEES, squisheeById } from "@/lib/squishees";

export const COMMON_PRICE = 10;
export const RARE_PRICE = 50;
export const MISSING_ADDEND_PRICE = 12;

export function coinsForResult(correct: number, total: number): number {
  const pct = total <= 0 ? 0 : correct / total;
  return 5 + correct + (pct >= 1 ? 3 : pct >= 0.7 ? 1 : 0);
}

export function squisheePrice(id: string): number {
  return squisheeById(id)?.rarity === "rare" ? RARE_PRICE : COMMON_PRICE;
}

export type BuyReason = "ok" | "missing" | "owned" | "poor";

export function applyBuy(
  coins: number,
  owned: string[],
  id: string,
): { ok: boolean; reason: BuyReason; coins: number; squishees: string[] } {
  const s = squisheeById(id);
  if (!s) return { ok: false, reason: "missing", coins, squishees: owned };
  if (owned.includes(id)) return { ok: false, reason: "owned", coins, squishees: owned };
  const price = squisheePrice(id);
  if (coins < price) return { ok: false, reason: "poor", coins, squishees: owned };
  return { ok: true, reason: "ok", coins: coins - price, squishees: [...owned, id] };
}

export function canAffordAnything(coins: number, owned: string[]): boolean {
  return [...COMMON_SQUISHEES, ...RARE_SQUISHEES].some((s) => !owned.includes(s.id) && coins >= squisheePrice(s.id));
}
