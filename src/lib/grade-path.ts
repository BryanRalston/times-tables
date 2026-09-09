export type PathZone = "meadow" | "cove" | "forest";

export type PathNodePos = { x: number; y: number };

export type PathPad = {
  zone: PathZone;
  map: PathNodePos;
  unitNumber: number;
};

/** Locked quiet world: landscape winding boardwalk + 13 cream pads. 1920×1080. */
export const TALL_MAP_FILE = "candy-zones/tall-map.png";

export const TALL_MAP_SIZE = { w: 1920, h: 1080 } as const;

/**
 * CSS `aspect-ratio` width/height for the Lessons world.
 * Matches the landscape PNG so the full meadow↔cove↔forest loop stays on-art.
 * The long axis is horizontal — Lessons scrolls sideways to follow the S.
 */
export const CANDY_WORLD_ASPECT = 16 / 9;

/**
 * Painted cream pads on tall-map.png, percent of the PNG (y = 0 is the top).
 * 13 discs in boardwalk order: meadow (green, right→left) → cove (water S)
 * → forest (pink, hook→left). First/last path ends are cropped off-canvas.
 */
const TALL_MAP_UNIT_PADS: readonly PathPad[] = [
  { zone: "meadow", map: { x: 94.49, y: 77.53 }, unitNumber: 1 },
  { zone: "meadow", map: { x: 70.38, y: 86.33 }, unitNumber: 2 },
  { zone: "meadow", map: { x: 50.42, y: 75.69 }, unitNumber: 3 },
  { zone: "meadow", map: { x: 30.59, y: 77.57 }, unitNumber: 4 },
  { zone: "cove", map: { x: 31.68, y: 53.48 }, unitNumber: 5 },
  { zone: "cove", map: { x: 43.19, y: 49.96 }, unitNumber: 6 },
  { zone: "cove", map: { x: 55.73, y: 49.55 }, unitNumber: 7 },
  { zone: "cove", map: { x: 66.87, y: 43.17 }, unitNumber: 8 },
  { zone: "forest", map: { x: 70.53, y: 29.79 }, unitNumber: 9 },
  { zone: "forest", map: { x: 53.1, y: 17.49 }, unitNumber: 10 },
  { zone: "forest", map: { x: 41.4, y: 23.56 }, unitNumber: 11 },
  { zone: "forest", map: { x: 18.3, y: 15.42 }, unitNumber: 12 },
  { zone: "forest", map: { x: 1.51, y: 17.63 }, unitNumber: 13 },
];

/**
 * Vinyl boulder on the left shoulder of the 4↔5 water rise (PNG %).
 * Between consecutive pads, not on a numbered disc.
 */
export const TALL_MAP_DECORATIVE_PAD: PathNodePos = { x: 24.6, y: 64.8 };

export const GRADE3_PATH_PADS: readonly PathPad[] = TALL_MAP_UNIT_PADS;

/** Percent coords for the 13 Grade 3 units in PNG space; y = 0 is the top. */
export const GRADE3_PATH_NODES: readonly PathNodePos[] = GRADE3_PATH_PADS.map((p) => p.map);

