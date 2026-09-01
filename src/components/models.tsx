import { useMemo, useState, type ReactNode } from "react";
import { ChoiceList } from "@/components/keypad";
import { MagentaImg } from "@/components/magenta-video";
import { parseLocale, PLACE, UI } from "@/lib/i18n";
import { useProgress } from "@/lib/progress";
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
  FractionData,
  FluencyData,
  GraphData,
  GroupsData,
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
            {Array.from({ length: Math.max(size, 1) }, (_, i) => (
              <span key={i} className={cn("size-4 rounded-full sm:size-5", size === 0 ? "border border-dashed border-faint" : "bg-teal")} />
            ))}
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
  const parts = tensOnes(data.number);
  const s = String(data.number);
  const locale = parseLocale(useProgress((st) => st.locale));
  if (data.mode === "word") {
    const padded = s.padStart(6, "0");
    const labels = [...PLACE[locale]].reverse();
    const askingWords = question.prompt.includes("in words") || question.prompt.includes("en palabras") || question.prompt.includes("por extenso");
    return (
      <Frame shake={shake} status={status}>
        <p className="mb-3 text-center font-display text-xl tabular-nums sm:text-2xl">
          {askingWords ? data.number.toLocaleString("en-US") : (data.words ?? "")}
        </p>
        <div className="grid grid-cols-6 gap-1 text-center text-[9px] leading-tight text-muted">
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
              {Array.from({ length: parts.tens }, (_, i) => (
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
  return (
    <Frame shake={shake} status={status}>
      <p className="mb-3 text-center font-display text-3xl tabular-nums sm:text-4xl">
        {s.split("").map((ch, i) => (
          <span key={i} className={cn("px-0.5", Number(ch) === data.digit && i === s.length - 1 - ["ones", "tens", "hundreds", "thousands"].indexOf(data.place) ? "text-teal underline" : "")}>
            {ch}
          </span>
        ))}
      </p>
      <div className="flex flex-wrap justify-center gap-3 text-center text-xs text-muted">
        {parts.thousands ? (
          <div>
            <div className="grid grid-cols-3 gap-0.5">
              {Array.from({ length: parts.thousands }, (_, i) => (
                <span key={i} className="size-6 rounded-[4px] bg-q4" />
              ))}
            </div>
            thousands
          </div>
        ) : null}
        {parts.hundreds ? (
          <div>
            <div className="flex flex-wrap justify-center gap-0.5">
              {Array.from({ length: parts.hundreds }, (_, i) => (
                <span key={i} className="size-6 rounded-[3px] bg-q2" />
              ))}
            </div>
            hundreds
          </div>
        ) : null}
        {parts.tens ? (
          <div>
            <div className="flex gap-0.5">
              {Array.from({ length: parts.tens }, (_, i) => (
                <span key={i} className="h-10 w-2 rounded-sm bg-teal" />
              ))}
            </div>
            tens
          </div>
        ) : null}
        <div>
          <div className="flex flex-wrap gap-0.5">
            {Array.from({ length: parts.ones }, (_, i) => (
              <span key={i} className="size-3 rounded-[2px] bg-star" />
            ))}
          </div>
          ones
        </div>
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
  const picked = value ? value.split(" ").filter(Boolean) : [];
  const labels = question.choices ?? data.numbers.map(String);
  return (
    <Frame shake={shake} status={status}>
      <p className="mb-3 text-center text-sm text-muted">{question.prompt}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {labels.map((n) => {
          const used = picked.includes(n);
          return (
            <button
              type="button"
              key={n}
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
      <p className="mt-3 text-center font-display text-lg tabular-nums">{picked.join("  →  ") || "Tap in order"}</p>
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
    const result = data.result ?? data.shape ?? "quadrilateral";
    return (
      <Frame shake={shake} status={status}>
        <div className="flex items-center justify-center gap-2">
          <ShapePoly shape={parts[0]} sizeClass="size-16 sm:size-20" />
          <span className="text-xl text-muted">+</span>
          <ShapePoly shape={parts[1] ?? parts[0]} sizeClass="size-16 sm:size-20" />
          <span className="text-xl text-muted">→</span>
          <ShapePoly shape={result} fill="#dceadf" stroke="#2f6f4e" sizeClass="size-16 sm:size-20" />
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
        const thisShaded = b === 0 ? Math.min(den, shaded) : data.mode === "compare" ? (data.num2 ?? 0) : Math.max(0, shaded - den);
        const thisDen = b === 1 && data.den2 ? data.den2 : den;
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

function AnalogClock({ question, status, shake }: BoardProps) {
  const data = question.data as ClockData;
  const minAngle = data.minutes * 6;
  const hourAngle = (data.hours % 12) * 30 + data.minutes * 0.5;
  return (
    <Frame shake={shake} status={status}>
      <div className="flex justify-center">
        <svg viewBox="0 0 100 100" className="size-48">
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
      </div>
      <p className="mt-2 text-center text-sm text-muted">
        {data.find === "time" ? "Read the hands." : `Start ${data.hours}:${pad2(data.minutes)}`}
      </p>
    </Frame>
  );
}

const COIN_META: { id: Coin; label: string; cents: number; size: string; fill: string }[] = [
  { id: "five", label: "$5", cents: 500, size: "h-12 w-20 rounded-[8px]", fill: "bg-good-soft border-good" },
  { id: "dollar", label: "$1", cents: 100, size: "size-16", fill: "bg-good-soft border-good" },
  { id: "quarter", label: "25¢", cents: 25, size: "size-14", fill: "bg-surface-2 border-faint" },
  { id: "dime", label: "10¢", cents: 10, size: "size-10", fill: "bg-surface-2 border-faint" },
  { id: "nickel", label: "5¢", cents: 5, size: "size-12", fill: "bg-surface-2 border-faint" },
  { id: "penny", label: "1¢", cents: 1, size: "size-11", fill: "bg-star-soft border-star" },
];

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
              className={cn("grid place-items-center rounded-full border text-xs font-medium", meta.size, meta.fill)}
            >
              {meta.label}
            </button>
          ))}
        </div>
        <p className="mb-1 mt-3 text-center text-xs text-muted">{ui.yourSet}</p>
        <div className="flex min-h-12 flex-wrap justify-center gap-1">
          {built.map((id, i) => {
            const meta = COIN_META.find((m) => m.id === id)!;
            return (
              <button
                type="button"
                key={`${id}-${i}`}
                onClick={() => {
                  const next = built.filter((_, j) => j !== i);
                  setBuilt(next);
                  setValue(String(next.reduce((n, c) => n + (COIN_META.find((m) => m.id === c)?.cents ?? 0), 0)));
                }}
                className={cn("grid place-items-center rounded-full border text-[10px] font-medium", meta.size, meta.fill)}
              >
                {meta.label}
              </button>
            );
          })}
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
              className={cn(
                "grid place-items-center rounded-full border text-xs font-medium",
                meta.size,
                meta.fill,
                gone[c.key] && "scale-50 opacity-0",
              )}
            >
              {meta.label}
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
    setTray((t) => t.filter((x) => x.id !== picked));
    setCounts((c) => ({ ...c, [label]: (c[label] ?? 0) + 1 }));
    setPicked(null);
    playTap();
    onInteract();
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
                <MagentaImg src={squisheeSrc(t.symbol ?? data.symbol)} alt="" className="size-8" />
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {data.kind === "picto" ? (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-2">
              <button
                type="button"
                className="w-20 shrink-0 rounded-[8px] border border-line px-1 py-0.5 text-left text-sm"
                onClick={() => place(r.label)}
              >
                {r.label}
              </button>
              <div className="flex flex-wrap items-center gap-0.5">
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

function ComputeBoard({ question, status, shake }: BoardProps) {
  const data = question.data as ComputeData;
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

function MeasureBoard({ question, status, shake }: BoardProps) {
  const data = question.data as MeasureData;
  const ui = UI[parseLocale(useProgress((st) => st.locale))];
  if (data.mode === "unit") {
    return (
      <Frame shake={shake} status={status}>
        <p className="text-center text-sm text-muted">{ui.readPointer}</p>
      </Frame>
    );
  }
  const max = Math.max(1, data.max);
  const halves = data.attribute === "length" && (data.unit === "in" || data.unit === "cm");
  const steps = halves ? max * 2 : max;
  const at = halves ? data.value * 2 : data.value;
  const x = (i: number) => 28 + (i / steps) * 204;
  const caption = (
    <p className="mt-1 text-center text-sm font-medium text-ink">
      {ui.readPointer} · {data.unit}
    </p>
  );
  if (data.attribute === "length") {
    const px = x(at);
    return (
      <Frame shake={shake} status={status}>
        <svg viewBox="0 0 260 100" className="h-36 w-full" role="img" aria-label={`${ui.readPointer} ${data.unit}`}>
          <rect x="20" y="44" width="220" height="40" rx="5" fill="#f4e4b8" stroke="#1f1a14" strokeWidth="2.5" />
          <rect x="28" y="22" width={Math.max(6, (at / steps) * 204)} height="16" rx="3" fill="#0d7377" />
          {Array.from({ length: steps + 1 }, (_, i) => {
            const major = !halves || i % 2 === 0;
            return (
              <g key={i}>
                <line x1={x(i)} y1="44" x2={x(i)} y2={major ? 72 : 58} stroke="#1f1a14" strokeWidth={major ? 2.5 : 1.5} />
                {major ? (
                  <text x={x(i)} y="92" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1f1a14">
                    {halves ? i / 2 : i}
                  </text>
                ) : null}
              </g>
            );
          })}
          <polygon points={`${px},44 ${px - 9},18 ${px + 9},18`} fill="#c45c26" stroke="#1f1a14" strokeWidth="1.2" />
        </svg>
        {caption}
      </Frame>
    );
  }
  if (data.attribute === "mass") {
    const y = 148 - (data.value / max) * 116;
    return (
      <Frame shake={shake} status={status}>
        <svg viewBox="0 0 140 180" className="mx-auto h-52" role="img" aria-label={`${ui.readPointer} ${data.unit}`}>
          <rect x="52" y="20" width="56" height="136" rx="8" fill="#fffaf1" stroke="#1f1a14" strokeWidth="2.5" />
          {Array.from({ length: max + 1 }, (_, i) => {
            const yy = 148 - (i / max) * 116;
            return (
              <g key={i}>
                <line x1="52" y1={yy} x2="42" y2={yy} stroke="#1f1a14" strokeWidth="2" />
                <text x="38" y={yy + 5} textAnchor="end" fontSize="13" fontWeight="700" fill="#1f1a14">
                  {i}
                </text>
              </g>
            );
          })}
          <rect x="60" y={y} width="40" height={148 - y} fill="#0d7377" />
          <polygon points={`112,${y} 128,${y - 8} 128,${y + 8}`} fill="#c45c26" stroke="#1f1a14" strokeWidth="1" />
        </svg>
        {caption}
      </Frame>
    );
  }
  const fillH = (data.value / max) * 116;
  const meniscus = 148 - fillH;
  return (
    <Frame shake={shake} status={status}>
      <svg viewBox="0 0 140 180" className="mx-auto h-52" role="img" aria-label={`${ui.readPointer} ${data.unit}`}>
        <path d="M48,20 L112,20 L104,156 L56,156 Z" fill="#fffaf1" stroke="#1f1a14" strokeWidth="2.5" />
        {Array.from({ length: max + 1 }, (_, i) => {
          const yy = 148 - (i / max) * 116;
          return (
            <g key={i}>
              <line x1="48" y1={yy} x2="38" y2={yy} stroke="#1f1a14" strokeWidth="2" />
              <text x="34" y={yy + 5} textAnchor="end" fontSize="13" fontWeight="700" fill="#1f1a14">
                {i}
              </text>
            </g>
          );
        })}
        <path d={`M54,${meniscus} L106,${meniscus} L100,156 L60,156 Z`} fill="#0d7377" opacity="0.88" />
        <polygon points={`112,${meniscus} 128,${meniscus - 8} 128,${meniscus + 8}`} fill="#c45c26" stroke="#1f1a14" strokeWidth="1" />
      </svg>
      {caption}
    </Frame>
  );
}

function FluencyBoard({ question, status, shake }: BoardProps) {
  const data = question.data as FluencyData;
  const times = data.op === "×" && data.a > 0 && data.b > 0 && data.a <= 6 && data.b <= 10;
  const div =
    data.op === "÷" && data.b > 0 && data.a % data.b === 0 && data.a / data.b <= 6 && data.b <= 10 && data.a / data.b >= 1;
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
                <span key={i} className="size-3 rounded-full bg-teal sm:size-4" />
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
