import { COMMON_SQUISHEES, pathHopperId, squisheeById } from "@/lib/squishees";
import type { Rng } from "@/lib/rng";
import { rngFromSeed } from "@/lib/rng";

export const MINI_KINDS = ["match", "who-hid", "poke", "peek", "twin", "hop"] as const;
export type MiniKind = (typeof MINI_KINDS)[number];

export function parseMiniKind(v: unknown): MiniKind | undefined {
  return typeof v === "string" && (MINI_KINDS as readonly string[]).includes(v) ? (v as MiniKind) : undefined;
}

export function pickMiniKind(seed: string, force?: string | null): MiniKind {
  return parseMiniKind(force) ?? rngFromSeed(seed).pick(MINI_KINDS);
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

export interface PeekDeal {
  kind: "peek";
  peeker: string;
  spots: number;
  peekIndex: number;
}

export interface TwinCard {
  id: string;
  toy: string;
}

export interface TwinDeal {
  kind: "twin";
  hopper: string;
  cards: TwinCard[];
}

export interface HopDeal {
  kind: "hop";
  hopper: string;
  pads: number;
  target: number;
}

export type MiniDeal = MatchDeal | WhoHidDeal | PokeDeal | PeekDeal | TwinDeal | HopDeal;

export type WhoHidStage = "remember" | "choose";

/** Choose stage never dumps faces — only the found hidder may open. */
export function whoHidShowsFace(stage: WhoHidStage, id: string, hit: string | null): boolean {
  if (stage === "remember") return true;
  return hit === id;
}

function distinctFrom(pool: string[], n: number, rng: Rng): string[] {
  const out: string[] = [];
  for (const id of rng.shuffle(pool)) {
    if (out.includes(id)) continue;
    out.push(id);
    if (out.length >= n) break;
  }
  return out;
}

function hopperOf(owned: string[], hopperId?: string): string {
  if (hopperId && squisheeById(hopperId)) return hopperId;
  return pathHopperId(owned);
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
    choices: shown,
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

export function dealPeek(owned: string[], rng: Rng): PeekDeal {
  const roster = houseRoster(owned);
  return {
    kind: "peek",
    peeker: rng.pick(roster),
    spots: 4,
    peekIndex: rng.int(0, 3),
  };
}

export function dealTwin(owned: string[], rng: Rng, hopperId?: string): TwinDeal {
  const hopper = hopperOf(owned, hopperId);
  const decoyPool = COMMON_SQUISHEES.map((s) => s.id).filter((id) => id !== hopper);
  const decoy = rng.pick(decoyPool.length ? decoyPool : hopper === "frog" ? ["cat"] : ["frog"]);
  return {
    kind: "twin",
    hopper,
    cards: rng.shuffle([
      { id: "h0", toy: hopper },
      { id: "h1", toy: hopper },
      { id: "d0", toy: decoy },
    ]),
  };
}

export function dealHop(owned: string[], rng: Rng, hopperId?: string): HopDeal {
  return {
    kind: "hop",
    hopper: hopperOf(owned, hopperId),
    pads: 3,
    target: rng.int(0, 2),
  };
}

export function applyWhoHidPick(
  missing: string,
  pick: string,
  onHit: () => void,
  onMiss: () => void,
): void {
  if (pick === missing) onHit();
  else onMiss();
}

export function dealMini(kind: MiniKind, owned: string[], rng: Rng, hopperId?: string): MiniDeal {
  switch (kind) {
    case "match":
      return dealMatch(owned, rng);
    case "who-hid":
      return dealWhoHid(owned, rng);
    case "poke":
      return dealPoke(owned, rng);
    case "peek":
      return dealPeek(owned, rng);
    case "twin":
      return dealTwin(owned, rng, hopperId);
    case "hop":
      return dealHop(owned, rng, hopperId);
    default: {
      const _never: never = kind;
      return _never;
    }
  }
}
