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

export type Sprinkle = { x: number; y: number; hue: number; r: number };

export function pathSprinkles(nodes: readonly PathNodePos[] = GRADE3_PATH_NODES, count = 56): Sprinkle[] {
  if (nodes.length < 2 || count <= 0) return [];
  const hues = [0, 28, 200, 140, 330];
  const out: Sprinkle[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const scaled = t * (nodes.length - 1);
    const a = Math.floor(scaled);
    const b = Math.min(nodes.length - 1, a + 1);
    const f = scaled - a;
    const p = nodes[a]!;
    const q = nodes[b]!;
    const side = i % 2 === 0 ? -1 : 1;
    out.push({
      x: p.x + (q.x - p.x) * f + side * (1.1 + (i % 3) * 0.35),
      y: p.y + (q.y - p.y) * f + (i % 5 === 0 ? -0.6 : 0.4),
      hue: hues[i % hues.length]!,
      r: 0.55 + (i % 3) * 0.18,
    });
  }
  return out;
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
