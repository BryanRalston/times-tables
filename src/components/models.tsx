import { useMemo, useState, type ReactNode } from "react";
import { ChoiceList } from "@/components/keypad";
import { MagentaImg } from "@/components/magenta-video";
import { G4Q, parseLocale, PLACE, UI } from "@/lib/i18n";
import { useProgress } from "@/lib/progress";
import { asset } from "@/lib/art";
import { playTap } from "@/lib/sound";
import { squisheeSrc } from "@/lib/squishees";
import type {
  AreaData,
  ArrayData,
  BuildData,
  ChoiceData,
  ClockData,
  Coin,
  CompareData,
  ComputeData,
  DecimalData,
  FractionData,
  FracOpData,
  FluencyData,
  GraphData,
  GroupsData,
  JumpsData,
  LinesData,
  MeasureData,
  MoneyData,
  OrderData,
  PerimeterData,
  PlaceValueData,
  Question,
  TenFrameData,
} from "@/lib/types";

import { cn, moneyFmt, pad2 } from "@/lib/utils";

export interface BoardProps {
  question: Question;
  value: string;
  setValue: (v: string) => void;
  interacted: boolean;
  onInteract: () => void;
  status: "idle" | "correct" | "wrong";
  shake: number;
}

export function Board(props: BoardProps) {
  const { question } = props;
  switch (question.kind) {
    case "tenframe":
      return <TenFrame {...props} />;
    case "groups":
      return <Groups {...props} />;
    case "array":
      return <ArrayGrid {...props} />;
    case "placevalue":
      return <PlaceValue {...props} />;
    case "build":
      return <BuildNumber {...props} />;
    case "compare":
      return <CompareNums {...props} />;
    case "order":
      return <OrderNums {...props} />;
    case "choice":
      return <ChoiceVisual {...props} />;
    case "fraction":
      return <FractionBar {...props} />;
    case "clock":
      return <AnalogClock {...props} />;
    case "money":
      return <MoneyBoard {...props} />;
    case "area":
      return <AreaBoard {...props} />;
    case "perimeter":
      return <PerimeterBoard {...props} />;
    case "graph":
      return <GraphBoard {...props} />;
    case "pattern":
      return <PatternBoard {...props} />;
    case "fluency":
      return <FluencyBoard {...props} />;
    case "measure":
      return <MeasureBoard {...props} />;
    case "compute":
      return <ComputeBoard {...props} />;
    case "jumps":
      return <NumberLine {...props} />;
    case "decimal":
      return <DecimalBoard {...props} />;
    case "fracop":
      return <FracOpBoard {...props} />;
    case "lines":
      return <LinesBoard {...props} />;
    case "word":
      return <BigPrompt prompt={question.prompt} status={props.status} />;
    default:
      return null;
  }
}

function Frame({ children, shake, status }: { children: ReactNode; shake: number; status: BoardProps["status"] }) {
  return (
    <div
      key={shake}
      className={cn(
        "frost rounded-[24px] border p-4 shadow-soft sm:p-5",
        status === "correct" && "border-good bg-good-soft",
        status === "wrong" && "border-bad shake",
        status === "idle" && "border-line",
      )}
    >
      {children}
    </div>
  );
}

function Dot({ filled, gone, onClick }: { filled: boolean; gone?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!filled || gone || !onClick}
      className={cn(
        "size-6 rounded-full border transition-transform duration-200 sm:size-7",
        filled && !gone ? "takeable border-teal bg-teal" : "border-line bg-surface-2",
        gone && "scale-50 opacity-0",
        onClick && filled && !gone && "hover:scale-95",
      )}
      aria-label={filled ? "dot" : "empty"}
    />
  );
}

function TenFrame({ question, onInteract, status, shake }: BoardProps) {
  const data = question.data as TenFrameData;
  const [gone, setGone] = useState<boolean[]>(() => Array(data.shown).fill(false));
  const cells = Math.min(20, Math.max(data.total, data.shown));
  const perRow = 5;
  const rows = Math.ceil(Math.max(cells, 10) / perRow);

  function take(i: number) {
    if (i >= data.shown) return;
    setGone((g) => {
      const n = [...g];
      n[i] = true;
      return n;
    });
    playTap();
    onInteract();
  }

  return (
    <Frame shake={shake} status={status}>
      <p className="mb-3 text-center font-display text-2xl sm:text-3xl">{data.equation}</p>
      <div className="flex flex-col items-center gap-2">
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="flex flex-nowrap justify-center gap-1 rounded-[16px] border border-line bg-bg-warm p-2">
            {Array.from({ length: Math.min(perRow, Math.max(0, cells - r * perRow)) }, (_, c) => {
              const i = r * perRow + c;
              const filled = i < data.shown;
              return (
                <Dot
                  key={i}
                  filled={filled}
                  gone={filled && gone[i]}
                  onClick={filled ? () => take(i) : undefined}
                />
              );
            })}
          </div>
        ))}
      </div>
      {status === "correct" ? (
        <p className="mt-3 text-center text-sm text-muted">n = {question.answer}</p>
      ) : null}
    </Frame>
  );
}

function Groups({ question, onInteract, status, shake }: BoardProps) {
  const data = question.data as GroupsData;
  const [taken, setTaken] = useState(false);
  const groups = Math.max(1, data.groups);
  const size = Math.max(0, data.size);

  function isolate() {
    setTaken(true);
    playTap();
    onInteract();
  }

  return (
    <Frame shake={shake} status={status}>
      <p className="mb-3 text-center font-display text-xl sm:text-2xl">{data.equation}</p>
      <div className="flex flex-wrap justify-center gap-3">
        {Array.from({ length: groups }, (_, g) => (
          <button
            type="button"
            key={g}
            onClick={isolate}
            className={cn(
              "flex flex-wrap gap-1 rounded-[16px] border border-line bg-bg-warm p-2",
              taken && g === 0 && "border-teal bg-teal-soft",
              taken && g > 0 && "opacity-40",
            )}
            aria-label={`group ${g + 1}`}
          >
            {size === 0 ? (
              <span className="px-1 text-[10px] text-faint">0</span>
            ) : (
              Array.from({ length: size }, (_, i) => <span key={i} className="size-4 rounded-full bg-teal sm:size-5" />)
            )}
          </button>
        ))}
      </div>
      <p className="mt-3 text-center text-sm text-muted">
        {data.hide === "product" ? "Count them all." : "Tap a group to isolate it, then name n."}
      </p>
    </Frame>
  );
}

function ArrayGrid({ question, status, shake }: BoardProps) {
  const data = question.data as ArrayData;
  return (
    <Frame shake={shake} status={status}>
      <p className="mb-3 text-center text-sm text-muted">{question.prompt}</p>
      <div className="flex flex-col items-center gap-1">
        {Array.from({ length: data.rows }, (_, r) => (
          <div key={r} className="flex gap-1">
            {Array.from({ length: data.cols }, (_, c) => (
              <span key={c} className="size-5 rounded-[4px] bg-teal sm:size-6" />
            ))}
          </div>
        ))}
      </div>
    </Frame>
  );
}

function tensOnes(n: number) {
  const thousands = Math.floor(n / 1000);
  const hundreds = Math.floor((n % 1000) / 100);
  const tens = Math.floor((n % 100) / 10);
  const ones = n % 10;
  return { thousands, hundreds, tens, ones };
}

