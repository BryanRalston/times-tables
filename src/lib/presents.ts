import { adjacentPadIds, RADIAL_PADS, START_PAD } from "@/lib/radial-web";
import { RARE_SQUISHEES, squisheeById } from "@/lib/squishees";

export const PRESENT_COIN_PILE = 10;

export type PresentSquisheeSpot = {
  pad: number;
  kind: "squishee";
  squisheeId: string;
};

export type PresentCoinSpot = {
  pad: number;
  kind: "coins";
  coins: number;
};

export type PresentSpot = PresentSquisheeSpot | PresentCoinSpot;

export type LandedPresent =
  | { kind: "squishee"; squisheeId: string }
  | { kind: "coins"; coins: number };

/**
 * Grade 3 mystery boxes. Fixed pad ↔ reward, like mystery portals —
 * not reshuffled every visit.
 *
 * Mix: one unowned common, two find-to-unlock rares, one ~10-coin pile
 * (one Shelf common). Remaining rares stay Shelf mysteries.
 */
export const GRADE3_PRESENTS: readonly PresentSpot[] = [
  { pad: 12, kind: "squishee", squisheeId: "otter" },
  { pad: 17, kind: "squishee", squisheeId: "crystal-axolotl" },
  { pad: 21, kind: "coins", coins: PRESENT_COIN_PILE },
  { pad: 25, kind: "squishee", squisheeId: "galaxy-narwhal" },
];

/** Pre-v15 map rares. Heal opened pads so old finds are not re-wrapped. */
export const LEGACY_PRESENT_SQUISHEES: Readonly<Record<number, string>> = {
  12: "crystal-axolotl",
  17: "galaxy-narwhal",
  21: "golden-dragon",
  25: "rainbow-cupcake",
};

export const UNWRAP_OPEN_MS = 640;
export const UNWRAP_HOLD_MS = 9000;

const presentByPad = new Map(GRADE3_PRESENTS.map((p) => [p.pad, p]));

export function presentSpotAt(pad: number): PresentSpot | undefined {
  return presentByPad.get(pad);
}

export function presentSquisheeAt(pad: number): string | undefined {
  const spot = presentByPad.get(pad);
  return spot?.kind === "squishee" ? spot.squisheeId : undefined;
}

export function isPresentPad(pad: number): boolean {
  return presentByPad.has(pad);
}

export function parseOpenedPresents(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const out: number[] = [];
  const seen = new Set<number>();
  for (const n of raw) {
    if (typeof n !== "number" || !Number.isFinite(n)) continue;
    const pad = Math.round(n);
    if (!presentByPad.has(pad) || seen.has(pad)) continue;
    seen.add(pad);
    out.push(pad);
  }
  return out.sort((a, b) => a - b);
}

export function healOpenedPresents(
  owned: readonly string[],
  raw: unknown,
  saveVersion: number,
): number[] {
  const opened = new Set(parseOpenedPresents(raw));
  for (const spot of GRADE3_PRESENTS) {
    if (spot.kind === "squishee" && owned.includes(spot.squisheeId)) opened.add(spot.pad);
  }
  if (saveVersion < 15) {
    for (const [padRaw, id] of Object.entries(LEGACY_PRESENT_SQUISHEES)) {
      if (owned.includes(id)) opened.add(Number(padRaw));
    }
  }
  return [...opened].filter((pad) => presentByPad.has(pad)).sort((a, b) => a - b);
}

function padSpent(spot: PresentSpot, owned: readonly string[], opened: ReadonlySet<number>): boolean {
  if (opened.has(spot.pad)) return true;
  return spot.kind === "squishee" && owned.includes(spot.squisheeId);
}

export function visiblePresentPads(owned: readonly string[], opened: readonly number[] = []): readonly number[] {
  const done = new Set(opened);
  return GRADE3_PRESENTS.filter((p) => !padSpent(p, owned, done)).map((p) => p.pad);
}

export function foundPresentPads(owned: readonly string[], opened: readonly number[] = []): readonly number[] {
  const done = new Set(opened);
  return GRADE3_PRESENTS.filter((p) => padSpent(p, owned, done)).map((p) => p.pad);
}

export function landPresent(
  pad: number,
  owned: readonly string[],
  opened: readonly number[],
): LandedPresent | undefined {
  if (opened.includes(pad)) return undefined;
  const spot = presentByPad.get(pad);
  if (!spot) return undefined;
  switch (spot.kind) {
    case "coins":
      return { kind: "coins", coins: spot.coins };
    case "squishee":
      if (owned.includes(spot.squisheeId)) return undefined;
      return squisheeById(spot.squisheeId) ? { kind: "squishee", squisheeId: spot.squisheeId } : undefined;
    default: {
      const _never: never = spot;
      return _never;
    }
  }
}

export function applyUnlock(
  owned: string[],
  id: string,
): { ok: boolean; reason: "ok" | "missing" | "owned"; squishees: string[] } {
  const s = squisheeById(id);
  if (!s) return { ok: false, reason: "missing", squishees: owned };
  if (owned.includes(id)) return { ok: false, reason: "owned", squishees: owned };
  return { ok: true, reason: "ok", squishees: [...owned, id] };
}

export function applyPresentLand(
  owned: string[],
  coins: number,
  opened: number[],
  pad: number,
): {
  ok: boolean;
  squishees: string[];
  coins: number;
  opened: number[];
  reward?: LandedPresent;
} {
  const reward = landPresent(pad, owned, opened);
  if (!reward) return { ok: false, squishees: owned, coins, opened };
  const nextOpened = opened.includes(pad) ? opened : [...opened, pad].sort((a, b) => a - b);
  switch (reward.kind) {
    case "coins":
      return {
        ok: true,
        squishees: owned,
        coins: coins + reward.coins,
        opened: nextOpened,
        reward,
      };
    case "squishee": {
      const grant = applyUnlock(owned, reward.squisheeId);
      if (!grant.ok) return { ok: false, squishees: owned, coins, opened };
      return { ok: true, squishees: grant.squishees, coins, opened: nextOpened, reward };
    }
    default: {
      const _never: never = reward;
      return _never;
    }
  }
}

/** BFS that skips present pads still reaches the outer ring. */
export function webOpenAroundPresents(): boolean {
  const skip = new Set(GRADE3_PRESENTS.map((p) => p.pad));
  const seen = new Set<number>([START_PAD]);
  const q = [START_PAD];
  while (q.length) {
    const id = q.shift()!;
    for (const n of adjacentPadIds(id)) {
      if (skip.has(n) || seen.has(n)) continue;
      seen.add(n);
      q.push(n);
    }
  }
  return RADIAL_PADS.some((p) => p.ring === 4 && seen.has(p.id));
}

export function grade3PresentRares(): readonly string[] {
  return GRADE3_PRESENTS.filter((p): p is PresentSquisheeSpot => p.kind === "squishee")
    .map((p) => p.squisheeId)
    .filter((id) => squisheeById(id)?.rarity === "rare");
}

export function grade3PresentCommons(): readonly string[] {
  return GRADE3_PRESENTS.filter((p): p is PresentSquisheeSpot => p.kind === "squishee")
    .map((p) => p.squisheeId)
    .filter((id) => squisheeById(id)?.rarity === "common");
}

export function heldRares(): readonly string[] {
  const onMap = new Set(grade3PresentRares());
  return RARE_SQUISHEES.filter((s) => !onMap.has(s.id)).map((s) => s.id);
}
