import type { ReactNode } from "react";
import { squisheeById } from "@/lib/squishees";
import { MINUS, TIMES, type AddVisual, type TimeVisual, type TimesVisual } from "../questions";
import { squisheeUrl } from "../paths";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function BackLink({ href = "#/", children = "Games" }: { href?: string; children?: ReactNode }) {
  return (
    <a className="ac-back" href={href}>
      {children}
    </a>
  );
}

export function SquisheeImg({ id, className, label }: { id: string; className?: string; label?: string }) {
  const s = squisheeById(id);
  if (!s) return null;
  return <img className={className} src={squisheeUrl(s.file)} alt={label ?? ""} draggable={false} />;
}

export function Stars({ value, of = 3, className }: { value: number; of?: number; className?: string }) {
  return (
    <span className={cx("ac-stars", className)} aria-label={`${value} of ${of} stars`}>
      {Array.from({ length: of }, (_, i) => (
        <Star key={i} filled={i < value} />
      ))}
    </span>
  );
}

export function Star({ filled }: { filled?: boolean }) {
  return (
    <svg className={cx("ac-star", filled && "is-on")} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.6 14.7 8.8 21.4 9.5 16.4 14.1 17.8 20.7 12 17.4 6.2 20.7 7.6 14.1 2.6 9.5 9.3 8.8Z" />
    </svg>
  );
}

export function Flame() {
  return (
    <svg className="ac-flame" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2s2.2 3.2 2.2 5.4c0 1.2-.6 2-1.3 2.4.9-.2 2.3-.1 3.2 1 1.6 1.9 1.4 5-1.2 7.2C12.6 20.2 9 20 7.2 17.6 5.2 14.8 5.6 11 8 8.4c.3 1.5 1.2 2.4 2.2 2.6C10 8.8 10.2 6.2 12 2Z" />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V8a4 4 0 0 1 8 0v2" />
    </svg>
  );
}

function IconPeople() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="8" cy="8" r="2.2" />
      <circle cx="16" cy="9" r="2" />
      <path d="M3.8 18.5c.6-2.6 2.4-4 4.4-4s3.8 1.4 4.4 4" />
      <path d="M13 14.6c1.6-.4 3.2.2 4.2 1.6.7 1 .9 2.3.8 2.8" />
    </svg>
  );
}

function IconPrint() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 8V4h10v4" />
      <rect x="5" y="8" width="14" height="8" rx="2" />
      <path d="M8 14h8v6H8z" />
    </svg>
  );
}

function IconGear() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" />
    </svg>
  );
}

export function Foot() {
  return (
    <nav className="ac-foot" aria-label="More">
      <a href="#/grownups">
        <IconPeople /> Grown-ups
      </a>
      <a href="#/sheets">
        <IconPrint /> Free worksheets
      </a>
      <a href="#/settings">
        <IconGear /> Settings
      </a>
    </nav>
  );
}

export function Logo() {
  return (
    <a className="ac-logo" href="#/">
      <b>Squishee</b>
      <i>Academy</i>
    </a>
  );
}

export function clockAria(hours: number, minutes: number): string {
  const long = Math.round(minutes / 5) % 12;
  const longN = long === 0 ? 12 : long;
  const short = hours % 12 === 0 ? 12 : hours % 12;
  if (minutes === 0) return `Analog clock. Short hand on ${short}. Long hand on 12.`;
  const next = short === 12 ? 1 : short + 1;
  if (minutes >= 25) return `Analog clock. Short hand between ${short} and ${next}. Long hand on ${longN}.`;
  return `Analog clock. Short hand just after ${short}. Long hand on ${longN}.`;
}

