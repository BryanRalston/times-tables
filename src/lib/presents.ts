import { adjacentPadIds, isPortalPad, RADIAL_PAD_COUNT, RADIAL_PADS, START_PAD } from "@/lib/radial-web";
import { COMMON_SQUISHEES, RARE_SQUISHEES, squisheeById } from "@/lib/squishees";

export const LIVE_PRESENT_COUNT = 4;
export const PRESENT_COIN_PILE = 10;
export const PRESENT_ROLL_MIN = 1;
export const PRESENT_ROLL_MAX = 2;

/**
 * Current unwrap mix. Old v15 board was 1 coin / 1 common / 2 rares
 * on four fixed pads (25% / 25% / 50%). Coins and rolls must win.
 */
export const PRESENT_LOOT_WEIGHTS = {
  coins: 40,
  rolls: 40,
  common: 15,
  rare: 5,
} as const;

export type PresentLootKind = keyof typeof PRESENT_LOOT_WEIGHTS;

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
  | { kind: "coins"; coins: number }
  | { kind: "rolls"; rolls: number };

/**
 * First-visit seed pads (and v15 migration leftovers). Rewards are no
 * longer pinned to these pads — unwrap rolls the live mix.
 */
export const GRADE3_PRESENTS: readonly PresentSpot[] = [
  { pad: 12, kind: "squishee", squisheeId: "otter" },
  { pad: 17, kind: "squishee", squisheeId: "crystal-axolotl" },
  { pad: 21, kind: "coins", coins: PRESENT_COIN_PILE },
  { pad: 25, kind: "squishee", squisheeId: "galaxy-narwhal" },
];

export const SEED_PRESENT_PADS: readonly number[] = GRADE3_PRESENTS.map((p) => p.pad);

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

export function clampGiftRolls(n: unknown): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return 0;
  return Math.min(99, Math.max(0, Math.round(n)));
}

function playerPad(hopperAt: unknown): number {
  if (typeof hopperAt !== "number" || !Number.isFinite(hopperAt)) return START_PAD;
  const pad = Math.round(hopperAt);
  return pad > 0 ? pad : START_PAD;
}

function isWalkablePad(pad: number): boolean {
  if (pad <= START_PAD || pad > RADIAL_PAD_COUNT) return false;
  if (isPortalPad(pad)) return false;
  return adjacentPadIds(pad).length > 0;
}

export function presentSpotAt(pad: number): PresentSpot | undefined {
  return presentByPad.get(pad);
}

export function presentSquisheeAt(pad: number): string | undefined {
  const spot = presentByPad.get(pad);
  return spot?.kind === "squishee" ? spot.squisheeId : undefined;
}

export function isPresentPad(pad: number, live: readonly number[] = SEED_PRESENT_PADS): boolean {
  return live.includes(pad);
}

export function parsePadList(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const out: number[] = [];
  const seen = new Set<number>();
  for (const n of raw) {
    if (typeof n !== "number" || !Number.isFinite(n)) continue;
    const pad = Math.round(n);
    if (!isWalkablePad(pad) || seen.has(pad)) continue;
    seen.add(pad);
    out.push(pad);
  }
  return out.sort((a, b) => a - b);
}

export function parseOpenedPresents(raw: unknown): number[] {
  return parsePadList(raw);
}

export function parseLivePresentPads(raw: unknown): number[] {
  return parsePadList(raw);
}

