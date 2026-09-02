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

/** Wrap minutes into hours, then hours onto a 1–12 clock. */
export function wrapClockParts(hours: number, minutes: number): { hours: number; minutes: number } {
  let h = Math.trunc(hours);
  let m = Math.trunc(minutes);
  if (!Number.isFinite(h)) h = 12;
  if (!Number.isFinite(m)) m = 0;
  const extra = Math.floor(m / 60);
  h += extra;
  m -= extra * 60;
  h = ((h % 12) + 12) % 12;
  if (h === 0) h = 12;
  return { hours: h, minutes: m };
}

export function formatClockTime(hours: number, minutes: number): string {
  const t = wrapClockParts(hours, minutes);
  return `${t.hours}:${String(t.minutes).padStart(2, "0")}`;
}

export function parseClockTime(value: string, fallback = "12:00"): { hours: number; minutes: number } {
  const [hRaw, mRaw] = (value || fallback).split(":");
  let hours = Number(hRaw || 12);
  let minutes = Number(mRaw || 0);
  if (!Number.isFinite(hours)) hours = 12;
  if (!Number.isFinite(minutes)) minutes = 0;
  return wrapClockParts(hours, minutes);
}

export function startClockTime(avoid?: string): string {
  return avoid === "12:00" ? "3:00" : "12:00";
}

/** Time shown on the answer face: parent value, or the start face when value is empty. */
export function displayedClockTime(value: string, avoid?: string): string {
  const { hours, minutes } = parseClockTime(value || startClockTime(avoid));
  return formatClockTime(hours, minutes);
}

/** Whole-minute match on a 1–12 clock. `given` is h:mm from the answer face. */
export function clockTimesMatch(given: string, hours: number, minutes: number): boolean {
  if (!/^\d{1,2}:\d{1,2}$/.test(given.trim())) return false;
  const got = parseClockTime(given.trim());
  const want = wrapClockParts(hours, minutes);
  return got.hours === want.hours && got.minutes === want.minutes;
}
