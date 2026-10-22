import { useEffect, useState, type ReactNode } from "react";
import { gamePill, starPlace, t, thingName } from "../i18n";
import type { Grade } from "../model";
import { SquisheeImg, cx } from "../ui/bits";
import { CountToken } from "../ui/count-token";
import type { AngleKind, FlatKind, FoldFig, MeasureItem, PositionWord, QuadName, ShapeColor, ShapeName } from "./boards";
import { labelFor } from "./pick";
import type { ChoiceProps, ChoiceQ, GameModule, LevelDef, SheetItem, SkillRow } from "./types";

export function SceneCard({
  title,
  mascot,
  happy,
  hint,
  hands,
  answer,
  children,
}: {
  title: string;
  mascot: string;
  happy: boolean;
  hint: string;
  hands: boolean;
  answer: string;
  children: ReactNode;
}) {
  return (
    <section className="ac-qcard" data-hands={hands ? "yes" : "no"} data-answer={answer}>
      <h1>{title}</h1>
      <SquisheeImg id={mascot} className={cx("ac-mascot", happy && "is-happy")} />
      {children}
      <p className="ac-hint">{hint}</p>
    </section>
  );
}

export function SquisheeRow({ n, name }: { n: number; name: string }) {
  return (
    <div className="ac-emoji-row" aria-label={`${n} ${name}`}>
      {Array.from({ length: n }, (_, i) => (
        <CountToken key={i} />
      ))}
    </div>
  );
}

export function EmojiRow({ emoji, n, name }: { emoji: string; n: number; name: string }) {
  return (
    <div className="ac-emoji-row" aria-label={`${n} ${name}`}>
      {Array.from({ length: n }, (_, i) => (
        <span key={i}>{emoji}</span>
      ))}
    </div>
  );
}

export function TenFrames({ frames }: { frames: number[] }) {
  return (
    <div className="ac-frames">
      {frames.map((filled, frame) => (
        <div key={frame} className="ac-ten" aria-hidden="true">
          {Array.from({ length: 10 }, (_, cell) =>
            cell < filled ? <CountToken key={cell} /> : <i key={cell} />,
          )}
        </div>
      ))}
    </div>
  );
}

export function DotClusters({ clusters }: { clusters: number[] }) {
  return (
    <div className="ac-clusters" aria-hidden="true">
      {clusters.map((count, i) => (
        <span key={i} className="ac-cluster">
          {Array.from({ length: count }, (_, n) => (
            <i key={n} />
          ))}
        </span>
      ))}
    </div>
  );
}

export function BaseTen({ n }: { n: number }) {
  const hundreds = Math.floor(n / 100);
  const tens = Math.floor((n % 100) / 10);
  const ones = n % 10;
  if (hundreds > 4) return <p className="ac-big-num">{n}</p>;
  return (
    <div className="ac-base" aria-hidden="true">
      {Array.from({ length: hundreds }, (_, i) => (
        <i key={`h${i}`} className="ac-flat" />
      ))}
      {Array.from({ length: tens }, (_, i) => (
        <i key={`t${i}`} className="ac-rod" />
      ))}
      <span className="ac-ones">
        {Array.from({ length: ones }, (_, i) => (
          <i key={`o${i}`} className="ac-dot is-pink" />
        ))}
      </span>
    </div>
  );
}

export function ShapeFig({ name }: { name: ShapeName }) {
  const label = name;
  switch (name) {
    case "circle":
      return (
        <svg className="ac-shape" viewBox="0 0 120 100" role="img" aria-label={label}>
          <circle cx="60" cy="50" r="36" />
        </svg>
      );
    case "triangle":
      return (
        <svg className="ac-shape" viewBox="0 0 120 100" role="img" aria-label={label}>
          <polygon points={TRIANGLE_POINTS} />
        </svg>
      );
    case "square":
      return (
        <svg className="ac-shape" viewBox="0 0 120 100" role="img" aria-label={label}>
          <rect x="28" y="18" width="64" height="64" />
        </svg>
      );
    case "rectangle":
      return (
        <svg className="ac-shape" viewBox="0 0 120 100" role="img" aria-label={label}>
          <rect x="12" y="28" width="96" height="48" />
        </svg>
      );
    case "pentagon":
      return (
        <svg className="ac-shape" viewBox="0 0 120 100" role="img" aria-label={label}>
          <polygon points="60,8 108,42 90,92 30,92 12,42" />
        </svg>
      );
    case "hexagon":
      return (
        <svg className="ac-shape" viewBox="0 0 120 100" role="img" aria-label={label}>
          <polygon points="36,12 84,12 110,50 84,88 36,88 10,50" />
        </svg>
      );
    case "cube":
      return (
        <svg className="ac-shape" viewBox="0 0 120 100" role="img" aria-label={label}>
          <polygon points="28,38 62,22 96,38 62,54" />
          <polygon points="28,38 62,54 62,86 28,70" />
          <polygon points="62,54 96,38 96,70 62,86" />
        </svg>
      );
    case "sphere":
      return (
        <svg className="ac-shape" viewBox="0 0 120 100" role="img" aria-label={label}>
          <circle cx="60" cy="50" r="36" />
          <ellipse cx="48" cy="38" rx="10" ry="6" className="is-shine" />
        </svg>
      );
    case "cone":
      return (
        <svg className="ac-shape" viewBox="0 0 120 100" role="img" aria-label={label}>
          <ellipse cx="60" cy="78" rx="32" ry="12" />
          <polygon points="60,12 92,78 28,78" />
        </svg>
      );
    case "cylinder":
      return (
        <svg className="ac-shape" viewBox="0 0 120 100" role="img" aria-label={label}>
          <ellipse cx="60" cy="24" rx="32" ry="12" />
          <path d="M28 24 V76 Q28 90 60 90 Q92 90 92 76 V24" />
          <ellipse cx="60" cy="76" rx="32" ry="12" />
        </svg>
      );
    default: {
      const neverName: never = name;
      return neverName;
    }
  }
}

