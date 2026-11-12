import { cx } from "../ui/bits";
import type { CubeBoard, CubeBox } from "./boards";
import { boxCubes, boxDims, type Voxel } from "./cubes-data";

/**
 * Cube Builder pictures. Unit cubes drawn in a fixed isometric view on a floor,
 * back to front, so every cube rests on the floor or on a cube. Numbers stay
 * left to right in every language, and nothing is drawn on top of the cubes.
 */

const C = Math.cos(Math.PI / 6);
const U = 24;

type Pt = [number, number];

function project(x: number, y: number, z: number): Pt {
  return [(x - y) * C * U, (x + y) * 0.5 * U - z * U];
}

function poly(points: Pt[]): string {
  return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

/** Top, left (+y), and right (+x) face fills. */
const HUES: Record<string, [string, string, string]> = {
  pink: ["#ffd3e6", "#ffa8cc", "#f47fb0"],
  mint: ["#c9f3e8", "#8fdcc8", "#5cbfa8"],
  lav: ["#e6dcff", "#c4b0f5", "#a08ae0"],
  sun: ["#ffe9b0", "#ffd06e", "#eaae3c"],
  sky: ["#d4ecff", "#9fcff5", "#72afe0"],
};

const LAYER_HUES = ["pink", "mint", "lav", "sun", "sky"];

export interface EdgeLabel {
  at: [number, number, number];
  text: string;
  tone?: "base" | "pink" | "mint";
}

export function CubeFigure({
  cubes,
  floor,
  hue,
  labels = [],
  className,
  dropTop = false,
}: {
  cubes: Voxel[];
  floor: { l: number; w: number };
  hue: (cube: Voxel) => string;
  labels?: EdgeLabel[];
  className?: string;
  /** The top layer drops in, for the builder. */
  dropTop?: boolean;
}) {
  const at = new Set(cubes.map((c) => `${c.x},${c.y},${c.z}`));
  const has = (x: number, y: number, z: number) => at.has(`${x},${y},${z}`);
  const top = cubes.reduce((m, c) => Math.max(m, c.z), 0);
  const order = [...cubes].sort((a, b) => a.x + a.y + a.z - (b.x + b.y + b.z) || a.z - b.z);
  const pad = 0.45;
  const floorPts: Pt[] = [
    project(-pad, -pad, 0),
    project(floor.l + pad, -pad, 0),
    project(floor.l + pad, floor.w + pad, 0),
    project(-pad, floor.w + pad, 0),
  ];
  const grid: [Pt, Pt][] = [];
  for (let x = 0; x <= floor.l; x += 1) grid.push([project(x, 0, 0), project(x, floor.w, 0)]);
  for (let y = 0; y <= floor.w; y += 1) grid.push([project(0, y, 0), project(floor.l, y, 0)]);

  const all: Pt[] = [...floorPts];
  for (const c of cubes) {
    all.push(project(c.x, c.y, c.z + 1), project(c.x + 1, c.y + 1, c.z), project(c.x + 1, c.y, c.z + 1), project(c.x, c.y + 1, c.z + 1));
  }
  for (const label of labels) all.push(project(...label.at));
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const m = 16;
  const minX = Math.min(...xs) - m;
  const minY = Math.min(...ys) - m;
  const w = Math.max(...xs) + m - minX;
  const h = Math.max(...ys) + m + 6 - minY;

  return (
    <svg
      className={cx("ac-cubes-svg", className)}
      viewBox={`${minX.toFixed(1)} ${minY.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`}
      aria-hidden="true"
      style={{ aspectRatio: `${w.toFixed(1)} / ${h.toFixed(1)}` }}
    >
      <polygon points={poly(floorPts.map(([x, y]) => [x + 4, y + 7] as Pt))} className="ac-cubes-shadow" />
      <polygon points={poly(floorPts)} className="ac-cubes-floor" />
      {grid.map(([a, b], i) => (
        <line key={`g${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="ac-cubes-grid" />
      ))}
      {order.map((c) => {
        const [tFill, lFill, rFill] = HUES[hue(c)] ?? HUES.pink!;
        const { x, y, z } = c;
        const faces: { key: string; pts: Pt[]; fill: string }[] = [];
        if (!has(x, y + 1, z))
          faces.push({ key: "l", fill: lFill, pts: [project(x, y + 1, z), project(x + 1, y + 1, z), project(x + 1, y + 1, z + 1), project(x, y + 1, z + 1)] });
        if (!has(x + 1, y, z))
          faces.push({ key: "r", fill: rFill, pts: [project(x + 1, y, z), project(x + 1, y + 1, z), project(x + 1, y + 1, z + 1), project(x + 1, y, z + 1)] });
        if (!has(x, y, z + 1))
          faces.push({ key: "t", fill: tFill, pts: [project(x, y, z + 1), project(x + 1, y, z + 1), project(x + 1, y + 1, z + 1), project(x, y + 1, z + 1)] });
        if (faces.length === 0) return null;
        return (
          <g key={`${x}-${y}-${z}`} className={cx("ac-cube", dropTop && z === top && top > 0 && "is-drop")}>
            {faces.map((f) => (
              <polygon key={f.key} points={poly(f.pts)} fill={f.fill} />
            ))}
          </g>
        );
      })}
      {labels.map((label, i) => {
        const [lx, ly] = project(...label.at);
        return (
          <text key={`t${i}`} x={lx} y={ly} className={cx("ac-cubes-num", label.tone && `is-${label.tone}`)} textAnchor="middle" dominantBaseline="central">
            {label.text}
          </text>
        );
      })}
    </svg>
  );
}

function boxLabels(box: CubeBox): EdgeLabel[] {
  return [
    { at: [box.l / 2, box.w + 0.95, 0], text: String(box.l) },
    { at: [box.l + 0.95, box.w / 2, 0], text: String(box.w) },
    { at: [-0.75, box.w + 0.75, box.h / 2], text: String(box.h) },
  ];
}

/** The picture for one card or worksheet row. */
export function CubeArt({ board, reveal = false }: { board: CubeBoard; reveal?: boolean }) {
  void reveal;
  switch (board.mode) {
    case "count":
      return (
        <CubeFigure
          cubes={boxCubes(board.box)}
          floor={board.box}
          hue={(c) => LAYER_HUES[c.z % LAYER_HUES.length]!}
          className="is-count"
        />
      );
    case "build": {
      // Worksheet row: the floor layer with its two edges; the child finds how many layers.
      const floor = { ...board.box, h: 1 };
      return <CubeFigure cubes={boxCubes(floor)} floor={floor} hue={() => "pink"} labels={boxLabels(floor).slice(0, 2)} />;
    }
    case "formula": {
      const base = board.ask === "base";
      const labels: EdgeLabel[] = base
        ? [
            { at: [board.box.l / 2, board.box.w + 1.05, 0], text: `B = ${board.box.l * board.box.w}`, tone: "base" },
            { at: [-0.75, board.box.w + 0.75, board.box.h / 2], text: String(board.box.h) },
          ]
        : boxLabels(board.box);
      return (
        <CubeFigure
          cubes={boxCubes(board.box)}
          floor={board.box}
          hue={(c) => (base && c.z === 0 ? "sun" : "lav")}
          labels={labels}
          className="is-formula"
        />
      );
    }
    case "two": {
      const { box, second } = board;
      const L = box.l + second.l;
      // Each box's numbers sit on that box's own edges, in that box's color:
      // pink on the left (front, top-left, left side), teal on the right.
      const labels: EdgeLabel[] = [
        { at: [box.l / 2, box.w + 0.95, 0], text: String(box.l), tone: "pink" },
        { at: [-0.6, box.w / 2, box.h + 0.2], text: String(box.w), tone: "pink" },
        { at: [-0.75, box.w + 0.75, box.h / 2], text: String(box.h), tone: "pink" },
        { at: [box.l + second.l / 2, box.w + 0.95, 0], text: String(second.l), tone: "mint" },
        { at: [L + 1.0, second.w / 2 + 0.25, 0], text: String(second.w), tone: "mint" },
        { at: [L + 0.7, -0.7, second.h / 2 + 0.35], text: String(second.h), tone: "mint" },
      ];
      return (
        <>
          <CubeFigure
            cubes={boxCubes(box, second)}
            floor={{ l: L, w: box.w }}
            hue={(c) => (c.part === 0 ? "pink" : "mint")}
            labels={labels}
            className="is-two"
          />
          <TwoKey board={board} />
        </>
      );
    }
    default: {
      const neverBoard: never = board;
      return neverBoard;
    }
  }
}

/** A color key under the two-box picture: one swatch and l × w × h per box. */
export function TwoKey({ board }: { board: Extract<CubeBoard, { mode: "two" }> }) {
  return (
    <p className="ac-cubes-key" dir="ltr">
      <span className="is-pink">
        <i aria-hidden="true" />
        {boxDims(board.box)}
      </span>
      <span className="is-mint">
        <i aria-hidden="true" />
        {boxDims(board.second)}
      </span>
    </p>
  );
}
