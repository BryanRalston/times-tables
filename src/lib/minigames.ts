import { COMMON_SQUISHEES } from "@/lib/squishees";
import type { Rng } from "@/lib/rng";
import { rngFromSeed } from "@/lib/rng";

export type MiniKind = "match" | "who-hid" | "poke";

export function pickMiniKind(seed: string): MiniKind {
  return rngFromSeed(seed).pick(["match", "who-hid", "poke"] as const);
}

export function houseRoster(owned: string[]): string[] {
  return owned.length ? [...owned] : ["frog"];
}

export interface MatchDeal {
  kind: "match";
  cards: { id: string; toy: string }[];
}

export interface WhoHidDeal {
  kind: "who-hid";
  shown: string[];
  missing: string;
  choices: string[];
}

export interface PokeDeal {
  kind: "poke";
  choices: string[];
  target: string;
}

export type MiniDeal = MatchDeal | WhoHidDeal | PokeDeal;

function distinctFrom(pool: string[], n: number, rng: Rng): string[] {
  const out: string[] = [];
  for (const id of rng.shuffle(pool)) {
    if (out.includes(id)) continue;
    out.push(id);
    if (out.length >= n) break;
  }
  return out;
}

export function dealMatch(owned: string[], rng: Rng): MatchDeal {
  const roster = houseRoster(owned);
  const pool = [...roster];
  for (const id of COMMON_SQUISHEES.map((s) => s.id)) {
    if (!pool.includes(id)) pool.push(id);
  }
  const pairToys = distinctFrom(pool, 2, rng);
  const a = pairToys[0] ?? "frog";
  const b = pairToys[1] ?? (a === "cat" ? "frog" : "cat");
  return {
    kind: "match",
    cards: rng.shuffle([
      { id: "a0", toy: a },
      { id: "a1", toy: a },
      { id: "b0", toy: b },
      { id: "b1", toy: b },
    ]),
  };
}

export function dealWhoHid(owned: string[], rng: Rng): WhoHidDeal {
  const roster = houseRoster(owned);
  const missing = rng.pick(roster);
  const others = distinctFrom(
    COMMON_SQUISHEES.map((s) => s.id).filter((id) => id !== missing),
    2,
    rng,
  );
  const shown = rng.shuffle([missing, ...others]);
  return {
    kind: "who-hid",
    shown,
    missing,
    choices: rng.shuffle(shown),
  };
}

export function dealPoke(owned: string[], rng: Rng): PokeDeal {
  const roster = houseRoster(owned);
  const target = rng.pick(roster);
  const decoys = distinctFrom(
    COMMON_SQUISHEES.map((s) => s.id).filter((id) => id !== target),
    2,
    rng,
  );
  return {
    kind: "poke",
    choices: rng.shuffle([target, ...decoys]),
    target,
  };
}

export function dealMini(kind: MiniKind, owned: string[], rng: Rng): MiniDeal {
  if (kind === "match") return dealMatch(owned, rng);
  if (kind === "who-hid") return dealWhoHid(owned, rng);
  return dealPoke(owned, rng);
}