export function parsePresentGrantedIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of raw) {
    if (typeof id !== "string" || !id || seen.has(id)) continue;
    if (!squisheeById(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
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
  return [...opened].filter((pad) => isWalkablePad(pad)).sort((a, b) => a - b);
}

export function healPresentGrantedIds(owned: readonly string[], raw: unknown): string[] {
  const granted = new Set(parsePresentGrantedIds(raw));
  for (const spot of GRADE3_PRESENTS) {
    if (spot.kind === "squishee" && owned.includes(spot.squisheeId)) granted.add(spot.squisheeId);
  }
  for (const id of owned) {
    if (squisheeById(id)?.rarity === "rare") granted.add(id);
  }
  return [...granted].sort();
}

export function presentHostPads(blocked: ReadonlySet<number>): number[] {
  return RADIAL_PADS.filter((p) => isWalkablePad(p.id) && !blocked.has(p.id)).map((p) => p.id);
}

function pickHostPad(blocked: ReadonlySet<number>, next?: () => number): number | undefined {
  const hosts = presentHostPads(blocked);
  if (!hosts.length) return undefined;
  if (!next) return hosts[0];
  return hosts[Math.floor(next() * hosts.length)];
}

export function refillLivePresents(args: {
  live: readonly number[];
  hopperAt?: number;
  next?: () => number;
}): number[] {
  const hopper = playerPad(args.hopperAt);
  const live: number[] = [];
  const seen = new Set<number>();
  for (const pad of args.live) {
    if (!isWalkablePad(pad) || pad === hopper || seen.has(pad)) continue;
    seen.add(pad);
    live.push(pad);
  }
  while (live.length < LIVE_PRESENT_COUNT) {
    const blocked = new Set<number>([hopper, ...live]);
    const pad = pickHostPad(blocked, args.next);
    if (pad == null) break;
    live.push(pad);
  }
  return live.sort((a, b) => a - b);
}

export function healLivePresentPads(args: {
  owned: readonly string[];
  rawLive: unknown;
  rawOpened: unknown;
  saveVersion: number;
  hopperAt?: number;
}): number[] {
  const opened = healOpenedPresents(args.owned, args.rawOpened, args.saveVersion);
  if (Array.isArray(args.rawLive)) {
    return refillLivePresents({ live: parseLivePresentPads(args.rawLive), hopperAt: args.hopperAt });
  }
  const leftover = SEED_PRESENT_PADS.filter((pad) => !opened.includes(pad));
  return refillLivePresents({ live: leftover, hopperAt: args.hopperAt });
}

function unownedOf(pool: readonly { id: string }[], owned: ReadonlySet<string>): string[] {
  return pool.map((s) => s.id).filter((id) => !owned.has(id));
}

export function unownedPresentCommons(owned: readonly string[]): string[] {
  return unownedOf(COMMON_SQUISHEES, new Set(owned));
}

export function unownedPresentRares(owned: readonly string[]): string[] {
  return unownedOf(RARE_SQUISHEES, new Set(owned));
}

export function presentLootKinds(owned: readonly string[]): PresentLootKind[] {
  const skipCommon = unownedPresentCommons(owned).length === 0;
  const skipRare = unownedPresentRares(owned).length === 0;
  const kinds: PresentLootKind[] = [];
  (Object.entries(PRESENT_LOOT_WEIGHTS) as [PresentLootKind, number][]).forEach(([kind, weight]) => {
    if (kind === "common" && skipCommon) return;
    if (kind === "rare" && skipRare) return;
    for (let i = 0; i < weight; i++) kinds.push(kind);
  });
  if (kinds.length) return kinds;
  return [
    ...Array.from({ length: PRESENT_LOOT_WEIGHTS.coins }, (): PresentLootKind => "coins"),
    ...Array.from({ length: PRESENT_LOOT_WEIGHTS.rolls }, (): PresentLootKind => "rolls"),
  ];
}

function pickId(ids: readonly string[], next: () => number): string | undefined {
  if (!ids.length) return undefined;
  return ids[Math.floor(next() * ids.length)];
}

export function rollPresentLoot(owned: readonly string[], next: () => number = Math.random): LandedPresent {
  const kinds = presentLootKinds(owned);
  const kind = kinds[Math.floor(next() * kinds.length)] ?? "coins";
  switch (kind) {
    case "coins":
      return { kind: "coins", coins: PRESENT_COIN_PILE };
    case "rolls": {
      const span = PRESENT_ROLL_MAX - PRESENT_ROLL_MIN + 1;
      const rolls = PRESENT_ROLL_MIN + Math.floor(next() * span);
      return { kind: "rolls", rolls };
    }
    case "common": {
      const id = pickId(unownedPresentCommons(owned), next);
      if (!id) return { kind: "coins", coins: PRESENT_COIN_PILE };
      return { kind: "squishee", squisheeId: id };
    }
    case "rare": {
      const id = pickId(unownedPresentRares(owned), next);
      if (!id) return { kind: "coins", coins: PRESENT_COIN_PILE };
      return { kind: "squishee", squisheeId: id };
    }
    default: {
      const _never: never = kind;
      return _never;
    }
  }
}

export function visiblePresentPads(
  _owned: readonly string[] = [],
  _opened: readonly number[] = [],
  live: readonly number[] = SEED_PRESENT_PADS,
): readonly number[] {
  return parseLivePresentPads(live);
}

export function foundPresentPads(
  _owned: readonly string[] = [],
  _opened: readonly number[] = [],
): readonly number[] {
  return [];
}

export function landPresent(
  pad: number,
  owned: readonly string[],
  opened: readonly number[],
  live: readonly number[] = SEED_PRESENT_PADS,
  next: () => number = Math.random,
): LandedPresent | undefined {
  if (!live.includes(pad)) return undefined;
  void opened;
  return rollPresentLoot(owned, next);
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
  extra?: {
    live?: readonly number[];
    granted?: readonly string[];
    giftRolls?: number;
    hopperAt?: number;
    next?: () => number;
  },
): {
  ok: boolean;
  squishees: string[];
  coins: number;
  opened: number[];
  livePads: number[];
  granted: string[];
  giftRolls: number;
  reward?: LandedPresent;
} {
  const live = extra?.live ?? visiblePresentPads(owned, opened);
  const granted = parsePresentGrantedIds(extra?.granted ?? []);
  const giftRolls = clampGiftRolls(extra?.giftRolls);
  const known = [...owned, ...granted];
  const reward = landPresent(pad, known, opened, live, extra?.next);
  if (!reward) {
    return { ok: false, squishees: owned, coins, opened, livePads: [...live], granted, giftRolls };
  }
  const nextOpened = opened.includes(pad) ? opened : [...opened, pad].sort((a, b) => a - b);
  const nextLive = refillLivePresents({
    live: live.filter((id) => id !== pad),
    hopperAt: extra?.hopperAt ?? pad,
    next: extra?.next,
  });
  switch (reward.kind) {
    case "coins":
      return {
        ok: true,
        squishees: owned,
        coins: coins + reward.coins,
        opened: nextOpened,
        livePads: nextLive,
        granted,
        giftRolls,
        reward,
      };
    case "rolls":
      return {
        ok: true,
        squishees: owned,
        coins,
        opened: nextOpened,
        livePads: nextLive,
        granted,
        giftRolls: clampGiftRolls(giftRolls + reward.rolls),
        reward,
      };
    case "squishee": {
      const grant = applyUnlock(owned, reward.squisheeId);
      if (!grant.ok) {
        return {
          ok: true,
          squishees: owned,
          coins: coins + PRESENT_COIN_PILE,
          opened: nextOpened,
          livePads: nextLive,
          granted,
          giftRolls,
          reward: { kind: "coins", coins: PRESENT_COIN_PILE },
        };
      }
      return {
        ok: true,
        squishees: grant.squishees,
        coins,
        opened: nextOpened,
        livePads: nextLive,
        granted: [...new Set([...granted, reward.squisheeId])].sort(),
        giftRolls,
        reward,
      };
    }
    default: {
      const _never: never = reward;
      return _never;
    }
  }
}

/** BFS that skips present pads still reaches the outer ring. */
export function webOpenAroundPresents(): boolean {
  const skip = new Set(SEED_PRESENT_PADS);
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
  return RARE_SQUISHEES.map((s) => s.id);
}

export function grade3PresentCommons(): readonly string[] {
  return COMMON_SQUISHEES.map((s) => s.id);
}

export function heldRares(): readonly string[] {
  return RARE_SQUISHEES.map((s) => s.id);
}
