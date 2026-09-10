import { activityById } from "./curriculum";
import type { ActivitySave, DaySession } from "./types";

export type RadialPos = { x: number; y: number };

/** Locked radial-web Lessons art. 1280×720, 16:9. Do not redesign. */
export const RADIAL_MAP_FILE = "candy-zones/radial-web-locked.jpg";

export const RADIAL_MAP_SIZE = { w: 1280, h: 720 } as const;

export const START_PAD = 1;

export type RadialRing = 0 | 1 | 2 | 3 | 4;

export type RadialPad = {
  id: number;
  map: RadialPos;
  ring: RadialRing;
  angle: number;
  portal: boolean;
};

/**
 * Pixel-space center of the painted plaza. Percent coords so hops sit on
 * the circular board (y = 0 is the top of the JPG).
 */
const CX = 50.04;
const CY = 47.35;

function polar(angleDeg: number, rPx: number): RadialPos {
  const th = (angleDeg * Math.PI) / 180;
  return {
    x: CX + (100 * rPx * Math.sin(th)) / RADIAL_MAP_SIZE.w,
    y: CY + (100 * -rPx * Math.cos(th)) / RADIAL_MAP_SIZE.h,
  };
}

/**
 * Ring radii in art pixels, tuned so pads land on painted tiles:
 * inner 8 around the plaza, inner swirl ring, mid ring, outer walking ring.
 */
const RING_RADIUS = [0, 92, 172, 228, 274] as const;

function buildPads(): RadialPad[] {
  const pads: RadialPad[] = [{ id: 1, map: { x: CX, y: CY }, ring: 0, angle: 0, portal: false }];
  let id = 2;
  for (let i = 0; i < 8; i++) {
    const angle = i * 45;
    pads.push({ id: id++, map: polar(angle, RING_RADIUS[1]), ring: 1, angle, portal: false });
  }
  for (let i = 0; i < 16; i++) {
    const angle = i * 22.5;
    pads.push({
      id: id++,
      map: polar(angle, RING_RADIUS[2]),
      ring: 2,
      angle,
      portal: angle % 90 === 0,
    });
  }
  for (let i = 0; i < 16; i++) {
    const angle = i * 22.5;
    pads.push({ id: id++, map: polar(angle, RING_RADIUS[3]), ring: 3, angle, portal: false });
  }
  for (let i = 0; i < 40; i++) {
    const angle = i * 9;
    pads.push({
      id: id++,
      map: polar(angle, RING_RADIUS[4]),
      ring: 4,
      angle,
      portal: angle % 45 === 0,
    });
  }
  return pads;
}

export const RADIAL_PADS: readonly RadialPad[] = buildPads();

export const RADIAL_PAD_COUNT = RADIAL_PADS.length;

const byId = new Map(RADIAL_PADS.map((p) => [p.id, p]));

export function radialPad(id: number): RadialPad {
  return byId.get(clampPad(id)) ?? RADIAL_PADS[0]!;
}

export function clampPad(n: unknown): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return START_PAD;
  return Math.min(RADIAL_PAD_COUNT, Math.max(START_PAD, Math.round(n)));
}

function ringPads(ring: RadialRing): RadialPad[] {
  return RADIAL_PADS.filter((p) => p.ring === ring);
}

function angleDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function buildEdges(): readonly (readonly [number, number])[] {
  const edges: [number, number][] = [];
  const add = (a: number, b: number) => {
    if (a === b) return;
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    if (!edges.some(([x, y]) => x === lo && y === hi)) edges.push([lo, hi]);
  };

  for (const ring of [1, 2, 3, 4] as const) {
    const row = ringPads(ring);
    for (let i = 0; i < row.length; i++) add(row[i]!.id, row[(i + 1) % row.length]!.id);
  }

  const r1 = ringPads(1);
  const r2 = ringPads(2);
  const r3 = ringPads(3);
  const r4 = ringPads(4);

  for (const p of r1) add(START_PAD, p.id);
  for (const inner of r1) {
    let best: RadialPad | undefined;
    let bestD = 8;
    for (const outer of r2) {
      const d = angleDiff(inner.angle, outer.angle);
      if (d < bestD) {
        bestD = d;
        best = outer;
      }
    }
    if (best) add(inner.id, best.id);
  }
  for (let i = 0; i < r2.length; i++) add(r2[i]!.id, r3[i]!.id);
  for (const inner of r3) {
    let best: RadialPad | undefined;
    let bestD = 8;
    for (const outer of r4) {
      const d = angleDiff(inner.angle, outer.angle);
      if (d < bestD) {
        bestD = d;
        best = outer;
      }
    }
    if (best) add(inner.id, best.id);
  }
  return edges;
}

export const RADIAL_EDGES: readonly (readonly [number, number])[] = buildEdges();

const adj = new Map<number, number[]>();
for (const pad of RADIAL_PADS) adj.set(pad.id, []);
for (const [a, b] of RADIAL_EDGES) {
  adj.get(a)!.push(b);
  adj.get(b)!.push(a);
}
for (const [id, list] of adj) adj.set(id, [...new Set(list)].sort((x, y) => x - y));

export function adjacentPadIds(id: number): readonly number[] {
  return adj.get(clampPad(id)) ?? [];
}

export function areAdjacent(a: number, b: number): boolean {
  return adjacentPadIds(a).includes(clampPad(b));
}

/** One-space hop only. Never lists intermediate pads. */
export function radialHopStops(fromId: number, toId: number): number[] {
  const a = clampPad(fromId);
  const b = clampPad(toId);
  if (a === b) return [a];
  if (areAdjacent(a, b)) return [a, b];
  return [a];
}

/**
 * Fixed mystery-portal pairs. Opposite gates on the inner swirl ring and
 * the outer ring. Not labeled in UI. Center plaza is the start pad, not a warp.
 *
 * Inner N↔S, E↔W. Outer N↔S, NE↔SW, E↔W, SE↔NW.
 */
function buildPortalPairs(): readonly (readonly [number, number])[] {
  const inner = ringPads(2).filter((p) => p.portal);
  const outer = ringPads(4).filter((p) => p.portal);
  const at = (row: RadialPad[], angle: number) => row.find((p) => p.angle === angle);
  const pairs: [number, number][] = [];
  const link = (a?: RadialPad, b?: RadialPad) => {
    if (a && b) pairs.push([a.id, b.id]);
  };
  link(at(inner, 0), at(inner, 180));
  link(at(inner, 90), at(inner, 270));
  link(at(outer, 0), at(outer, 180));
  link(at(outer, 45), at(outer, 225));
  link(at(outer, 90), at(outer, 270));
  link(at(outer, 135), at(outer, 315));
  return pairs;
}

export const PORTAL_PAIRS: readonly (readonly [number, number])[] = buildPortalPairs();

const portalExit = new Map<number, number>();
for (const [a, b] of PORTAL_PAIRS) {
  portalExit.set(a, b);
  portalExit.set(b, a);
}

export function portalPartner(id: number): number | undefined {
  return portalExit.get(id);
}

export function isPortalPad(id: number): boolean {
  return radialPad(id).portal;
}

/**
 * Phone-fair snap radius. The Lessons card zooms the locked 16:9 board
 * (taller crop, side letterbox gone). Plaza neighbors sit ~34px apart on
 * that stage, so a 36px snap is a comfortable fat-finger circle. Hits use
 * nearest valid neighbor (plus the current pad as a tap sink). Voronoi
 * among glowing pads keeps neighbors from stealing.
 */
export const HOP_SNAP_PX = 36;

/**
 * Visible radial card on a 390 phone after 0.45rem scroll pad + 4px frame.
 * CSS `.candy-world` uses 10/9 so the island grows without shearing
 * the outer E/W portal arches off the card.
 */
export const PHONE_MAP_VIEW = { width: 368, height: (368 * 9) / 10 } as const;