const SWATCH: Record<ShapeColor, string> = {
  red: "#e85d6a",
  blue: "#4c8dff",
  yellow: "#f6c945",
  green: "#3cbf7a",
};

export function ColorSwatch({ color }: { color: ShapeColor }) {
  return (
    <svg className="ac-shape" viewBox="0 0 120 100" role="img" aria-label={color}>
      <circle cx="60" cy="50" r="36" fill={SWATCH[color]} stroke="#2a2430" strokeWidth="3" />
    </svg>
  );
}

export function SizeDot({ n }: { n: number }) {
  const radius = 10 + Math.max(1, Math.min(4, n)) * 8;
  return (
    <svg className="ac-shape" viewBox="0 0 120 100" role="img" aria-label={String(n)}>
      <circle cx="60" cy="50" r={radius} />
    </svg>
  );
}

export function AngleFig({ kind }: { kind: AngleKind }) {
  const sweep = kind === "acute" ? 40 : kind === "right" ? 90 : kind === "obtuse" ? 130 : 180;
  const rad = ((180 - sweep) * Math.PI) / 180;
  const x2 = 24 + Math.cos(rad) * 78;
  const y2 = 78 - Math.sin(rad) * 78;
  return (
    <svg className="ac-shape" viewBox="0 0 120 100" role="img" aria-label={kind}>
      <line x1="24" y1="78" x2="108" y2="78" />
      <line x1="24" y1="78" x2={x2} y2={y2} />
      {kind === "right" ? <path d="M24 62 H40 V78" fill="none" /> : null}
    </svg>
  );
}

export function RectFig({ length, width, label }: { length: number; width: number; label: string }) {
  const w = Math.min(120, 28 + length * 8);
  const h = Math.min(72, 18 + width * 6);
  const x = (160 - w) / 2;
  const y = (110 - h) / 2;
  return (
    <svg className="ac-shape" viewBox="0 0 160 120" role="img" aria-label={label}>
      <rect x={x} y={y} width={w} height={h} />
      <text x={80} y={y + h + 16} textAnchor="middle">
        {length} × {width}
      </text>
    </svg>
  );
}

export function DecimalGrid({ tenths, hundredths }: { tenths: number; hundredths: number }) {
  const filled = Math.max(0, Math.min(100, tenths * 10 + hundredths));
  return (
    <div className="ac-decimal" aria-hidden="true">
      {Array.from({ length: 100 }, (_, index) => (
        <i key={index} className={index < filled ? "is-on" : ""} />
      ))}
    </div>
  );
}

function isShapeColor(value: string): value is ShapeColor {
  return value === "red" || value === "blue" || value === "yellow" || value === "green";
}

function isFlatName(value: string): value is ShapeName {
  return value === "circle" || value === "triangle" || value === "square" || value === "rectangle";
}

/** Equilateral, so the picture has three lines of symmetry. */
export const TRIANGLE_POINTS = "60,17.09 98,82.91 22,82.91";

export const RULER_INCH = 18;
const RULER_SPAN = 12;

export function FractionBar({ num, den }: { num: number; den: number }) {
  return (
    <div className="ac-frac" aria-label={`${num} of ${den}`}>
      {Array.from({ length: den }, (_, i) => (
        <i key={i} className={i < num ? "is-on" : ""} />
      ))}
    </div>
  );
}

export function FractionLine({ den, mark }: { den: number; mark: number }) {
  const ticks = Array.from({ length: den + 1 }, (_, i) => i);
  return (
    <svg className="ac-line" viewBox="0 0 320 80" role="img" aria-label={t("Number line from 0 to 1", "Recta numérica del 0 al 1")}>
      <line x1="20" y1="36" x2="300" y2="36" className="ac-line-base" />
      {ticks.map((i) => {
        const x = 20 + (280 * i) / den;
        const text = i === 0 ? "0" : i === den ? "1" : `${i}/${den}`;
        return (
          <g key={i}>
            <line x1={x} y1="28" x2={x} y2="44" className="ac-line-tick" />
            <text x={x} y="66" textAnchor="middle">
              {text}
            </text>
            {i === mark ? <circle cx={x} cy="36" r="7" className="ac-line-dot" /> : null}
          </g>
        );
      })}
    </svg>
  );
}