/**
 * Map a PNG-percent point onto the world box.
 * When the world aspect matches the art, this is identity — the full loop stays visible.
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

/** Stars under a pad: earned only. Hide on now (hopper sits there) and locked/fog. */
export function padChromeStars(
  earned: number,
  opts: { now: boolean; locked: boolean },
): number {
  if (opts.now || opts.locked) return 0;
  return Math.min(3, Math.max(0, earned));
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

export type OverlaySeat = "land" | "water" | "shore";

export type PathObstacle = {
  id: string;
  file: string;
  zone: PathZone;
  map: PathNodePos;
  width: number;
  seat: OverlaySeat;
};

/** Vinyl candy boulder on the 4↔5 water-rise shoulder. Not tappable. */
export const PATH_OBSTACLE: PathObstacle = {
  id: "cove-boulder",
  file: "cove-boulder.png",
  zone: "cove",
  map: TALL_MAP_DECORATIVE_PAD,
  width: 8,
  seat: "land",
};

export type PathOverlay = {
  id: string;
  file: string;
  zone: PathZone;
  map: PathNodePos;
  width: number;
  motion: OverlayMotion;
  seat: OverlaySeat;
};

export const TALL_MAP_OVERLAY_DIR = "candy-zones/overlays";

/**
 * PNG-space props in empty frosting / sand / water gutters beside the loop.
 * Full landscape is on-screen (no side crop), so landmarks sit in the wide
 * gutters — never on cream discs.
 */
export const TALL_MAP_OVERLAYS: readonly PathOverlay[] = [
  { id: "tenframe-a", file: "tenframe-mound.png", zone: "meadow", map: { x: 12.2, y: 90.4 }, width: 10, motion: "bob", seat: "land" },
  { id: "tenframe-b", file: "tenframe-mound.png", zone: "meadow", map: { x: 46.8, y: 93.2 }, width: 9, motion: "bob", seat: "land" },
  { id: "tenframe-c", file: "tenframe-mound.png", zone: "meadow", map: { x: 64.2, y: 94.0 }, width: 9, motion: "bob", seat: "land" },
  { id: "tenframe-d", file: "tenframe-mound.png", zone: "meadow", map: { x: 84.6, y: 91.5 }, width: 9, motion: "bob", seat: "land" },
  { id: "tenframe-e", file: "tenframe-mound.png", zone: "meadow", map: { x: 18.8, y: 70.2 }, width: 9, motion: "bob", seat: "land" },
  { id: "flowers", file: "meadow-flowers.png", zone: "meadow", map: { x: 55.5, y: 96.2 }, width: 7, motion: "bob", seat: "land" },
  { id: "daisies", file: "daisies.png", zone: "meadow", map: { x: 8.4, y: 82.6 }, width: 7, motion: "bob", seat: "land" },
  { id: "waterfall", file: "waterfall.png", zone: "cove", map: { x: 11.4, y: 33.8 }, width: 10, motion: "fall", seat: "shore" },
  { id: "palm", file: "palm.png", zone: "cove", map: { x: 90.8, y: 58.6 }, width: 9, motion: "sway", seat: "land" },
  { id: "dock", file: "dock.png", zone: "cove", map: { x: 86.4, y: 51.2 }, width: 9, motion: "bob", seat: "water" },
  { id: "sailboat", file: "sailboat.png", zone: "cove", map: { x: 82.2, y: 46.4 }, width: 7, motion: "bob", seat: "water" },
  { id: "sailboat-b", file: "sailboat.png", zone: "cove", map: { x: 91.0, y: 43.8 }, width: 6, motion: "bob", seat: "water" },
  { id: "coins", file: "coin-stack.png", zone: "cove", map: { x: 9.6, y: 46.8 }, width: 7, motion: "bob", seat: "water" },
  { id: "coins-b", file: "coin-stack.png", zone: "cove", map: { x: 14.2, y: 55.6 }, width: 6, motion: "bob", seat: "water" },
  { id: "coins-c", file: "coin-stack.png", zone: "cove", map: { x: 91.4, y: 38.6 }, width: 7, motion: "bob", seat: "water" },
  { id: "fraction-tree", file: "fraction-tree.png", zone: "forest", map: { x: 86.2, y: 10.4 }, width: 8, motion: "sway", seat: "land" },
  { id: "fraction-tree-b", file: "fraction-tree.png", zone: "forest", map: { x: 58.8, y: 6.2 }, width: 8, motion: "sway", seat: "land" },
  { id: "fraction-tree-c", file: "fraction-tree.png", zone: "forest", map: { x: 32.4, y: 7.8 }, width: 8, motion: "sway", seat: "land" },
  { id: "fraction-tree-d", file: "fraction-tree.png", zone: "forest", map: { x: 72.6, y: 8.6 }, width: 8, motion: "sway", seat: "land" },
  { id: "fraction-tree-e", file: "fraction-tree.png", zone: "forest", map: { x: 10.8, y: 7.4 }, width: 8, motion: "sway", seat: "land" },
];

/** Same-file landmarks stay this far apart so gutters do not become a clutter wall. */
export const OVERLAY_MIN_LANDMARK_DIST = 6.2;

/** Keep scenery off cream discs / numbers. Existing tenframes sit ~6.5 away. */
export const OVERLAY_MIN_PAD_DIST = 6.4;

export function overlayPadDistance(prop: PathOverlay, pad: PathNodePos): number {
  return Math.hypot(pad.x - prop.map.x, pad.y - prop.map.y);
}

export function overlayClearsPads(prop: PathOverlay): boolean {
  return GRADE3_PATH_PADS.every((pad) => overlayPadDistance(prop, pad.map) >= OVERLAY_MIN_PAD_DIST);
}

export function overlayPairDistance(a: PathOverlay, b: PathOverlay): number {
  return Math.hypot(a.map.x - b.map.x, a.map.y - b.map.y);
}

export function overlaysHaveBreathingRoom(
  props: readonly PathOverlay[],
  file: string,
  minDist = OVERLAY_MIN_LANDMARK_DIST,
): boolean {
  const same = props.filter((p) => p.file === file);
  for (let i = 0; i < same.length; i++) {
    for (let j = i + 1; j < same.length; j++) {
      if (overlayPairDistance(same[i]!, same[j]!) < minDist) return false;
    }
  }
  return true;
}

/** Open water on the left cove, beside the boardwalk S. */
export function overlayInOpenCoveWater(prop: PathOverlay): boolean {
  return prop.zone === "cove" && prop.map.x < 22 && prop.map.y > 40 && prop.map.y < 58;
}

/** Dry pink forest above the cove lip. */
export function overlayOnDryCoveBank(prop: PathOverlay): boolean {
  return prop.zone === "cove" && prop.map.x < 20 && prop.map.y < 28;
}

/**
 * Splash-anchor on the left pink→sand lip. Path is on the right at this y.
 */
export function overlayOnCoveShoreLip(prop: PathOverlay): boolean {
  return (
    prop.id === "waterfall" &&
    prop.zone === "cove" &&
    prop.seat === "shore" &&
    prop.map.x > 8 &&
    prop.map.x < 16 &&
    prop.map.y > 31 &&
    prop.map.y < 36 &&
    !overlayInOpenCoveWater(prop) &&
    !overlayOnDryCoveBank(prop)
  );
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
  { id: "meadow-bush", zone: "meadow", map: { x: 88.2, y: 90.6 } },
  { id: "meadow-rock", zone: "meadow", map: { x: 22.4, y: 88.8 } },
  { id: "meadow-clear", zone: "meadow", map: { x: 58.6, y: 92.4 } },
  { id: "cove-palm", zone: "cove", map: { x: 90.2, y: 56.8 } },
  { id: "cove-fall", zone: "cove", map: { x: 10.8, y: 52.4 } },
  { id: "cove-coin", zone: "cove", map: { x: 90.6, y: 40.2 } },
  { id: "forest-shade", zone: "forest", map: { x: 84.4, y: 14.6 } },
  { id: "forest-pie", zone: "forest", map: { x: 62.2, y: 9.2 } },
  { id: "forest-canopy", zone: "forest", map: { x: 8.6, y: 9.0 } },
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

export function overlaySeatClass(seat: OverlaySeat): string {
  switch (seat) {
    case "land":
      return "candy-prop-land";
    case "water":
      return "candy-prop-water";
    case "shore":
      return "candy-prop-shore";
    default: {
      const _never: never = seat;
      return _never;
    }
  }
}