function PlaceValue({ question, status, shake }: BoardProps) {
  const data = question.data as PlaceValueData;
  const s = String(data.number);
  const locale = parseLocale(useProgress((st) => st.locale));
  if (data.mode === "word") {
    const cols = s.length > 6 ? 9 : 6;
    const padded = s.padStart(cols, "0");
    const labels = [...PLACE[locale]].slice(0, cols).reverse();
    const askingWords = question.prompt.includes("in words") || question.prompt.includes("en palabras") || question.prompt.includes("por extenso");
    return (
      <Frame shake={shake} status={status}>
        <p className="mb-3 text-center font-display text-xl tabular-nums sm:text-2xl">
          {askingWords ? data.number.toLocaleString("en-US") : (data.words ?? "")}
        </p>
        <div className={cn("grid gap-1 text-center text-[9px] leading-tight text-muted", cols >= 9 ? "grid-cols-9" : "grid-cols-6")}>
          {padded.split("").map((ch, i) => (
            <div key={i} className="rounded-[10px] border border-line bg-bg-warm p-1">
              <p className="font-display text-lg text-ink tabular-nums">{askingWords ? Number(ch) : "·"}</p>
              {labels[i]}
            </div>
          ))}
        </div>
      </Frame>
    );
  }
  if (data.mode === "expanded") {
    const tens = Math.floor(data.number / 10) * 10;
    const ones = data.digit;
    return (
      <Frame shake={shake} status={status}>
        <p className="mb-3 text-center font-display text-2xl sm:text-3xl">{tens} + n = {data.number}</p>
        <div className="flex flex-wrap items-end justify-center gap-6 text-center text-xs text-muted">
          <div>
            <div className="flex gap-0.5">
              {Array.from({ length: Math.floor((data.number % 100) / 10) }, (_, i) => (
                <span key={i} className="h-12 w-2.5 rounded-sm bg-teal" />
              ))}
            </div>
            tens you can see
          </div>
          <div>
            <div className="flex flex-wrap gap-0.5">
              {Array.from({ length: Math.max(ones, 1) }, (_, i) => (
                <span key={i} className="size-3 rounded-[2px] border border-dashed border-star bg-star-soft" />
              ))}
            </div>
            n ones hiding
          </div>
        </div>
      </Frame>
    );
  }
  const enPlaces = PLACE.en;
  const locLabels = PLACE[locale];
  const cols = s.split("").map((ch, i) => {
    const fromRight = s.length - 1 - i;
    return { ch, placeEn: enPlaces[fromRight] ?? "ones", label: locLabels[fromRight] ?? "" };
  });
  return (
    <Frame shake={shake} status={status}>
      <p className="mb-3 text-center font-display text-3xl tabular-nums sm:text-4xl">
        {cols.map((col, i) => (
          <span key={i} className={cn("px-0.5", col.placeEn === data.place ? "text-teal underline" : "")}>
            {col.ch}
          </span>
        ))}
      </p>
      <div
        className={cn(
          "grid gap-1 text-center text-[9px] leading-tight text-muted",
          s.length >= 9 ? "grid-cols-9" : s.length >= 6 ? "grid-cols-6" : s.length === 5 ? "grid-cols-5" : "grid-cols-4",
        )}
      >
        {cols.map((col, i) => (
          <div
            key={i}
            className={cn(
              "rounded-[10px] border bg-bg-warm p-1",
              col.placeEn === data.place ? "border-teal" : "border-line",
            )}
          >
            <p className="font-display text-lg text-ink tabular-nums">{col.ch}</p>
            {col.label}
          </div>
        ))}
      </div>
    </Frame>
  );
}

function BuildNumber({ question, status, shake }: BoardProps) {
  const data = question.data as BuildData;
  const parts = tensOnes(data.target);
  return (
    <Frame shake={shake} status={status}>
      <p className="mb-3 text-center font-display text-3xl tabular-nums">{data.target}</p>
      <div className="grid grid-cols-4 gap-2 text-center text-xs text-muted">
        {[
          ["Th", parts.thousands],
          ["H", parts.hundreds],
          ["T", parts.tens],
          ["O", parts.ones],
        ].map(([label, n]) => (
          <div key={String(label)} className="rounded-[12px] border border-line bg-bg-warm p-2">
            <p className="font-display text-xl text-ink">{n}</p>
            {label}
          </div>
        ))}
      </div>
    </Frame>
  );
}

function CompareNums({ question, status, shake }: BoardProps) {
  const data = question.data as CompareData;
  const max = Math.max(data.a, data.b, 1);
  return (
    <Frame shake={shake} status={status}>
      <div className="flex items-end justify-center gap-8">
        {[data.a, data.b].map((n, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div
              className={cn("w-10 rounded-t-md", i === 0 ? "bg-teal" : "bg-star")}
              style={{ height: `${Math.max(12, (n / max) * 96)}px` }}
            />
            <span className="font-display text-2xl tabular-nums sm:text-3xl">{n}</span>
          </div>
        ))}
      </div>
      {question.input === "compare" ? <p className="mt-3 text-center text-faint">○</p> : null}
    </Frame>
  );
}

