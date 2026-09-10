import { activityById } from "./curriculum";
import type { ActivitySave } from "./types";

export type RadialPos = { x: number; y: number };

/** Locked radial-web Lessons art. 1280×720, 16:9, circular path in pixel space. */
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

const CX = 50.08;
const CY = 47.35;

function polar(angleDeg: number, rPx: number): RadialPos {
  const th = (angleDeg * Math.PI) / 180;
  return {
    x: CX + (100 * rPx * Math.sin(th)) / RADIAL_MAP_SIZE.w,
    y: CY + (100 * -rPx * Math.cos(th)) / RADIAL_MAP_SIZE.h,
  };
}

const RING_RADIUS = [0, 96, 150, 204, 280] as const;

function buildPads(): RadialPad[] {
  const pads: RadialPad[] = [{ id: 1, map: { x: CX, y: CY }, ring: 0, angle: 0, portal: false }];
  let id = 2;
  for (let i = 0; i < 16; i++) {
    const angle = i * 22.5;
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

  for (const p of r1) {
    if (p.angle % 45 === 0) add(START_PAD, p.id);
  }
  for (let i = 0; i < r1.length; i++) add(r1[i]!.id, r2[i]!.id);
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
 * the outer ring. Not labeled in UI. Center hub is the start pad, not a warp.
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

export function hopCreditsOf(activities: Record<string, ActivitySave>, hopsSpent: number): number {
  return Math.max(0, smallLessonsCompleted(activities) - Math.max(0, Math.round(hopsSpent)));
}
