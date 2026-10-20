import { WEEKDAY_LETTERS, WEEKDAY_NAMES, gradeLabel, type Grade } from "./model";
import { ES, TRAIT_ES } from "./i18n-es";

export type Locale = "en" | "es";

let locale: Locale = "en";

export function getLocale(): Locale {
  return locale;
}

export function setLocale(next: Locale): void {
  locale = next === "es" ? "es" : "en";
  if (typeof document !== "undefined") document.documentElement.lang = locale === "es" ? "es" : "en";
}

/** First visit on a Spanish browser. English stays the default until the child picks. */
export function prefersSpanish(): boolean {
  if (typeof navigator === "undefined") return false;
  const lang = (navigator.languages?.[0] || navigator.language || "").toLowerCase();
  return lang.startsWith("es");
}

export function t(en: string, es: string): string {
  return locale === "es" ? es : en;
}

/** Static English copy. Missing Spanish falls back to the English words. */
export function show(en: string): string {
  if (locale !== "es") return en;
  return ES[en] ?? en;
}

export function yesDetail(detail: string): string {
  return t(`Yes! ${detail}`, `¡Sí! ${detail}`);
}

export function almostDetail(detail: string): string {
  return t(`Almost! ${detail}`, `¡Casi! ${detail}`);
}

export function yourTurnLine(prompt: string): string {
  return t(`Your turn. ${prompt}`, `Te toca. ${prompt}`);
}

/** Round size for little kids. A countdown is not part of this label. */
export function cardsRoundLabel(count: number): string {
  const n = Math.max(0, Math.floor(count));
  if (n === 1) return t("1 card", "1 tarjeta");
  return t(`${n} cards`, `${n} tarjetas`);
}

/** Card step for Pre-K, kindergarten, and grade 1. */
export function cardStepLabel(index: number, total: number): string {
  const safeTotal = Math.max(1, Math.floor(total));
  const at = Math.min(safeTotal, Math.max(1, Math.floor(index) + 1));
  return t(`Card ${at} of ${safeTotal}`, `Tarjeta ${at} de ${safeTotal}`);
}

export function gradeText(grade: Grade): string {
  if (locale !== "es") return gradeLabel(grade);
  if (grade === "PK") return "Prekínder";
  if (grade === "K") return "Kínder";
  return `Grado ${grade}`;
}

export function weekdayName(index: number): string {
  const en = WEEKDAY_NAMES[index] ?? "Day";
  return show(en);
}

export function weekdayLetter(index: number): string {
  if (locale !== "es") return WEEKDAY_LETTERS[index] ?? "";
  return ["L", "M", "M", "J", "V", "S", "D"][index] ?? "";
}

const SHAPES: Record<string, { one: string; article: string }> = {
  circle: { one: "círculo", article: "el" },
  triangle: { one: "triángulo", article: "el" },
  square: { one: "cuadrado", article: "el" },
  rectangle: { one: "rectángulo", article: "el" },
  pentagon: { one: "pentágono", article: "el" },
  hexagon: { one: "hexágono", article: "el" },
  cube: { one: "cubo", article: "el" },
  sphere: { one: "esfera", article: "la" },
  cone: { one: "cono", article: "el" },
  cylinder: { one: "cilindro", article: "el" },
};

export function shapeWord(id: string): string {
  if (locale !== "es") return id;
  return SHAPES[id]?.one ?? id;
}

export function shapeWithArticle(id: string): string {
  if (locale !== "es") return id;
  const row = SHAPES[id];
  if (!row) return id;
  return `${row.article} ${row.one}`;
}

const PARTS: Record<string, string> = {
  halves: "las mitades",
  thirds: "los tercios",
  fourths: "los cuartos",
  unequal: "las partes que no son iguales",
  "not equal": "que no son iguales",
};

export function partPhrase(id: string): string {
  if (locale !== "es") return id;
  return PARTS[id] ?? id;
}

