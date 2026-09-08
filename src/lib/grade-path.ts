export type PathZone = "meadow" | "cove" | "forest";

export type PathNodePos = { x: number; y: number };

/** Painted plates, top of the scroll to bottom. Each file is 1536×1024 (3:2). */
export const CANDY_ZONE_STACK: readonly PathZone[] = ["forest", "cove", "meadow"];

export const CANDY_ZONE_FILES: Record<PathZone, string> = {
  forest: "candy-zones/forest.png",
  cove: "candy-zones/cove.png",
  meadow: "candy-zones/meadow.png",
};

/** Local percent coords on one plate; y = 0 is the top of that plate. */
export function plateToMapPos(zone: PathZone, local: PathNodePos): PathNodePos {
  const i = CANDY_ZONE_STACK.indexOf(zone);
  return { x: local.x, y: (i * 100 + local.y) / CANDY_ZONE_STACK.length };
}

/** Cream pads on the locked vinyl plates, bottom-to-top, one node per Grade 3 unit. */
const MEADOW_PADS: readonly PathNodePos[] = [
  { x: 42.3, y: 90.9 },
  { x: 58.3, y: 62.8 },
  { x: 46.6, y: 40 },
  { x: 44.8, y: 16.4 },
];

const COVE_PADS: readonly PathNodePos[] = [
  { x: 63, y: 90 },
  { x: 38.6, y: 59.7 },
  { x: 45.7, y: 28.1 },
  { x: 60.6, y: 4.4 },
];

const FOREST_PADS: readonly PathNodePos[] = [
  { x: 47.7, y: 87.4 },
  { x: 54.3, y: 68.3 },
  { x: 49.9, y: 45.8 },
  { x: 49.7, y: 26 },
  { x: 60.9, y: 2.6 },
];

/** Percent coords inside the stacked map; y = 0 is the top so the trail climbs. */
export const GRADE3_PATH_NODES: readonly PathNodePos[] = [
  ...MEADOW_PADS.map((p) => plateToMapPos("meadow", p)),
  ...COVE_PADS.map((p) => plateToMapPos("cove", p)),
  ...FOREST_PADS.map((p) => plateToMapPos("forest", p)),
];

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

/** Fog layer height from the top of the map, or 0 when the trail is fully open. */
export function fogCoverPercent(nowNumber: number, nodes: readonly PathNodePos[] = GRADE3_PATH_NODES): number {
  const last = lastClearUnitNumber(nowNumber, nodes.length);
  if (last >= nodes.length) return 0;
  const lastVisible = nodes[last - 1];
  if (!lastVisible) return 0;
  return Math.max(8, lastVisible.y - 10);
}