export function AnalogClock({ hours, minutes, className }: { hours: number; minutes: number; className?: string }) {
  const minuteDeg = minutes * 6;
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;
  const point = (deg: number, len: number) => {
    const r = (deg * Math.PI) / 180;
    return { x: 100 + Math.sin(r) * len, y: 100 - Math.cos(r) * len };
  };
  const hour = point(hourDeg, 50);
  const minute = point(minuteDeg, 72);
  return (
    <svg
      className={cx("ac-clock", className)}
      viewBox="0 0 200 200"
      role="img"
      aria-label={clockAria(hours, minutes)}
      data-hours={hours}
      data-minutes={minutes}
    >
      <circle cx="100" cy="100" r="94" fill="#fffdfb" stroke="#f7b7d2" strokeWidth="10" />
      {Array.from({ length: 12 }, (_, i) => {
        const n = i + 1;
        const r = (n * 30 * Math.PI) / 180;
        const x = 100 + Math.sin(r) * 72;
        const y = 100 - Math.cos(r) * 72;
        return (
          <text key={n} x={x} y={y} textAnchor="middle" dominantBaseline="central">
            {n}
          </text>
        );
      })}
      <line x1="100" y1="100" x2={hour.x} y2={hour.y} className="ac-hour" strokeLinecap="round" />
      <line x1="100" y1="100" x2={minute.x} y2={minute.y} className="ac-minute" strokeLinecap="round" />
      <circle cx="100" cy="100" r="7" fill="#4a2d55" />
    </svg>
  );
}

function Dots({ n, tone }: { n: number; tone: "pink" | "teal" | "gone" }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <i key={`${tone}-${i}`} className={cx("ac-dot", `is-${tone}`)} />
      ))}
    </>
  );
}

function Blocks({ n, tone }: { n: number; tone: "pink" | "teal" }) {
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return (
    <span className={cx("ac-blockset", `is-${tone}`)}>
      {Array.from({ length: tens }, (_, i) => (
        <i key={`t${i}`} className="ac-rod" />
      ))}
      {Array.from({ length: ones }, (_, i) => (
        <i key={`o${i}`} className="ac-dot" />
      ))}
      {n === 0 ? <i className="ac-zero">0</i> : null}
    </span>
  );
}

export function DotModel({ visual }: { visual: AddVisual }) {
  if (visual.max > 20) {
    return (
      <div className="ac-blocks" aria-hidden="true">
        <Blocks n={visual.pink} tone="pink" />
        <span className="ac-op-mini">{visual.op === "+" ? "+" : MINUS}</span>
        <Blocks n={visual.teal} tone="teal" />
      </div>
    );
  }
  return (
    <div className="ac-dots" aria-hidden="true">
      <Dots n={visual.pink} tone="pink" />
      <span className="ac-dot-gap" />
      <Dots n={visual.teal} tone={visual.op === "+" ? "teal" : "gone"} />
    </div>
  );
}

export function Groups({ a, b }: { a: number; b: number }) {
  if (a > 6 || b > 6 || a * b > 24 || a < 1) return null;
  return (
    <div className="ac-groups" aria-hidden="true">
      {Array.from({ length: a }, (_, g) => (
        <span key={g} className="ac-group">
          {Array.from({ length: b }, (_, i) => (
            <i key={i} />
          ))}
        </span>
      ))}
    </div>
  );
}

function Slot({ n, reveal, answer }: { n: number | null; reveal: boolean; answer: string }) {
  if (n == null) return <span className="ac-blank">{reveal ? answer : "?"}</span>;
  return <span>{n}</span>;
}

export function Equation({
  visual,
  reveal,
  answer,
}: {
  visual: AddVisual | TimesVisual | TimeVisual;
  reveal: boolean;
  answer: string;
}) {
  if (visual.kind === "time") return null;
  if (visual.kind === "times") {
    return (
      <p className="ac-eq">
        <span>{visual.a}</span>
        <span className="ac-op">{TIMES}</span>
        <span>{visual.b}</span>
        <span className="ac-op">=</span>
        <span className="ac-blank">{reveal ? answer : "?"}</span>
      </p>
    );
  }
  return (
    <p className="ac-eq">
      <Slot n={visual.left} reveal={reveal} answer={answer} />
      <span className="ac-op">{visual.op === "+" ? "+" : MINUS}</span>
      <Slot n={visual.right} reveal={reveal} answer={answer} />
      <span className="ac-op">=</span>
      <Slot n={visual.result} reveal={reveal} answer={answer} />
    </p>
  );
}

export function fmtSeconds(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
