import { useEffect, useRef, useState } from "react";
import { emptyPile, formatCents } from "../games/money-model";
import type { TeachFrame, WorkedExample } from "../teach";
import { AnalogClock, cx } from "./bits";
import { CountToken } from "./count-token";
import { CoinRow } from "./coins";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function WorkedExample({
  example,
  onDone,
}: {
  example: WorkedExample;
  onDone: () => void;
}) {
  const [reduced] = useState(prefersReducedMotion);
  const [frameIndex, setFrameIndex] = useState(() => (reduced ? Math.max(0, example.frames.length - 1) : 0));
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const frame = example.frames[Math.min(frameIndex, example.frames.length - 1)] ?? example.frames[0];

  useEffect(() => {
    if (!frame) return;
    const last = frameIndex >= example.frames.length - 1;
    const wait = reduced ? 800 : last ? 900 : 700;
    const id = window.setTimeout(() => {
      if (last || reduced) onDoneRef.current();
      else setFrameIndex((n) => n + 1);
    }, wait);
    return () => window.clearTimeout(id);
  }, [frameIndex, reduced, example]);

  if (!frame) return null;
  return (
    <div className="ac-teach" role="region" aria-label="Worked example">
      <TeachArt frame={frame} />
      <p className="ac-teach-cap">{frame.caption}</p>
      <button type="button" className="ac-go" onClick={() => onDoneRef.current()}>
        Try again
      </button>
    </div>
  );
}

function TeachArt({ frame }: { frame: TeachFrame }) {
  switch (frame.kind) {
    case "add":
      return <AddArt frame={frame} />;
    case "times":
      return <TimesArt frame={frame} />;
    case "time":
      return (
        <AnalogClock hours={frame.hours} minutes={frame.minutes} handMinutes={frame.handMinutes} />
      );
    case "money":
      return <MoneyArt frame={frame} />;
    case "sight":
    case "spell":
      return <p className="ac-sight-word">{frame.show}</p>;
    case "scene":
      return <p className="ac-teach-pic">{frame.show}</p>;
    default: {
      const neverFrame: never = frame;
      return neverFrame;
    }
  }
}

function AddArt({ frame }: { frame: Extract<TeachFrame, { kind: "add" }> }) {
  return (
    <div className="ac-teach-add">
      {frame.blocks ? <BlockRow frame={frame} /> : <DotRow frame={frame} />}
      {frame.tenFilled != null ? <TenFrame filled={frame.tenFilled} /> : null}
      {frame.line ? <NumberLine from={frame.line.from} to={frame.line.to} max={frame.line.max} /> : null}
    </div>
  );
}

function DotRow({ frame }: { frame: Extract<TeachFrame, { kind: "add" }> }) {
  return (
    <div className="ac-dots" aria-hidden="true">
      {pile(frame.pink, "pink")}
      {frame.op === "+" ? (
        frame.tealShown > 0 ? (
          <>
            <span className="ac-dot-gap" />
            {pile(frame.tealShown, "teal")}
          </>
        ) : null
      ) : (
        <>
          <span className="ac-dot-gap" />
          {Array.from({ length: frame.teal }, (_, i) => (
            <i key={`x${i}`} className={cx("ac-dot", "is-teal", i < frame.crossed && "is-cross")} />
          ))}
        </>
      )}
    </div>
  );
}

function pile(n: number, tone: "pink" | "teal") {
  return Array.from({ length: n }, (_, i) => <i key={`${tone}${i}`} className={cx("ac-dot", `is-${tone}`)} />);
}

function BlockRow({ frame }: { frame: Extract<TeachFrame, { kind: "add" }> }) {
  if (frame.op === "-") {
    return (
      <div className="ac-blocks" aria-hidden="true">
        <Blocks n={frame.pink + frame.teal - frame.crossed} tone="pink" />
      </div>
    );
  }
  return (
    <div className="ac-blocks" aria-hidden="true">
      <Blocks n={frame.pink} tone="pink" />
      {frame.tealShown > 0 ? (
        <>
          <span className="ac-op-mini">+</span>
          <Blocks n={frame.tealShown} tone="teal" />
        </>
      ) : null}
    </div>
  );
}

function Blocks({ n, tone }: { n: number; tone: "pink" | "teal" }) {
  const tens = Math.floor(Math.max(0, n) / 10);
  const ones = Math.max(0, n) % 10;
  return (
    <span className={cx("ac-blockset", `is-${tone}`)}>
      {Array.from({ length: tens }, (_, i) => (
        <i key={`t${i}`} className="ac-rod" />
      ))}
      {Array.from({ length: ones }, (_, i) => (
        <i key={`o${i}`} className="ac-dot" />
      ))}
    </span>
  );
}

function TenFrame({ filled }: { filled: number }) {
  const n = Math.max(0, Math.min(10, filled));
  return (
    <div className="ac-ten" aria-label={`${n} squishees on a ten-frame`}>
      {Array.from({ length: 10 }, (_, i) => (i < n ? <CountToken key={i} /> : <i key={i} />))}
    </div>
  );
}

function NumberLine({ from, to, max }: { from: number; to: number; max: number }) {
  const cap = Math.max(max, from, to, 1);
  const x = (n: number) => 18 + (Math.max(0, Math.min(cap, n)) / cap) * 264;
  const y = 36;
  const start = x(from);
  const end = x(to);
  const mid = (start + end) / 2;
  const arc = Math.min(-18, -Math.abs(end - start) * 0.25);
  return (
    <svg className="ac-line" viewBox="0 0 300 72" aria-hidden="true">
      <line x1="16" y1={y} x2="284" y2={y} className="ac-line-base" />
      <Tick n={0} x={x(0)} />
      {from !== 0 ? <Tick n={from} x={start} /> : null}
      {to !== from && to !== cap ? <Tick n={to} x={end} /> : null}
      {cap !== to && cap !== from ? <Tick n={cap} x={x(cap)} /> : null}
      {from !== to ? (
        <path d={`M ${start} ${y - 6} Q ${mid} ${y + arc} ${end} ${y - 8}`} className="ac-line-jump" />
      ) : null}
      <circle cx={end} cy={y} r="6" className="ac-line-dot" />
    </svg>
  );
}

function Tick({ n, x }: { n: number; x: number }) {
  return (
    <g>
      <line x1={x} y1="32" x2={x} y2="42" className="ac-line-tick" />
      <text x={x} y="60" textAnchor="middle">
        {n}
      </text>
    </g>
  );
}

function TimesArt({ frame }: { frame: Extract<TeachFrame, { kind: "times" }> }) {
  const tiny = frame.cols > 8 || frame.rows > 6;
  return (
    <div
      className={cx("ac-array", tiny && "is-tiny")}
      aria-hidden="true"
    >
      {Array.from({ length: frame.shownRows }, (_, row) => (
        <span key={row}>
          {Array.from({ length: Math.max(0, frame.cols) }, (_, col) => (
            <i key={col} />
          ))}
        </span>
      ))}
    </div>
  );
}

function MoneyArt({ frame }: { frame: Extract<TeachFrame, { kind: "money" }> }) {
  const pile = emptyPile();
  for (const kind of frame.coins) pile[kind] += 1;
  return (
    <div className="ac-teach-money">
      {frame.coins.length > 0 ? <CoinRow pile={pile} label={frame.caption} /> : null}
      <p className="ac-eq ac-money-price">{formatCents(frame.runningCents)}</p>
    </div>
  );
}
