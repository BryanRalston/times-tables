import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { clockTimesMatch } from "./clock";
import { UI, type Locale } from "./i18n";

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

const YES_NO = new Set(["yes", "no", "sí", "sim", "não", "<", ">", "="]);

function isClockTime(q: { kind: string; answer: string; data?: unknown }): boolean {
  if (/^\d{1,2}:\d{2}$/.test(q.answer.trim())) return true;
  if (q.kind !== "clock") return false;
  const d = q.data as { mode?: string; find?: string } | undefined;
  return d?.find === "time" || d?.mode === "read";
}

function isMoneyAmount(q: { kind: string; data?: unknown }): boolean {
  if (q.kind !== "money") return false;
  const mode = (q.data as { mode?: string } | undefined)?.mode;
  return mode === "count" || mode === "change" || mode === "make";
}

function looksNumeric(answer: string): boolean {
  const t = answer.trim();
  if (!t) return true;
  if (YES_NO.has(t.toLowerCase())) return true;
  if (/^\$?\d+(\.\d+)?$/.test(t)) return true;
  if (/^\d+\s+\d+\/\d+$/.test(t)) return true;
  if (/^\d+\/\d+$/.test(t)) return true;
  if (/^-?\d+(\.\d+)?$/.test(t)) return true;
  if (/^\d{1,2}:\d{2}$/.test(t)) return true;
  if (/^[<>]=?$/.test(t)) return true;
  if (/^\d+\s*[×÷+\u2212-]\s*\d+(\s*=\s*\d+)?$/.test(t)) return true;
  return false;
}

function isPluralName(name: string, locale: Locale): boolean {
  const last = name.trim().split(/\s+/).pop() ?? "";
  if (!last) return false;
  const lower = last.toLowerCase();
  if (YES_NO.has(lower) || lower === "plus" || lower === "us") return false;
  if (locale === "en") {
    if (/(ss|us|is)$/i.test(lower)) return false;
    return /s$/i.test(lower) || /ies$/i.test(lower);
  }
  return /(s|es)$/i.test(lower);
}

function withArticle(name: string, locale: Locale): string {
  const n = name.trim();
  if (!n || looksNumeric(n)) return n;
  if (/^(a|an|the|un|una|um|uma)\s/i.test(n)) return n;
  if (isPluralName(n, locale)) return n;
  if (locale === "en") return /^[aeiou]/i.test(n) ? `an ${n}` : `a ${n}`;
  if (locale === "es") return /a$/i.test(n) ? `una ${n}` : `un ${n}`;
  return /a$/i.test(n) ? `uma ${n}` : `um ${n}`;
}

function thatsLine(spoken: string, locale: Locale): string {
  if (locale === "en") return UI.en.thats(spoken);
  if (isPluralName(spoken, locale) && !/^(un|una|um|uma)\s/i.test(spoken)) {
    return locale === "es" ? `Eso son ${spoken}.` : `Isso são ${spoken}.`;
  }
  return UI[locale].thats(spoken);
}

/** Kid speech for a correct Check. Leftover ten-frames do not use this. */
export function correctSpeech(
  q: { kind: string; answer: string; data?: unknown },
  locale: Locale,
): string {
  const ui = UI[locale];
  if (isClockTime(q)) return ui.itsClock(q.answer.trim());
  if (isMoneyAmount(q)) return thatsLine(moneySpeech(q.answer), locale);
  if (looksNumeric(q.answer)) return thatsLine(q.answer.trim(), locale);
  return thatsLine(withArticle(q.answer, locale), locale);
}

/** Panda bubble: leftover keeps take-what-you-see; never "n is leftover." */
export function pandaLine(
  q: { kind: string; answer: string; hint?: string; data?: unknown },
  locale: Locale,
  status: "idle" | "correct" | "wrong",
): string {
  const ui = UI[locale];
  if (status === "wrong") return ui.tryAgain;
  if (q.kind === "tenframe") return q.hint ?? ui.takeWhatYouSee;
  if (status === "correct") return correctSpeech(q, locale);
  return q.hint ?? ui.takeWhatYouSee;
}