const NOUNS: Record<string, [string, string]> = {
  apple: ["manzana", "manzanas"],
  apples: ["manzana", "manzanas"],
  fish: ["pez", "peces"],
  star: ["estrella", "estrellas"],
  stars: ["estrella", "estrellas"],
  cookie: ["galleta", "galletas"],
  cookies: ["galleta", "galletas"],
  frog: ["rana", "ranas"],
  frogs: ["rana", "ranas"],
  bag: ["bolsa", "bolsas"],
  bags: ["bolsa", "bolsas"],
  cat: ["gato", "gatos"],
  cats: ["gato", "gatos"],
  dog: ["perro", "perros"],
  dogs: ["perro", "perros"],
  squishee: ["squishee", "squishees"],
  squishees: ["squishee", "squishees"],
  ball: ["pelota", "pelotas"],
  balls: ["pelota", "pelotas"],
  banana: ["plátano", "plátanos"],
  bananas: ["plátano", "plátanos"],
  snake: ["serpiente", "serpientes"],
  snakes: ["serpiente", "serpientes"],
  carrot: ["zanahoria", "zanahorias"],
  carrots: ["zanahoria", "zanahorias"],
  bone: ["hueso", "huesos"],
  bones: ["hueso", "huesos"],
  candy: ["dulce", "dulces"],
  candies: ["dulce", "dulces"],
  bug: ["bicho", "bichos"],
  bugs: ["bicho", "bichos"],
};

const FEMININE = new Set(["serpiente", "zanahoria", "manzana", "estrella", "galleta", "rana", "bolsa", "pelota"]);

/** English plural helper stays put. Spanish uses real singular and plural. */
export function thingName(name: string, n: number, english: string): string {
  if (locale !== "es") return english;
  const pair = NOUNS[name];
  if (!pair) return english;
  return n === 1 ? pair[0] : pair[1];
}

/** English vowel labels such as "short i". Letter patterns stay as written. */
export function patternName(label: string): string {
  if (locale !== "es") return label;
  const short = /^short ([aeiou])$/.exec(label);
  if (short?.[1]) return `${short[1]} corta`;
  return label;
}

const COIN_ES: Record<string, { one: string; many: string }> = {
  penny: { one: "centavo", many: "centavos" },
  nickel: { one: "níquel", many: "níqueles" },
  dime: { one: "moneda de 10", many: "monedas de 10" },
  quarter: { one: "moneda de 25", many: "monedas de 25" },
  dollar: { one: "dólar", many: "dólares" },
};

export function coinWord(kind: string, n = 1): string {
  if (locale !== "es") return kind;
  const row = COIN_ES[kind];
  if (!row) return kind;
  return n === 1 ? row.one : row.many;
}

