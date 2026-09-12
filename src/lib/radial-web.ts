import { activityById } from "./curriculum";
import { coverMapBoard } from "./map-viewport";
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
 * water are not hoppable. Centroids measured on radial-web-locked.jpg
 * so every hop lands in the middle of a walkable square — not on the
 * #70 grass gaps (plaza 49.88/45.15, r=85 NE at ~54.58/36.80, and the
 * north-spoke polar node that sat between plaza and the inner-N pad).
 */
type PadSpot = { x: number; y: number; ring: RadialRing; angle: number; portal?: boolean };

const PAD_SPOTS: readonly PadSpot[] = [
  { x: 49.682, y: 46.272, ring: 0, angle: 0 },
  { x: 50.350, y: 39.633, ring: 2, angle: 10.1, portal: true },
  { x: 55.468, y: 38.333, ring: 1, angle: 52.3 },
  { x: 57.254, y: 44.062, ring: 1, angle: 80.7 },
  { x: 55.378, y: 50.202, ring: 1, angle: 111.2 },
  { x: 49.786, y: 57.670, ring: 1, angle: 179.1 },
  { x: 49.888, y: 53.239, ring: 1, angle: 177.0 },
  { x: 44.460, y: 50.217, ring: 1, angle: 247.0 },
  { x: 42.442, y: 44.111, ring: 1, angle: 279.5 },
  { x: 44.235, y: 38.347, ring: 1, angle: 309.3 },
  { x: 49.553, y: 33.768, ring: 2, angle: 358.9 },
  { x: 60.727, y: 30.655, ring: 2, angle: 51.5 },
  { x: 58.268, y: 35.018, ring: 2, angle: 53.6 },
  { x: 61.059, y: 44.163, ring: 2, angle: 84.0 },
  { x: 64.752, y: 44.149, ring: 2, angle: 85.5, portal: true },
  { x: 58.269, y: 53.704, ring: 2, angle: 116.0 },
  { x: 58.867, y: 63.751, ring: 2, angle: 136.9 },
  { x: 54.946, y: 65.274, ring: 2, angle: 153.8 },
  { x: 50.209, y: 62.699, ring: 2, angle: 176.7, portal: true },
  { x: 44.799, y: 65.367, ring: 2, angle: 204.4 },
  { x: 40.889, y: 63.766, ring: 2, angle: 221.8 },
  { x: 41.806, y: 53.740, ring: 2, angle: 241.9 },
  { x: 35.454, y: 44.072, ring: 2, angle: 275.0, portal: true },
  { x: 38.683, y: 44.163, ring: 2, angle: 276.2 },
  { x: 41.635, y: 35.194, ring: 2, angle: 307.8 },
  { x: 49.833, y: 29.619, ring: 2, angle: 0.9 },
  { x: 50.254, y: 23.591, ring: 3, angle: 2.6 },
  { x: 54.291, y: 24.811, ring: 3, angle: 20.9 },
  { x: 57.857, y: 26.137, ring: 3, angle: 35.8 },
  { x: 66.121, y: 26.086, ring: 3, angle: 55.4 },
  { x: 63.683, y: 29.549, ring: 3, angle: 56.1 },
  { x: 66.278, y: 34.370, ring: 3, angle: 68.0 },
  { x: 68.450, y: 38.756, ring: 3, angle: 77.3 },
  { x: 70.215, y: 44.076, ring: 3, angle: 86.6 },
  { x: 73.777, y: 44.189, ring: 3, angle: 87.2 },
  { x: 68.284, y: 49.722, ring: 3, angle: 96.0 },
  { x: 66.796, y: 54.633, ring: 3, angle: 105.4 },
  { x: 63.765, y: 60.454, ring: 3, angle: 119.5 },
  { x: 66.709, y: 64.422, ring: 3, angle: 120.9 },
  { x: 49.769, y: 69.094, ring: 3, angle: 179.6 },
  { x: 49.680, y: 74.575, ring: 3, angle: 180.0 },
  { x: 32.945, y: 64.455, ring: 3, angle: 238.6 },
  { x: 36.120, y: 60.252, ring: 3, angle: 239.9 },
  { x: 33.030, y: 54.646, ring: 3, angle: 254.2 },
  { x: 31.497, y: 49.706, ring: 3, angle: 263.9 },
  { x: 25.983, y: 44.130, ring: 3, angle: 272.9 },
  { x: 29.794, y: 44.042, ring: 3, angle: 273.6 },
  { x: 31.636, y: 39.007, ring: 3, angle: 282.8 },
  { x: 33.600, y: 34.416, ring: 3, angle: 292.5 },
  { x: 36.421, y: 29.426, ring: 3, angle: 305.5 },
  { x: 33.757, y: 26.014, ring: 3, angle: 305.6 },
  { x: 42.050, y: 26.083, ring: 3, angle: 326.1 },
  { x: 45.607, y: 24.844, ring: 3, angle: 341.3 },
  { x: 50.346, y: 6.921, ring: 4, angle: 1.7, portal: true },
  { x: 53.922, y: 15.229, ring: 4, angle: 13.6 },
  { x: 57.767, y: 15.993, ring: 4, angle: 25.4 },
  { x: 25.629, y: 70.821, ring: 4, angle: 240.1, portal: true },
  { x: 61.522, y: 17.408, ring: 4, angle: 36.1 },
  { x: 65.171, y: 19.572, ring: 4, angle: 45.9, portal: true },
  { x: 68.573, y: 22.357, ring: 4, angle: 54.5 },
  { x: 71.529, y: 25.765, ring: 4, angle: 62.2 },
  { x: 73.933, y: 29.586, ring: 4, angle: 68.8 },
  { x: 75.823, y: 34.089, ring: 4, angle: 75.3 },
  { x: 77.098, y: 38.927, ring: 4, angle: 81.4 },
  { x: 77.721, y: 44.072, ring: 4, angle: 87.5, portal: true },
  { x: 77.835, y: 49.483, ring: 4, angle: 93.7 },
  { x: 77.169, y: 54.724, ring: 4, angle: 99.8 },
  { x: 75.667, y: 59.838, ring: 4, angle: 106.4 },
  { x: 74.358, y: 70.072, ring: 4, angle: 118.5, portal: true },
  { x: 69.837, y: 68.426, ring: 4, angle: 121.7 },
  { x: 66.896, y: 72.421, ring: 4, angle: 130.5 },
  { x: 63.209, y: 75.386, ring: 4, angle: 140.4 },
  { x: 59.040, y: 77.553, ring: 4, angle: 152.0 },
  { x: 54.852, y: 78.557, ring: 4, angle: 164.1 },
  { x: 50.388, y: 82.634, ring: 4, angle: 178.0, portal: true },
  { x: 44.893, y: 78.769, ring: 4, angle: 194.7 },
  { x: 40.494, y: 77.494, ring: 4, angle: 207.6 },
  { x: 36.410, y: 75.318, ring: 4, angle: 219.1 },
  { x: 32.727, y: 72.379, ring: 4, angle: 229.1 },
  { x: 29.656, y: 68.486, ring: 4, angle: 238.0 },
  { x: 26.540, y: 64.070, ring: 4, angle: 246.6 },
  { x: 24.107, y: 59.683, ring: 4, angle: 253.6 },
  { x: 22.618, y: 54.725, ring: 4, angle: 260.0 },
  { x: 21.920, y: 49.383, ring: 4, angle: 266.4 },
  { x: 22.073, y: 44.001, ring: 4, angle: 272.6, portal: true },
  { x: 22.640, y: 38.858, ring: 4, angle: 278.8 },
  { x: 23.969, y: 34.096, ring: 4, angle: 284.9 },
  { x: 25.910, y: 29.581, ring: 4, angle: 291.6 },
  { x: 28.311, y: 25.754, ring: 4, angle: 298.4, portal: true },
  { x: 31.250, y: 22.305, ring: 4, angle: 306.2 },
  { x: 34.628, y: 19.502, ring: 4, angle: 315.0 },
  { x: 38.217, y: 17.364, ring: 4, angle: 324.8 },
  { x: 41.961, y: 15.941, ring: 4, angle: 335.7 },
  { x: 45.811, y: 15.157, ring: 4, angle: 347.5 },
  { x: 49.838, y: 14.935, ring: 4, angle: 0.5 },
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
  [23, 48],   [26, 27], [26, 28], [26, 53], [27, 28], [27, 53],
  [27, 95], [28, 29], [29, 31], [30, 31], [30, 32], [30, 59],
  [30, 60], [30, 61], [31, 32], [32, 33], [33, 34], [33, 35],
  [34, 35], [34, 36], [35, 36], [35, 64], [35, 65], [35, 66],
  [36, 37], [37, 38], [38, 39], [39, 70], [39, 71], [40, 41],
  [41, 74], [41, 75], [41, 76], [42, 43], [42, 79], [42, 80],
  [42, 81], [43, 44], [44, 45], [45, 46], [45, 47], [46, 47],
  [46, 84], [46, 85], [46, 86], [47, 48], [48, 49], [49, 50],
  [49, 51], [50, 51], [50, 52], [51, 89], [51, 90], [51, 91],
  [52, 53], [54, 95], [55, 56],
  [55, 95], [56, 58], [57, 80], [57, 81], [58, 59], [59, 60], [60, 61],
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
 * #63 comfort floor: a 48px-wide circle around each glow. Used when the
 * painted board is smaller than the 390 phone stage.
 */
export const HOP_SNAP_MIN_PX = 16;

/**
 * Phone-fair snap radius on the 8/5 390 contain stage. Plaza neighbors
 * sit ~16–32px apart there. Cover-fill phone boards scale this up.
 */
export const HOP_SNAP_PX = 22;

/**
 * Hopper box as % of the 16:9 board width. Plaza cream tiles are ~3.7%
 * (~28px on a 390 phone). Must stay inside one painted tile — a rem box
 * on the full 1024 PNG still overflowed neighbors.
 */
export const HOPPER_BOARD_WIDTH_PCT = 3.2;

/** Zoom the 1024 sprite so the opaque peach/body fills the pad box. */
export const HOPPER_ART_ZOOM_PCT = 140;

/** Sit the piece in the tile, not standing above it onto the north pad. */
export const HOPPER_SIT_TRANSLATE = "translate(-50%, -50%)";

/** Choice-glow disc as % of board width. One disc per neighbor tile. */
export const HOP_GLOW_BOARD_WIDTH_PCT = 2.2;

/**
 * Visible Lessons world on a 390×844 phone after header, chips, dock,
 * and tabs. Taller than the 8/5 contain card so grass sits on the rail.
 */
export const PHONE_MAP_VIEW = { width: 368, height: 520 } as const;

/**
 * Cover-fitted 16:9 stage for that phone column. Wider than the view —
 * pinch-zoom + drag pans around the overflow. Hop % stay on this board.
 */
export const PHONE_MAP_BOARD = coverMapBoard(PHONE_MAP_VIEW);

/**
 * Tablet / desktop card: 8/5 + height-fitted 16:9 so the whole painted
 * island (rim, arches, portals) stays on-screen. No pinch-pan.
 */
export const DESK_MAP_VIEW = { width: 368, height: (368 * 5) / 8 } as const;

export const DESK_MAP_BOARD = coverMapBoard(DESK_MAP_VIEW);

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

export function hopperBoardPx(board: HopBoardRect = PHONE_MAP_BOARD): number {
  return (HOPPER_BOARD_WIDTH_PCT / 100) * board.width;
}

export function hopGlowBoardPx(board: HopBoardRect = PHONE_MAP_BOARD): number {
  return (HOP_GLOW_BOARD_WIDTH_PCT / 100) * board.width;
}

/**
 * Fat-finger snap in CSS pixels of `board`. Scales from the 8/5 390
 * contain stage so a painted tile stays tappable on the cover-fill phone
 * board; never tighter than {@link HOP_SNAP_MIN_PX}.
 */
export function hopSnapPx(board: HopBoardRect = PHONE_MAP_BOARD): number {
  if (board.width <= 0) return HOP_SNAP_PX;
  const scaled = (HOP_SNAP_PX * board.width) / DESK_MAP_BOARD.width;
  return Math.max(HOP_SNAP_MIN_PX, Math.round(scaled));
}

/** Center-to-center gap to the closest painted neighbor. */
export function minAdjacentGapPx(id: number, board: HopBoardRect = PHONE_MAP_BOARD): number {
  const here = padClientPos(id, board);
  let min = Infinity;
  for (const n of adjacentPadIds(id)) {
    const p = padClientPos(n, board);
    const d = Math.hypot(p.x - here.x, p.y - here.y);
    if (d < min) min = d;
  }
  return min;
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
  snapPx = hopSnapPx(board),
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
