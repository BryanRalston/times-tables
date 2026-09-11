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
 * One hop node per painted path tile (cream / beige, light purple,
 * and portal-arch pads). Measured from the locked art so hops sit on
 * tiles, not grass. #70’s 4-ring polar table (81 nodes) skipped purple
 * pads and sat off-tile after the 6/7 crop.
 */
type PadSpot = { x: number; y: number; ring: RadialRing; angle: number; portal?: boolean };

const PAD_SPOTS: readonly PadSpot[] = [
  { x: 49.682, y: 46.272, ring: 0, angle: 0 },
  { x: 55.448, y: 38.237, ring: 1, angle: 51.9 },
  { x: 57.26, y: 44.075, ring: 1, angle: 80.7 },
  { x: 55.364, y: 50.124, ring: 1, angle: 110.9 },
  { x: 50.866, y: 57.397, ring: 1, angle: 169.3 },
  { x: 49.82, y: 53.159, ring: 1, angle: 178.0 },
  { x: 48.94, y: 57.406, ring: 1, angle: 186.8 },
  { x: 44.432, y: 50.112, ring: 1, angle: 247.6 },
  { x: 42.45, y: 44.138, ring: 1, angle: 279.4 },
  { x: 44.218, y: 38.245, ring: 1, angle: 309.6 },
  { x: 49.86, y: 29.631, ring: 2, angle: 1.1, portal: true },
  { x: 50.771, y: 33.108, ring: 2, angle: 8.4 },
  { x: 55.981, y: 34.205, ring: 2, angle: 42.9 },
  { x: 58.286, y: 35.092, ring: 2, angle: 53.8 },
  { x: 61.088, y: 44.231, ring: 2, angle: 84.3 },
  { x: 64.613, y: 44.066, ring: 2, angle: 85.2, portal: true },
  { x: 58.033, y: 53.856, ring: 2, angle: 117.1 },
  { x: 56.767, y: 55.307, ring: 2, angle: 125.7 },
  { x: 53.518, y: 57.544, ring: 2, angle: 148.8 },
  { x: 49.818, y: 58.302, ring: 2, angle: 178.8 },
  { x: 46.151, y: 57.504, ring: 2, angle: 209.2 },
  { x: 42.986, y: 55.273, ring: 2, angle: 232.9 },
  { x: 41.86, y: 53.84, ring: 2, angle: 241.4 },
  { x: 37.764, y: 49.099, ring: 2, angle: 262.4 },
  { x: 35.698, y: 43.915, ring: 2, angle: 275.4, portal: true },
  { x: 38.695, y: 44.241, ring: 2, angle: 275.9 },
  { x: 41.59, y: 35.222, ring: 2, angle: 307.5 },
  { x: 43.875, y: 34.217, ring: 2, angle: 319.4 },
  { x: 48.952, y: 33.181, ring: 2, angle: 354.3 },
  { x: 50.063, y: 24.352, ring: 3, angle: 1.8 },
  { x: 54.3, y: 24.902, ring: 3, angle: 21.0 },
  { x: 57.82, y: 26.16, ring: 3, angle: 35.7 },
  { x: 63.729, y: 29.631, ring: 3, angle: 56.3 },
  { x: 66.273, y: 34.47, ring: 3, angle: 68.2 },
  { x: 68.474, y: 38.827, ring: 3, angle: 77.4 },
  { x: 70.149, y: 44.105, ring: 3, angle: 86.6 },
  { x: 68.261, y: 49.751, ring: 3, angle: 96.0 },
  { x: 66.825, y: 54.724, ring: 3, angle: 105.5 },
  { x: 63.711, y: 60.475, ring: 3, angle: 119.7 },
  { x: 58.865, y: 63.823, ring: 3, angle: 137.1 },
  { x: 54.949, y: 65.376, ring: 3, angle: 153.9 },
  { x: 49.812, y: 69.04, ring: 3, angle: 179.4, portal: true },
  { x: 44.849, y: 65.481, ring: 3, angle: 204.1 },
  { x: 40.923, y: 63.832, ring: 3, angle: 221.6 },
  { x: 33.058, y: 54.749, ring: 3, angle: 254.0 },
  { x: 31.418, y: 49.687, ring: 3, angle: 264.0 },
  { x: 29.819, y: 44.086, ring: 3, angle: 273.5 },
  { x: 31.393, y: 38.853, ring: 3, angle: 282.9 },
  { x: 33.625, y: 34.53, ring: 3, angle: 292.4 },
  { x: 36.177, y: 29.689, ring: 3, angle: 304.6 },
  { x: 42.083, y: 26.105, ring: 3, angle: 326.2 },
  { x: 45.617, y: 24.961, ring: 3, angle: 341.3 },
  { x: 49.751, y: 15.003, ring: 4, angle: 0.2, portal: true },
  { x: 50.793, y: 18.417, ring: 4, angle: 4.1 },
  { x: 53.932, y: 15.302, ring: 4, angle: 13.7 },
  { x: 57.811, y: 16.068, ring: 4, angle: 25.6 },
  { x: 58.847, y: 16.612, ring: 4, angle: 28.8 },
  { x: 61.556, y: 17.407, ring: 4, angle: 36.2 },
  { x: 65.145, y: 19.496, ring: 4, angle: 45.8, portal: true },
  { x: 68.611, y: 22.436, ring: 4, angle: 54.7 },
  { x: 66.151, y: 26.163, ring: 4, angle: 55.5 },
  { x: 71.504, y: 25.683, ring: 4, angle: 62.0 },
  { x: 73.933, y: 29.594, ring: 4, angle: 68.9 },
  { x: 75.824, y: 34.011, ring: 4, angle: 75.2 },
  { x: 77.12, y: 39.019, ring: 4, angle: 81.5 },
  { x: 73.816, y: 44.294, ring: 4, angle: 87.4 },
  { x: 77.749, y: 44.124, ring: 4, angle: 87.5, portal: true },
  { x: 77.774, y: 49.379, ring: 4, angle: 93.6 },
  { x: 77.18, y: 54.757, ring: 4, angle: 99.8 },
  { x: 75.673, y: 59.902, ring: 4, angle: 106.4 },
  { x: 72.698, y: 63.538, ring: 4, angle: 112.9 },
  { x: 71.34, y: 66.848, ring: 4, angle: 118.1 },
  { x: 69.809, y: 68.521, ring: 4, angle: 121.9, portal: true },
  { x: 68.948, y: 70.104, ring: 4, angle: 124.8 },
  { x: 66.188, y: 72.988, ring: 4, angle: 132.3 },
  { x: 60.377, y: 76.86, ring: 4, angle: 148.1 },
  { x: 59.016, y: 77.502, ring: 4, angle: 152.0 },
  { x: 54.895, y: 78.657, ring: 4, angle: 164.0 },
  { x: 53.436, y: 76.193, ring: 4, angle: 167.4 },
  { x: 49.826, y: 73.799, ring: 4, angle: 179.5 },
  { x: 46.378, y: 76.28, ring: 4, angle: 191.1 },
  { x: 44.791, y: 78.756, ring: 4, angle: 195.0, portal: true },
  { x: 40.456, y: 77.398, ring: 4, angle: 207.8 },
  { x: 39.282, y: 76.938, ring: 4, angle: 211.1 },
  { x: 33.318, y: 72.954, ring: 4, angle: 227.5 },
  { x: 30.552, y: 70.102, ring: 4, angle: 235.0 },
  { x: 29.694, y: 68.575, ring: 4, angle: 237.9, portal: true },
  { x: 28.148, y: 66.876, ring: 4, angle: 241.7 },
  { x: 26.937, y: 63.62, ring: 4, angle: 246.8 },
  { x: 24.122, y: 59.706, ring: 4, angle: 253.5 },
  { x: 22.64, y: 54.81, ring: 4, angle: 259.9 },
  { x: 21.965, y: 49.365, ring: 4, angle: 266.4 },
  { x: 22.055, y: 43.997, ring: 4, angle: 272.7, portal: true },
  { x: 26.039, y: 44.295, ring: 4, angle: 272.7 },
  { x: 22.682, y: 38.914, ring: 4, angle: 278.7 },
  { x: 23.969, y: 34.031, ring: 4, angle: 285.0 },
  { x: 25.908, y: 29.611, ring: 4, angle: 291.5 },
  { x: 28.291, y: 25.723, ring: 4, angle: 298.4 },
  { x: 33.758, y: 26.111, ring: 4, angle: 305.5 },
  { x: 31.246, y: 22.363, ring: 4, angle: 306.1 },
  { x: 34.631, y: 19.42, ring: 4, angle: 315.1, portal: true },
  { x: 38.188, y: 17.368, ring: 4, angle: 324.7 },
  { x: 41.095, y: 16.441, ring: 4, angle: 332.9 },
  { x: 41.969, y: 16.026, ring: 4, angle: 335.6 },
  { x: 45.853, y: 15.242, ring: 4, angle: 347.6 },
  { x: 48.953, y: 18.444, ring: 4, angle: 357.3 },
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
  [1, 2], [1, 3], [1, 4], [1, 6], [1, 8], [1, 9], [1, 10], [1, 12],
  [2, 13], [2, 14], [3, 15], [4, 17], [4, 18], [5, 19], [5, 20], [6, 19],
  [6, 21], [7, 20], [7, 21], [8, 22], [8, 23], [9, 26], [10, 27], [10, 28],
  [11, 12], [11, 29], [11, 30], [11, 31], [11, 52], [12, 13], [12, 29], [13, 14],
  [15, 16], [16, 35], [16, 36], [16, 37], [17, 18], [18, 19], [21, 22], [22, 23],
  [23, 24], [24, 25], [24, 26], [25, 26], [25, 47], [25, 48], [27, 28], [28, 29],
  [30, 31], [30, 52], [30, 54], [30, 106], [31, 32], [33, 34], [33, 61], [34, 35],
  [35, 36], [36, 37], [36, 66], [37, 38], [38, 39], [39, 40], [40, 41], [41, 42],
  [42, 43], [42, 80], [43, 44], [45, 46], [46, 47], [47, 48], [47, 94], [48, 49],
  [49, 50], [50, 99], [51, 52], [53, 54], [53, 55], [53, 105], [53, 106], [54, 55],
  [54, 106], [55, 56], [56, 57], [57, 58], [58, 59], [59, 60], [59, 61], [60, 61],
  [60, 62], [61, 62], [62, 63], [63, 64], [64, 65], [65, 66], [65, 67], [66, 67],
  [66, 68], [67, 68], [68, 69], [69, 70], [70, 71], [71, 72], [72, 73], [73, 74],
  [74, 75], [76, 77], [77, 78], [77, 79], [78, 79], [79, 80], [80, 81], [81, 82],
  [81, 83], [82, 83], [83, 84], [85, 86], [86, 87], [87, 88], [88, 89], [89, 90],
  [90, 91], [91, 92], [92, 93], [92, 94], [93, 94], [93, 95], [94, 95], [95, 96],
  [96, 97], [97, 98], [98, 99], [98, 100], [99, 100], [99, 101], [100, 101], [101, 102],
  [102, 103], [103, 104], [104, 105], [105, 106],
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
