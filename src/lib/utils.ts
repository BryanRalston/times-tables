import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function moneyFmt(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
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

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ").replace(/,/g, "");
}

function timeMatch(a: string, b: string): boolean {
  const re = /^(\d{1,2}):(\d{1,2})$/;
  const ma = a.match(re);
  const mb = b.match(re);
  if (!ma || !mb) return false;
  return Number(ma[1]) === Number(mb[1]) && Number(ma[2]) === Number(mb[2]);
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
