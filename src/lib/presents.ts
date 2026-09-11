import { adjacentPadIds, RADIAL_PADS, START_PAD } from "@/lib/radial-web";
import { RARE_SQUISHEES, squisheeById } from "@/lib/squishees";

export type PresentSpot = {
  pad: number;
  squisheeId: string;
};

/**
 * Grade 3 find-to-unlock rares. Fixed pad ↔ rare pairing, like mystery
 * portals — discoverable, not reshuffled every visit.
 *
 * Four ring-2 corner tiles (NE / SE / SW / NW). Not the plaza, not a
 * portal, and not a gate: the web still connects around them.
 * Remaining rares stay Shelf mysteries until a later grade.
 */
export const GRADE3_PRESENTS: readonly PresentSpot[] = [
  { pad: 12, squisheeId: "crystal-axolotl" },
  { pad: 17, squisheeId: "galaxy-narwhal" },
  { pad: 21, squisheeId: "golden-dragon" },
  { pad: 25, squisheeId: "rainbow-cupcake" },
];

export const UNWRAP_OPEN_MS = 640;
export const UNWRAP_HOLD_MS = 9000;

const presentByPad = new Map(GRADE3_PRESENTS.map((p) => [p.pad, p.squisheeId]));

export function presentSquisheeAt(pad: number): string | undefined {
  return presentByPad.get(pad);
}

export function isPresentPad(pad: number): boolean {
  return presentByPad.has(pad);
}

export function visiblePresentPads(owned: readonly string[]): readonly number[] {
  return GRADE3_PRESENTS.filter((p) => !owned.includes(p.squisheeId)).map((p) => p.pad);
}

export function foundPresentPads(owned: readonly string[]): readonly number[] {
  return GRADE3_PRESENTS.filter((p) => owned.includes(p.squisheeId)).map((p) => p.pad);
}

/** Rare waiting in that box, if the Guest does not already own it. */
export function landPresent(pad: number, owned: readonly string[]): string | undefined {
  const id = presentSquisheeAt(pad);
  if (!id || owned.includes(id)) return undefined;
  return squisheeById(id)?.rarity === "rare" ? id : undefined;
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
  return GRADE3_PRESENTS.map((p) => p.squisheeId);
}

export function heldRares(): readonly string[] {
  const onMap = new Set(grade3PresentRares());
  return RARE_SQUISHEES.filter((s) => !onMap.has(s.id)).map((s) => s.id);
}
