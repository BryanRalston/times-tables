export type PathZone = "meadow" | "cove" | "forest";

export type PathNodePos = { x: number; y: number };

export type PathPad = {
  zone: PathZone;
  local: PathNodePos;
  map: PathNodePos;
  unitNumber: number | null;
};

/** Painted plates, top of the scroll to bottom. Each file is 1536×1024 (3:2). */
export const CANDY_ZONE_STACK: readonly PathZone[] = ["forest", "cove", "meadow"];

export const CANDY_ZONE_FILES: Record<PathZone, string> = {
  forest: "candy-zones/forest.png",
  cove: "candy-zones/cove.png",
  meadow: "candy-zones/meadow.png",
};

/** Shared plate-height fraction used for CSS overlap and map math. */
export const PLATE_OVERLAP = 0.34;

export function plateSpan(overlap = PLATE_OVERLAP): number {
  return CANDY_ZONE_STACK.length - (CANDY_ZONE_STACK.length - 1) * overlap;
}

/** Local percent coords on one plate; y = 0 is the top of that plate. */
export function plateToMapPos(zone: PathZone, local: PathNodePos, overlap = PLATE_OVERLAP): PathNodePos {
  const i = CANDY_ZONE_STACK.indexOf(zone);
  const start = i * (1 - overlap);
  return { x: local.x, y: ((start + local.y / 100) / plateSpan(overlap)) * 100 };
}

/**
 * Cream discs painted on the locked vinyl plates, bottom-to-top along the path.
 * Meadow drops the off-path flower; cove keeps the recovered mid-curve stones;
 * forest includes the entrance pad at the bottom of the plate.
 */
const MEADOW_PADS: readonly PathNodePos[] = [
  { x: 38.7, y: 93.2 },
  { x: 43.5, y: 81.7 },
  { x: 55.8, y: 75.4 },
  { x: 55.1, y: 64.4 },
  { x: 46.9, y: 57.3 },
  { x: 42.3, y: 49.1 },
  { x: 46.5, y: 40.1 },
  { x: 55.6, y: 35.8 },
  { x: 58.5, y: 27.3 },
  { x: 50.5, y: 22.7 },
  { x: 44.6, y: 17.0 },
  { x: 47.2, y: 9.8 },
  { x: 54.6, y: 5.9 },
  { x: 62.7, y: 2.0 },
];

const COVE_PADS: readonly PathNodePos[] = [
  { x: 59.6, y: 92.0 },
  { x: 51.2, y: 85.3 },
  { x: 42.9, y: 79.4 },
  { x: 37.4, y: 72.8 },
  { x: 35.5, y: 61.6 },
  { x: 48.9, y: 54.6 },
  { x: 58.4, y: 49.2 },
  { x: 63.5, y: 39.9 },
  { x: 54.7, y: 30.9 },
  { x: 44.7, y: 28.7 },
  { x: 37.9, y: 22.7 },
  { x: 44.2, y: 14.8 },
  { x: 52.5, y: 8.8 },
  { x: 60.6, y: 4.5 },
];

const FOREST_PADS: readonly PathNodePos[] = [
  { x: 47.7, y: 87.4 },
  { x: 52.1, y: 80.7 },
  { x: 54.0, y: 70.4 },
  { x: 45.9, y: 62.8 },
  { x: 42.3, y: 53.6 },
  { x: 49.9, y: 45.8 },
  { x: 56.3, y: 40.4 },
  { x: 56.9, y: 30.8 },
  { x: 49.7, y: 26.1 },
  { x: 46.5, y: 19.6 },
  { x: 47.7, y: 12.9 },
  { x: 55.3, y: 8.6 },
  { x: 60.9, y: 3.4 },
];

export const ZONE_PAD_COUNTS = {
  meadow: MEADOW_PADS.length,
  cove: COVE_PADS.length,
  forest: FOREST_PADS.length,
} as const;

/** Grade 3 units stay 4 / 4 / 5 across the three zones. */
const MEADOW_UNIT_INDEXES = [0, 4, 9, 13] as const;
const COVE_UNIT_INDEXES = [0, 4, 9, 13] as const;
const FOREST_UNIT_INDEXES = [0, 3, 6, 9, 12] as const;

function padsForZone(
  zone: PathZone,
  locals: readonly PathNodePos[],
  unitIndexes: readonly number[],
  firstUnit: number,
): PathPad[] {
  return locals.map((local, i) => {
    const unitSlot = unitIndexes.indexOf(i);
    return {
      zone,
      local,
      map: plateToMapPos(zone, local),
      unitNumber: unitSlot >= 0 ? firstUnit + unitSlot : null,
    };
  });
}

/** Every painted cream pad, bottom of meadow to top of forest. */
export const GRADE3_PATH_PADS: readonly PathPad[] = [
  ...padsForZone("meadow", MEADOW_PADS, MEADOW_UNIT_INDEXES, 1),
  ...padsForZone("cove", COVE_PADS, COVE_UNIT_INDEXES, 5),
  ...padsForZone("forest", FOREST_PADS, FOREST_UNIT_INDEXES, 9),
];

/** Percent coords for the 13 Grade 3 units; y = 0 is the top so the trail climbs. */
export const GRADE3_PATH_NODES: readonly PathNodePos[] = GRADE3_PATH_PADS.filter((p) => p.unitNumber !== null).map(
  (p) => p.map,
);

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

export function padIsFogged(pos: PathNodePos, nowNumber: number, nodes: readonly PathNodePos[] = GRADE3_PATH_NODES): boolean {
  const last = lastClearUnitNumber(nowNumber, nodes.length);
  if (last >= nodes.length) return false;
  const lastVisible = nodes[last - 1];
  if (!lastVisible) return false;
  return pos.y < lastVisible.y - 3;
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