function OrderNums({ question, value, setValue, status, shake }: BoardProps) {
  const data = question.data as OrderData;
  const ui = UI[parseLocale(useProgress((st) => st.locale))];
  const picked = value ? value.split(" ").filter(Boolean) : [];
  const labels = question.choices ?? data.numbers.map(String);
  return (
    <Frame shake={shake} status={status}>
      <p className="mb-3 text-center text-sm text-muted">{question.prompt}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {labels.map((n, i) => {
          const used = picked.includes(n);
          return (
            <button
              type="button"
              key={`${n}-${i}`}
              disabled={used}
              onClick={() => setValue([...picked, n].join(" "))}
              className={cn(
                "h-12 min-w-16 rounded-[14px] border px-3 font-display text-xl tabular-nums",
                used ? "border-line bg-bg-warm text-faint" : "border-line bg-surface",
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center font-display text-lg tabular-nums">{picked.join("  →  ") || ui.orderEmpty}</p>
      {picked.length ? (
        <button
          type="button"
          className="mx-auto mt-2 block text-sm text-muted"
          onClick={() => setValue(picked.slice(0, -1).join(" "))}
        >
          {ui.undo}
        </button>
      ) : null}
    </Frame>
  );
}

const SHAPE_SIDES: Record<string, number> = {
  triangle: 3,
  quadrilateral: 4,
  pentagon: 5,
  hexagon: 6,
  octagon: 8,
};

function regularPoints(sides: number, r = 40): { x: number; y: number }[] {
  const n = Math.max(3, sides);
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    pts.push({ x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) });
  }
  return pts;
}

function ShapePoly({
  shape,
  sides,
  rotation = 0,
  fill = "#d7ecec",
  stroke = "#0d7377",
  sizeClass = "size-40",
  split = false,
}: {
  shape?: string;
  sides?: number;
  rotation?: number;
  fill?: string;
  stroke?: string;
  sizeClass?: string;
  split?: boolean;
}) {
  if (shape === "circle") {
    return (
      <svg viewBox="0 0 100 100" className={sizeClass}>
        <circle cx="50" cy="50" r="36" fill={fill} stroke={stroke} strokeWidth="3" />
      </svg>
    );
  }
  if (shape === "open") {
    return (
      <svg viewBox="0 0 100 100" className={sizeClass}>
        <polyline points="12,70 20,20 50,40 80,18 88,72" fill="none" stroke={stroke} strokeWidth="3" />
      </svg>
    );
  }
  const n = sides ?? SHAPE_SIDES[shape ?? ""] ?? 3;
  const pts = shape === "quadrilateral" || n === 4 ? [
    { x: 16, y: 30 },
    { x: 84, y: 30 },
    { x: 84, y: 74 },
    { x: 16, y: 74 },
  ] : regularPoints(n);
  const splits =
    split && pts.length >= 4
      ? pts.slice(2, pts.length - 1).map((p) => ({ x1: pts[0]!.x, y1: pts[0]!.y, x2: p.x, y2: p.y }))
      : [];
  return (
    <svg viewBox="0 0 100 100" className={sizeClass}>
      <polygon
        points={pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
        fill={fill}
        stroke={stroke}
        strokeWidth="3"
        transform={`rotate(${rotation} 50 50)`}
      />
      {splits.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#c45c26" strokeWidth="2" transform={`rotate(${rotation} 50 50)`} />
      ))}
    </svg>
  );
}

function ChoiceVisual({ question, status, shake }: BoardProps) {
  const data = question.data as ChoiceData;
  if (data.visual === "none") {
    return (
      <Frame shake={shake} status={status}>
        <p className="text-center text-sm text-muted">{question.prompt}</p>
      </Frame>
    );
  }
  if (data.visual === "combine") {
    const parts = data.parts?.length ? data.parts : ["triangle", "triangle"];
    return (
      <Frame shake={shake} status={status}>
        <div className="flex items-center justify-center gap-2">
          <ShapePoly shape={parts[0]} sizeClass="size-16 sm:size-20" />
          <span className="text-xl text-muted">+</span>
          <ShapePoly shape={parts[1] ?? parts[0]} sizeClass="size-16 sm:size-20" />
          <span className="text-xl text-muted">→</span>
          <span className="grid size-16 place-items-center rounded-[16px] border border-dashed border-line font-display text-2xl text-muted sm:size-20">
            ?
          </span>
        </div>
      </Frame>
    );
  }
  if (data.visual === "subdivide") {
    return (
      <Frame shake={shake} status={status}>
        <div className="flex justify-center">
          <ShapePoly shape={data.shape} sides={data.sides} split sizeClass="mx-auto size-40" />
        </div>
      </Frame>
    );
  }
  return (
    <Frame shake={shake} status={status}>
      <div className="flex justify-center">
        <ShapePoly shape={data.shape} sides={data.sides} rotation={data.rotation ?? 0} />
      </div>
    </Frame>
  );
}

function FractionBar({ question, onInteract, status, shake }: BoardProps) {
  const data = question.data as FractionData;
  const den = Math.max(1, data.den);
  const shaded = data.shaded ?? data.num;
  const [gone, setGone] = useState<boolean[]>(() => Array(den).fill(false));

  function take(i: number) {
    if (i >= (data.num ?? 0) && data.mode !== "leftover") return;
    if (data.mode === "leftover" && i >= data.num) return;
    setGone((g) => {
      const n = [...g];
      n[i] = true;
      return n;
    });
    playTap();
    onInteract();
  }

  if (data.mode === "line") {
    const marks = den;
    const x = (k: number, d: number) => 8 + (k / d) * 84;
    return (
      <Frame shake={shake} status={status}>
        <svg viewBox="0 0 100 36" className="h-16 w-full">
          <line x1="8" y1="20" x2="92" y2="20" stroke="#1f1a14" strokeWidth="1.5" />
          {Array.from({ length: marks + 1 }, (_, i) => (
            <g key={i}>
              <line x1={x(i, marks)} y1="14" x2={x(i, marks)} y2="26" stroke="#1f1a14" strokeWidth="1.2" />
              <text x={x(i, marks)} y="34" textAnchor="middle" fontSize="5" fill="#6b6358">
                {i === 0 ? "0" : i === marks ? "1" : ""}
              </text>
            </g>
          ))}
          <circle cx={x(data.num, den)} cy="20" r="3" fill="#0d7377" />
          {data.num2 != null && data.den2 ? <circle cx={x(data.num2, data.den2)} cy="20" r="3" fill="#c45c26" /> : null}
        </svg>
        <p className="text-center text-xs text-muted">
          {data.num2 != null ? `${data.num}/${data.den} and ${data.num2}/${data.den2}` : `${data.num} jump${data.num === 1 ? "" : "s"} of 1/${den}`}
        </p>
      </Frame>
    );
  }

  const bars = data.mode === "mixed" ? Math.ceil(shaded / den) : data.mode === "compare" ? 2 : 1;

  return (
    <Frame shake={shake} status={status}>
      {Array.from({ length: bars }, (_, b) => {
        const thisDen = b === 1 && data.mode === "compare" && data.den2 ? data.den2 : den;
        const thisShaded =
          data.mode === "compare" && b === 1
            ? (data.num2 ?? 0)
            : Math.max(0, Math.min(thisDen, shaded - b * den));
        return (
          <div key={b} className="mb-2 flex h-12 overflow-hidden rounded-[12px] border border-line">
            {Array.from({ length: thisDen }, (_, i) => (
              <button
                type="button"
                key={i}
                onClick={() => take(i)}
                className={cn(
                  "h-full flex-1 border-r border-line last:border-r-0",
                  i < thisShaded && !gone[i] ? "bg-teal" : "bg-surface",
                  gone[i] && "bg-bg-warm",
                )}
                aria-label={`piece ${i + 1}`}
              />
            ))}
          </div>
        );
      })}
      {data.mode === "compare" ? (
        <p className="text-center font-display text-xl">
          {data.num}/{data.den} ○ {data.num2}/{data.den2}
        </p>
      ) : null}
    </Frame>
  );
}

function ClockFace({ hours, minutes, size = "size-48" }: { hours: number; minutes: number; size?: string }) {
  const minAngle = minutes * 6;
  const hourAngle = (hours % 12) * 30 + minutes * 0.5;
  return (
    <svg viewBox="0 0 100 100" className={size}>
      <circle cx="50" cy="50" r="46" fill="#fffaf1" stroke="#1f1a14" strokeWidth="2" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = ((i + 1) / 12) * Math.PI * 2 - Math.PI / 2;
        const x = 50 + Math.cos(a) * 36;
        const y = 50 + Math.sin(a) * 36;
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="#1f1a14">
            {i + 1}
          </text>
        );
      })}
      <line x1="50" y1="50" x2={50 + Math.sin((hourAngle * Math.PI) / 180) * 22} y2={50 - Math.cos((hourAngle * Math.PI) / 180) * 22} stroke="#1f1a14" strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="50" x2={50 + Math.sin((minAngle * Math.PI) / 180) * 32} y2={50 - Math.cos((minAngle * Math.PI) / 180) * 32} stroke="#0d7377" strokeWidth="2" strokeLinecap="round" />
      <circle cx="50" cy="50" r="2.5" fill="#c45c26" />
    </svg>
  );
}

