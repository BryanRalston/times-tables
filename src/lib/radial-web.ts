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

/** Painted plaza center on radial-web-locked.jpg (1280×720). */
export const RADIAL_PLAZA = { x: 49.682, y: 46.272 } as const;

/**
 * One hop node per painted path tile: cream / beige, light pink, and
 * purple (including portal-arch floors). Grass, flowers, trees, and
 * water are not hoppable. Measured on radial-web-locked.jpg so each
 * painted walkable square is a real adjacent move. #70 polar nodes
 * (plaza 49.88/45.15, r=85) sat on grass NE of the inner north gate
 * and between the plaza and the north cream pad — hops must land on
 * the tile center, not those gaps.
 */
type PadSpot = { x: number; y: number; ring: RadialRing; angle: number; portal?: boolean };

const PAD_SPOTS: readonly PadSpot[] = [
  { x: 49.682, y: 46.272, ring: 0, angle: 0 },
  { x: 50.547, y: 39.167, ring: 2, angle: 6.9, portal: true },
  { x: 55.391, y: 38.472, ring: 1, angle: 36.2 },
  { x: 57.109, y: 44.028, ring: 1, angle: 73.2 },
  { x: 55.391, y: 50.278, ring: 1, angle: 125.1 },
  { x: 50.262, y: 57.338, ring: 1, angle: 177.3 },
  { x: 49.453, y: 53.333, ring: 1, angle: 181.9 },
  { x: 44.375, y: 50.417, ring: 1, angle: 232.0 },
  { x: 42.109, y: 44.167, ring: 1, angle: 285.5 },
  { x: 44.219, y: 38.472, ring: 1, angle: 325.0 },
  { x: 49.833, y: 33.126, ring: 2, angle: 0.7 },
  { x: 60.625, y: 30.556, ring: 2, angle: 34.8 },
  { x: 58.281, y: 35.000, ring: 2, angle: 37.3 },
  { x: 60.781, y: 44.167, ring: 2, angle: 79.3 },
  { x: 64.922, y: 44.167, ring: 2, angle: 82.1, portal: true },
  { x: 58.203, y: 53.889, ring: 2, angle: 131.8 },
  { x: 58.828, y: 63.750, ring: 2, angle: 152.4 },
  { x: 55.078, y: 65.278, ring: 2, angle: 164.2 },
  { x: 50.322, y: 62.762, ring: 2, angle: 177.8, portal: true },
  { x: 44.844, y: 65.417, ring: 2, angle: 194.2 },
  { x: 40.781, y: 63.750, ring: 2, angle: 207.0 },
  { x: 41.719, y: 53.889, ring: 2, angle: 226.3 },
  { x: 35.234, y: 44.306, ring: 2, angle: 277.7, portal: true },
  { x: 38.594, y: 44.167, ring: 2, angle: 280.7 },
  { x: 41.484, y: 35.417, ring: 2, angle: 322.9 },
  { x: 49.219, y: 29.583, ring: 2, angle: 358.4 },
  { x: 50.313, y: 23.611, ring: 3, angle: 1.6 },
  { x: 54.531, y: 25.000, ring: 3, angle: 12.8 },
  { x: 57.578, y: 26.111, ring: 3, angle: 21.4 },
  { x: 66.094, y: 26.111, ring: 3, angle: 39.1 },
  { x: 63.438, y: 29.583, ring: 3, angle: 39.5 },
  { x: 66.250, y: 34.444, ring: 3, angle: 54.5 },
  { x: 68.594, y: 39.167, ring: 3, angle: 69.4 },
  { x: 69.766, y: 44.167, ring: 3, angle: 84.0 },
  { x: 73.828, y: 44.167, ring: 3, angle: 85.0 },
  { x: 68.672, y: 49.861, ring: 3, angle: 100.7 },
  { x: 66.953, y: 54.861, ring: 3, angle: 116.4 },
  { x: 63.906, y: 60.278, ring: 3, angle: 134.6 },
  { x: 66.719, y: 64.444, ring: 3, angle: 136.8 },
  { x: 50.156, y: 68.889, ring: 3, angle: 178.8 },
  { x: 49.609, y: 74.583, ring: 3, angle: 180.1 },
  { x: 33.047, y: 64.444, ring: 3, angle: 222.5 },
  { x: 36.094, y: 60.278, ring: 3, angle: 224.1 },
  { x: 32.812, y: 54.861, ring: 3, angle: 243.0 },
  { x: 31.484, y: 49.722, ring: 3, angle: 259.3 },
  { x: 25.859, y: 44.167, ring: 3, angle: 275.0 },
  { x: 29.531, y: 44.167, ring: 3, angle: 276.0 },
  { x: 31.406, y: 38.333, ring: 3, angle: 293.5 },
  { x: 33.594, y: 34.444, ring: 3, angle: 306.3 },
  { x: 36.406, y: 29.722, ring: 3, angle: 321.3 },
  { x: 33.750, y: 26.111, ring: 3, angle: 321.7 },
  { x: 42.188, y: 26.111, ring: 3, angle: 339.6 },
  { x: 45.234, y: 25.000, ring: 3, angle: 348.2 },
  { x: 48.923, y: 18.515, ring: 3, angle: 358.5 },
  { x: 53.438, y: 15.278, ring: 4, angle: 6.9 },
  { x: 57.344, y: 15.972, ring: 4, angle: 14.2 },
  { x: 59.033, y: 16.408, ring: 4, angle: 18.1 },
  { x: 61.797, y: 17.639, ring: 4, angle: 22.9 },
  { x: 65.000, y: 19.583, ring: 4, angle: 29.9, portal: true },
  { x: 68.594, y: 22.500, ring: 4, angle: 38.5 },
  { x: 71.484, y: 25.833, ring: 4, angle: 46.8 },
  { x: 73.984, y: 29.583, ring: 4, angle: 55.5 },
  { x: 76.016, y: 34.028, ring: 4, angle: 65.1 },
  { x: 77.500, y: 38.889, ring: 4, angle: 75.1 },
  { x: 77.344, y: 44.167, ring: 4, angle: 85.6, portal: true },
  { x: 77.734, y: 49.583, ring: 4, angle: 96.7 },
  { x: 77.188, y: 54.861, ring: 4, angle: 107.3 },
  { x: 75.781, y: 60.000, ring: 4, angle: 117.7 },
  { x: 74.380, y: 70.010, ring: 4, angle: 133.9, portal: true },
  { x: 70.156, y: 68.750, ring: 4, angle: 137.7 },
  { x: 66.719, y: 72.639, ring: 4, angle: 147.1 },
  { x: 63.438, y: 75.278, ring: 4, angle: 154.6 },
  { x: 58.906, y: 77.639, ring: 4, angle: 163.6 },
  { x: 55.156, y: 78.611, ring: 4, angle: 170.4 },
  { x: 49.828, y: 82.449, ring: 4, angle: 179.7, portal: true },
  { x: 45.312, y: 78.889, ring: 4, angle: 187.6 },
  { x: 40.703, y: 77.639, ring: 4, angle: 196.0 },
  { x: 36.406, y: 75.417, ring: 4, angle: 204.5 },
  { x: 32.734, y: 72.361, ring: 4, angle: 213.0 },
  { x: 29.531, y: 68.472, ring: 4, angle: 222.2 },
  { x: 26.782, y: 64.009, ring: 4, angle: 232.0, portal: true },
  { x: 23.828, y: 60.000, ring: 4, angle: 242.0 },
  { x: 22.344, y: 54.861, ring: 4, angle: 252.6 },
  { x: 21.406, y: 49.444, ring: 4, angle: 263.6 },
  { x: 21.719, y: 44.028, ring: 4, angle: 274.6, portal: true },
  { x: 22.578, y: 38.889, ring: 4, angle: 285.2 },
  { x: 24.062, y: 34.167, ring: 4, angle: 295.3 },
  { x: 26.016, y: 29.722, ring: 4, angle: 305.0 },
  { x: 28.359, y: 25.833, ring: 4, angle: 313.8, portal: true },
  { x: 31.406, y: 22.222, ring: 4, angle: 322.8 },
  { x: 35.000, y: 19.306, ring: 4, angle: 331.4 },
  { x: 38.672, y: 17.222, ring: 4, angle: 339.2 },
  { x: 41.562, y: 16.111, ring: 4, angle: 344.9 },
  { x: 46.406, y: 15.139, ring: 4, angle: 354.0 },
  { x: 49.219, y: 15.000, ring: 4, angle: 359.2, portal: true }
];

