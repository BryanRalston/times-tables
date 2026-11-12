import { cx } from "../ui/bits";
import type { PatternBoard, PlaneBoard } from "./boards";
import { PLANE_MAX, pairText, timesOf, twoRuleTerms } from "./grade5-pairs";
import { ruleLabel } from "./patterns-data";

/**
 * Grade 5 slice 4 pictures. Two patterns as a two-row table, and a calm
 * quadrant I coordinate plane. Math and the plane stay left to right in every
 * language. Nothing here sits on top of the squishee.
 */

export function TwoRulesArt({ board, reveal }: { board: PatternBoard; reveal: boolean }) {
  const two = board.two;
  if (!two) return null;
  const { a, b } = twoRuleTerms(two);
  const k = timesOf(two);
  const rows: { key: "a" | "b"; name: string; rule: number; terms: number[] }[] = [
    { key: "a", name: "A", rule: two.ruleA, terms: a },
    { key: "b", name: "B", rule: two.ruleB, terms: b },
  ];
  const shaded = (i: number) => two.ask === "pair" && i === two.col;
  return (
    <div className="ac-g5-rules" dir="ltr" aria-hidden="true" style={{ gridTemplateColumns: `auto repeat(${two.count}, 1fr)` }}>
      {rows.map((row) => [
        <span key={`n${row.key}`} className={cx("ac-g5-rules-name", row.key === "a" ? "is-a" : "is-b")}>
          <b>{row.name}</b>
          <small dir="auto">{ruleLabel(row.rule)}</small>
        </span>,
        ...row.terms.map((n, i) => {
          const blank = two.ask === "missing" && two.row === row.key && two.col === i;
          return (
            <span
              key={`${row.key}${i}`}
              className={cx("ac-g5-rules-term", row.key === "a" ? "is-a" : "is-b", shaded(i) && "is-col", blank && "is-blank", blank && reveal && "is-shown")}
            >
              {blank && !reveal ? "?" : n}
            </span>
          );
        }),
      ])}
      {two.ask === "relation" && reveal
        ? [
            <span key="kx" className="ac-g5-rules-name is-k">
              <small>A → B</small>
            </span>,
            ...a.map((_, i) => (
              <span key={`k${i}`} className="ac-g5-rules-k">
                {i === 0 ? "" : `× ${k}`}
              </span>
            )),
          ]
        : null}
      {two.ask === "pair" && reveal ? (
        <p className="ac-g5-rules-pair" style={{ gridColumn: `1 / span ${two.count + 1}` }}>
          {pairText(a[two.col] ?? 0, b[two.col] ?? 0)}
        </p>
      ) : null}
    </div>
  );
}

const SIZE = 280;
const PAD_L = 26;
const PAD_B = 24;
const PAD_T = 10;
const PAD_R = 12;
const UNIT_X = (SIZE - PAD_L - PAD_R) / PLANE_MAX;
const UNIT_Y = (SIZE - PAD_T - PAD_B) / PLANE_MAX;

function px(x: number): number {
  return PAD_L + x * UNIT_X;
}

function py(y: number): number {
  return SIZE - PAD_B - y * UNIT_Y;
}

const LABEL_SPOTS: readonly (readonly [number, number])[] = [
  [13, -11],
  [-13, -11],
  [13, 15],
  [-13, 15],
  [0, -15],
  [0, 21],
  [15, 5],
  [-15, 5],
];

/** Put each letter on the side of its dot that is farthest from every other dot and letter, inside the plane. */
export function labelSpots(points: readonly { x: number; y: number }[]): [number, number][] {
  const dots = points.map((p) => [px(p.x), py(p.y)] as const);
  const placed: (readonly [number, number])[] = [];
  return dots.map(([cx0, cy0]) => {
    let best: [number, number] = [LABEL_SPOTS[0]![0], LABEL_SPOTS[0]![1]];
    let bestScore = -Infinity;
    for (const [dx, dy] of LABEL_SPOTS) {
      const lx = cx0 + dx;
      const ly = cy0 + dy - 5;
      if (lx < PAD_L + 4 || lx > SIZE - 4 || ly < 6 || ly > SIZE - PAD_B - 4) continue;
      const near = [...dots.filter(([x, y]) => x !== cx0 || y !== cy0), ...placed].map(([x, y]) => Math.hypot(x - lx, y - ly));
      const score = near.length > 0 ? Math.min(...near) : 99;
      if (score > bestScore + 0.5) {
        bestScore = score;
        best = [dx, dy];
      }
    }
    placed.push([cx0 + best[0], cy0 + best[1] - 5]);
    return best;
  });
}