function AnalogClock({ question, status, shake }: BoardProps) {
  const data = question.data as ClockData;
  const extraM = data.elapsedMinutes ?? 0;
  if (data.mode === "elapsed" && extraM > 0) {
    let endM = data.minutes + extraM;
    let endH = data.hours + (data.elapsedHours ?? 0);
    if (endM >= 60) {
      endM -= 60;
      endH += 1;
    }
    endH = ((endH - 1) % 12) + 1;
    return (
      <Frame shake={shake} status={status}>
        <div className="flex justify-center gap-4">
          <div className="text-center">
            <ClockFace hours={data.hours} minutes={data.minutes} size="size-36 sm:size-44" />
            <p className="mt-1 text-xs text-muted">{data.hours}:{pad2(data.minutes)}</p>
          </div>
          <div className="text-center">
            <ClockFace hours={endH} minutes={endM} size="size-36 sm:size-44" />
            <p className="mt-1 text-xs text-muted">{endH}:{pad2(endM)}</p>
          </div>
        </div>
      </Frame>
    );
  }
  return (
    <Frame shake={shake} status={status}>
      <div className="flex justify-center">
        <ClockFace hours={data.hours} minutes={data.minutes} />
      </div>
      <p className="mt-2 text-center text-sm text-muted">
        {data.find === "time" ? "Read the hands." : `Start ${data.hours}:${pad2(data.minutes)}`}
      </p>
    </Frame>
  );
}

const COIN_META: { id: Coin; label: string; cents: number; imgClass: string }[] = [
  { id: "five", label: "five-dollar bill", cents: 500, imgClass: "h-10 w-[5.2rem] sm:h-12 sm:w-28" },
  { id: "dollar", label: "one-dollar bill", cents: 100, imgClass: "h-10 w-[5.2rem] sm:h-12 sm:w-28" },
  { id: "quarter", label: "quarter", cents: 25, imgClass: "size-14 sm:size-16" },
  { id: "nickel", label: "nickel", cents: 5, imgClass: "size-12" },
  { id: "penny", label: "penny", cents: 1, imgClass: "size-11" },
  { id: "dime", label: "dime", cents: 10, imgClass: "size-9" },
];

function moneySrc(id: Coin): string {
  return asset(`money/${id}.png`);
}

function MoneyPic({ id, className }: { id: Coin; className?: string }) {
  const meta = COIN_META.find((m) => m.id === id)!;
  return (
    <img
      src={moneySrc(id)}
      alt={meta.label}
      draggable={false}
      className={cn("object-contain", meta.imgClass, className)}
    />
  );
}

