export type PathZone = "meadow" | "cove" | "forest";

export type PathNodePos = { x: number; y: number };

/** Percent coords inside the map; y = 0 is the top so the trail climbs. */
export const GRADE3_PATH_NODES: readonly PathNodePos[] = [
  { x: 20, y: 91 },
  { x: 46, y: 84 },
  { x: 74, y: 77 },
  { x: 40, y: 69 },
  { x: 18, y: 61 },
  { x: 50, y: 54 },
  { x: 78, y: 47 },
  { x: 48, y: 40 },
  { x: 24, y: 33 },
  { x: 52, y: 26 },
  { x: 76, y: 19 },
  { x: 46, y: 12 },
  { x: 62, y: 5.5 },
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

export function pathSvgD(nodes: readonly PathNodePos[] = GRADE3_PATH_NODES): string {
  const first = nodes[0];
  if (!first) return "";
  let d = `M ${first.x} ${first.y}`;
  for (let i = 1; i < nodes.length; i++) {
    const prev = nodes[i - 1]!;
    const cur = nodes[i]!;
    const cpx = (prev.x + cur.x) / 2;
    const cpy = (prev.y + cur.y) / 2 + (i % 2 === 0 ? -3 : 3);
    d += ` Q ${cpx} ${cpy} ${cur.x} ${cur.y}`;
  }
  return d;
}