export function Ruler({ inches }: { inches: number }) {
  return (
    <div className="ac-ruler-wrap">
      <div className="ac-ruler-scale">
        <div className="ac-ruler-obj" style={{ width: inches * RULER_INCH }} />
        <div className="ac-ruler" aria-hidden="true" style={{ width: RULER_SPAN * RULER_INCH }}>
          {Array.from({ length: RULER_SPAN + 1 }, (_, i) => (
            <span key={i} style={{ left: i * RULER_INCH }}>
              {i}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PictureGraph({ items }: { items: MeasureItem[] }) {
  return (
    <div className="ac-picto" aria-hidden="true">
      {items.map((item) => (
        <p key={item.name}>
          <span>
            {item.emoji} {thingName(item.name, 1, item.name)}
          </span>
          <span>{item.emoji.repeat(item.value)}</span>
        </p>
      ))}
    </div>
  );
}

export function BarGraph({ items }: { items: MeasureItem[] }) {
  return (
    <div className="ac-graph" aria-hidden="true">
      {items.map((item) => (
        <div key={item.name} className="ac-graph-col">
          <i style={{ height: item.value * 12 }} />
          <span>
            {item.emoji}
            <small>{thingName(item.name, 1, item.name)}</small>
          </span>
        </div>
      ))}
    </div>
  );
}

export function StoryGroups({
  op,
  a,
  b,
  emoji,
}: {
  op: "+" | "-" | "×" | "÷";
  a: number;
  b: number;
  emoji: string;
}) {
  if (op === "+") {
    return (
      <div className="ac-emoji-row">
        <span>{emoji.repeat(a)}</span>
        <span className="ac-op-mini">+</span>
        <span>{emoji.repeat(b)}</span>
      </div>
    );
  }
  if (op === "-") {
    return (
      <div className="ac-emoji-row">
        <span>{emoji.repeat(Math.max(0, a - b))}</span>
        <span className="ac-gone">{emoji.repeat(b)}</span>
      </div>
    );
  }
  if (op === "×") {
    return (
      <div className="ac-groups" aria-hidden="true">
        {Array.from({ length: a }, (_, i) => (
          <span key={i} className="ac-group">
            {emoji.repeat(b)}
          </span>
        ))}
      </div>
    );
  }
  const each = b > 0 ? Math.floor(a / b) : 0;
  return (
    <div className="ac-groups" aria-label={`${b} equal groups`}>
      {Array.from({ length: b }, (_, i) => (
        <span key={i} className="ac-group">
          {emoji.repeat(each)}
        </span>
      ))}
    </div>
  );
}

function TextChoices({ question, onChoose }: { question: ChoiceQ; onChoose: ChoiceProps["onChoose"] }) {
  const labels = question.visual.kind === "scene" ? question.visual.labels : {};
  return (
    <div className="ac-choices">
      {question.choices.map((choice) => (
        <button key={choice} type="button" className="ac-choice is-word" onClick={() => onChoose(choice)}>
          {labels[choice] ?? choice}
        </button>
      ))}
    </div>
  );
}

const INK = "#2a2430";

function isPositionWord(value: string): value is PositionWord {
  return value === "above" || value === "below" || value === "beside" || value === "behind";
}

function isFlatKind(value: string): value is FlatKind {
  return value === "circle" || value === "triangle" || value === "square" || value === "rectangle";
}

function isQuadName(value: string): value is QuadName {
  return value === "rhombus" || value === "rectangle" || value === "square" || value === "trapezoid";
}

function isFoldFig(value: string): value is FoldFig {
  return value === "square" || value === "rectangle" || value === "triangle" || value === "circle";
}

function positionLabel(place: PositionWord): string {
  return starPlace(place);
}

/** Crisp geometry pictures. No filters, and nothing is drawn on the squishee. */
export function GeoMark({ code }: { code: string }) {
  const bits = code.split(":");
  const kind = bits[1] ?? "";
  switch (kind) {
    case "pos":
      return isPositionWord(bits[2] ?? "") ? <PositionScene place={bits[2] as PositionWord} /> : null;
    case "shape":
      return isShapeName(bits[2] ?? "") ? <ShapeFig name={bits[2] as ShapeName} /> : null;
    case "trait":
      return isFlatKind(bits[2] ?? "") && isShapeColor(bits[3] ?? "") ? (
        <TraitFig shape={bits[2] as FlatKind} color={bits[3] as ShapeColor} big={bits[4] !== "small"} turn={bits[5] === "turn"} />
      ) : null;
    case "join":
      return bits[2] === "rectangle" || bits[2] === "square" || bits[2] === "circle" ? <JoinFig made={bits[2]} /> : null;
    case "piece":
      return <PieceFig name={bits[2] ?? ""} />;
    case "net":
      return <CubeNet />;
    case "grid": {
      const size = parseGridSize(bits[2] ?? "", bits[3]);
      return <GridFig rows={size.rows} cols={size.cols} />;
    }
    case "quad":
      return isQuadName(bits[2] ?? "") ? <QuadFig name={bits[2] as QuadName} /> : null;
    case "share":
      return <ShareFig den={Number(bits[2])} />;
    case "fold":
      return isFoldFig(bits[2] ?? "") ? <FoldFigShape fig={bits[2] as FoldFig} mirror={bits[3] === "yes"} /> : null;
    default:
      return null;
  }
}

export function geoAlt(code: string): string {
  const bits = code.split(":");
  switch (bits[1]) {
    case "pos":
      return isPositionWord(bits[2] ?? "") ? positionLabel(bits[2] as PositionWord) : t("A shape", "Una figura");
    case "shape":
    case "quad":
    case "piece":
      return bits[2] || t("A shape", "Una figura");
    case "trait":
      return bits[2] || t("A shape", "Una figura");
    case "join":
      return t("Shapes joined together", "Figuras juntas");
    case "net":
      return t("A cube net", "La red de un cubo");
    case "grid":
      return t("A rectangle tiled with squares", "Un rectángulo cubierto de cuadrados");
    case "share":
      return t("One equal part shaded", "Una parte igual sombreada");
    case "fold":
      return bits[3] === "yes" ? t("A line of symmetry", "Una línea de simetría") : t("A line that is not symmetry", "Una línea que no es simetría");
    default:
      return t("A shape", "Una figura");
  }
}

function Star({ cx, cy }: { cx: number; cy: number }) {
  return <polygon className="is-star" points={starPoints(cx, cy, 11, 5)} />;
}

function starPoints(cx: number, cy: number, outer: number, inner: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + Math.cos(angle) * radius).toFixed(1)},${(cy + Math.sin(angle) * radius).toFixed(1)}`);
  }
  return pts.join(" ");
}

function PositionScene({ place }: { place: PositionWord }) {
  const star = place === "above" ? { x: 60, y: 16 } : place === "below" ? { x: 60, y: 86 } : place === "beside" ? { x: 16, y: 50 } : { x: 60, y: 40 };
  const behind = place === "behind";
  return (
    <svg className="ac-geo" viewBox="0 0 120 100" role="img" aria-label={positionLabel(place)}>
      {behind ? <Star cx={star.x} cy={star.y} /> : null}
      <rect className="is-box" x="36" y="34" width="48" height="36" />
      {behind ? null : <Star cx={star.x} cy={star.y} />}
    </svg>
  );
}

function TraitFig({ shape, color, big, turn }: { shape: FlatKind; color: ShapeColor; big: boolean; turn: boolean }) {
  const fill = SWATCH[color];
  const spin = turn && shape !== "circle" ? "rotate(22 60 50)" : "";
  const scale = big ? "" : "translate(60 50) scale(0.62) translate(-60 -50)";
  const transform = `${scale} ${spin}`.trim();
  return (
    <svg className="ac-geo" viewBox="0 0 120 100" role="img" aria-label={shape}>
      {shape === "circle" ? <circle cx="60" cy="50" r={big ? 30 : 18} fill={fill} stroke={INK} strokeWidth="3" /> : null}
      {shape === "triangle" ? <polygon points={TRIANGLE_POINTS} fill={fill} stroke={INK} strokeWidth="3" transform={transform} /> : null}
      {shape === "square" ? <rect x="28" y="18" width="64" height="64" fill={fill} stroke={INK} strokeWidth="3" transform={transform} /> : null}
      {shape === "rectangle" ? <rect x="14" y="30" width="92" height="40" fill={fill} stroke={INK} strokeWidth="3" transform={transform} /> : null}
    </svg>
  );
}

function JoinFig({ made }: { made: "rectangle" | "square" | "circle" }) {
  if (made === "circle") {
    return (
      <svg className="ac-geo" viewBox="0 0 120 100" role="img" aria-label={t("Two half circles", "Dos medios círculos")}>
        <path d="M28 50 A32 32 0 0 1 92 50 Z" />
        <path d="M28 50 A32 32 0 0 0 92 50 Z" />
      </svg>
    );
  }
  const top = made === "square" ? 18 : 28;
  const bottom = made === "square" ? 82 : 76;
  const right = made === "square" ? 82 : 102;
  return (
    <svg className="ac-geo" viewBox="0 0 120 100" role="img" aria-label={t("Two triangles joined", "Dos triángulos juntos")}>
      <polygon points={`18,${top} 18,${bottom} ${right},${bottom}`} />
      <polygon points={`18,${top} ${right},${top} ${right},${bottom}`} />
    </svg>
  );
}

function PieceFig({ name }: { name: string }) {
  if (name === "square") {
    return (
      <svg className="ac-geo" viewBox="0 0 120 100" role="img" aria-label="square">
        <rect x="36" y="26" width="48" height="48" />
      </svg>
    );
  }
  if (name === "half") {
    return (
      <svg className="ac-geo" viewBox="0 0 120 100" role="img" aria-label={t("A half circle", "Un medio círculo")}>
        <path d="M24 62 A36 36 0 0 1 96 62 Z" />
      </svg>
    );
  }
  return (
    <svg className="ac-geo" viewBox="0 0 120 100" role="img" aria-label="triangle">
      <polygon points="22,78 98,78 22,22" />
    </svg>
  );
}

function CubeNet() {
  const s = 16;
  const cells = [
    [34, 26],
    [18, 42],
    [34, 42],
    [50, 42],
    [66, 42],
    [34, 58],
  ];
  return (
    <svg className="ac-geo" viewBox="0 0 120 100" role="img" aria-label={t("A cube net", "La red de un cubo")}>
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={s} height={s} />
      ))}
    </svg>
  );
}

/** Accepts `geo:grid:2x3` and `geo:grid:2:3`. */
function parseGridSize(first: string, second: string | undefined): { rows: number; cols: number } {
  const pair = first.includes("x") ? first.split("x") : [first, second ?? ""];
  return { rows: Number(pair[0]), cols: Number(pair[1]) };
}

function GridFig({ rows, cols }: { rows: number; cols: number }) {
  const safeRows = Math.max(1, Math.min(5, rows || 1));
  const safeCols = Math.max(1, Math.min(5, cols || 1));
  const cell = 16;
  const width = safeCols * cell;
  const height = safeRows * cell;
  const x0 = (120 - width) / 2;
  const y0 = (100 - height) / 2;
  const cells: Array<[number, number]> = [];
  for (let row = 0; row < safeRows; row += 1) {
    for (let col = 0; col < safeCols; col += 1) cells.push([x0 + col * cell, y0 + row * cell]);
  }
  return (
    <svg className="ac-geo" viewBox="0 0 120 100" role="img" aria-label={t("A rectangle tiled with squares", "Un rectángulo cubierto de cuadrados")}>
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={cell} height={cell} />
      ))}
    </svg>
  );
}

function QuadFig({ name }: { name: QuadName }) {
  switch (name) {
    case "rhombus":
      return (
        <svg className="ac-geo" viewBox="0 0 120 100" role="img" aria-label="rhombus">
          <polygon points="60,10 102,50 60,90 18,50" />
        </svg>
      );
    case "rectangle":
      return <ShapeFig name="rectangle" />;
    case "square":
      return <ShapeFig name="square" />;
    case "trapezoid":
      return (
        <svg className="ac-geo" viewBox="0 0 120 100" role="img" aria-label="trapezoid">
          <polygon points="34,22 86,22 106,80 14,80" />
        </svg>
      );
    default: {
      const neverName: never = name;
      return neverName;
    }
  }
}

function ShareFig({ den }: { den: number }) {
  const parts = den === 3 ? 3 : den === 4 ? 4 : 2;
  return (
    <svg className="ac-geo" viewBox="0 0 120 80" role="img" aria-label={t("One equal part shaded", "Una parte igual sombreada")}>
      {Array.from({ length: parts }, (_, index) => {
        const width = 100 / parts;
        return (
          <rect
            key={index}
            x={10 + index * width}
            y="16"
            width={width - 2}
            height="48"
            className={index === 0 ? "is-unit" : "is-off"}
          />
        );
      })}
    </svg>
  );
}

function FoldFigShape({ fig, mirror }: { fig: FoldFig; mirror: boolean }) {
  const line = foldLine(fig, mirror);
  return (
    <svg className="ac-geo" viewBox="0 0 120 100" role="img" aria-label={mirror ? t("A line of symmetry", "Una línea de simetría") : t("A line that is not symmetry", "Una línea que no es simetría")}>
      {fig === "square" ? <rect x="28" y="18" width="64" height="64" /> : null}
      {fig === "rectangle" ? <rect x="14" y="30" width="92" height="40" /> : null}
      {fig === "triangle" ? <polygon points={TRIANGLE_POINTS} /> : null}
      {fig === "circle" ? <circle cx="60" cy="50" r="32" /> : null}
      <line className="is-line" x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
    </svg>
  );
}

function foldLine(fig: FoldFig, mirror: boolean): { x1: number; y1: number; x2: number; y2: number } {
  if (mirror) {
    switch (fig) {
      case "square":
        return { x1: 60, y1: 18, x2: 60, y2: 82 };
      case "rectangle":
        return { x1: 14, y1: 50, x2: 106, y2: 50 };
      case "triangle":
        return { x1: 60, y1: 17, x2: 60, y2: 83 };
      case "circle":
        return { x1: 28, y1: 50, x2: 92, y2: 50 };
      default: {
        const neverFig: never = fig;
        return neverFig;
      }
    }
  }
  switch (fig) {
    case "square":
      return { x1: 44, y1: 18, x2: 44, y2: 82 };
    case "rectangle":
      return { x1: 14, y1: 30, x2: 106, y2: 70 };
    case "triangle":
      return { x1: 40, y1: 17, x2: 40, y2: 83 };
    case "circle":
      return { x1: 46, y1: 22, x2: 46, y2: 78 };
    default: {
      const neverFig: never = fig;
      return neverFig;
    }
  }
}

function isShapeName(value: string): value is ShapeName {
  return (
    value === "circle" ||
    value === "triangle" ||
    value === "square" ||
    value === "rectangle" ||
    value === "pentagon" ||
    value === "hexagon" ||
    value === "cube" ||
    value === "sphere" ||
    value === "cone" ||
    value === "cylinder"
  );
}

function choiceCaption(label: string | undefined, choice: string): string {
  if (label === undefined) return choice;
  return label;
}

type PartKind = "halves" | "thirds" | "fourths" | "unequal";

function isPartKind(value: string): value is PartKind {
  return value === "halves" || value === "thirds" || value === "fourths" || value === "unequal";
}

function partAlt(kind: PartKind): string {
  switch (kind) {
    case "halves":
      return t("Two equal parts", "Dos partes iguales");
    case "thirds":
      return t("Three equal parts", "Tres partes iguales");
    case "fourths":
      return t("Four equal parts", "Cuatro partes iguales");
    case "unequal":
      return t("Parts that are not equal", "Partes que no son iguales");
    default: {
      const neverKind: never = kind;
      return neverKind;
    }
  }
}

/** Screen-reader name for a picture button. A lone emoji keeps its word. Repeated emoji are groups. */
export function pictureAlt(label: string | undefined, choice: string, picture: string): string {
  if (picture.startsWith("sq:")) {
    const n = Number(picture.slice(3));
    if (!Number.isFinite(n)) return t("A group of squishees", "Un grupo de squishees");
    return t(`${n} ${n === 1 ? "squishee" : "squishees"}`, `${n} ${n === 1 ? "squishee" : "squishees"}`, `${n} ${n === 1 ? "squishee" : "squishees"}`);
  }
  if (picture.startsWith("shape:")) {
    const kind = picture.slice(6);
    return isPartKind(kind) ? partAlt(kind) : t("A shape split into parts", "Una figura partida en partes");
  }
  const swatch = picture.startsWith("swatch:") ? picture.slice(7) : "";
  if (isShapeColor(swatch)) {
    switch (swatch) {
      case "red":
        return t("red", "rojo");
      case "blue":
        return t("blue", "azul");
      case "yellow":
        return t("yellow", "amarillo");
      case "green":
        return t("green", "verde");
      default: {
        const neverColor: never = swatch;
        return neverColor;
      }
    }
  }
  if (picture.startsWith("geo:")) return geoAlt(picture);
  if (picture.startsWith("fig:")) return picture.slice(4);
  if (picture.startsWith("grow:")) return t("A circle", "Un círculo");
  const groups = picture.split(" ").filter((part) => part.length > 0);
  const token = groups[0] ?? "";
  const units = [...token];
  const repeated = groups.length > 0 && groups.every((part) => part === token) && units.length > 0 && units.every((unit) => unit === units[0]);
  if (repeated && (groups.length > 1 || units.length > 1)) {
    const size = units.length;
    const count = groups.length;
    return `${count} ${count === 1 ? "group" : "groups"} of ${size}`;
  }
  if (label) return label;
  return choice;
}

function PartFig({ kind }: { kind: PartKind }) {
  const fill = "#7ad7c8";
  const line = "#0e7d72";
  switch (kind) {
    case "halves":
      return (
        <svg className="ac-part" viewBox="0 0 80 48" role="img" aria-hidden="true">
          <rect x="1" y="1" width="38" height="46" fill={fill} stroke={line} strokeWidth="2" />
          <rect x="41" y="1" width="38" height="46" fill={fill} stroke={line} strokeWidth="2" />
        </svg>
      );
    case "thirds":
      return (
        <svg className="ac-part" viewBox="0 0 80 48" role="img" aria-hidden="true">
          <rect x="1" y="1" width="24" height="46" fill={fill} stroke={line} strokeWidth="2" />
          <rect x="28" y="1" width="24" height="46" fill={fill} stroke={line} strokeWidth="2" />
          <rect x="55" y="1" width="24" height="46" fill={fill} stroke={line} strokeWidth="2" />
        </svg>
      );
    case "fourths":
      return (
        <svg className="ac-part" viewBox="0 0 80 48" role="img" aria-hidden="true">
          <rect x="1" y="1" width="38" height="22" fill={fill} stroke={line} strokeWidth="2" />
          <rect x="41" y="1" width="38" height="22" fill={fill} stroke={line} strokeWidth="2" />
          <rect x="1" y="25" width="38" height="22" fill={fill} stroke={line} strokeWidth="2" />
          <rect x="41" y="25" width="38" height="22" fill={fill} stroke={line} strokeWidth="2" />
        </svg>
      );
    case "unequal":
      return (
        <svg className="ac-part" viewBox="0 0 80 48" role="img" aria-hidden="true">
          <rect x="1" y="1" width="22" height="46" fill={fill} stroke={line} strokeWidth="2" />
          <rect x="25" y="1" width="54" height="46" fill="#f8d7ea" stroke={line} strokeWidth="2" />
        </svg>
      );
    default: {
      const neverKind: never = kind;
      return neverKind;
    }
  }
}

function PictureFace({ picture }: { picture: string }) {
  if (picture.startsWith("sq:")) {
    const n = Number(picture.slice(3));
    if (Number.isFinite(n) && n > 0) {
      return (
        <span aria-hidden="true">
          <SquisheeRow n={n} name="squishees" />
        </span>
      );
    }
  }
  if (picture.startsWith("shape:")) {
    const kind = picture.slice(6);
    if (isPartKind(kind)) return <PartFig kind={kind} />;
  }
  if (picture.startsWith("swatch:")) {
    const color = picture.slice(7);
    if (isShapeColor(color)) return <ColorSwatch color={color} />;
  }
  if (picture.startsWith("geo:")) return <GeoMark code={picture} />;
  if (picture.startsWith("fig:")) {
    const name = picture.slice(4);
    if (isFlatName(name) || isShapeName(name)) return <ShapeFig name={name} />;
  }
  if (picture.startsWith("grow:")) {
    const n = Number(picture.slice(5));
    if (Number.isFinite(n)) return <SizeDot n={n} />;
  }
  return (
    <span className="ac-pic-emoji" aria-hidden="true">
      {picture}
    </span>
  );
}

function PictureChoices({ question, onChoose }: { question: ChoiceQ; onChoose: ChoiceProps["onChoose"] }) {
  const visual = question.visual.kind === "scene" ? question.visual : null;
  const pictures = visual?.pictures ?? {};
  const labels = visual?.labels ?? {};
  return (
    <div className="ac-choices">
      {question.choices.map((choice) => {
        const caption = choiceCaption(labels[choice], choice);
        return (
          <button
            key={choice}
            type="button"
            className="ac-choice is-card"
            aria-label={pictureAlt(labels[choice], choice, pictures[choice] ?? "")}
            onClick={() => onChoose(choice)}
          >
            <PictureFace picture={pictures[choice] ?? ""} />
            {caption ? <small>{caption}</small> : null}
          </button>
        );
      })}
    </div>
  );
}

function useTries(resetKey: string) {
  const [tries, setTries] = useState(0);
  const [note, setNote] = useState("");
  useEffect(() => {
    setTries(0);
    setNote("");
  }, [resetKey]);
  return { tries, setTries, note, setNote };
}

function TenBuilder({
  answer,
  onChoose,
}: {
  answer: string;
  onChoose: ChoiceProps["onChoose"];
}) {
  const [on, setOn] = useState<boolean[]>(() => Array(10).fill(false));
  const { tries, setTries, note, setNote } = useTries(answer);
  const filled = on.filter(Boolean).length;

  function check() {
    if (String(filled) === answer) {
      onChoose(answer);
      return;
    }
    if (tries === 0) {
      setTries(1);
      setNote(
        filled === 0
          ? t("Tap a spot for each squishee.", "Toca un espacio por cada squishee.")
          : t("Count the squishees and try again.", "Cuenta los squishees e inténtalo otra vez."),
      );
      return;
    }
    onChoose(String(filled));
  }

  return (
    <div className="ac-build">
      <div className="ac-ten">
        {on.map((filledCell, i) => (
          <button
            key={i}
            type="button"
            className={cx("ac-cell", filledCell && "is-on")}
            aria-label={filledCell ? "Squishee" : t("Empty", "Vacío")}
            aria-pressed={filledCell}
            onClick={() => setOn((rows) => rows.map((cell, n) => (n === i ? !cell : cell)))}
          >
            {filledCell ? <CountToken /> : null}
          </button>
        ))}
      </div>
      <p className="ac-tile-note">{note}</p>
      <button type="button" className="ac-check" onClick={check}>
        {t("Check", "Revisar")}
      </button>
    </div>
  );
}

function BlockBuilder({ answer, onChoose }: { answer: string; onChoose: ChoiceProps["onChoose"] }) {
  const [tens, setTens] = useState(0);
  const [ones, setOnes] = useState(0);
  const { tries, setTries, note, setNote } = useTries(answer);
  const value = tens * 10 + ones;

  function check() {
    if (String(value) === answer) {
      onChoose(answer);
      return;
    }
    if (tries === 0) {
      setTries(1);
      setNote(t("A ten is a tall rod. A one is a little cube.", "Una decena es una barra alta. Una unidad es un cubito."));
      return;
    }
    onChoose(String(value));
  }

  return (
    <div className="ac-build">
      <BaseTen n={value} />
      <div className="ac-steppers">
        <Stepper label={t("tens", "decenas")} value={tens} onChange={setTens} max={9} />
        <Stepper label={t("ones", "unidades")} value={ones} onChange={setOnes} max={9} />
      </div>
      <p className="ac-tile-note">{note}</p>
      <button type="button" className="ac-check" onClick={check}>
        {t("Check", "Revisar")}
      </button>
    </div>
  );
}

function Stepper({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="ac-stepper">
      <button type="button" aria-label={t(`Fewer ${label}`, `Menos ${label}`, `Menos ${label}`)} onClick={() => onChange(Math.max(0, value - 1))}>
        −
      </button>
      <span>
        {value} {label}
      </span>
      <button type="button" aria-label={t(`More ${label}`, `Más ${label}`, `Mais ${label}`)} onClick={() => onChange(Math.min(max, value + 1))}>
        +
      </button>
    </div>
  );
}

function ShadeBuilder({
  den,
  answer,
  onChoose,
}: {
  den: number;
  answer: string;
  onChoose: ChoiceProps["onChoose"];
}) {
  const [on, setOn] = useState<boolean[]>(() => Array(den).fill(false));
  const { tries, setTries, note, setNote } = useTries(answer);
  const shaded = on.filter(Boolean).length;

  useEffect(() => {
    setOn(Array(den).fill(false));
  }, [den, answer]);

  function check() {
    const made = `${shaded}/${den}`;
    if (made === answer || (shaded === den && answer === "1") || (shaded === 0 && answer === "0")) {
      onChoose(answer);
      return;
    }
    if (tries === 0) {
      setTries(1);
      setNote(t("Tap a part to shade it. Tap again to clear it.", "Toca una parte para sombrearla. Toca otra vez para quitarla."));
      return;
    }
    onChoose(made);
  }

  return (
    <div className="ac-build">
      <div className="ac-frac">
        {on.map((part, i) => (
          <button
            key={i}
            type="button"
            className={cx("ac-frac-btn", part && "is-on")}
            aria-pressed={part}
            aria-label={part ? t("Shaded part", "Parte sombreada") : t("Empty part", "Parte vacía")}
            onClick={() => setOn((rows) => rows.map((cell, n) => (n === i ? !cell : cell)))}
          />
        ))}
      </div>
      <p className="ac-tile-note">{note}</p>
      <button type="button" className="ac-check" onClick={check}>
        {t("Check", "Revisar")}
      </button>
    </div>
  );
}

function LengthChoices({
  items,
  onChoose,
}: {
  items: MeasureItem[];
  onChoose: ChoiceProps["onChoose"];
}) {
  return (
    <div className="ac-choices">
      {items.map((item) => (
        <button
          key={item.name}
          type="button"
          className="ac-choice is-card"
          aria-label={thingName(item.name, 1, item.name)}
          onClick={() => onChoose(item.name)}
        >
          <i className="ac-len" style={{ width: `${item.value * 18}px` }} aria-hidden="true" />
          <small>
            {item.emoji} {thingName(item.name, 1, item.name)}
          </small>
        </button>
      ))}
    </div>
  );
}

export function SceneChoices({ question, onChoose }: ChoiceProps) {
  if (question.visual.kind !== "scene") return <TextChoices question={question} onChoose={onChoose} />;
  const board = question.visual.board;
  if (board.game === "count" && board.mode === "build") {
    return <TenBuilder answer={question.answer} onChoose={onChoose} />;
  }
  if (board.game === "place" && board.mode === "build") {
    return <BlockBuilder answer={question.answer} onChoose={onChoose} />;
  }
  if (board.game === "fractions" && board.mode === "shade") {
    return <ShadeBuilder den={board.den} answer={question.answer} onChoose={onChoose} />;
  }
  if (board.game === "measure" && board.mode === "compare") {
    return <LengthChoices items={board.items} onChoose={onChoose} />;
  }
  if (question.visual.pictures) return <PictureChoices question={question} onChoose={onChoose} />;
  return <TextChoices question={question} onChoose={onChoose} />;
}

export function ProblemList({ items }: { items: SheetItem[] }) {
  return (
    <ol className="ac-problems">
      {items.map((item, i) => (
        <li key={`${item.prompt}-${i}`}>{item.prompt}</li>
      ))}
    </ol>
  );
}

export function sceneModule(opts: {
  id: string;
  title: string;
  short: string;
  audience: string;
  tint: string;
  mascot: string;
  sheetSlug: string;
  sheetScreen: string;
  blurb: string;
  levels: LevelDef[];
  defaultLevel: (grade: Grade) => string;
  sheetDefaultLevel: string;
  isLevel: (value: unknown) => boolean;
  bars: SkillRow[];
  chips: SkillRow[];
  makeQuestion: GameModule["makeQuestion"];
  makeSheetItem: GameModule["makeSheetItem"];
  Prompt: GameModule["Prompt"];
}): GameModule {
  return {
    id: opts.id,
    title: opts.title,
    audience: opts.audience,
    tint: opts.tint,
    mascot: opts.mascot,
    sheetSlug: opts.sheetSlug,
    sheetScreen: opts.sheetScreen,
    blurb: opts.blurb,
    sheetCount: 10,
    layout: "card",
    levels: opts.levels,
    defaultLevel: opts.defaultLevel,
    sheetDefaultLevel: opts.sheetDefaultLevel,
    isLevel: opts.isLevel,
    pill: (level) => gamePill(opts.short, level.num),
    makeQuestion: opts.makeQuestion,
    makeSheetItem: opts.makeSheetItem,
    Prompt: opts.Prompt,
    Choices: SceneChoices,
    SheetBody: ProblemList,
    bars: opts.bars,
    chips: opts.chips,
    skillLabel: (key) => labelFor(opts.bars, key) ?? labelFor(opts.chips, key),
    chipLabel: (key) => labelFor(opts.chips, key),
  };
}
