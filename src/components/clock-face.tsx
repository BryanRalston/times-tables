import { useRef, type PointerEvent } from "react";
import { applyHandAngle, clockAngleFromPoint, formatClockTime, pickHand, type ClockHand } from "@/lib/clock";
import { cn, pad2 } from "@/lib/utils";

function FaceMarks({ hours, minutes, grab }: { hours: number; minutes: number; grab?: boolean }) {
  const minAngle = minutes * 6;
  const hourAngle = (hours % 12) * 30 + minutes * 0.5;
  const hx = 50 + Math.sin((hourAngle * Math.PI) / 180) * 22;
  const hy = 50 - Math.cos((hourAngle * Math.PI) / 180) * 22;
  const mx = 50 + Math.sin((minAngle * Math.PI) / 180) * 32;
  const my = 50 - Math.cos((minAngle * Math.PI) / 180) * 32;
  return (
    <>
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
      {grab ? (
        <>
          <line x1="50" y1="50" x2={hx} y2={hy} stroke="transparent" strokeWidth="14" strokeLinecap="round" />
          <line x1="50" y1="50" x2={mx} y2={my} stroke="transparent" strokeWidth="12" strokeLinecap="round" />
        </>
      ) : null}
      <line x1="50" y1="50" x2={hx} y2={hy} stroke="#1f1a14" strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="50" x2={mx} y2={my} stroke="#0d7377" strokeWidth="2" strokeLinecap="round" />
      <circle cx="50" cy="50" r="2.5" fill="#c45c26" />
    </>
  );
}

export function ClockFace({ hours, minutes, size = "size-48" }: { hours: number; minutes: number; size?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={size}>
      <FaceMarks hours={hours} minutes={minutes} />
    </svg>
  );
}

export function InteractiveClock({
  hours,
  minutes,
  onChange,
  disabled,
  size = "size-48",
}: {
  hours: number;
  minutes: number;
  onChange: (v: string) => void;
  disabled?: boolean;
  size?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const handRef = useRef<ClockHand | null>(null);

  function localDeg(e: PointerEvent<SVGSVGElement>): number | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return null;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return clockAngleFromPoint(x - 50, y - 50);
  }

  function apply(hand: ClockHand, deg: number) {
    const next = applyHandAngle(hours, minutes, hand, deg);
    onChange(formatClockTime(next.hours, next.minutes));
  }

  function release(e: PointerEvent<SVGSVGElement>) {
    handRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  }

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      className={cn(size, "touch-none select-none", disabled ? "pointer-events-none" : "cursor-grab active:cursor-grabbing")}
      role="slider"
      aria-label="clock hands"
      aria-valuetext={`${hours}:${pad2(minutes)}`}
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        if (disabled) return;
        const deg = localDeg(e);
        if (deg == null) return;
        const hand = pickHand(deg, hours, minutes);
        handRef.current = hand;
        e.currentTarget.setPointerCapture(e.pointerId);
        apply(hand, deg);
      }}
      onPointerMove={(e) => {
        if (handRef.current == null) return;
        const deg = localDeg(e);
        if (deg == null) return;
        apply(handRef.current, deg);
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <FaceMarks hours={hours} minutes={minutes} grab />
    </svg>
  );
}
