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