/**
 * Overlay / art stage: same 16:9 as radial-web-locked.jpg, height-matched
 * to the card so pad % stays on-art. Wider than the card — sides crop.
 */
export const PHONE_MAP_BOARD = {
  left: 0,
  top: 0,
  width: PHONE_MAP_VIEW.height * (RADIAL_MAP_SIZE.w / RADIAL_MAP_SIZE.h),
  height: PHONE_MAP_VIEW.height,
} as const;

export type HopBoardRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function padClientPos(id: number, board: HopBoardRect): RadialPos {
  const p = radialPad(id).map;
  return {
    x: board.left + (p.x / 100) * board.width,
    y: board.top + (p.y / 100) * board.height,
  };
}

/**
 * Closest glowing (adjacent) pad under a tap. The current pad wins its
 * own Voronoi cell so a tap on the hopper does not hop. Quiet pads are
 * never candidates. Distance is board pixels, not map percent.
 */
export function nearestHopTarget(
  clientX: number,
  clientY: number,
  board: HopBoardRect,
  choiceIds: readonly number[],
  hereId?: number,
  snapPx = HOP_SNAP_PX,
): number | undefined {
  if (!choiceIds.length || board.width <= 0 || board.height <= 0 || snapPx <= 0) return undefined;
  const seen = new Set<number>();
  const candidates: number[] = [];
  for (const id of choiceIds) {
    const pad = clampPad(id);
    if (seen.has(pad)) continue;
    seen.add(pad);
    candidates.push(pad);
  }
  if (hereId != null) {
    const here = clampPad(hereId);
    if (!seen.has(here)) candidates.push(here);
  }
  let bestId: number | undefined;
  let bestD = Infinity;
  for (const id of candidates) {
    const p = padClientPos(id, board);
    const d = Math.hypot(clientX - p.x, clientY - p.y);
    if (d < bestD || (d === bestD && id < (bestId ?? Infinity))) {
      bestD = d;
      bestId = id;
    }
  }
  if (bestId == null || bestD > snapPx) return undefined;
  if (hereId != null && bestId === clampPad(hereId)) return undefined;
  return choiceIds.some((id) => clampPad(id) === bestId) ? bestId : undefined;
}

export function smallLessonsCompleted(activities: Record<string, ActivitySave>): number {
  let n = 0;
  for (const [id, save] of Object.entries(activities)) {
    if (!save.plays) continue;
    if (id === "welcome" || id.startsWith("daily:") || id.startsWith("g4-")) continue;
    if (!activityById(id)) continue;
    n += 1;
  }
  return n;
}

export const DIE_MIN = 1;
export const DIE_MAX = 3;
export type DieFace = 1 | 2 | 3;
export const DICE_TUMBLE_MS = 720;

export function clampDieFace(n: unknown): DieFace {
  if (typeof n !== "number" || !Number.isFinite(n)) return DIE_MIN;
  const v = Math.round(n);
  if (v <= DIE_MIN) return DIE_MIN;
  if (v >= DIE_MAX) return DIE_MAX;
  return v as DieFace;
}

export function clampPathStepsLeft(n: unknown): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return 0;
  return Math.min(DIE_MAX, Math.max(0, Math.round(n)));
}

/** Fair 1–3. Pass a 0–1 sampler in tests. */
export function rollDieFace(next = Math.random): DieFace {
  return clampDieFace(DIE_MIN + Math.floor(next() * (DIE_MAX - DIE_MIN + 1)));
}

export function canStartDiceTurn(rolls: number, stepsLeft: number): boolean {
  return rolls > 0 && clampPathStepsLeft(stepsLeft) <= 0;
}

/** Guest-local calendar day. Same-day Start replay must reuse this key. */
export function dailyWalkActivityId(date: string): string {
  return `daily:${date}`;
}

