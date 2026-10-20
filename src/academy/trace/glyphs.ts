/** Centerlines for finger tracing. Coordinates live in a 0–100 box. */

export interface Pt {
  x: number;
  y: number;
}

export interface Stroke {
  points: Pt[];
}

export interface Glyph {
  id: string;
  strokes: Stroke[];
}

function pt(x: number, y: number): Pt {
  return { x, y };
}

function line(a: Pt, b: Pt, steps = 8): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  return out;
}

function cubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, steps = 14): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const u = 1 - t;
    out.push({
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    });
  }
  return out;
}

/** Screen y grows downward, so a falling angle walks clockwise. */
function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, steps = 28): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const a = a0 + ((a1 - a0) * i) / steps;
    out.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
  }
  return out;
}

function chain(parts: Pt[][]): Pt[] {
  const out: Pt[] = [];
  for (const part of parts) {
    for (const p of part) {
      const last = out[out.length - 1];
      if (last && Math.hypot(last.x - p.x, last.y - p.y) < 0.35) continue;
      out.push(p);
    }
  }
  return out;
}

function stroke(...parts: Pt[][]): Stroke {
  return { points: chain(parts) };
}

/** Counterclockwise oval starting at the top. */
function oval(cx: number, cy: number, rx: number, ry: number): Pt[] {
  return arc(cx, cy, rx, ry, -Math.PI / 2, -Math.PI / 2 - Math.PI * 2, 32);
}

function dot(cx: number, cy: number): Pt[] {
  return arc(cx, cy, 3.2, 3.2, -Math.PI / 2, -Math.PI / 2 - Math.PI * 2, 10);
}

const NUMERALS: Glyph[] = [
  { id: "0", strokes: [stroke(oval(50, 50, 22, 30))] },
  { id: "1", strokes: [stroke(line(pt(40, 30), pt(50, 16), 4), line(pt(50, 16), pt(50, 84), 12))] },
  {
    id: "2",
    strokes: [
      stroke(
        cubic(pt(30, 38), pt(28, 14), pt(74, 12), pt(72, 40), 12),
        cubic(pt(72, 40), pt(70, 62), pt(36, 58), pt(26, 82), 12),
        line(pt(26, 82), pt(76, 82), 8),
      ),
    ],
  },
  {
    id: "3",
    strokes: [
      stroke(cubic(pt(32, 30), pt(34, 14), pt(76, 14), pt(58, 40), 12), cubic(pt(58, 40), pt(48, 50), pt(44, 50), pt(46, 50), 6)),
      stroke(cubic(pt(46, 48), pt(78, 46), pt(78, 88), pt(34, 82), 14)),
    ],
  },
  {
    id: "4",
    strokes: [stroke(line(pt(34, 20), pt(26, 54), 8), line(pt(26, 54), pt(78, 54), 8)), stroke(line(pt(60, 16), pt(60, 86), 12))],
  },
  {
    id: "5",
    strokes: [
      stroke(line(pt(68, 18), pt(32, 18), 8), line(pt(32, 18), pt(32, 48), 8)),
      stroke(cubic(pt(32, 46), pt(32, 44), pt(78, 38), pt(72, 62), 10), cubic(pt(72, 62), pt(66, 88), pt(30, 88), pt(28, 68), 10)),
    ],
  },
  {
    id: "6",
    strokes: [
      stroke(
        cubic(pt(66, 26), pt(24, 16), pt(20, 62), pt(48, 78), 14),
        cubic(pt(48, 78), pt(78, 90), pt(80, 50), pt(50, 48), 12),
        cubic(pt(50, 48), pt(26, 46), pt(22, 76), pt(48, 78), 10),
      ),
    ],
  },
  { id: "7", strokes: [stroke(line(pt(26, 20), pt(76, 20), 8), line(pt(76, 20), pt(38, 86), 12))] },
  {
    id: "8",
    strokes: [stroke(oval(50, 34, 18, 16)), stroke(oval(50, 68, 20, 18))],
  },
  {
    id: "9",
    strokes: [stroke(oval(50, 36, 18, 16)), stroke(line(pt(66, 42), pt(46, 86), 12))],
  },
];

