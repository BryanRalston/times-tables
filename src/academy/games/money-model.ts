import type { Rng } from "@/lib/rng";
import type { CoinKind, CoinPile, MoneyMode } from "./types";

export type { CoinKind, CoinPile, MoneyMode };

export const COIN_CENTS: Record<CoinKind, number> = {
  penny: 1,
  nickel: 5,
  dime: 10,
  quarter: 25,
  dollar: 100,
};

export const COIN_NAME: Record<CoinKind, string> = {
  penny: "Penny",
  nickel: "Nickel",
  dime: "Dime",
  quarter: "Quarter",
  dollar: "Dollar",
};

const PLURAL: Record<CoinKind, string> = {
  penny: "pennies",
  nickel: "nickels",
  dime: "dimes",
  quarter: "quarters",
  dollar: "dollars",
};

const NAME_KINDS: CoinKind[] = ["penny", "nickel", "dime", "quarter"];

export function emptyPile(): CoinPile {
  return { penny: 0, nickel: 0, dime: 0, quarter: 0, dollar: 0 };
}

export function pileCents(pile: CoinPile): number {
  return (
    pile.penny * COIN_CENTS.penny +
    pile.nickel * COIN_CENTS.nickel +
    pile.dime * COIN_CENTS.dime +
    pile.quarter * COIN_CENTS.quarter +
    pile.dollar * COIN_CENTS.dollar
  );
}

export function formatCents(cents: number): string {
  const safe = Math.max(0, Math.floor(cents));
  if (safe < 100) return `${safe}¢`;
  const dollars = Math.floor(safe / 100);
  const rest = safe % 100;
  if (rest === 0) return `$${dollars}`;
  return `$${dollars}.${String(rest).padStart(2, "0")}`;
}

export function describePile(pile: CoinPile): string {
  const parts: string[] = [];
  const order: CoinKind[] = ["dollar", "quarter", "dime", "nickel", "penny"];
  for (const kind of order) {
    const n = pile[kind];
    if (n <= 0) continue;
    parts.push(`${n} ${n === 1 ? COIN_NAME[kind].toLowerCase() : PLURAL[kind]}`);
  }
  if (parts.length === 0) return "no coins";
  if (parts.length === 1) return parts[0]!;
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

export function oneCoin(kind: CoinKind): CoinPile {
  const pile = emptyPile();
  pile[kind] = 1;
  return pile;
}

/** A pile that sums to `cents`, preferring a short mix of coins. */
export function composePile(rng: Rng, cents: number, allowDollar: boolean): CoinPile {
  let left = Math.max(0, Math.floor(cents));
  const pile = emptyPile();
  const kinds: CoinKind[] = allowDollar
    ? ["dollar", "quarter", "dime", "nickel", "penny"]
    : ["quarter", "dime", "nickel", "penny"];
  for (const kind of kinds) {
    if (kind === "penny") continue;
    const value = COIN_CENTS[kind];
    const cap = kind === "dollar" ? 3 : 4;
    const maxN = Math.min(cap, Math.floor(left / value));
    if (maxN <= 0) continue;
    const take = rng.int(0, maxN);
    pile[kind] = take;
    left -= take * value;
  }
  const fix: CoinKind[] = allowDollar ? ["dollar", "quarter", "dime", "nickel", "penny"] : ["quarter", "dime", "nickel", "penny"];
  for (const kind of fix) {
    const value = COIN_CENTS[kind];
    const n = Math.floor(left / value);
    if (n <= 0) continue;
    pile[kind] += n;
    left -= n * value;
  }
  return pile;
}

export function nameKinds(): readonly CoinKind[] {
  return NAME_KINDS;
}

export function isMoneyMode(value: string): value is MoneyMode {
  return value === "name" || value === "count" || value === "make" || value === "change" || value === "dollars";
}
