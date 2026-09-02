import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { clockTimesMatch } from "./clock";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function moneyFmt(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Speak integer-cent answers as $0.78, not bare 78. */
export function moneySpeech(answer: string): string {
  const t = answer.trim().replace(/^\$/, "");
  if (/^\d+$/.test(t)) return moneyFmt(Number(t));
  if (/^\d+\.\d{1,2}$/.test(t)) return moneyFmt(Math.round(Number(t) * 100));
  return answer;
}

export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Decimal key only for money count / change / make. */
export function keypadAllowsDot(q: { kind: string; data?: unknown }): boolean {
  if (q.kind !== "money") return false;
  const mode = (q.data as { mode?: string } | undefined)?.mode;
  return mode === "count" || mode === "change" || mode === "make";
}

export function answersMatch(given: string, answer: string, alts: string[] = []): boolean {
  const n = normalize(given);
  if (n === normalize(answer)) return true;
  if (alts.some((a) => normalize(a) === n)) return true;
  if (timeMatch(n, normalize(answer))) return true;
  if (alts.some((a) => timeMatch(n, normalize(a)))) return true;
  if (moneyMatch(n, normalize(answer))) return true;
  if (alts.some((a) => moneyMatch(n, normalize(a)))) return true;
  if (orderMatch(n, normalize(answer))) return true;
  return false;
}

export function questionCorrect(
  given: string,
  q: { input: string; answer: string; alts?: string[]; data: unknown },
): boolean {
  if (q.input === "clock") {
    const d = q.data as { hours?: number; minutes?: number };
    if (typeof d.hours === "number" && typeof d.minutes === "number") {
      return clockTimesMatch(given, d.hours, d.minutes);
    }
  }
  return answersMatch(given, q.answer, q.alts);
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ").replace(/,/g, "");
}

function timeMatch(a: string, b: string): boolean {
  const re = /^(\d{1,2}):(\d{1,2})$/;
  const mb = b.match(re);
  if (!mb) return false;
  return clockTimesMatch(a, Number(mb[1]), Number(mb[2]));
}

function moneyMatch(a: string, b: string): boolean {
  const cents = (s: string) => {
    const t = s.replace(/\$/g, "");
    if (/^\d+$/.test(t)) return Number(t);
    if (/^\d+\.\d{1,2}$/.test(t)) return Math.round(Number(t) * 100);
    return null;
  };
  const ca = cents(a);
  const cb = cents(b);
  return ca != null && cb != null && ca === cb && ca < 10000;
}

function orderMatch(a: string, b: string): boolean {
  const pa = a.split(/[^\d-]+/).filter(Boolean).join(" ");
  const pb = b.split(/[^\d-]+/).filter(Boolean).join(" ");
  return pa.length > 0 && pa === pb;
}

export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}
