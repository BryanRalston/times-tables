import { COMMON_PRICE } from "@/lib/coins";
import { adjacentPadIds, RADIAL_PADS, START_PAD } from "@/lib/radial-web";
import { RARE_SQUISHEES, squisheeById } from "@/lib/squishees";

export type PresentReward =
  | { kind: "squishee"; squisheeId: string }
  | { kind: "coins"; amount: number };

export type PresentSpot = { pad: number } & PresentReward;

export const PRESENT_COIN_AMOUNT = COMMON_PRICE;

export const PRESENT_BOX_FILE = "art/presents/present-closed.png";
export const PRESENT_OPEN_FILE = "art/presents/present-open.png";
export const PRESENT_COIN_FILE = "art/presents/coin-pile.png";

/**
 * Grade 3 hop-on mystery presents. Fixed pad ↔ reward, never shuffled.
 *
 * Mixed loot on hoppable, non-portal, non-start tiles. The web still
 * connects around them. Rainbow Cupcake and the other unlisted rares
 * stay Shelf mysteries (find-only, no Buy).
 */
export const GRADE3_PRESENTS: readonly PresentSpot[] = [
  { pad: 12, kind: "squishee", squisheeId: "crystal-axolotl" },
  { pad: 17, kind: "squishee", squisheeId: "galaxy-narwhal" },
  { pad: 21, kind: "squishee", squisheeId: "golden-dragon" },
  { pad: 25, kind: "squishee", squisheeId: "capybara" },
  { pad: 32, kind: "squishee", squisheeId: "boba" },
  { pad: 37, kind: "coins", amount: PRESENT_COIN_AMOUNT },
  { pad: 41, kind: "coins", amount: PRESENT_COIN_AMOUNT },
  { pad: 49, kind: "squishee", squisheeId: "axolotl" },
];

export const UNWRAP_OPEN_MS = 640;
export const UNWRAP_HOLD_MS = 9000;

const presentByPad = new Map(GRADE3_PRESENTS.map((p) => [p.pad, p]));

export function presentAt(pad: number): PresentSpot | undefined {
  return presentByPad.get(pad);
}

export function presentSquisheeAt(pad: number): string | undefined {
  const spot = presentAt(pad);
  return spot?.kind === "squishee" ? spot.squisheeId : undefined;
}

export function isPresentPad(pad: number): boolean {
  return presentByPad.has(pad);
}

export function parseClaimedPresentPads(v: unknown): number[] {
  if (!Array.isArray(v)) return [];
  const out: number[] = [];
  const seen = new Set<number>();
  for (const n of v) {
    if (typeof n !== "number" || !Number.isFinite(n)) continue;
    const pad = Math.round(n);
    if (!presentByPad.has(pad) || seen.has(pad)) continue;
    seen.add(pad);
    out.push(pad);
  }
  return out;
}

function isClaimed(spot: PresentSpot, owned: readonly string[], claimedPads: readonly number[]): boolean {
  if (claimedPads.includes(spot.pad)) return true;
  return spot.kind === "squishee" && owned.includes(spot.squisheeId);
}

export function visiblePresentPads(owned: readonly string[], claimedPads: readonly number[] = []): readonly number[] {
  return GRADE3_PRESENTS.filter((p) => !isClaimed(p, owned, claimedPads)).map((p) => p.pad);
}

export function foundPresentPads(owned: readonly string[]): readonly number[] {
  return GRADE3_PRESENTS.filter((p) => p.kind === "squishee" && owned.includes(p.squisheeId)).map((p) => p.pad);
}

/** Reward waiting in that box, if the Guest has not already claimed it. */
export function landPresent(
  pad: number,
  owned: readonly string[],
  claimedPads: readonly number[] = [],
): PresentSpot | undefined {
  const spot = presentAt(pad);
  if (!spot || isClaimed(spot, owned, claimedPads)) return undefined;
  return spot;
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

export type PresentClaimReason = "ok" | "missing" | "owned" | "claimed";

export function applyPresentClaim(args: {
  pad: number;
  owned: readonly string[];
  coins: number;
  claimedPads: readonly number[];
}): {
  ok: boolean;
  reason: PresentClaimReason;
  squishees: string[];
  coins: number;
  claimedPads: number[];
  reward?: PresentSpot;
} {
  const owned = [...args.owned];
  const claimedPads = parseClaimedPresentPads(args.claimedPads);
  const coins = Math.max(0, Math.floor(args.coins));
  const spot = landPresent(args.pad, owned, claimedPads);
  if (!spot) {
    const known = presentAt(args.pad);
    const reason: PresentClaimReason = !known ? "missing" : claimedPads.includes(args.pad) ? "claimed" : "owned";
    return { ok: false, reason, squishees: owned, coins, claimedPads };
  }
  const nextClaimed = claimedPads.includes(spot.pad) ? claimedPads : [...claimedPads, spot.pad];
  if (spot.kind === "coins") {
    return {
      ok: true,
      reason: "ok",
      squishees: owned,
      coins: coins + spot.amount,
      claimedPads: nextClaimed,
      reward: spot,
    };
  }
  const unlocked = applyUnlock(owned, spot.squisheeId);
  if (!unlocked.ok) {
    return { ok: false, reason: unlocked.reason, squishees: owned, coins, claimedPads };
  }
  return {
    ok: true,
    reason: "ok",
    squishees: unlocked.squishees,
    coins,
    claimedPads: nextClaimed,
    reward: spot,
  };
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
  return GRADE3_PRESENTS.filter((p) => p.kind === "squishee")
    .map((p) => p.squisheeId)
    .filter((id) => squisheeById(id)?.rarity === "rare");
}

export function grade3PresentCommons(): readonly string[] {
  return GRADE3_PRESENTS.filter((p) => p.kind === "squishee")
    .map((p) => p.squisheeId)
    .filter((id) => squisheeById(id)?.rarity === "common");
}

export function heldRares(): readonly string[] {
  const onMap = new Set(grade3PresentRares());
  return RARE_SQUISHEES.filter((s) => !onMap.has(s.id)).map((s) => s.id);
}
