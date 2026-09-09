export type PathZone = "meadow" | "cove" | "forest";

export type PathNodePos = { x: number; y: number };

export type PathPad = {
  zone: PathZone;
  map: PathNodePos;
  unitNumber: number;
};

/** Locked quiet world: terrain + path + cream pads only. 1536×1024. */
export const TALL_MAP_FILE = "candy-zones/tall-map.png";

export const TALL_MAP_SIZE = { w: 1536, h: 1024 } as const;

/**
 * CSS `aspect-ratio` width/height for the Lessons world.
 * Taller than the 3:2 PNG so painted pads are large enough for hopper/numbers
 * and the trail scrolls. object-fit cover crops only the far sides.
 */
export const CANDY_WORLD_ASPECT = 2 / 5;

/**
 * Painted cream pads on tall-map.png, percent of the PNG (y = 0 is the top).
 * Art has 14 discs; the cove→forest shoreline stone is decorative.
 */
const TALL_MAP_UNIT_PADS: readonly PathPad[] = [
  { zone: "meadow", map: { x: 45.05, y: 92.69 }, unitNumber: 1 },
  { zone: "meadow", map: { x: 51.04, y: 83.31 }, unitNumber: 2 },
  { zone: "meadow", map: { x: 48.89, y: 74.64 }, unitNumber: 3 },
  { zone: "meadow", map: { x: 46.06, y: 65.81 }, unitNumber: 4 },
  { zone: "cove", map: { x: 50.64, y: 59.03 }, unitNumber: 5 },
  { zone: "cove", map: { x: 49.56, y: 51.11 }, unitNumber: 6 },
  { zone: "cove", map: { x: 53.67, y: 44.87 }, unitNumber: 7 },
  { zone: "cove", map: { x: 49.87, y: 38.13 }, unitNumber: 8 },
  { zone: "forest", map: { x: 49.44, y: 27.4 }, unitNumber: 9 },
  { zone: "forest", map: { x: 54.47, y: 21.22 }, unitNumber: 10 },
  { zone: "forest", map: { x: 49.3, y: 17.14 }, unitNumber: 11 },
  { zone: "forest", map: { x: 46.06, y: 11.46 }, unitNumber: 12 },
  { zone: "forest", map: { x: 51.27, y: 6.52 }, unitNumber: 13 },
];

/** Shoreline stone between cove and forest — painted, not a unit. */
export const TALL_MAP_DECORATIVE_PAD: PathNodePos = { x: 45.51, y: 32.55 };

export const GRADE3_PATH_PADS: readonly PathPad[] = TALL_MAP_UNIT_PADS;

/** Percent coords for the 13 Grade 3 units in PNG space; y = 0 is the top. */
export const GRADE3_PATH_NODES: readonly PathNodePos[] = GRADE3_PATH_PADS.map((p) => p.map);

/**
 * Map a PNG-percent point onto the cover-cropped world box.
 * The world is taller than the art, so only the x axis is cropped.
 */
export function mapToViewPos(pos: PathNodePos, worldAspect = CANDY_WORLD_ASPECT): PathNodePos {
  const imageAspect = TALL_MAP_SIZE.w / TALL_MAP_SIZE.h;
  if (worldAspect >= imageAspect) {
    const scale = worldAspect / imageAspect;
    return { x: pos.x, y: (pos.y - 50) * scale + 50 };
  }
  const scale = imageAspect / worldAspect;
  return { x: (pos.x - 50) * scale + 50, y: pos.y };
}

export function zoneForUnitNumber(n: number): PathZone {
  if (n <= 4) return "meadow";
  if (n <= 8) return "cove";
  return "forest";
}

export function displayUnitStars(earned: number, max: number): number {
  if (max <= 0 || earned <= 0) return 0;
  return Math.min(3, Math.max(0, Math.ceil((earned / max) * 3)));
}

/** Completed + current + this many nodes ahead stay readable. */
export const PATH_LOOKAHEAD = 2;

export function lastClearUnitNumber(nowNumber: number, total = GRADE3_PATH_NODES.length): number {
  const now = Math.min(total, Math.max(1, nowNumber));
  return Math.min(total, now + PATH_LOOKAHEAD);
}

export function nodeIsFogged(unitNumber: number, nowNumber: number): boolean {
  return unitNumber > lastClearUnitNumber(nowNumber);
}

export function zoneIsFogged(zone: PathZone, nowNumber: number): boolean {
  switch (zone) {
    case "meadow":
      return nodeIsFogged(1, nowNumber);
    case "cove":
      return nodeIsFogged(5, nowNumber);
    case "forest":
      return nodeIsFogged(9, nowNumber);
    default: {
      const _never: never = zone;
      return _never;
    }
  }
}

