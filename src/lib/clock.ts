export type ClockHand = "hour" | "minute";

/** Degrees clockwise from 12 o'clock. Screen y grows downward. */
export function clockAngleFromPoint(dx: number, dy: number): number {
  let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return deg;
}

export function angleDiff(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export function pickHand(deg: number, hours: number, minutes: number): ClockHand {
  const minAngle = minutes * 6;
  const hourAngle = (hours % 12) * 30 + minutes * 0.5;
  return angleDiff(deg, minAngle) <= angleDiff(deg, hourAngle) ? "minute" : "hour";
}

export function applyHandAngle(
  hours: number,
  minutes: number,
  hand: ClockHand,
  deg: number,
): { hours: number; minutes: number } {
  if (hand === "minute") {
    return { hours, minutes: Math.round(deg / 6) % 60 };
  }
  const adjusted = (deg - minutes * 0.5 + 360) % 360;
  const h = Math.round(adjusted / 30) % 12;
  return { hours: h === 0 ? 12 : h, minutes };
}

export function formatClockTime(hours: number, minutes: number): string {
  const hh = ((hours - 1 + 12) % 12) + 1;
  const mm = ((minutes % 60) + 60) % 60;
  return `${hh}:${String(mm).padStart(2, "0")}`;
}

export function parseClockTime(value: string, fallback = "12:00"): { hours: number; minutes: number } {
  const [hRaw, mRaw] = (value || fallback).split(":");
  let hours = Number(hRaw || 12);
  let minutes = Number(mRaw || 0);
  if (!Number.isFinite(hours)) hours = 12;
  if (!Number.isFinite(minutes)) minutes = 0;
  return { hours: ((hours - 1 + 12) % 12) + 1, minutes: ((minutes % 60) + 60) % 60 };
}

export function startClockTime(avoid?: string): string {
  return avoid === "12:00" ? "3:00" : "12:00";
}