function buildPads(): RadialPad[] {
  return PAD_SPOTS.map((spot, i) => ({
    id: i + 1,
    map: { x: spot.x, y: spot.y },
    ring: spot.ring,
    angle: spot.angle,
    portal: Boolean(spot.portal),
  }));
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

function angleDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/** Adjacent = sharing a painted-path connection. No grass skips. */
const PAD_EDGES: readonly (readonly [number, number])[] = [
  [1, 2], [1, 3], [1, 4], [1, 5], [1, 7], [1, 8],
  [1, 9], [1, 10], [2, 3], [2, 10], [2, 11], [3, 4],
  [3, 11], [3, 13], [3, 14], [4, 5], [4, 14], [5, 7],
  [5, 16], [6, 7], [6, 19], [7, 8], [8, 9], [8, 22],
  [9, 10], [9, 24], [10, 11], [10, 25], [11, 26], [12, 13],
  [12, 29], [12, 31], [14, 15], [15, 33], [15, 34], [15, 36],
  [17, 18], [17, 38], [18, 19], [18, 40], [19, 20], [19, 40],
  [20, 21], [20, 40], [21, 43], [23, 24], [23, 45], [23, 47],
  [23, 48], [26, 27], [26, 28], [26, 53], [27, 28], [27, 53],
  [27, 54], [28, 29], [29, 31], [30, 31], [30, 32], [30, 59],
  [30, 60], [30, 61], [31, 32], [32, 33], [33, 34], [33, 35],
  [34, 35], [34, 36], [35, 36], [35, 64], [35, 65], [35, 66],
  [36, 37], [37, 38], [38, 39], [39, 70], [39, 71], [40, 41],
  [41, 74], [41, 75], [41, 76], [42, 43], [42, 79], [42, 80],
  [42, 81], [43, 44], [44, 45], [45, 46], [45, 47], [46, 47],
  [46, 84], [46, 85], [46, 86], [47, 48], [48, 49], [49, 50],
  [49, 51], [50, 51], [50, 52], [51, 89], [51, 90], [51, 91],
  [52, 53], [53, 54], [54, 55], [54, 94], [54, 95], [55, 56],
  [55, 95], [56, 57], [57, 58], [58, 59], [59, 60], [60, 61],
  [61, 62], [62, 63], [63, 64], [64, 65], [65, 66], [66, 67],
  [67, 68], [69, 70], [70, 71], [71, 72], [72, 73], [73, 74],
  [74, 75], [75, 76], [76, 77], [77, 78], [78, 79], [79, 80],
  [80, 81], [81, 82], [82, 83], [83, 84], [84, 85], [85, 86],
  [86, 87], [87, 88], [88, 89], [89, 90], [90, 91], [91, 92],
  [92, 93], [93, 94], [94, 95],
  [16, 17], [21, 22], [25, 26], [68, 69], [69, 71],
];

function buildEdges(): readonly (readonly [number, number])[] {
  return PAD_EDGES;
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
function nearestAtAngle(row: RadialPad[], angle: number, maxDeg = 28): RadialPad | undefined {
  let best: RadialPad | undefined;
  let bestD = maxDeg;
  for (const p of row) {
    const d = angleDiff(p.angle, angle);
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

function buildPortalPairs(): readonly (readonly [number, number])[] {
  const portals = RADIAL_PADS.filter((p) => p.portal);
  const inner = portals.filter((p) => p.ring === 2 || p.ring === 3);
  const outer = portals.filter((p) => p.ring === 4);
  const pairs: [number, number][] = [];
  const link = (a?: RadialPad, b?: RadialPad) => {
    if (a && b && a.id !== b.id) pairs.push([a.id, b.id]);
  };
  link(nearestAtAngle(inner, 0), nearestAtAngle(inner, 180));
  link(nearestAtAngle(inner, 90), nearestAtAngle(inner, 270));
  link(nearestAtAngle(outer, 0), nearestAtAngle(outer, 180));
  link(nearestAtAngle(outer, 45), nearestAtAngle(outer, 225));
  link(nearestAtAngle(outer, 90), nearestAtAngle(outer, 270));
  link(nearestAtAngle(outer, 135), nearestAtAngle(outer, 315));
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

export type HopCardinal = "up" | "down" | "left" | "right";

export type HopDir = {
  id: number;
  /** 0 = north / up, clockwise, in painted-art pixels. */
  bearing: number;
  cardinal: HopCardinal | null;
  portal: boolean;
};

/** Within this of a compass point counts as a cardinal button, not an angled spoke. */
const CARDINAL_ALIGN_DEG = 16;

/** Fat-finger snap from the squishee to the nearest visible direction. */
export const HOP_DIR_SNAP_DEG = 32;

/** Ignore taps on the face; ignore taps past the direction ring. */
export const HOP_DIR_MIN_PX = 22;
export const HOP_DIR_MAX_PX = 78;

function hopBearingDeg(fromId: number, toId: number): number {
  const a = radialPad(fromId).map;
  const b = radialPad(toId).map;
  const dx = ((b.x - a.x) / 100) * RADIAL_MAP_SIZE.w;
  const dy = ((b.y - a.y) / 100) * RADIAL_MAP_SIZE.h;
  return (Math.atan2(dx, -dy) * 180) / Math.PI;
}

function wrapDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function cardinalOfBearing(bearing: number): HopCardinal | null {
  const slots: { c: HopCardinal; a: number }[] = [
    { c: "up", a: 0 },
    { c: "right", a: 90 },
    { c: "down", a: 180 },
    { c: "left", a: 270 },
  ];
  let best: HopCardinal | null = null;
  let bestD = CARDINAL_ALIGN_DEG;
  for (const s of slots) {
    const d = angleDiff(wrapDeg(bearing), s.a);
    if (d < bestD) {
      bestD = d;
      best = s.c;
    }
  }
  return best;
}

/** Valid one-space hops from a pad, each aimed along the painted path. */
export function hopDirs(fromId: number): readonly HopDir[] {
  return adjacentPadIds(fromId)
    .map((id) => {
      const bearing = wrapDeg(hopBearingDeg(fromId, id));
      return { id, bearing, cardinal: cardinalOfBearing(bearing), portal: isPortalPad(id) };
    })
    .sort((a, b) => a.bearing - b.bearing || a.id - b.id);
}

/**
 * Nearest visible direction around the squishee. Taps on the face or
 * outside the ring do not hop. Tie-break is smaller bearing, then id.
 */
export function nearestHopDir(
  originX: number,
  originY: number,
  tapX: number,
  tapY: number,
  dirs: readonly HopDir[],
  snapDeg = HOP_DIR_SNAP_DEG,
  minPx = HOP_DIR_MIN_PX,
  maxPx = HOP_DIR_MAX_PX,
): number | undefined {
  if (!dirs.length || snapDeg <= 0) return undefined;
  const dist = Math.hypot(tapX - originX, tapY - originY);
  if (dist < minPx || dist > maxPx) return undefined;
  const bearing = wrapDeg((Math.atan2(tapX - originX, -(tapY - originY)) * 180) / Math.PI);
  let bestId: number | undefined;
  let bestD = snapDeg;
  let bestBearing = 361;
  for (const d of dirs) {
    const gap = angleDiff(bearing, d.bearing);
    if (gap < bestD || (gap === bestD && (d.bearing < bestBearing || (d.bearing === bestBearing && (bestId == null || d.id < bestId))))) {
      bestD = gap;
      bestId = d.id;
      bestBearing = d.bearing;
    }
  }
  return bestId;
}

/**
 * Phone-fair snap radius kept for pad-space math. Plaza neighbors sit
 * ~39px apart on the 6/7 stage. Direction-pad hits use nearestHopDir.
 */
export const HOP_SNAP_PX = 36;

/**
 * Visible radial card on a 390 phone after scroll pad + 4px frame.
 * CSS `.candy-world` caps at 6/7 so the island grows without shearing
 * the outer E/W portal arches off the card. The Lessons plate may be
 * taller — leftover column is studio white, not a deeper crop.
 */
export const PHONE_MAP_VIEW = { width: 368, height: (368 * 7) / 6 } as const;

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

/** Steps only exist after a roll is spent. Spent 0 means a leftover "N left" is stale. */
export function activePathStepsLeft(pathHopSpent: unknown, pathStepsLeft: unknown): number {
  const spent =
    typeof pathHopSpent === "number" && Number.isFinite(pathHopSpent) ? Math.max(0, Math.round(pathHopSpent)) : 0;
  if (spent <= 0) return 0;
  return clampPathStepsLeft(pathStepsLeft);
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

function grade3DailyWalkKeyCount(activities: Record<string, ActivitySave>): number {
  let n = 0;
  for (const [id, save] of Object.entries(activities)) {
    if (save.plays && isGrade3DailyWalkId(id)) n += 1;
  }
  return n;
}

/**
 * #66 collapsed many `daily:${unit}` keys into one calendar-day credit.
 * A Guest who already rolled a farmed extra turn can be left with spent ≥ 1
 * and leftover steps, so Lessons shows "N left" instead of the one real roll.
 * Refund those extra spends once (pre-v14) and never keep steps with no turn.
 */
export function migrateDiceTurnState(args: {
  activities: Record<string, ActivitySave>;
  pathHopSpent: number;
  pathStepsLeft: number;
  saveVersion: unknown;
}): { pathHopSpent: number; pathStepsLeft: number } {
  const version = typeof args.saveVersion === "number" && Number.isFinite(args.saveVersion) ? args.saveVersion : 0;
  let spent = Math.max(0, Math.round(args.pathHopSpent));
  let steps = clampPathStepsLeft(args.pathStepsLeft);
  if (version < 14) {
    const extra = Math.max(0, grade3DailyWalkKeyCount(args.activities) - 1);
    if (extra > 0) {
      spent = Math.max(0, spent - extra);
      steps = 0;
    }
  }
  if (spent <= 0) steps = 0;
  return { pathHopSpent: spent, pathStepsLeft: steps };
}