export function coinButton(kind: string, english: string): string {
  if (locale !== "es") return english;
  const row = COIN_ES[kind];
  if (!row) return english;
  const word = row.one;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** "a nickel" / "un níquel" for praise lines. */
export function coinAsA(kind: string, englishLower: string): string {
  if (locale !== "es") return `a ${englishLower}`;
  switch (kind) {
    case "penny":
      return "un centavo";
    case "nickel":
      return "un níquel";
    case "dime":
      return "una moneda de 10";
    case "quarter":
      return "una moneda de 25";
    case "dollar":
      return "un dólar";
    default:
      return englishLower;
  }
}

const ES_ONES = [
  "cero",
  "uno",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
  "once",
  "doce",
  "trece",
  "catorce",
  "quince",
  "dieciséis",
  "diecisiete",
  "dieciocho",
  "diecinueve",
] as const;

const ES_TENS = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"] as const;

const ES_HUNDREDS = [
  "",
  "ciento",
  "doscientos",
  "trescientos",
  "cuatrocientos",
  "quinientos",
  "seiscientos",
  "setecientos",
  "ochocientos",
  "novecientos",
] as const;

function esUnder100(n: number): string {
  if (n < 20) return ES_ONES[n] ?? String(n);
  if (n < 30) {
    switch (n) {
      case 20:
        return "veinte";
      case 21:
        return "veintiuno";
      case 22:
        return "veintidós";
      case 23:
        return "veintitrés";
      case 26:
        return "veintiséis";
      default:
        return `veinti${ES_ONES[n - 20] ?? ""}`;
    }
  }
  const tens = ES_TENS[Math.floor(n / 10)] ?? "";
  const ones = n % 10;
  return ones ? `${tens} y ${ES_ONES[ones]}` : tens;
}

/** Cardinal for a clip. 100 is "cien"; 101 is "ciento uno". */
export function spanishNumberWords(n: number): string {
  if (!Number.isInteger(n) || n < 0) return String(n);
  if (n < 100) return esUnder100(n);
  if (n === 100) return "cien";
  if (n < 1000) {
    const hundreds = ES_HUNDREDS[Math.floor(n / 100)] ?? "";
    const rest = n % 100;
    return rest ? `${hundreds} ${esUnder100(rest)}` : hundreds;
  }
  if (n === 1000) return "mil";
  return String(n);
}

/** Fraction speech with no slash: "un medio", "dos tercios". */
export function spanishFraction(num: number, den: number): string {
  const head = num === 1 ? "un" : spanishNumberWords(num);
  const forms: Record<number, [string, string]> = {
    2: ["medio", "medios"],
    3: ["tercio", "tercios"],
    4: ["cuarto", "cuartos"],
    6: ["sexto", "sextos"],
    5: ["quinto", "quintos"],
    8: ["octavo", "octavos"],
    10: ["décimo", "décimos"],
    12: ["doceavo", "doceavos"],
  };
  const pair = forms[den];
  if (!pair) return `${num} de ${den}`;
  return `${head} ${num === 1 ? pair[0] : pair[1]}`;
}

/** "Peach the sweet" / "Peach, la dulce," */
export function starLead(name: string, trait: string): string {
  return t(`${name} the ${trait}`, `${name}, ${TRAIT_ES[trait] ?? trait},`);
}

export function gamePill(title: string, num: number): string {
  return t(`${title} · Level ${num}`, `${show(title)} · Nivel ${num}`);
}

/** "cuántos plátanos" or "cuántas zanahorias" in a how-many-more question. */
export function howManyMorePhrase(name: string, englishPlural: string): string {
  if (locale !== "es") return englishPlural;
  const one = thingName(name, 1, name);
  const word = thingName(name, 2, englishPlural);
  const lead = FEMININE.has(one) ? "Cuántas" : "Cuántos";
  return `${lead} ${word}`;
}

/** "bananas" / "cuántos plátanos" or "cuántas zanahorias". */
export function howManyPhrase(name: string, n: number, englishPlural: string): string {
  if (locale !== "es") return englishPlural;
  const one = thingName(name, 1, name);
  const word = thingName(name, Math.max(n, 2), englishPlural);
  const lead = FEMININE.has(one) ? "Cuántas" : "Cuántos";
  return `${lead} ${word}`;
}

export function longShort(long: boolean): string {
  if (locale !== "es") return long ? "longest" : "shortest";
  return long ? "más largo" : "más corto";
}

/** Adjective agrees with the Spanish noun. English stays "longest" / "shortest". */
export function longShortOf(name: string, long: boolean): string {
  if (locale !== "es") return long ? "longest" : "shortest";
  const word = thingName(name, 1, name);
  const fem = FEMININE.has(word);
  if (long) return fem ? "más larga" : "más largo";
  return fem ? "más corta" : "más corto";
}

export function spanishMinuteWords(minutes: number): string {
  if (minutes === 0) return "en punto";
  if (minutes === 15) return "y cuarto";
  if (minutes === 30) return "y media";
  if (minutes === 45) return "y cuarenta y cinco";
  return `y ${spanishNumberWords(minutes)}`;
}
