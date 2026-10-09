import type { ReactNode } from "react";
import { canDressFace } from "@/lib/cosmetics";
import { squisheeById } from "@/lib/squishees";
import { MINUS, TIMES, type AddVisual, type Visual } from "../games/types";
import { cosmeticCompositeUrl, squisheeUrl } from "../paths";
import { CountToken, SquisheeTen } from "./count-token";
import { useCast } from "./round-cast";

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

export function AcademyPal({
  id,
  cosmetic,
  className,
  label,
}: {
  id: string;
  cosmetic?: string;
  className?: string;
  label?: string;
}) {
  const s = squisheeById(id);
  if (!s) return null;
  const src = cosmetic && canDressFace(id, cosmetic) ? cosmeticCompositeUrl(id, cosmetic) : squisheeUrl(s.file);
  return <img className={className} src={src} alt={label ?? ""} draggable={false} />;
}

export function ProgressRing({ value, max, label }: { value: number; max: number; label: string }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max));
  return (
    <svg className="ac-ring" viewBox="0 0 44 44" role="img" aria-label={label}>
      <circle className="ac-ring-track" cx="22" cy="22" r={r} />
      <circle
        className="ac-ring-value"
        cx="22"
        cy="22"
        r={r}
        strokeDasharray={`${c * pct} ${c}`}
      />
      <text x="22" y="26" textAnchor="middle">
        {value}
      </text>
    </svg>
  );
}

export function GiftBox({ open }: { open?: boolean }) {
  return (
    <svg className="ac-gift-ico" viewBox="0 0 48 48" aria-hidden="true">
      <rect x="8" y="20" width="32" height="22" rx="4" fill={open ? "#fff6ea" : "#ff4b93"} />
      <rect x="6" y="16" width="36" height="8" rx="3" fill={open ? "#ffe0ee" : "#ff7eb3"} />
      <path d="M24 16v26" stroke="#fff" strokeWidth="3" />
      <path d="M16 16c0-6 8-8 8-2 0-6 8-4 8 2" fill="none" stroke="#f0b429" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function SpeakerIcon({ muted }: { muted?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 10h4l5-4v12l-5-4H4z" />
      {muted ? <path d="M16 9l5 6M21 9l-5 6" /> : <path d="M16 9.5a3 3 0 0 1 0 5M18 7a6 6 0 0 1 0 10" />}
    </svg>
  );
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

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 5 6v6c0 4.2 2.8 7.2 7 8.5 4.2-1.3 7-4.3 7-8.5V6Z" />
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

export function FreeNote() {
  return <p className="ac-free">Free for every family. No ads, no accounts.</p>;
}

export function Foot() {
  return (
    <>
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
        <a href={`${import.meta.env.BASE_URL}privacy/`}>
          <IconShield /> Privacy
        </a>
      </nav>
      <FreeNote />
    </>
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

export function AnalogClock({
  hours,
  minutes,
  className,
  handMinutes,
}: {
  hours: number;
  minutes: number;
  className?: string;
  /** Minute-hand position while a worked example moves the hands. */
  handMinutes?: number;
}) {
  const shown = handMinutes ?? minutes;
  const minuteDeg = shown * 6;
  const hourDeg = (hours % 12) * 30 + shown * 0.5;
  const point = (deg: number, len: number) => {
    const r = (deg * Math.PI) / 180;
    return { x: 100 + Math.sin(r) * len, y: 100 - Math.cos(r) * len };
  };
  const hour = point(hourDeg, 50);
  const minute = point(minuteDeg, 72);
  const rider = squisheeById(useCast()?.hostId ?? "");
  return (
    <span className="ac-clock-wrap">
    <svg
      className={cx("ac-clock", className)}
      viewBox="0 0 200 200"
      role="img"
      aria-label={clockAria(hours, shown)}
      data-hours={hours}
      data-minutes={shown}
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
    {rider ? <img className="ac-clock-pal" src={squisheeUrl(rider.file)} alt="" draggable={false} /> : null}
    </span>
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
  const total = visual.pink + visual.teal;
  if (visual.op === "+" && visual.max <= 10 && total <= 10) {
    return <SquisheeTen pink={visual.pink} teal={visual.teal} />;
  }
  if (total <= 12) {
    return <TokenAdd visual={visual} />;
  }
  return (
    <div className="ac-dots" aria-hidden="true">
      <Dots n={visual.pink} tone="pink" />
      <span className="ac-dot-gap" />
      <Dots n={visual.teal} tone={visual.op === "+" ? "teal" : "gone"} />
    </div>
  );
}

function TokenAdd({ visual }: { visual: AddVisual }) {
  const cast = useCast();
  const kept = cast?.buddyId ?? "peach";
  const extra = cast?.hostId ?? "frog";
  const gone = visual.op === "-";
  return (
    <div className="ac-dots" aria-label={gone ? "Squishees, some shared away" : "Squishees to count"}>
      {Array.from({ length: visual.pink }, (_, i) => (
        <CountToken key={`p${i}`} id={kept} />
      ))}
      <span className="ac-dot-gap" />
      {Array.from({ length: visual.teal }, (_, i) => (
        <CountToken key={`t${i}`} id={extra} faded={gone} />
      ))}
    </div>
  );
}

export function Groups({ a, b }: { a: number; b: number }) {
  if (a > 6 || b > 6 || a * b > 24 || a < 1) return null;
  const faces = a <= 4 && a * b <= 12;
  const token = useCast()?.buddyId ?? "peach";
  return (
    <div className="ac-groups" aria-hidden={faces ? undefined : true} aria-label={faces ? `${a} groups of ${b} squishees` : undefined}>
      {Array.from({ length: a }, (_, g) => (
        <span key={g} className="ac-group">
          {Array.from({ length: b }, (_, i) => (faces ? <CountToken key={i} id={token} /> : <i key={i} />))}
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
  visual: Visual;
  reveal: boolean;
  answer: string;
}) {
  if (visual.kind === "time" || visual.kind === "money" || visual.kind === "sight" || visual.kind === "spell") return null;
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
