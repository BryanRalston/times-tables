import { getLocale } from "../i18n";
import { speakable } from "./speakable";

export interface SpeechPiece {
  key: string;
  gapMs: number;
}

type TokenKind = "word" | "num" | "clock";

interface Token {
  kind: TokenKind;
  text: string;
  /** Pause already earned by punctuation before this token. */
  gapBefore: number;
}

const SENTENCE_GAP = 200;
const COMMA_GAP = 120;
const WORD_GAP = 70;
const CLOCK_GAP = 45;

/** Turn symbols and money into words a clip key can match. */
export function normalizeSpeech(text: string): string {
  let line = text.normalize("NFKC").replace(/[’‘]/g, "'").replace(/[“”]/g, "");
  line = line.replace(/[…]/g, ". ").replace(/[—–]/g, ", ");
  line = line.replace(/_+/g, " blank ");
  line = speakable(line);
  if (getLocale() === "es" || getLocale() === "pt") {
    const and = getLocale() === "pt" ? "e" : "y";
    const divided = getLocale() === "pt" ? "dividido por" : "dividido entre";
    line = line.replace(/\$(\d+)\.(\d{2})/g, (_full, dollars: string, cents: string) => {
      const dollarWord = Number(dollars) === 1 ? "dólar" : "dólares";
      return `${dollars} ${dollarWord} ${and} ${Number(cents)} centavos`;
    });
    line = line.replace(/\b(\d+) dólares\.(\d{2})\b/g, (_full, dollars: string, cents: string) => {
      return `${dollars} dólares ${and} ${Number(cents)} centavos`;
    });
    line = line.replace(/÷/g, ` ${divided} `);
    line = line.replace(/(\d)\s*-\s*(\d)/g, "$1 menos $2");
    line = line.replace(/&/g, ` ${and} `);
  } else {
    line = line.replace(/\$(\d+)\.(\d{2})/g, (_full, dollars: string, cents: string) => {
      return `${dollars} dollars and ${Number(cents)} cents`;
    });
    line = line.replace(/\b(\d+) dollars\.(\d{2})\b/g, (_full, dollars: string, cents: string) => {
      return `${dollars} dollars and ${Number(cents)} cents`;
    });
    line = line.replace(/÷/g, " divided by ");
    line = line.replace(/(\d)\s*-\s*(\d)/g, "$1 minus $2");
    line = line.replace(/&/g, " and ");
  }
  line = line.replace(/(\d),(?=\d)/g, "$1");
  line = line.replace(/(\d+)\.º/g, "$1");
  line = line.replace(/[()·«»]/g, " ");
  return line.toLowerCase().replace(/\s+/g, " ").trim();
}

