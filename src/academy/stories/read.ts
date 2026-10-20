const SENTENCE_GAP = 200;
const COMMA_GAP = 120;
const WORD_GAP = 70;

export interface LineToken {
  key: string;
  text: string;
  gapAfterMs: number;
}

function gapFor(marks: string): number {
  let gap = WORD_GAP;
  for (const mark of marks) {
    if (mark === "." || mark === "!" || mark === "?") gap = Math.max(gap, SENTENCE_GAP);
    else if (mark === "," || mark === ";" || mark === ":") gap = Math.max(gap, COMMA_GAP);
  }
  return gap;
}

/** Words in reading order, with the punctuation a child sees on that word. */
export function lineTokens(text: string): LineToken[] {
  const tokens: LineToken[] = [];
  const re = /([A-Za-z]+(?:'[A-Za-z]+)?)([^A-Za-z]*)/g;
  let match: RegExpExecArray | null = re.exec(text);
  while (match) {
    const word = match[1] ?? "";
    const tail = match[2] ?? "";
    const marks = tail.replace(/[^.,!?;:]/g, "");
    const shown = `${word}${marks}`;
    tokens.push({ key: word.toLowerCase(), text: shown, gapAfterMs: marks ? gapFor(marks) : WORD_GAP });
    match = re.exec(text);
  }
  const last = tokens[tokens.length - 1];
  if (last && !/[.!?]$/.test(last.text)) last.gapAfterMs = Math.min(last.gapAfterMs, 60);
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