const UPPER: Glyph[] = [
  {
    id: "A",
    strokes: [stroke(line(pt(50, 16), pt(22, 84), 12)), stroke(line(pt(50, 16), pt(78, 84), 12)), stroke(line(pt(32, 58), pt(68, 58), 6))],
  },
  {
    id: "B",
    strokes: [
      stroke(line(pt(30, 16), pt(30, 84), 12)),
      stroke(cubic(pt(30, 16), pt(72, 14), pt(74, 46), pt(30, 48), 12)),
      stroke(cubic(pt(30, 48), pt(78, 50), pt(76, 88), pt(30, 84), 12)),
    ],
  },
  { id: "C", strokes: [stroke(arc(50, 50, 24, 30, -0.7, -0.7 - (Math.PI * 2 - 1.4), 28))] },
  {
    id: "D",
    strokes: [stroke(line(pt(30, 16), pt(30, 84), 12)), stroke(cubic(pt(30, 16), pt(86, 16), pt(86, 84), pt(30, 84), 16))],
  },
  {
    id: "E",
    strokes: [
      stroke(line(pt(32, 16), pt(32, 84), 12)),
      stroke(line(pt(32, 16), pt(74, 16), 6)),
      stroke(line(pt(32, 50), pt(66, 50), 6)),
      stroke(line(pt(32, 84), pt(74, 84), 6)),
    ],
  },
  {
    id: "F",
    strokes: [stroke(line(pt(32, 16), pt(32, 84), 12)), stroke(line(pt(32, 16), pt(74, 16), 6)), stroke(line(pt(32, 48), pt(66, 48), 6))],
  },
  {
    id: "G",
    strokes: [
      stroke(arc(48, 50, 24, 30, -0.45, -0.45 - (Math.PI * 2 - 1.5), 28)),
      stroke(line(pt(48, 52), pt(74, 52), 6), line(pt(74, 52), pt(74, 68), 4)),
    ],
  },
  {
    id: "H",
    strokes: [stroke(line(pt(28, 16), pt(28, 84), 12)), stroke(line(pt(72, 16), pt(72, 84), 12)), stroke(line(pt(28, 50), pt(72, 50), 8))],
  },
  {
    id: "I",
    strokes: [stroke(line(pt(34, 16), pt(66, 16), 6)), stroke(line(pt(50, 16), pt(50, 84), 12)), stroke(line(pt(34, 84), pt(66, 84), 6))],
  },
  { id: "J", strokes: [stroke(line(pt(36, 18), pt(64, 18), 6)), stroke(line(pt(56, 18), pt(56, 68), 10), cubic(pt(56, 68), pt(56, 90), pt(28, 90), pt(28, 66), 10))] },
  {
    id: "K",
    strokes: [
      stroke(line(pt(30, 16), pt(30, 84), 12)),
      stroke(line(pt(70, 16), pt(30, 50), 10)),
      stroke(line(pt(38, 46), pt(74, 84), 10)),
    ],
  },
  { id: "L", strokes: [stroke(line(pt(32, 16), pt(32, 84), 12), line(pt(32, 84), pt(74, 84), 8))] },
  {
    id: "M",
    strokes: [stroke(line(pt(18, 84), pt(18, 20), 10), line(pt(18, 20), pt(50, 72), 10)), stroke(line(pt(50, 72), pt(82, 20), 10), line(pt(82, 20), pt(82, 84), 10))],
  },
  {
    id: "N",
    strokes: [stroke(line(pt(26, 84), pt(26, 18), 12)), stroke(line(pt(26, 18), pt(74, 84), 12)), stroke(line(pt(74, 84), pt(74, 18), 12))],
  },
  { id: "O", strokes: [stroke(oval(50, 50, 24, 30))] },
  {
    id: "P",
    strokes: [stroke(line(pt(32, 16), pt(32, 84), 12)), stroke(cubic(pt(32, 16), pt(80, 14), pt(80, 52), pt(32, 50), 14))],
  },
  { id: "Q", strokes: [stroke(oval(48, 48, 22, 28)), stroke(line(pt(58, 62), pt(78, 86), 8))] },
  {
    id: "R",
    strokes: [
      stroke(line(pt(30, 16), pt(30, 84), 12)),
      stroke(cubic(pt(30, 16), pt(78, 14), pt(78, 50), pt(30, 48), 12)),
      stroke(line(pt(42, 48), pt(76, 84), 10)),
    ],
  },
  {
    id: "S",
    strokes: [
      stroke(
        cubic(pt(70, 28), pt(70, 12), pt(26, 12), pt(28, 36), 12),
        cubic(pt(28, 36), pt(30, 54), pt(74, 48), pt(72, 68), 10),
        cubic(pt(72, 68), pt(70, 90), pt(26, 90), pt(28, 72), 10),
      ),
    ],
  },
  { id: "T", strokes: [stroke(line(pt(22, 18), pt(78, 18), 8)), stroke(line(pt(50, 18), pt(50, 84), 12))] },
  { id: "U", strokes: [stroke(line(pt(28, 18), pt(28, 62), 8), cubic(pt(28, 62), pt(28, 90), pt(72, 90), pt(72, 62), 12), line(pt(72, 62), pt(72, 18), 8))] },
  { id: "V", strokes: [stroke(line(pt(22, 18), pt(50, 84), 12)), stroke(line(pt(50, 84), pt(78, 18), 12))] },
  {
    id: "W",
    strokes: [
      stroke(line(pt(16, 18), pt(32, 84), 10), line(pt(32, 84), pt(50, 36), 8)),
      stroke(line(pt(50, 36), pt(68, 84), 8), line(pt(68, 84), pt(84, 18), 10)),
    ],
  },
  { id: "X", strokes: [stroke(line(pt(24, 18), pt(76, 84), 12)), stroke(line(pt(76, 18), pt(24, 84), 12))] },
  {
    id: "Y",
    strokes: [stroke(line(pt(24, 18), pt(50, 48), 8)), stroke(line(pt(76, 18), pt(50, 48), 8), line(pt(50, 48), pt(50, 84), 8))],
  },
  { id: "Z", strokes: [stroke(line(pt(24, 18), pt(76, 18), 8), line(pt(76, 18), pt(24, 84), 12), line(pt(24, 84), pt(76, 84), 8))] },
];

