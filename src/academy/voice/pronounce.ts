import { getLocale, spanishMinuteWords, spanishNumberWords } from "../i18n";

/** How a clip key is read aloud. Runtime never calls this; the generator does. */

const ONES = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
] as const;

const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"] as const;

const LETTERS: Record<string, string> = {
  a: "ay",
  b: "bee",
  c: "see",
  d: "dee",
  e: "ee",
  f: "ef",
  g: "jee",
  h: "aitch",
  i: "eye",
  j: "jay",
  k: "kay",
  l: "el",
  m: "em",
  n: "en",
  o: "oh",
  p: "pee",
  q: "cue",
  r: "ar",
  s: "ess",
  t: "tee",
  u: "you",
  v: "vee",
  w: "double you",
  x: "ex",
  y: "why",
  z: "zee",
};

/** Isolated letter sounds. The say-text is chosen so a neural voice does not spell the letters. */
const PHONEMES: Record<string, string> = {
  mmm: "mmmm",
  sss: "ssss",
  fff: "ffff",
  nnn: "nnnn",
  lll: "llll",
  rrr: "rrrr",
  vvv: "vvvv",
  zzz: "zzzz",
  tuh: "tuh",
  buh: "buh",
  puh: "puh",
  duh: "duh",
  guh: "guh",
  huh: "huh",
  kuh: "kuh",
  juh: "juh",
  wuh: "wuh",
  yuh: "yuh",
  aaa: "aah",
  eh: "eh",
  ih: "ih",
  ah: "ah",
  uh: "uh",
};

const LETTER_PHONEME: Record<string, string> = {
  a: "aaa",
  e: "eh",
  i: "ih",
  o: "ah",
  u: "uh",
  b: "buh",
  c: "kuh",
  d: "duh",
  f: "fff",
  g: "guh",
  h: "huh",
  j: "juh",
  k: "kuh",
  l: "lll",
  m: "mmm",
  n: "nnn",
  p: "puh",
  r: "rrr",
  s: "sss",
  t: "tuh",
  v: "vvv",
  w: "wuh",
  y: "yuh",
  z: "zzz",
};

const WORD_SAY: Record<string, string> = {
  "a-maize-ing": "amazing",
  "purr-fect": "perfect",
  "hole-y": "holy",
};

export function numberWords(n: number): string {
  if (!Number.isInteger(n) || n < 0) return String(n);
  if (n < 20) return ONES[n] ?? String(n);
  if (n < 100) {
    const tens = TENS[Math.floor(n / 10)] ?? "";
    const ones = n % 10;
    return ones ? `${tens} ${ONES[ones]}` : tens;
  }
  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    const head = `${ONES[hundreds]} hundred`;
    return rest ? `${head} ${numberWords(rest)}` : head;
  }
  if (n === 1000) return "one thousand";
  return String(n);
}

export function minuteWords(minutes: number): string {
  if (minutes === 0) return "o'clock";
  if (minutes < 10) return `oh ${numberWords(minutes)}`;
  return numberWords(minutes);
}

function isPhoneme(word: string): boolean {
  return Object.prototype.hasOwnProperty.call(PHONEMES, word);
}

function pronounceWord(word: string, next: string | undefined, alone: boolean): string {
  const special = WORD_SAY[word];
  if (special) return special;
  if (isPhoneme(word)) return PHONEMES[word] ?? word;
  if (/^[a-z]$/.test(word)) {
    const phoneme = LETTER_PHONEME[word];
    const asLetter = word !== "a" && word !== "i" ? true : Boolean(phoneme && next === phoneme);
    if (asLetter) return LETTERS[word] ?? word;
    if (word === "i") return "eye";
    return alone ? "uh" : "a";
  }
  if (word.includes("-")) return word.replace(/-/g, " ");
  return word;
}

/** Words and numbers, without sentence punctuation. */
export function pronounceKey(key: string): string {
  if (key.startsWith("min:")) {
    const minutes = Number(key.slice(4));
    return Number.isInteger(minutes) ? minuteWords(minutes) : key;
  }
  if (/^\d+$/.test(key)) return numberWords(Number(key));
  const words = key.split(" ").filter((word) => word.length > 0);
  const alone = words.length === 1;
  return words.map((word, index) => pronounceWord(word, words[index + 1], alone)).join(" ");
}

const ES_LETTER: Record<string, string> = {
  a: "a",
  b: "be",
  c: "ce",
  d: "de",
  e: "e",
  f: "efe",
  g: "ge",
  h: "hache",
  i: "i",
  j: "jota",
  k: "ka",
  l: "ele",
  m: "eme",
  n: "ene",
  o: "o",
  p: "pe",
  q: "cu",
  r: "ere",
  s: "ese",
  t: "te",
  u: "u",
  v: "uve",
  w: "doble uve",
  x: "equis",
  y: "i",
  z: "zeta",
};

function pronounceSpanishWord(word: string, alone: boolean): string {
  if (word === "thousand") return "mil";
  if (word === "million") return "millón";
  if (word === "hundredths") return "centésimos";
  if (word === "tenths") return "décimos";
  if (word === "remainder") return "residuo";
  if (isPhoneme(word)) return PHONEMES[word] ?? word;
  if (word === "y") return "i";
  if (/^[a-z]$/.test(word) && alone) return ES_LETTER[word] ?? word;
  if (word.includes("-")) return word.replace(/-/g, " ");
  return word;
}

function pronounceKeyEs(key: string): string {
  if (key.startsWith("min:")) {
    const minutes = Number(key.slice(4));
    return Number.isInteger(minutes) ? spanishMinuteWords(minutes) : key;
  }
  if (/^\d+$/.test(key)) return spanishNumberWords(Number(key));
  const words = key.split(" ").filter((word) => word.length > 0);
  const alone = words.length === 1;
  return words.map((word) => pronounceSpanishWord(word, alone)).join(" ");
}

/**
 * Text sent to the synthesizer. Longer clauses get a light ending so the
 * melody lands, and short pieces stay open so the next clip can follow.
 */
export function spokenText(key: string): string {
  const es = getLocale() === "es";
  const say = (es ? pronounceKeyEs(key) : pronounceKey(key)).trim();
  if (!say || /[.!?]$/.test(say)) return say;
  const words = say.split(/\s+/);
  if (!es && words.length >= 3 && /^(what|how|which|where|who|can)\b/i.test(say)) return `${say}?`;
  if (es && words.length >= 3 && /^(qué|cómo|cuál|cuánto|cuántos|cuántas|dónde|quién|puedes)\b/i.test(say)) return `${say}?`;
  if (words.length >= 5) return `${say}.`;
  return say;
}