/** Keep zone titles readable when that land is still next to the playable stretch. */
export function zoneLabelIsFogged(zone: PathZone, nowNumber: number): boolean {
  switch (zone) {
    case "meadow":
      return zoneIsFogged("meadow", nowNumber);
    case "cove":
      return nowNumber >= 5 && zoneIsFogged("cove", nowNumber);
    case "forest":
      return nowNumber >= 9 && zoneIsFogged("forest", nowNumber);
    default: {
      const _never: never = zone;
      return _never;
    }
  }
}

/** Fog layer height from the top of the map, or 0 when the trail is fully open. */
export function fogCoverPercent(nowNumber: number, nodes: readonly PathNodePos[] = GRADE3_PATH_NODES): number {
  const last = lastClearUnitNumber(nowNumber, nodes.length);
  if (last >= nodes.length) return 0;
  const lastVisible = nodes[last - 1];
  if (!lastVisible) return 0;
  return Math.max(6, lastVisible.y - 6);
}

export type OverlayMotion = "bob" | "sway" | "shimmer" | "fall" | "spin";

export type PathOverlay = {
  id: string;
  file: string;
  zone: PathZone;
  map: PathNodePos;
  width: number;
  motion: OverlayMotion;
};

export const TALL_MAP_OVERLAY_DIR = "candy-zones/overlays";

/**
 * PNG-space props in the cover-crop gutters, beside the trail.
 * Visible x is roughly 36.7–63.3 of the 1536px art.
 *
 * Waterfall sits on the cove's upper-left rocky/pink shore (forest→water),
 * not the open-water band around y ≈ 42–54. Splash is toward larger y.
 */
export const TALL_MAP_OVERLAYS: readonly PathOverlay[] = [
  { id: "tenframe-a", file: "tenframe.png", zone: "meadow", map: { x: 40.15, y: 88.35 }, width: 20, motion: "bob" },
  { id: "tenframe-b", file: "tenframe.png", zone: "meadow", map: { x: 59.55, y: 77.85 }, width: 16, motion: "bob" },
  { id: "daisies", file: "daisies.png", zone: "meadow", map: { x: 39.85, y: 80.15 }, width: 11, motion: "bob" },
  { id: "gumdrop", file: "gumdrop.png", zone: "meadow", map: { x: 59.25, y: 69.45 }, width: 12, motion: "sway" },
  { id: "waterfall", file: "waterfall.png", zone: "cove", map: { x: 42.05, y: 31.15 }, width: 15, motion: "fall" },
  { id: "palm", file: "palm.png", zone: "cove", map: { x: 60.45, y: 56.85 }, width: 15, motion: "sway" },
  { id: "sailboat", file: "sailboat.png", zone: "cove", map: { x: 59.4, y: 49.6 }, width: 12, motion: "bob" },
  { id: "coins", file: "coins.png", zone: "cove", map: { x: 60.15, y: 42.55 }, width: 13, motion: "bob" },
  { id: "coin-spin", file: "coin-spin.png", zone: "cove", map: { x: 61.25, y: 40.75 }, width: 5.5, motion: "spin" },
  { id: "candy-cane", file: "candy-cane.png", zone: "forest", map: { x: 59.85, y: 28.15 }, width: 10, motion: "sway" },
  { id: "fraction-pie", file: "fraction-pie.png", zone: "forest", map: { x: 39.55, y: 14.35 }, width: 13, motion: "sway" },
];

/** Keep scenery off cream discs / numbers. Existing tenframes sit ~6.5 away. */
export const OVERLAY_MIN_PAD_DIST = 6.4;

export function overlayPadDistance(prop: PathOverlay, pad: PathNodePos): number {
  return Math.hypot(pad.x - prop.map.x, pad.y - prop.map.y);
}

export function overlayClearsPads(prop: PathOverlay): boolean {
  return GRADE3_PATH_PADS.every((pad) => overlayPadDistance(prop, pad.map) >= OVERLAY_MIN_PAD_DIST);
}

/** Open water on the left gutter — the old mid-cove float. */
export function overlayInOpenCoveWater(prop: PathOverlay): boolean {
  return prop.zone === "cove" && prop.map.x < 45 && prop.map.y > 42 && prop.map.y < 54;
}

export type TrailPeekSpot = {
  id: string;
  zone: PathZone;
  map: PathNodePos;
};

/**
 * Hide holes beside the trail — PNG gutters, not on pads.
 * Only one fires per Lessons visit; extras exist so the current stretch always has a nearby pop.
 */