function isGrade3DailyWalkId(id: string): boolean {
  if (!id.startsWith("daily:")) return false;
  const rest = id.slice("daily:".length);
  return Boolean(rest) && !rest.startsWith("g4-");
}

function hasGrade3DailyWalk(
  activities: Record<string, ActivitySave>,
  sessions?: Record<string, DaySession>,
): boolean {
  for (const [id, save] of Object.entries(activities)) {
    if (save.plays && isGrade3DailyWalkId(id)) return true;
  }
  if (!sessions) return false;
  for (const session of Object.values(sessions)) {
    if (!session.completed) continue;
    const unitId = session.unitId;
    if (!unitId || unitId.startsWith("g4-")) continue;
    return true;
  }
  return false;
}

/**
 * Hop-earning first-time Grade 3 plays: each unique named small lesson, plus
 * the first daily walk (any Start / completed session). The daily earn key is
 * the Guest-local calendar day (`daily:YYYY-MM-DD`), not the unit. Welcome,
 * Grade 4, same-day Start replay, and a later unit from pathNow advancing do
 * not add extra rolls. Guests who only press Lessons → Start still earn one.
 */
export function hopLessonsCompleted(
  activities: Record<string, ActivitySave>,
  sessions?: Record<string, DaySession>,
): number {
  let n = 0;
  for (const [id, save] of Object.entries(activities)) {
    if (!save.plays) continue;
    if (id === "welcome" || id.startsWith("g4-") || isGrade3DailyWalkId(id)) continue;
    if (!activityById(id)) continue;
    n += 1;
  }
  if (hasGrade3DailyWalk(activities, sessions)) n += 1;
  return n;
}

/** Banked dice rolls. Same earn rules as the old hop-credit ledger. */
export function hopCreditsOf(
  activities: Record<string, ActivitySave>,
  hopsSpent: number,
  sessions?: Record<string, DaySession>,
): number {
  return Math.max(0, hopLessonsCompleted(activities, sessions) - Math.max(0, Math.round(hopsSpent)));
}

export const diceRollsOf = hopCreditsOf;

/**
 * #58 treated missing pathHopSpent as "already spent every prior lesson",
 * so a Guest with completed Grade 3 work landed on 0 hop credits.
 * Missing spent stays 0. A one-time pre-v12 heal refunds unused hops
 * (v11 Pages loads could persist a still-burned ledger):
 * hopper still at Start → all credits; otherwise leave one leftover credit.
 */
export function migratePathHopSpent(args: {
  activities: Record<string, ActivitySave>;
  sessions?: Record<string, DaySession>;
  pathHopSpent: unknown;
  pathHopperAt: unknown;
  saveVersion: unknown;
}): number {
  const completed = hopLessonsCompleted(args.activities, args.sessions);
  const hopper =
    typeof args.pathHopperAt === "number" && Number.isFinite(args.pathHopperAt)
      ? Math.max(0, Math.round(args.pathHopperAt))
      : 0;
  const version = typeof args.saveVersion === "number" && Number.isFinite(args.saveVersion) ? args.saveVersion : 0;
  if (args.pathHopSpent == null) return 0;
  const spent =
    typeof args.pathHopSpent === "number" && Number.isFinite(args.pathHopSpent)
      ? Math.max(0, Math.round(args.pathHopSpent))
      : 0;
  if (version >= 12) return spent;
  const credits = Math.max(0, completed - spent);
  if (credits > 0 || completed <= 0) return spent;
  if (hopper <= START_PAD) return 0;
  return Math.min(spent, Math.max(0, completed - 1));
}

/**
 * Mid-turn steps are new in v13. Older saves have leftover hop credits that
 * become leftover rolls; they should not inherit a half-finished turn.
 */
export function migratePathStepsLeft(args: { pathStepsLeft: unknown; saveVersion: unknown }): number {
  const version = typeof args.saveVersion === "number" && Number.isFinite(args.saveVersion) ? args.saveVersion : 0;
  if (version < 13) return 0;
  return clampPathStepsLeft(args.pathStepsLeft);
}