function MoneyBoard({ question, onInteract, status, shake, setValue }: BoardProps) {
  const data = question.data as MoneyData;
  const [gone, setGone] = useState<Record<string, boolean>>({});
  const [built, setBuilt] = useState<Coin[]>([]);
  const coins = useMemo(() => {
    const list: { key: string; id: Coin }[] = [];
    for (const meta of COIN_META) {
      const n = data.coins[meta.id] ?? 0;
      for (let i = 0; i < n; i++) list.push({ key: `${meta.id}-${i}`, id: meta.id });
    }
    return list;
  }, [data.coins]);

  function take(key: string) {
    setGone((g) => ({ ...g, [key]: true }));
    playTap();
    onInteract();
  }

  const builtTotal = built.reduce((n, id) => n + (COIN_META.find((m) => m.id === id)?.cents ?? 0), 0);

  const ui = UI[parseLocale(useProgress((st) => st.locale))];

  function pile(bag: Partial<Record<Coin, number>>) {
    const list: Coin[] = [];
    for (const meta of COIN_META) {
      const n = bag[meta.id] ?? 0;
      for (let i = 0; i < n; i++) list.push(meta.id);
    }
    return list;
  }

  if (data.mode === "compare") {
    const left = pile(data.coins);
    const right = pile(data.otherCoins ?? {});
    return (
      <Frame shake={shake} status={status}>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-wrap justify-center gap-1 rounded-[16px] border border-line p-2">
            {left.map((id, i) => (
              <MoneyPic key={`l-${i}`} id={id} />
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-1 rounded-[16px] border border-line p-2">
            {right.map((id, i) => (
              <MoneyPic key={`r-${i}`} id={id} />
            ))}
          </div>
        </div>
        <p className="mt-3 text-center text-sm text-muted">{question.prompt}</p>
      </Frame>
    );
  }

  if (data.mode === "make") {
    return (
      <Frame shake={shake} status={status}>
        <p className="mb-2 text-center font-display text-xl">{ui.makeAmount(moneyFmt(data.target ?? 0))}</p>
        <p className="mb-2 text-center text-xs text-muted">{ui.bankTap}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {COIN_META.map((meta) => (
            <button
              type="button"
              key={meta.id}
              onClick={() => {
                const next = [...built, meta.id];
                setBuilt(next);
                const t = next.reduce((n, id) => n + (COIN_META.find((m) => m.id === id)?.cents ?? 0), 0);
                setValue(String(t));
                playTap();
                onInteract();
              }}
              className="bg-transparent p-0"
              aria-label={meta.label}
            >
              <MoneyPic id={meta.id} />
            </button>
          ))}
        </div>
        <p className="mb-1 mt-3 text-center text-xs text-muted">{ui.yourSet}</p>
        <div className="flex min-h-12 flex-wrap justify-center gap-1">
          {built.map((id, i) => (
              <button
                type="button"
                key={`${id}-${i}`}
                onClick={() => {
                  const next = built.filter((_, j) => j !== i);
                  setBuilt(next);
                  setValue(String(next.reduce((n, c) => n + (COIN_META.find((m) => m.id === c)?.cents ?? 0), 0)));
                }}
                className="bg-transparent p-0"
                aria-label={COIN_META.find((m) => m.id === id)!.label}
              >
                <MoneyPic id={id} />
              </button>
            ))}
        </div>
        <p className="mt-2 text-center font-display text-lg tabular-nums">{moneyFmt(builtTotal)}</p>
      </Frame>
    );
  }

  return (
    <Frame shake={shake} status={status}>
      <div className="flex flex-wrap justify-center gap-2">
        {coins.map((c) => {
          const meta = COIN_META.find((m) => m.id === c.id)!;
          return (
            <button
              type="button"
              key={c.key}
              onClick={() => take(c.key)}
              className={cn("bg-transparent p-0", gone[c.key] && "scale-50 opacity-0")}
              aria-label={meta.label}
            >
              <MoneyPic id={c.id} />
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-sm text-muted">
        {data.mode === "change" ? ui.takeCoins : ui.countCoins}
      </p>
    </Frame>
  );
}

function AreaBoard({ question, onInteract, status, shake }: BoardProps) {
  const data = question.data as AreaData;
  const [gone, setGone] = useState<Record<string, boolean>>({});
  return (
    <Frame shake={shake} status={status}>
      <div className="flex flex-col items-center gap-0.5">
        {data.cells.map((row, r) => (
          <div key={r} className="flex gap-0.5">
            {row.map((on, c) => (
              <button
                type="button"
                key={`${r}-${c}`}
                disabled={!on}
                onClick={() => {
                  setGone((g) => ({ ...g, [`${r}-${c}`]: true }));
                  playTap();
                  onInteract();
                }}
                className={cn(
                  "size-7 rounded-[4px] border sm:size-8",
                  on && !gone[`${r}-${c}`] ? "border-teal bg-teal" : "border-line bg-surface",
                  gone[`${r}-${c}`] && "opacity-30",
                )}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-muted">{data.unit}</p>
    </Frame>
  );
}

function PerimeterBoard({ question, onInteract, status, shake }: BoardProps) {
  const data = question.data as PerimeterData;
  const n = data.sides.length;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return `${50 + Math.cos(a) * 36},${50 + Math.sin(a) * 36}`;
  });
  const mids = pts.map((p, i) => {
    const [x1, y1] = p.split(",").map(Number) as [number, number];
    const [x2, y2] = pts[(i + 1) % n]!.split(",").map(Number) as [number, number];
    return { x: (x1 + x2) / 2, y: (y1 + y2) / 2, i };
  });
  return (
    <Frame shake={shake} status={status}>
      <svg viewBox="0 0 100 100" className="mx-auto size-48">
        <polygon points={pts.join(" ")} fill="#d7ecec" stroke="#0d7377" strokeWidth="2" />
        {mids.map((m) => (
          <text
            key={m.i}
            x={m.x}
            y={m.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="7"
            fill="#1f1a14"
            onClick={() => onInteract()}
          >
            {data.hideIndex === m.i ? "n" : data.sides[m.i]}
          </text>
        ))}
      </svg>
      <p className="text-center text-sm text-muted">{data.name}</p>
    </Frame>
  );
}

function GraphBoard({ question, onInteract, status, shake }: BoardProps) {
  const data = question.data as GraphData;
  const ui = UI[parseLocale(useProgress((st) => st.locale))];
  const [tray, setTray] = useState(() => data.tray ?? []);
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(data.rows.map((r) => [r.label, data.collect ? 0 : r.value])),
  );
  const [picked, setPicked] = useState<string | null>(null);
  const rows = data.rows.map((r) => ({ ...r, value: counts[r.label] ?? 0 }));
  const max = Math.max(...rows.map((r) => r.value), 1);
  const count = (v: number) => Math.max(0, Math.round(v / Math.max(1, data.key)));
  const sym = (r: { symbol?: string }) => r.symbol ?? data.symbol;

  function place(label: string) {
    if (!data.collect) {
      onInteract();
      return;
    }
    if (!picked) return;
    const item = tray.find((t) => t.id === picked);
    if (!item) return;
    const nextTray = tray.filter((x) => x.id !== picked);
    setTray(nextTray);
    setCounts((c) => ({ ...c, [label]: (c[label] ?? 0) + 1 }));
    setPicked(null);
    playTap();
    if (nextTray.length === 0) onInteract();
  }

  return (
    <Frame shake={shake} status={status}>
      <p className="mb-2 text-center text-sm font-medium">{data.title}</p>
      {data.collect && tray.length ? (
        <div className="mb-3 rounded-[12px] border border-dashed border-line bg-bg-warm p-2">
          <p className="mb-1 text-xs text-muted">{ui.tapPicture}</p>
          <div className="flex flex-wrap gap-1">
            {tray.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setPicked(t.id)}
                className={cn(
                  "rounded-[10px] border bg-surface p-1",
                  picked === t.id ? "border-teal" : "border-line",
                )}
                aria-label={t.label}
              >
                <MagentaImg src={squisheeSrc(t.symbol ?? data.symbol)} alt="" className="size-7" />
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {data.kind === "picto" ? (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start gap-2">
              <button
                type="button"
                className="w-20 shrink-0 rounded-[8px] border border-line px-1 py-0.5 text-left text-sm"
                onClick={() => place(r.label)}
              >
                {r.label}
              </button>
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-0.5">
                {Array.from({ length: count(r.value) }, (_, i) => (
                  <MagentaImg key={i} src={squisheeSrc(sym(r))} alt="" className="size-7" />
                ))}
              </div>
            </div>
          ))}
          <p className="flex items-center gap-1 text-xs text-muted">
            Key: <MagentaImg src={squisheeSrc(data.symbol)} alt="" className="inline size-5" /> = {data.key}
          </p>
        </div>
      ) : (
        <div className="flex h-40 items-stretch justify-around gap-2">
          {rows.map((r) => (
            <button
              type="button"
              key={r.label}
              className="flex h-full min-w-0 flex-1 flex-col"
              onClick={() => place(r.label)}
            >
              <div className="flex min-h-0 flex-1 items-end">
                <div
                  className="w-full rounded-t-md bg-teal"
                  style={{ height: r.value ? `${Math.max(8, (r.value / max) * 100)}%` : "0%" }}
                />
              </div>
              <span className="mt-1 shrink-0 text-[11px]">{r.label}</span>
            </button>
          ))}
        </div>
      )}
    </Frame>
  );
}

function PatternBoard({ question, status, shake }: BoardProps) {
  const data = question.data as { seq: (number | null)[]; step: number };
  return (
    <Frame shake={shake} status={status}>
      <div className="flex flex-wrap justify-center gap-2">
        {data.seq.map((n, i) => (
          <span
            key={i}
            className={cn(
              "grid size-12 place-items-center rounded-[14px] border font-display text-xl tabular-nums",
              n == null ? "border-teal bg-teal-soft" : "border-line bg-surface",
            )}
          >
            {n ?? "n"}
          </span>
        ))}
      </div>
    </Frame>
  );
}

function hundredsParts(n: number) {
  return {
    h: Math.floor(n / 100),
    t: Math.floor((n % 100) / 10),
    o: n % 10,
  };
}

function NumberLine({ question, status, shake }: BoardProps) {
  const data = question.data as JumpsData;
  const product = data.size * data.jumps;
  const max = Math.max(product, data.size);
  const x = (n: number) => 8 + (n / max) * 84;
  return (
    <Frame shake={shake} status={status}>
      <p className="mb-2 text-center font-display text-xl">{question.prompt}</p>
      <svg viewBox="0 0 100 42" className="h-24 w-full">
        <line x1="8" y1="24" x2="92" y2="24" stroke="#1f1a14" strokeWidth="1.5" />
        {Array.from({ length: data.jumps + 1 }, (_, i) => {
          const n = i * data.size;
          return (
            <g key={i}>
              <line x1={x(n)} y1="18" x2={x(n)} y2="30" stroke="#1f1a14" strokeWidth="1.2" />
              <text x={x(n)} y="38" textAnchor="middle" fontSize="5" fill="#6b6358">
                {n}
              </text>
              {i < data.jumps ? (
                <path
                  d={`M ${x(n)} 22 Q ${(x(n) + x(n + data.size)) / 2} 8 ${x(n + data.size)} 22`}
                  fill="none"
                  stroke="#0d7377"
                  strokeWidth="1.4"
                />
              ) : null}
            </g>
          );
        })}
        <circle cx={x(product)} cy="24" r="2.4" fill="#c45c26" />
      </svg>
    </Frame>
  );
}

function ComputeBoard({ question, status, shake }: BoardProps) {
  const data = question.data as ComputeData;
  if (data.a > 2000 || data.b > 2000) {
    return (
      <Frame shake={shake} status={status}>
        <p className="mb-3 text-center font-display text-2xl tabular-nums">
          {data.a.toLocaleString("en-US")} {data.op} {data.b.toLocaleString("en-US")}
          {data.mode === "estimate" ? <span className="block text-sm font-sans text-muted">Nearest thousand</span> : null}
        </p>
        <div className="mx-auto max-w-xs rounded-[16px] border border-line bg-bg-warm p-3 font-display text-2xl tabular-nums">
          <p className="text-right">{data.a.toLocaleString("en-US")}</p>
          <p className="text-right">
            {data.op} {data.b.toLocaleString("en-US")}
          </p>
          <div className="mt-1 border-t-2 border-ink" />
          <p className="text-right text-muted">n</p>
        </div>
      </Frame>
    );
  }
  const left = hundredsParts(data.a);
  const right = hundredsParts(data.b);
  return (
    <Frame shake={shake} status={status}>
      <p className="mb-3 text-center font-display text-2xl tabular-nums">
        {data.a} {data.op} {data.b}
        {data.mode === "estimate" ? <span className="block text-sm font-sans text-muted">Nearest hundred</span> : null}
      </p>
      <div className="flex justify-center gap-6 text-center text-[11px] text-muted">
        {[left, right].map((p, i) => (
          <div key={i}>
            <div className="flex flex-wrap justify-center gap-0.5">
              {Array.from({ length: p.h }, (_, k) => (
                <span key={k} className="size-5 rounded-[3px] bg-q2" />
              ))}
            </div>
            <div className="mt-1 flex justify-center gap-0.5">
              {Array.from({ length: p.t }, (_, k) => (
                <span key={k} className="h-8 w-1.5 rounded-sm bg-teal" />
              ))}
            </div>
            <div className="mt-1 flex justify-center gap-0.5">
              {Array.from({ length: p.o }, (_, k) => (
                <span key={k} className="size-2 rounded-[2px] bg-star" />
              ))}
            </div>
            {i === 0 ? data.a : data.b}
          </div>
        ))}
      </div>
    </Frame>
  );
}

/** Overlay viewBoxes match keyed public/measure PNGs. */
const RULER_FACE = { w: 1258, h: 200, x0: 168, x1: 1210, y0: 26, yMaj: 84, yMin: 54, yNum: 128 };
const SCALE_FACE = { w: 400, h: 644, cx: 205, cy: 290, r: 148, start: 225, sweep: 270 };
const BEAKER_FACE = { w: 413, h: 979, x: 132, fw: 188, yTop: 228, yBot: 862, tickX: 324 };

function ToolFace({
  src,
  viewBox,
  className,
  imgClass,
  under,
  over,
  label,
}: {
  src: string;
  viewBox: string;
  className?: string;
  imgClass?: string;
  under?: ReactNode;
  over: ReactNode;
  label: string;
}) {
  return (
    <div className={cn("relative mx-auto", className)}>
      {under ? (
        <svg viewBox={viewBox} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          {under}
        </svg>
      ) : null}
      <img src={src} alt="" className={cn("relative block", imgClass)} />
      <svg viewBox={viewBox} className="pointer-events-none absolute inset-0 h-full w-full" role="img" aria-label={label}>
        {over}
      </svg>
    </div>
  );
}

function MeasureBoard({ question, status, shake }: BoardProps) {
  const data = question.data as MeasureData;
  const ui = UI[parseLocale(useProgress((st) => st.locale))];
  if (data.mode === "unit") {
    const p = question.prompt.toLowerCase();
    const src = /pencil|l[aá]piz|l[aá]pis/.test(p)
      ? asset("measure/pencil.png")
      : /grape|uva/.test(p)
        ? asset("squishees/grape.png")
        : /watermelon|melon|sand[ií]a/.test(p)
          ? asset("squishees/melon.png")
          : /apple|manzana|ma[cç]/.test(p) || /pound|gram|kilo|mass|weight|peso/.test(p)
            ? asset("measure/scale.png")
            : /water|milk|spoon|bottle|cup|liter|gallon|leche|leite|agua|água/.test(p)
              ? asset("measure/beaker.png")
              : /classroom|height|clip|inch|yard|meter|centimeter|aula|altura/.test(p)
                ? asset("measure/ruler.png")
                : null;
    return (
      <Frame shake={shake} status={status}>
        {src ? (
          <img src={src} alt="" className="mx-auto h-28 object-contain" />
        ) : (
          <svg viewBox="0 0 120 72" className="mx-auto h-20 w-40" aria-hidden>
            <rect x="8" y="18" width="104" height="44" rx="8" fill="#fffaf1" stroke="#1f1a14" strokeWidth="2" />
            <rect x="20" y="28" width="36" height="24" rx="4" fill="#d7ecec" stroke="#0d7377" />
            <rect x="64" y="28" width="36" height="24" rx="4" fill="#f4d7c8" stroke="#c45c26" />
          </svg>
        )}
        <p className="mt-2 text-center font-display text-xl leading-tight">{question.prompt}</p>
      </Frame>
    );
  }
  if (data.mode === "convert") {
    const n = Math.max(1, Math.min(8, data.value));
    const rate = Math.round(data.max / n) || data.max;
    return (
      <Frame shake={shake} status={status}>
        <p className="mb-2 text-center font-display text-xl">{question.prompt}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: n }, (_, i) => (
            <div key={i} className="rounded-[12px] border border-line bg-bg-warm px-2 py-2 text-center">
              <div className="flex gap-0.5">
                {Array.from({ length: Math.min(rate, 16) }, (_, k) => (
                  <span key={k} className="h-8 w-1.5 rounded-sm bg-teal" />
                ))}
              </div>
              <p className="mt-1 text-[11px] text-muted">
                {rate} {data.unit}
              </p>
            </div>
          ))}
        </div>
      </Frame>
    );
  }
  const max = Math.max(1, data.max);
  const halves = data.attribute === "length";
  const steps = halves ? max * 2 : max;
  const at = halves ? data.value * 2 : data.value;
  const label = `${ui.readPointer} ${data.unit}`;
  const caption = (
    <p className="mt-1 text-center text-sm font-medium text-ink">
      {ui.readPointer} · {data.unit}
    </p>
  );
  if (data.attribute === "length") {
    const { w, h, x0, x1, y0, yMaj, yMin, yNum } = RULER_FACE;
    const x = (i: number) => x0 + (i / steps) * (x1 - x0);
    const px = x(at);
    const src = data.unit === "cm" ? asset("measure/ruler-cm.png") : asset("measure/ruler.png");
    return (
      <Frame shake={shake} status={status}>
        <ToolFace
          src={src}
          viewBox={`0 0 ${w} ${h}`}
          className="w-full max-w-xl"
          imgClass="h-auto w-full"
          label={label}
          over={
            <>
              {Array.from({ length: steps + 1 }, (_, i) => {
                const major = halves ? i % 2 === 0 : true;
                return (
                  <g key={i}>
                    <line
                      x1={x(i)}
                      y1={y0}
                      x2={x(i)}
                      y2={major ? yMaj : yMin}
                      stroke="#1f1a14"
                      strokeWidth={major ? 3 : 1.6}
                    />
                    {major ? (
                      <text x={x(i)} y={yNum} textAnchor="middle" fontSize="40" fontWeight="700" fill="#1f1a14">
                        {halves ? i / 2 : i}
                      </text>
                    ) : null}
                  </g>
                );
              })}
              <polygon
                points={`${px},${y0} ${px - 12},${y0 - 20} ${px + 12},${y0 - 20}`}
                fill="#c45c26"
                stroke="#1f1a14"
                strokeWidth="1.2"
              />
            </>
          }
        />
        {caption}
      </Frame>
    );
  }
  if (data.attribute === "mass") {
    const { w, h, cx, cy, r, start, sweep } = SCALE_FACE;
    const deg = start + (data.value / max) * sweep;
    const polar = (radius: number, d: number) => {
      const a = (d * Math.PI) / 180;
      return [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius] as const;
    };
    return (
      <Frame shake={shake} status={status}>
        <div className="flex justify-center">
          <ToolFace
            src={asset("measure/scale.png")}
            viewBox={`0 0 ${w} ${h}`}
            className="inline-block"
            imgClass="h-64 w-auto sm:h-72"
            label={label}
            over={
              <>
                {Array.from({ length: max + 1 }, (_, i) => {
                  const d = start + (i / max) * sweep;
                  const [x1, y1] = polar(r * 0.84, d);
                  const [x2, y2] = polar(r * 0.98, d);
                  const [tx, ty] = polar(r * 0.68, d);
                  return (
                    <g key={i}>
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1f1a14" strokeWidth="3" />
                      <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize="28" fontWeight="700" fill="#1f1a14">
                        {i}
                      </text>
                    </g>
                  );
                })}
                <g transform={`rotate(${deg} ${cx} ${cy})`}>
                  <line x1={cx} y1={cy} x2={cx + r * 0.78} y2={cy} stroke="#1f1a14" strokeWidth="5" strokeLinecap="round" />
                  <polygon
                    points={`${cx + r * 0.88},${cy} ${cx + r * 0.7},${cy - 11} ${cx + r * 0.7},${cy + 11}`}
                    fill="#c45c26"
                    stroke="#1f1a14"
                    strokeWidth="1.1"
                  />
                  <circle cx={cx} cy={cy} r="9" fill="#1f1a14" />
                </g>
              </>
            }
          />
        </div>
        {caption}
      </Frame>
    );
  }
  const { w, h, x: fx, fw, yTop, yBot, tickX } = BEAKER_FACE;
  const y = (i: number) => yBot - (i / max) * (yBot - yTop);
  const fillY = y(data.value);
  const py = fillY;
  return (
    <Frame shake={shake} status={status}>
      <div className="flex justify-center">
        <ToolFace
          src={asset("measure/beaker.png")}
          viewBox={`0 0 ${w} ${h}`}
          className="inline-block"
          imgClass="h-64 w-auto sm:h-72"
          label={label}
          under={<rect x={fx} y={fillY} width={fw} height={yBot - fillY} rx="36" fill="#0d7377" opacity="0.55" />}
          over={
            <>
              {Array.from({ length: max + 1 }, (_, i) => (
                <g key={i}>
                  <line x1={tickX} y1={y(i)} x2={tickX + 22} y2={y(i)} stroke="#1f1a14" strokeWidth="3" />
                  <text x={tickX + 30} y={y(i) + 8} fontSize="42" fontWeight="700" fill="#1f1a14">
                    {i}
                  </text>
                </g>
              ))}
              <polygon
                points={`${tickX},${py} ${tickX - 20},${py - 12} ${tickX - 20},${py + 12}`}
                fill="#c45c26"
                stroke="#1f1a14"
                strokeWidth="1.1"
              />
            </>
          }
        />
      </div>
      {caption}
    </Frame>
  );
}

function FluencyBoard({ question, status, shake }: BoardProps) {
  const data = question.data as FluencyData;
  if (data.op === "×" && data.a >= 10 && data.a <= 49 && data.b >= 2 && data.b <= 9) {
    const tens = Math.floor(data.a / 10) * 10;
    const ones = data.a % 10;
    return (
      <Frame shake={shake} status={status}>
        <p className="mb-3 text-center font-display text-2xl">{question.prompt}</p>
        <div className="flex justify-center gap-4 text-center text-xs text-muted">
          <div>
            <p className="mb-1 font-display text-lg text-ink">
              {tens} × {data.b}
            </p>
            <div className="flex flex-wrap justify-center gap-1">
              {Array.from({ length: data.b }, (_, g) => (
                <div key={g} className="flex gap-0.5 rounded-[8px] border border-line bg-bg-warm p-1">
                  {Array.from({ length: tens / 10 }, (_, i) => (
                    <span key={i} className="h-8 w-2 rounded-sm bg-teal" />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 font-display text-lg text-ink">
              {ones} × {data.b}
            </p>
            <div className="flex flex-wrap justify-center gap-1">
              {Array.from({ length: data.b }, (_, g) => (
                <div key={g} className="flex gap-0.5 rounded-[8px] border border-line bg-bg-warm p-1">
                  {Array.from({ length: ones }, (_, i) => (
                    <span key={i} className="size-3 rounded-full bg-star" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Frame>
    );
  }
  const times = data.op === "×" && data.a > 0 && data.b > 0 && data.a <= 12 && data.b <= 12;
  const div =
    data.op === "÷" && data.b > 0 && data.a % data.b === 0 && data.a / data.b <= 12 && data.b <= 12 && data.a / data.b >= 1;
  const addSmall = (data.op === "+" || data.op === "−") && data.a <= 20 && data.b <= 20;
  if (times || div) {
    const groups = times ? data.a : data.a / data.b;
    const size = times ? data.b : data.b;
    return (
      <Frame shake={shake} status={status}>
        <p className="mb-3 text-center font-display text-2xl sm:text-3xl">{question.prompt}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: groups }, (_, g) => (
            <div key={g} className="flex flex-wrap gap-1 rounded-[12px] border border-line bg-bg-warm p-1.5">
              {Array.from({ length: size }, (_, i) => (
                <span key={i} className={cn("rounded-full bg-teal", groups * size > 40 ? "size-2" : "size-3 sm:size-4")} />
              ))}
            </div>
          ))}
        </div>
      </Frame>
    );
  }
  if (addSmall) {
    const shown = data.op === "+" ? data.a : data.b;
    const total = data.op === "+" ? data.a + data.b : data.a;
    return (
      <Frame shake={shake} status={status}>
        <p className="mb-3 text-center font-display text-2xl sm:text-3xl">{question.prompt}</p>
        <div className="flex flex-wrap justify-center gap-1">
          {Array.from({ length: Math.min(total, 20) }, (_, i) => (
            <span
              key={i}
              className={cn("size-4 rounded-full sm:size-5", i < shown ? "bg-teal" : "border border-dashed border-faint")}
            />
          ))}
        </div>
      </Frame>
    );
  }
  return <BigPrompt prompt={question.prompt} status={status} />;
}

function DecimalBoard({ question, status, shake }: BoardProps) {
  const data = question.data as DecimalData;
  const cells = (tenths: number, hundredths: number) => tenths * 10 + hundredths;
  const shadeA = cells(data.tenths, data.hundredths);
  const shadeB = data.b ? cells(data.b.tenths, data.b.hundredths) : 0;
  const thousandths = data.thousandths;
  const grid = (shaded: number, label: string) => (
    <div className="text-center">
      <div className="mx-auto grid w-40 grid-cols-10 gap-px rounded-[8px] border border-line bg-line p-px">
        {Array.from({ length: 100 }, (_, i) => (
          <span key={i} className={cn("aspect-square", i < shaded ? "bg-teal" : "bg-surface")} />
        ))}
      </div>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
  if (thousandths != null) {
    const locale = parseLocale(useProgress((st) => st.locale));
    const labels = PLACE[locale].slice(0, 4).reverse();
    const digits = [data.whole, data.tenths, data.hundredths, thousandths];
    return (
      <Frame shake={shake} status={status}>
        <p className="mb-2 text-center font-display text-xl">{question.prompt}</p>
        <div className="grid grid-cols-4 gap-1 text-center text-[10px] text-muted">
          {digits.map((d, i) => (
            <div key={i} className="rounded-[10px] border border-line bg-bg-warm p-2">
              <p className="font-display text-2xl text-ink tabular-nums">{d}</p>
              {labels[i]}
            </div>
          ))}
        </div>
        {grid(shadeA, `${data.tenths}.${data.hundredths}`)}
      </Frame>
    );
  }
  if (data.mode === "add" || data.mode === "sub") {
    return (
      <Frame shake={shake} status={status}>
        <p className="mb-2 text-center font-display text-xl">{question.prompt}</p>
        <div className="flex flex-wrap justify-center gap-4">
          {grid(shadeA, "first")}
          {grid(shadeB, "second")}
        </div>
      </Frame>
    );
  }
  const tenthsOnly = data.hundredths === 0 && shadeA % 10 === 0;
  if (tenthsOnly || shadeA <= 10 && data.hundredths === 0) {
    return (
      <Frame shake={shake} status={status}>
        <p className="mb-2 text-center font-display text-xl">{question.prompt}</p>
        <div className="mx-auto flex h-12 w-full max-w-sm overflow-hidden rounded-[12px] border border-line">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className={cn("h-full flex-1 border-r border-line last:border-r-0", i < data.tenths ? "bg-teal" : "bg-surface")} />
          ))}
        </div>
        <p className="mt-1 text-center text-xs text-muted">{data.tenths} / 10</p>
      </Frame>
    );
  }
  return (
    <Frame shake={shake} status={status}>
      <p className="mb-2 text-center font-display text-xl">{question.prompt}</p>
      {grid(shadeA, `${shadeA} / 100`)}
    </Frame>
  );
}

function FracOpBoard({ question, status, shake }: BoardProps) {
  const data = question.data as FracOpData;
  const den = Math.max(1, data.den);
  const bar = (shaded: number, key: string) => (
    <div key={key} className="mb-2 flex h-12 overflow-hidden rounded-[12px] border border-line">
      {Array.from({ length: den }, (_, i) => (
        <span key={i} className={cn("h-full flex-1 border-r border-line last:border-r-0", i < shaded ? "bg-teal" : "bg-surface")} />
      ))}
    </div>
  );
  return (
    <Frame shake={shake} status={status}>
      <p className="mb-2 text-center font-display text-xl">
        {data.a}/{den} {data.op} {data.b}/{den}
      </p>
      {bar(data.a, "a")}
      {bar(data.b, "b")}
    </Frame>
  );
}

function LinesBoard({ question, status, shake }: BoardProps) {
  const data = question.data as LinesData;
  const locale = parseLocale(useProgress((st) => st.locale));
  const copy = G4Q[locale];
  return (
    <Frame shake={shake} status={status}>
      <svg viewBox="0 0 160 100" className="mx-auto h-40 w-full max-w-sm">
        {!data.pair && data.figure === "point" ? <circle cx="80" cy="50" r="5" fill="#0d7377" /> : null}
        {!data.pair && data.figure === "line" ? (
          <line x1="10" y1="50" x2="150" y2="50" stroke="#1f1a14" strokeWidth="3" />
        ) : null}
        {data.figure === "ray" ? (
          <>
            <circle cx="30" cy="50" r="4" fill="#1f1a14" />
            <line x1="30" y1="50" x2="150" y2="50" stroke="#1f1a14" strokeWidth="3" />
            <polygon points="150,50 138,44 138,56" fill="#1f1a14" />
          </>
        ) : null}
        {data.figure === "segment" ? (
          <>
            <line x1="30" y1="50" x2="130" y2="50" stroke="#1f1a14" strokeWidth="3" />
            <circle cx="30" cy="50" r="4" fill="#1f1a14" />
            <circle cx="130" cy="50" r="4" fill="#1f1a14" />
          </>
        ) : null}
        {data.figure === "angle" ? (
          <g transform="translate(50,70)">
            <line x1="0" y1="0" x2="90" y2="0" stroke="#1f1a14" strokeWidth="3" />
            <line
              x1="0"
              y1="0"
              x2={80 * Math.cos((-(data.degrees ?? 90) * Math.PI) / 180)}
              y2={80 * Math.sin((-(data.degrees ?? 90) * Math.PI) / 180)}
              stroke="#0d7377"
              strokeWidth="3"
            />
            <path
              d={`M 22 0 A 22 22 0 0 ${ (data.degrees ?? 90) > 180 ? 1 : 0 } ${22 * Math.cos((-(data.degrees ?? 90) * Math.PI) / 180)} ${22 * Math.sin((-(data.degrees ?? 90) * Math.PI) / 180)}`}
              fill="none"
              stroke="#c45c26"
              strokeWidth="2"
            />
          </g>
        ) : null}
        {data.pair === "parallel" ? (
          <>
            <line x1="20" y1="35" x2="140" y2="35" stroke="#1f1a14" strokeWidth="3" />
            <line x1="20" y1="65" x2="140" y2="65" stroke="#0d7377" strokeWidth="3" />
          </>
        ) : null}
        {data.pair === "perpendicular" ? (
          <>
            <line x1="20" y1="50" x2="140" y2="50" stroke="#1f1a14" strokeWidth="3" />
            <line x1="80" y1="15" x2="80" y2="85" stroke="#0d7377" strokeWidth="3" />
          </>
        ) : null}
        {data.pair === "neither" ? (
          <>
            <line x1="20" y1="30" x2="140" y2="50" stroke="#1f1a14" strokeWidth="3" />
            <line x1="30" y1="80" x2="140" y2="25" stroke="#0d7377" strokeWidth="3" />
          </>
        ) : null}
      </svg>
      <p className="text-center text-xs text-muted">{copy.nameFigure}</p>
    </Frame>
  );
}

function BigPrompt({ prompt, status }: { prompt: string; status: BoardProps["status"] }) {
  return (
    <div
      className={cn(
        "rounded-[24px] border bg-surface p-5 text-center font-display text-2xl shadow-soft sm:text-3xl",
        status === "correct" && "border-good bg-good-soft",
        status === "wrong" && "border-bad shake",
        status === "idle" && "border-line",
      )}
    >
      {prompt}
    </div>
  );
}

export { ChoiceList };