const LOWER: Glyph[] = [
  { id: "a", strokes: [stroke(oval(42, 64, 16, 14)), stroke(line(pt(56, 50), pt(56, 78), 8))] },
  { id: "b", strokes: [stroke(line(pt(30, 16), pt(30, 78), 12)), stroke(oval(48, 64, 16, 14))] },
  { id: "c", strokes: [stroke(arc(48, 64, 16, 14, -0.6, -0.6 - (Math.PI * 2 - 1.2), 20))] },
  { id: "d", strokes: [stroke(oval(44, 64, 16, 14)), stroke(line(pt(58, 16), pt(58, 78), 12))] },
  {
    id: "e",
    strokes: [stroke(line(pt(34, 64), pt(64, 64), 6), arc(48, 64, 16, 14, 0.05, Math.PI * 1.85, 18))],
  },
  {
    id: "f",
    strokes: [stroke(cubic(pt(62, 22), pt(62, 8), pt(40, 8), pt(40, 28), 8), line(pt(40, 28), pt(40, 84), 10)), stroke(line(pt(28, 48), pt(56, 48), 6))],
  },
  { id: "g", strokes: [stroke(oval(44, 60, 16, 14)), stroke(line(pt(58, 50), pt(58, 84), 8), cubic(pt(58, 84), pt(58, 98), pt(30, 98), pt(30, 80), 8))] },
  {
    id: "h",
    strokes: [stroke(line(pt(30, 16), pt(30, 78), 12)), stroke(cubic(pt(30, 52), pt(30, 44), pt(62, 44), pt(62, 58), 8), line(pt(62, 58), pt(62, 78), 6))],
  },
  { id: "i", strokes: [stroke(dot(46, 28)), stroke(line(pt(46, 46), pt(46, 78), 8))] },
  {
    id: "j",
    strokes: [stroke(dot(52, 26)), stroke(line(pt(52, 44), pt(52, 84), 8), cubic(pt(52, 84), pt(52, 98), pt(28, 98), pt(28, 80), 8))],
  },
  {
    id: "k",
    strokes: [stroke(line(pt(32, 16), pt(32, 78), 12)), stroke(line(pt(58, 48), pt(32, 62), 6)), stroke(line(pt(38, 58), pt(60, 78), 6))],
  },
  { id: "l", strokes: [stroke(line(pt(46, 16), pt(46, 78), 12))] },
  {
    id: "m",
    strokes: [
      stroke(line(pt(22, 78), pt(22, 50), 6)),
      stroke(cubic(pt(22, 56), pt(22, 44), pt(42, 44), pt(42, 56), 8), line(pt(42, 56), pt(42, 78), 6)),
      stroke(cubic(pt(42, 56), pt(42, 44), pt(64, 44), pt(64, 56), 8), line(pt(64, 56), pt(64, 78), 6)),
    ],
  },
  {
    id: "n",
    strokes: [stroke(line(pt(32, 78), pt(32, 50), 6)), stroke(cubic(pt(32, 56), pt(32, 44), pt(62, 44), pt(62, 56), 8), line(pt(62, 56), pt(62, 78), 6))],
  },
  { id: "o", strokes: [stroke(oval(50, 64, 16, 14))] },
  { id: "p", strokes: [stroke(line(pt(32, 48), pt(32, 96), 10)), stroke(oval(50, 62, 16, 14))] },
  { id: "q", strokes: [stroke(oval(44, 62, 16, 14)), stroke(line(pt(58, 48), pt(58, 96), 10))] },
  {
    id: "r",
    strokes: [stroke(line(pt(36, 78), pt(36, 50), 6)), stroke(cubic(pt(36, 58), pt(36, 46), pt(60, 46), pt(60, 56), 8))],
  },
  {
    id: "s",
    strokes: [
      stroke(
        cubic(pt(64, 52), pt(64, 42), pt(34, 42), pt(36, 58), 8),
        cubic(pt(36, 58), pt(38, 70), pt(66, 66), pt(62, 80), 8),
        cubic(pt(62, 80), pt(58, 90), pt(32, 88), pt(36, 76), 6),
      ),
    ],
  },
  { id: "t", strokes: [stroke(line(pt(46, 28), pt(46, 76), 10), cubic(pt(46, 76), pt(46, 86), pt(62, 86), pt(64, 74), 6)), stroke(line(pt(32, 48), pt(60, 48), 6))] },
  {
    id: "u",
    strokes: [stroke(line(pt(32, 48), pt(32, 68), 6), cubic(pt(32, 68), pt(32, 84), pt(58, 84), pt(58, 66), 8), line(pt(58, 66), pt(58, 48), 4))],
  },
  { id: "v", strokes: [stroke(line(pt(30, 48), pt(48, 78), 8)), stroke(line(pt(48, 78), pt(68, 48), 8))] },
  {
    id: "w",
    strokes: [stroke(line(pt(22, 48), pt(34, 78), 8), line(pt(34, 78), pt(48, 54), 6)), stroke(line(pt(48, 54), pt(62, 78), 6), line(pt(62, 78), pt(76, 48), 8))],
  },
  { id: "x", strokes: [stroke(line(pt(32, 48), pt(66, 78), 8)), stroke(line(pt(66, 48), pt(32, 78), 8))] },
  {
    id: "y",
    strokes: [stroke(line(pt(32, 48), pt(48, 70), 6)), stroke(line(pt(66, 48), pt(40, 96), 12))],
  },
  { id: "z", strokes: [stroke(line(pt(32, 50), pt(66, 50), 6), line(pt(66, 50), pt(32, 78), 8), line(pt(32, 78), pt(66, 78), 6))] },
];

const BY_ID = new Map<string, Glyph>();
for (const glyph of [...NUMERALS, ...UPPER, ...LOWER]) BY_ID.set(glyph.id, glyph);

export function glyphFor(id: string): Glyph | undefined {
  return BY_ID.get(id);
}

export function allGlyphs(): Glyph[] {
  return [...BY_ID.values()];
}