/** Quadrant I, 0 to 10 on both axes, one grid line per unit. */
export function PlaneArt({ plane, reveal }: { plane: PlaneBoard; reveal: boolean }) {
  const ticks = Array.from({ length: PLANE_MAX + 1 }, (_, i) => i);
  const { x: tx, y: ty } = plane.target;
  const guide = reveal || plane.ask === "pattern";
  const spots = labelSpots(plane.points);
  return (
    <div className="ac-g5-plane" dir="ltr" aria-hidden="true">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="presentation">
        {ticks.map((i) => (
          <g key={`g${i}`}>
            <line x1={px(i)} y1={py(0)} x2={px(i)} y2={py(PLANE_MAX)} className="ac-g5-plane-line" />
            <line x1={px(0)} y1={py(i)} x2={px(PLANE_MAX)} y2={py(i)} className="ac-g5-plane-line" />
            <text x={px(i)} y={py(0) + 16} className="ac-g5-plane-num" textAnchor="middle">
              {i}
            </text>
            {i > 0 ? (
              <text x={px(0) - 7} y={py(i) + 4} className="ac-g5-plane-num" textAnchor="end">
                {i}
              </text>
            ) : null}
          </g>
        ))}
        <line x1={px(0)} y1={py(0)} x2={px(PLANE_MAX) + 6} y2={py(0)} className="ac-g5-plane-axis" />
        <line x1={px(0)} y1={py(0)} x2={px(0)} y2={py(PLANE_MAX) - 6} className="ac-g5-plane-axis" />
        <text x={px(PLANE_MAX) + 4} y={py(0) - 6} className="ac-g5-plane-axis-name" textAnchor="end">
          x
        </text>
        <text x={px(0) + 7} y={py(PLANE_MAX) + 4} className="ac-g5-plane-axis-name">
          y
        </text>
        {reveal ? (
          <g className="ac-g5-plane-guide">
            <line x1={px(tx)} y1={py(0)} x2={px(tx)} y2={py(ty)} />
            <line x1={px(0)} y1={py(ty)} x2={px(tx)} y2={py(ty)} />
          </g>
        ) : null}
        {plane.ask === "pattern"
          ? plane.points.slice(1).map((p, i) => {
              const from = plane.points[i]!;
              return <line key={`s${i}`} x1={px(from.x)} y1={py(from.y)} x2={px(p.x)} y2={py(p.y)} className="ac-g5-plane-step" />;
            })
          : null}
        {plane.points.map((p, i) => {
          const hit = plane.ask === "find" && reveal && p.x === tx && p.y === ty;
          const [dx, dy] = spots[i] ?? [13, -11];
          return (
            <g key={`${p.label}${p.x}-${p.y}`} className={cx("ac-g5-plane-pt", plane.ask === "pattern" && "is-step", hit && "is-hit")}>
              <circle cx={px(p.x)} cy={py(p.y)} r={7} />
              {p.label ? (
                <text x={px(p.x) + dx} y={py(p.y) + dy} className="ac-g5-plane-label" textAnchor="middle">
                  {p.label}
                </text>
              ) : null}
            </g>
          );
        })}
        {plane.ask === "pattern" && reveal ? (
          <g className="ac-g5-plane-pt is-next">
            <line x1={px(plane.points[2]!.x)} y1={py(plane.points[2]!.y)} x2={px(tx)} y2={py(ty)} className="ac-g5-plane-step" />
            <circle cx={px(tx)} cy={py(ty)} r={8} />
          </g>
        ) : null}
        {guide && plane.ask !== "find" && reveal ? (
          <text x={Math.min(px(tx) + 10, SIZE - 52)} y={Math.max(py(ty) - 10, 16)} className="ac-g5-plane-tag">
            {pairText(tx, ty)}
          </text>
        ) : null}
      </svg>
    </div>
  );
}

/** "(3, 5)" on a tile, kept left to right inside Arabic. */
export function PairTile({ text }: { text: string }) {
  return (
    <bdi dir="ltr" className="ac-g5-pair">
      {text}
    </bdi>
  );
}