function validClock(text: string): boolean {
  const [hours, minutes] = text.split(":");
  if (!hours || !minutes || minutes.length !== 2) return false;
  const h = Number(hours);
  const m = Number(minutes);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

export function speechChunkError(text: string): string | null {
  return scan(normalizeSpeech(text)).error;
}

function scan(norm: string): { tokens: Token[] | null; error: string | null } {
  const tokens: Token[] = [];
  let i = 0;
  let gap = 0;
  while (i < norm.length) {
    const ch = norm[i] ?? "";
    if (ch === " " || ch === "\n" || ch === "\t") {
      i += 1;
      continue;
    }
    if (ch === "¿" || ch === "¡") {
      i += 1;
      continue;
    }
    if (ch === "." || ch === "!" || ch === "?") {
      gap = Math.max(gap, SENTENCE_GAP);
      i += 1;
      continue;
    }
    if (ch === "," || ch === ";" || ch === ":") {
      gap = Math.max(gap, COMMA_GAP);
      i += 1;
      continue;
    }
    const rest = norm.slice(i);
    const clock = /^(\d{1,2}:\d{2})/.exec(rest);
    if (clock?.[1] && validClock(clock[1])) {
      tokens.push({ kind: "clock", text: clock[1], gapBefore: gap });
      gap = 0;
      i += clock[1].length;
      continue;
    }
    const num = /^(\d+)/.exec(rest);
    if (num?.[1]) {
      tokens.push({ kind: "num", text: String(Number(num[1])), gapBefore: gap });
      gap = 0;
      i += num[1].length;
      continue;
    }
    const word = /^([a-záàâãéêíóôõúüçñ]+(?:'[a-záàâãéêíóôõúüçñ]+)?(?:-[a-záàâãéêíóôõúüçñ]+)*)/.exec(rest);
    if (word?.[1]) {
      tokens.push({ kind: "word", text: word[1], gapBefore: gap });
      gap = 0;
      i += word[1].length;
      continue;
    }
    return { tokens: null, error: `unsupported ${JSON.stringify(rest.slice(0, 16))} in ${JSON.stringify(norm)}` };
  }
  return { tokens, error: null };
}

function gapAfter(tokens: Token[], index: number): number {
  const next = tokens[index + 1];
  if (!next) return 60;
  return next.gapBefore > 0 ? next.gapBefore : WORD_GAP;
}

function numberPieces(token: Token, tokens: Token[], index: number): SpeechPiece[] {
  const n = Number(token.text);
  const gap = gapAfter(tokens, index);
  if (!Number.isFinite(n) || n <= 1000) return [{ key: token.text, gapMs: gap }];
  const parts: string[] = [];
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;
  if (millions > 0) {
    parts.push(String(millions), "million");
  }
  if (thousands > 0) {
    parts.push(String(thousands), "thousand");
  }
  if (rest > 0 || parts.length === 0) parts.push(String(rest));
  return parts.map((key, piece) => ({ key, gapMs: piece === parts.length - 1 ? gap : WORD_GAP }));
}

function clockPieces(token: Token, tokens: Token[], index: number): SpeechPiece[] {
  const [hours, minutes] = token.text.split(":");
  return [
    { key: String(Number(hours)), gapMs: CLOCK_GAP },
    { key: `min:${minutes}`, gapMs: gapAfter(tokens, index) },
  ];
}

/** The clips a line should have: whole phrases between numbers, composed math around them. */
export function idealPieces(text: string): SpeechPiece[] | null {
  const scanned = scan(normalizeSpeech(text));
  if (!scanned.tokens) return null;
  const tokens = scanned.tokens;
  const pieces: SpeechPiece[] = [];
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    if (!token) break;
    if (token.kind === "clock") {
      pieces.push(...clockPieces(token, tokens, i));
      i += 1;
      continue;
    }
    if (token.kind === "num") {
      pieces.push(...numberPieces(token, tokens, i));
      i += 1;
      continue;
    }
    if (token.kind !== "word") {
      const neverKind: never = token.kind;
      return neverKind;
    }
    let end = i;
    while (end + 1 < tokens.length && tokens[end + 1]?.kind === "word" && tokens[end + 1]?.gapBefore === 0) end += 1;
    const key = tokens
      .slice(i, end + 1)
      .map((part) => part.text)
      .join(" ");
    pieces.push({ key, gapMs: gapAfter(tokens, end) });
    i = end + 1;
  }
  return pieces;
}

function wordRunEnd(tokens: Token[], start: number): number {
  let end = start;
  while (end + 1 < tokens.length && tokens[end + 1]?.kind === "word" && tokens[end + 1]?.gapBefore === 0) end += 1;
  return end;
}

/**
 * Play recorded clips. Prefers the longest phrase that exists, then single
 * words, so a new sentence of known words still stays off the device voice.
 */
export function planSpeech(text: string, has: (key: string) => boolean): SpeechPiece[] | null {
  const scanned = scan(normalizeSpeech(text));
  if (!scanned.tokens) return null;
  const tokens = scanned.tokens;
  const pieces: SpeechPiece[] = [];
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    if (!token) break;
    if (token.kind === "clock") {
      const parts = clockPieces(token, tokens, i);
      if (parts.some((part) => !has(part.key))) return null;
      pieces.push(...parts);
      i += 1;
      continue;
    }
    if (token.kind === "num") {
      const parts = numberPieces(token, tokens, i);
      if (parts.some((part) => !has(part.key))) return null;
      pieces.push(...parts);
      i += 1;
      continue;
    }
    if (token.kind !== "word") {
      const neverKind: never = token.kind;
      return neverKind;
    }
    const limit = wordRunEnd(tokens, i);
    let chosen = -1;
    for (let end = limit; end >= i; end -= 1) {
      const key = tokens
        .slice(i, end + 1)
        .map((part) => part.text)
        .join(" ");
      if (has(key)) {
        chosen = end;
        break;
      }
    }
    if (chosen < 0) return null;
    const key = tokens
      .slice(i, chosen + 1)
      .map((part) => part.text)
      .join(" ");
    pieces.push({ key, gapMs: gapAfter(tokens, chosen) });
    i = chosen + 1;
  }
  return pieces;
}
