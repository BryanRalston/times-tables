import type { ReactNode } from "react";
import { canDressFace } from "@/lib/cosmetics";
import { squisheeById } from "@/lib/squishees";
import { remainderShown, show, t } from "../i18n";
import { isWardrobeId, lookShowsOn, wardrobeSrc } from "../wardrobe";
import { MINUS, TIMES, type AddVisual, type Visual } from "../games/types";
import { cosmeticCompositeUrl, squisheeUrl } from "../paths";
import type { SquishRole } from "../squish/gesture";
import { CountToken, SquisheeTen } from "./count-token";
import { useCast } from "./round-cast";
import { Squishy } from "./squishy";

type SquishMode = SquishRole | "off";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function PlayMark() {
  return (
    <svg className="ac-play-mark" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8.2 5.4v13.2L19 12 8.2 5.4z" fill="currentColor" />
    </svg>
  );
}

export function BackLink({ href = "#/", children = "Games" }: { href?: string; children?: ReactNode }) {
  return (
    <a className="ac-back" href={href}>
      {children}
    </a>
  );
}

export function SquisheeImg({
  id,
  className,
  label,
  squish = "toy",
}: {
  id: string;
  className?: string;
  label?: string;
  squish?: SquishMode;
}) {
  const s = squisheeById(id);
  if (!s) return null;
  const img = <img className={className} src={squisheeUrl(s.file)} alt={label ?? ""} draggable={false} />;
  if (squish === "off") return img;
  return (
    <Squishy id={id} role={squish}>
      {img}
    </Squishy>
  );
}

export function AcademyPal({
  id,
  cosmetic,
  className,
  label,
  squish = "toy",
  pulse = 0,
}: {
  id: string;
  cosmetic?: string;
  className?: string;
  label?: string;
  squish?: SquishMode;
  pulse?: number;
}) {
  const s = squisheeById(id);
  if (!s) return null;
  const wear = cosmetic && isWardrobeId(cosmetic) && lookShowsOn(id, cosmetic) ? cosmetic : "";
  const fitted = Boolean(cosmetic && canDressFace(id, cosmetic));
  const src = fitted && cosmetic ? cosmeticCompositeUrl(id, cosmetic) : squisheeUrl(s.file);
  // The squishee file stays the character. The costume is fitted to this body
  // and shares the squish, and it never draws eyes or a mouth.
  const art = wear ? (
    <span className={cx("ac-wear", className)} data-wear={wear} data-face={id}>
      <img className="ac-wear-face" src={src} alt={label ?? ""} draggable={false} />
      <img className="ac-wear-mark" src={wardrobeSrc(id, wear)} alt="" draggable={false} />
    </span>
  ) : (
    <img className={className} src={src} alt={label ?? ""} draggable={false} />
  );
  if (squish === "off") return art;
  return (
    <Squishy id={id} role={squish} pulse={pulse}>
      {art}
    </Squishy>
  );
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

export function Pips({ value, of = 3 }: { value: number; of?: number }) {
  const filled = Math.max(0, Math.min(of, value));
  return (
    <span className="ac-pips" role="img" aria-label={`${filled} of ${of} stars`}>
      {Array.from({ length: of }, (_, i) => (
        <i key={i} className={i < filled ? "is-on" : ""} />
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
  return <p className="ac-free">{show("Free for every family. No ads, no accounts.")}</p>;
}

export function Foot() {
  return (
    <>
      <nav className="ac-foot" aria-label={show("More")}>
        <a href="#/grownups">
          <IconPeople /> {show("Grown-ups")}
        </a>
        <a href="#/sheets">
          <IconPrint /> {show("Free worksheets")}
        </a>
        <a href="#/settings">
          <IconGear /> {show("Settings")}
        </a>
        <a href={`${import.meta.env.BASE_URL}privacy/`}>
          <IconShield /> {show("Privacy")}
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
  if (minutes === 0) return t(`Analog clock. Short hand on ${short}. Long hand on 12.`, `Reloj. La manecilla corta en el ${short}. La larga en el 12.`, `Relógio. O ponteiro pequeno no ${short}. O grande no 12.`, `Horloge à aiguilles. La petite aiguille sur le ${short}. La grande aiguille sur le 12.`, `钟面。时针指向${short}。分针指向12。`, `घड़ी। छोटी सुई ${short} पर। लंबी सुई 12 पर।`, `ساعة بعقارب. العقرب القصير على ${short}. العقرب الطويل على 12.`);
  const next = short === 12 ? 1 : short + 1;
  if (minutes >= 25) {
    return t(
      `Analog clock. Short hand between ${short} and ${next}. Long hand on ${longN}.`,
      `Reloj. La manecilla corta entre el ${short} y el ${next}. La larga en el ${longN}.`, `Relógio. O ponteiro pequeno entre o ${short} e o ${next}. O grande no ${longN}.`,
    `Horloge à aiguilles. La petite aiguille entre le ${short} et le ${next}. La grande aiguille sur le ${longN}.`, `钟面。时针在${short}和${next}之间。分针指向${longN}。`, `घड़ी। छोटी सुई ${short} और ${next} के बीच। लंबी सुई ${longN} पर।`, `ساعة بعقارب. العقرب القصير بين ${short} و${next}. العقرب الطويل على ${longN}.`);
  }
  return t(
    `Analog clock. Short hand just after ${short}. Long hand on ${longN}.`,
    `Reloj. La manecilla corta acaba de pasar el ${short}. La larga en el ${longN}.`, `Relógio. O ponteiro pequeno acabou de passar o ${short}. O grande no ${longN}.`,
  `Horloge à aiguilles. La petite aiguille vient de passer le ${short}. La grande aiguille sur le ${longN}.`, `钟面。时针刚过${short}。分针指向${longN}。`, `घड़ी। छोटी सुई ${short} के ठीक बाद। लंबी सुई ${longN} पर।`, `ساعة بعقارب. العقرب القصير بعد ${short} مباشرة. العقرب الطويل على ${longN}.`);
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
    {/* Sits on the clock hands, so a squish would fight the drag. */}
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
  if (a < 1 || a > 5 || b > 10 || a * b > 20) return null;
  const faces = a * b <= 12;
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
  if (visual.kind === "time" || visual.kind === "money" || visual.kind === "sight" || visual.kind === "spell" || visual.kind === "scene") return null;
  if (visual.kind === "times") {
    if (visual.ask === "divide") {
      const shown = reveal ? remainderShown(answer) : "?";
      return (
        <p className="ac-eq">
          <span>{visual.a}</span>
          <span className="ac-op">÷</span>
          <span>{visual.b}</span>
          <span className="ac-op">=</span>
          <span className="ac-blank">{shown}</span>
        </p>
      );
    }
    if (visual.ask === "factor" || visual.ask === "multiple") {
      return (
        <p className="ac-eq">
          <span className="ac-blank">{reveal ? answer : "?"}</span>
        </p>
      );
    }
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
