const SENTENCE_GAP = 200;
const COMMA_GAP = 120;
const WORD_GAP = 70;

const LEAD = new Set(["¡", "¿"]);
const SENTENCE = new Set([".", "!", "?", "。", "！", "？", "।", "؟"]);
const PAUSE = new Set([",", ";", ":", "，", "、", "；", "：", "،", "؛"]);

/**
 * Same word shape as the clip planner, so a highlighted word and its recording
 * share one key. Latin, Devanagari, Arabic, and Chinese all count.
 */
const WORD_RE =
  /^([a-záàâãäéèêëíïîóôõúùûüÿçñœæ\u0900-\u097F\u0621-\u063A\u0640-\u064A\u0671-\u06D3\u064B-\u0652\u0670\u3400-\u9fff]+(?:'[a-záàâãäéèêëíïîóôõúùûüÿçñœæ]+)?(?:-[a-záàâãäéèêëíïîóôõúùûüÿçñœæ]+)*)/;

export interface LineToken {
  key: string;
  text: string;
  gapAfterMs: number;
}

function gapFor(marks: string): number {
  let gap = WORD_GAP;
  for (const mark of marks) {
    if (SENTENCE.has(mark)) gap = Math.max(gap, SENTENCE_GAP);
    else if (PAUSE.has(mark)) gap = Math.max(gap, COMMA_GAP);
  }
  return gap;
}

/** Words in reading order, with the punctuation a child sees on that word. */
export function lineTokens(text: string): LineToken[] {
  const shown = text.normalize("NFKC").replace(/[’‘]/g, "'");
  const norm = shown.toLowerCase();
  const tokens: LineToken[] = [];
  let i = 0;
  while (i < norm.length) {
    const ch = norm[i] ?? "";
    if (ch === " " || ch === "\n" || ch === "\t") {
      i += 1;
      continue;
    }
    const start = i;
    if (LEAD.has(shown[i] ?? "")) i += 1;
    const match = WORD_RE.exec(norm.slice(i));
    if (!match?.[1]) {
      i = Math.max(i + 1, start + 1);
      continue;
    }
    const key = match[1];
    i += key.length;
    let marks = "";
    while (i < norm.length && (SENTENCE.has(norm[i] ?? "") || PAUSE.has(norm[i] ?? ""))) {
      marks += shown[i] ?? "";
      i += 1;
    }
    const lead = LEAD.has(shown[start] ?? "") ? (shown[start] ?? "") : "";
    const word = shown.slice(start + lead.length, start + lead.length + key.length);
    tokens.push({ key, text: `${lead}${word}${marks}`, gapAfterMs: marks ? gapFor(marks) : WORD_GAP });
  }
  const last = tokens[tokens.length - 1];
  if (last && !/[.!?。！？।؟]$/.test(last.text)) last.gapAfterMs = Math.min(last.gapAfterMs, 60);
  return tokens;
}

export function storyWords(text: string): string[] {
  return lineTokens(text).map((token) => token.key);
}

/** Reject digits and symbols the clip planner cannot say. Apostrophes in words are fine. */
export function storyTextError(text: string): string | null {
  if (!text.trim()) return "empty";
  if (/[0-9]/.test(text)) return "digit";
  if (/[^A-Za-z\s.,!?'"]/.test(text)) return "symbol";
  if (storyWords(text).length === 0) return "no words";
  return null;
}