export const TRAIL_PEEK_SPOTS: readonly TrailPeekSpot[] = [
  { id: "meadow-bush", zone: "meadow", map: { x: 58.85, y: 91.15 } },
  { id: "meadow-rock", zone: "meadow", map: { x: 39.45, y: 82.25 } },
  { id: "meadow-clear", zone: "meadow", map: { x: 59.35, y: 71.85 } },
  { id: "cove-palm", zone: "cove", map: { x: 60.85, y: 57.55 } },
  { id: "cove-fall", zone: "cove", map: { x: 39.75, y: 46.55 } },
  { id: "cove-coin", zone: "cove", map: { x: 60.55, y: 40.15 } },
  { id: "forest-shade", zone: "forest", map: { x: 39.65, y: 26.85 } },
  { id: "forest-pie", zone: "forest", map: { x: 61.5, y: 16.4 } },
  { id: "forest-canopy", zone: "forest", map: { x: 38.95, y: 7.25 } },
];

/** Map-Y window around the current pad that stays on-screen after hopper-centering. */
export const TRAIL_PEEK_NEARBY_Y = 16;

/** Minimum PNG-space distance from a painted pad so the pop never covers a disc. */
export const TRAIL_PEEK_MIN_PAD_DIST = 8;

/** Extra clearance from the hopper's current pad so the face never sits on the numbers. */
export const TRAIL_PEEK_MIN_HOPPER_DIST = 10;

/** Once the hide spot is on-screen, wait this long (plus spread) before the pop. */
export const TRAIL_PEEK_ARM_MS = 880;
export const TRAIL_PEEK_ARM_SPREAD_MS = 640;

export function trailPeekHash(iso: string, nowNumber: number): number {
  let h = 2166136261;
  for (let i = 0; i < iso.length; i++) h = Math.imul(h ^ iso.charCodeAt(i), 16777619);
  return (h + nowNumber * 131) >>> 0;
}

export function trailPeekSpotClear(spot: TrailPeekSpot, nowNumber: number): boolean {
  return !zoneIsFogged(spot.zone, nowNumber) && !overlayIsVeiled(spot.map.y, nowNumber);
}

export function trailPeekPadDistance(spot: TrailPeekSpot, pad: PathNodePos): number {
  return Math.hypot(pad.x - spot.map.x, pad.y - spot.map.y);
}

export function trailPeekClearsPads(spot: TrailPeekSpot): boolean {
  return GRADE3_PATH_PADS.every((pad) => trailPeekPadDistance(spot, pad.map) >= TRAIL_PEEK_MIN_PAD_DIST);
}

export function trailPeekClearsHopper(spot: TrailPeekSpot, nowNumber: number): boolean {
  const hopper = GRADE3_PATH_NODES[nowNumber - 1];
  if (!hopper) return true;
  return trailPeekPadDistance(spot, hopper) >= TRAIL_PEEK_MIN_HOPPER_DIST;
}

export function nearbyTrailPeekSpots(nowNumber: number): TrailPeekSpot[] {
  const nowY = GRADE3_PATH_NODES[nowNumber - 1]?.y;
  if (nowY == null) return [];
  return TRAIL_PEEK_SPOTS.filter(
    (s) =>
      trailPeekSpotClear(s, nowNumber) &&
      trailPeekClearsPads(s) &&
      trailPeekClearsHopper(s, nowNumber) &&
      Math.abs(s.map.y - nowY) <= TRAIL_PEEK_NEARBY_Y,
  );
}

export function pickTrailPeekSpot(nowNumber: number, hash: number): TrailPeekSpot | undefined {
  const nearby = nearbyTrailPeekSpots(nowNumber);
  if (nearby.length) return nearby[hash % nearby.length];
  const nowY = GRADE3_PATH_NODES[nowNumber - 1]?.y;
  if (nowY == null) return undefined;
  const clear = TRAIL_PEEK_SPOTS.filter(
    (s) => trailPeekSpotClear(s, nowNumber) && trailPeekClearsPads(s) && trailPeekClearsHopper(s, nowNumber),
  );
  if (!clear.length) return undefined;
  let best = clear[0]!;
  let bestD = Math.abs(best.map.y - nowY);
  for (const s of clear.slice(1)) {
    const d = Math.abs(s.map.y - nowY);
    if (d < bestD) {
      best = s;
      bestD = d;
    }
  }
  return best;
}

export function overlayIsVeiled(mapY: number, nowNumber: number): boolean {
  const fog = fogCoverPercent(nowNumber);
  return fog > 0 && mapY < fog - 2;
}

export function overlayMotionClass(motion: OverlayMotion): string {
  switch (motion) {
    case "bob":
      return "candy-prop-bob";
    case "sway":
      return "candy-prop-sway";
    case "shimmer":
      return "candy-prop-shimmer";
    case "fall":
      return "candy-prop-fall";
    case "spin":
      return "candy-prop-spin";
    default: {
      const _never: never = motion;
      return _never;
    }
  }
}
