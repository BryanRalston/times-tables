import { WEEKDAY_LETTERS, WEEKDAY_NAMES, gradeLabel, type Grade } from "./model";
import { ES, TRAIT_ES, type BossEs, type PersonaEs } from "./i18n-es";

export type Locale = "en" | "es" | "pt" | "fr" | "zh" | "hi";

export interface PortuguesePack {
  PT: Record<string, string>;
  PERSONA_PT: Record<string, PersonaEs>;
  PERSONA_FALLBACK_PT: PersonaEs;
  BOSS_PT: Record<string, BossEs>;
  TRAIT_PT: Record<string, string>;
}

let locale: Locale = "en";
let portuguesePack: PortuguesePack | null = null;
let portugueseLoad: Promise<void> | null = null;
let frenchPack: FrenchPack | null = null;
let frenchLoad: Promise<void> | null = null;
let chinesePack: ChinesePack | null = null;
let chineseLoad: Promise<void> | null = null;
let hindiPack: HindiPack | null = null;
let hindiLoad: Promise<void> | null = null;

export interface HindiPack {
  HI: Record<string, string>;
  PERSONA_HI: Record<string, PersonaEs>;
  PERSONA_FALLBACK_HI: PersonaEs;
  BOSS_HI: Record<string, BossEs>;
  TRAIT_HI: Record<string, string>;
}

export interface ChinesePack {
  ZH: Record<string, string>;
  PERSONA_ZH: Record<string, PersonaEs>;
  PERSONA_FALLBACK_ZH: PersonaEs;
  BOSS_ZH: Record<string, BossEs>;
  TRAIT_ZH: Record<string, string>;
}

export interface FrenchPack {
  FR: Record<string, string>;
  PERSONA_FR: Record<string, PersonaEs>;
  PERSONA_FALLBACK_FR: PersonaEs;
  BOSS_FR: Record<string, BossEs>;
  TRAIT_FR: Record<string, string>;
}

export function getLocale(): Locale {
  return locale;
}

export function setLocale(next: Locale): void {
  locale = next === "es" || next === "pt" || next === "fr" || next === "zh" || next === "hi" ? next : "en";
  if (typeof document !== "undefined") {
    document.documentElement.lang =
      locale === "es" ? "es" : locale === "pt" ? "pt-BR" : locale === "fr" ? "fr" : locale === "zh" ? "zh-Hans" : locale === "hi" ? "hi" : "en";
    if (locale === "zh") ensureChineseFont();
    if (locale === "hi") ensureHindiFont();
  }
}

/** The full Hindi face loads only after Hindi is chosen. The picker uses a small Devanagari subset. */
function ensureHindiFont(): void {
  if (document.getElementById("hi-font")) return;
  const base = import.meta.env.BASE_URL || "/";
  const prefix = base.endsWith("/") ? base : `${base}/`;
  const link = document.createElement("link");
  link.id = "hi-font";
  link.rel = "stylesheet";
  link.href = `${prefix}fonts/hi.css`;
  document.head.appendChild(link);
}

/** The full Chinese face loads only after Chinese is chosen. The picker uses a two-character subset. */
function ensureChineseFont(): void {
  if (document.getElementById("zh-font")) return;
  const base = import.meta.env.BASE_URL || "/";
  const prefix = base.endsWith("/") ? base : `${base}/`;
  const link = document.createElement("link");
  link.id = "zh-font";
  link.rel = "stylesheet";
  link.href = `${prefix}fonts/zh.css`;
  document.head.appendChild(link);
}

/** The Portuguese table is a separate chunk. English and Spanish do not download it. */
export function installPortuguese(pack: PortuguesePack): void {
  portuguesePack = pack;
}

export function portugueseReady(): boolean {
  return portuguesePack != null;
}

export function loadPortuguese(): Promise<void> {
  if (portuguesePack) return Promise.resolve();
  if (!portugueseLoad) {
    portugueseLoad = import("./i18n-pt").then((mod) => {
      installPortuguese(mod);
    });
  }
  return portugueseLoad;
}

/** The French table is a separate chunk. English, Spanish, and Portuguese do not download it. */
export function installFrench(pack: FrenchPack): void {
  frenchPack = pack;
}

export function frenchReady(): boolean {
  return frenchPack != null;
}

export function loadFrench(): Promise<void> {
  if (frenchPack) return Promise.resolve();
  if (!frenchLoad) {
    frenchLoad = import("./i18n-fr").then((mod) => {
      installFrench(mod);
    });
  }
  return frenchLoad;
}

/** The Chinese table is a separate chunk. The first visit does not download it. */
export function installChinese(pack: ChinesePack): void {
  chinesePack = pack;
}

export function chineseReady(): boolean {
  return chinesePack != null;
}

export function loadChinese(): Promise<void> {
  if (chinesePack) return Promise.resolve();
  if (!chineseLoad) {
    chineseLoad = import("./i18n-zh").then((mod) => {
      installChinese(mod);
    });
  }
  return chineseLoad;
}

/** The Hindi table is a separate chunk. The first visit does not download it. */
export function installHindi(pack: HindiPack): void {
  hindiPack = pack;
}

export function hindiReady(): boolean {
  return hindiPack != null;
}

export function loadHindi(): Promise<void> {
  if (hindiPack) return Promise.resolve();
  if (!hindiLoad) {
    hindiLoad = import("./i18n-hi").then((mod) => {
      installHindi(mod);
    });
  }
  return hindiLoad;
}

export function loadLocalePack(lang: Locale): Promise<void> {
  if (lang === "pt") return loadPortuguese();
  if (lang === "fr") return loadFrench();
  if (lang === "zh") return loadChinese();
  if (lang === "hi") return loadHindi();
  return Promise.resolve();
}

export function localePackReady(lang: Locale): boolean {
  if (lang === "pt") return portugueseReady();
  if (lang === "fr") return frenchReady();
  if (lang === "zh") return chineseReady();
  if (lang === "hi") return hindiReady();
  return true;
}

/** First visit on a Spanish browser. English stays the default until the child picks. */
export function prefersSpanish(): boolean {
  if (typeof navigator === "undefined") return false;
  const lang = (navigator.languages?.[0] || navigator.language || "").toLowerCase();
  return lang.startsWith("es");
}

/** First visit on a Brazilian Portuguese browser. English stays the default until the child picks. */
export function prefersPortuguese(): boolean {
  if (typeof navigator === "undefined") return false;
  const lang = (navigator.languages?.[0] || navigator.language || "").toLowerCase();
  return lang.startsWith("pt");
}

export function t(en: string, es: string, pt?: string, fr?: string, zh?: string, hi?: string): string {
  if (locale === "es") return es;
  if (locale === "pt") return pt ?? portuguesePack?.PT[en] ?? en;
  if (locale === "fr") return fr ?? frenchPack?.FR[en] ?? en;
  if (locale === "zh") return zh ?? chinesePack?.ZH[en] ?? en;
  if (locale === "hi") return hi ?? hindiPack?.HI[en] ?? en;
  return en;
}

/** Static English copy. A missing translation falls back to the English words. */
export function show(en: string): string {
  if (locale === "es") return ES[en] ?? en;
  if (locale === "pt") return portuguesePack?.PT[en] ?? en;
  if (locale === "fr") return frenchPack?.FR[en] ?? en;
  if (locale === "zh") return chinesePack?.ZH[en] ?? en;
  if (locale === "hi") return hindiPack?.HI[en] ?? en;
  return en;
}

/** Choice ids stay English, like "6 remainder 2". Hindi reads the school word. */
export function remainderShown(text: string): string {
  if (locale !== "hi") return text;
  return text.replace(/\bremainder\b/g, "शेष");
}

export function yesDetail(detail: string): string {
  return t(`Yes! ${detail}`, `¡Sí! ${detail}`, `Sim! ${detail}`, `Oui ! ${detail}`, `对！${detail}`, `हाँ! ${detail}`);
}

export function almostDetail(detail: string): string {
  return t(`Almost! ${detail}`, `¡Casi! ${detail}`, `Quase! ${detail}`, `Presque ! ${detail}`, `差一点！${detail}`, `लगभग! ${detail}`);
}

export function yourTurnLine(prompt: string): string {
  return t(`Your turn. ${prompt}`, `Te toca. ${prompt}`, `Sua vez. ${prompt}`, `À toi. ${prompt}`, `轮到你了。${prompt}`, `अब तुम्हारी बारी। ${prompt}`);
}

/** Round size for little kids. A countdown is not part of this label. */
export function cardsRoundLabel(count: number): string {
  const n = Math.max(0, Math.floor(count));
  if (n === 1) return t("1 card", "1 tarjeta", "1 carta", "1 carte", undefined, "1 कार्ड");
  return t(`${n} cards`, `${n} tarjetas`, `${n} cartas`, `${n} cartes`, `${n}张卡片`, `${n} कार्ड`);
}

/** Card step for Pre-K, kindergarten, and grade 1. */
export function cardStepLabel(index: number, total: number): string {
  const safeTotal = Math.max(1, Math.floor(total));
  const at = Math.min(safeTotal, Math.max(1, Math.floor(index) + 1));
  return t(
    `Card ${at} of ${safeTotal}`,
    `Tarjeta ${at} de ${safeTotal}`,
    `Carta ${at} de ${safeTotal}`,
    `Carte ${at} sur ${safeTotal}`,
    `第${at}张，共${safeTotal}张`,
    `कार्ड ${at}, कुल ${safeTotal}`,
  );
}

export function gradeText(grade: Grade): string {
  if (locale === "hi") {
    switch (grade) {
      case "PK":
        return "नर्सरी";
      case "K":
        return "केजी";
      case "1":
        return "कक्षा 1";
      case "2":
        return "कक्षा 2";
      case "3":
        return "कक्षा 3";
      case "4":
        return "कक्षा 4";
      default: {
        const neverGrade: never = grade;
        return neverGrade;
      }
    }
  }
  if (locale === "zh") {
    switch (grade) {
      case "PK":
        return "学前班";
      case "K":
        return "幼儿园";
      case "1":
        return "一年级";
      case "2":
        return "二年级";
      case "3":
        return "三年级";
      case "4":
        return "四年级";
      default: {
        const neverGrade: never = grade;
        return neverGrade;
      }
    }
  }
  if (locale === "fr") {
    switch (grade) {
      case "PK":
        return "Maternelle";
      case "K":
        return "Grande section";
      case "1":
        return "CP";
      case "2":
        return "CE1";
      case "3":
        return "CE2";
      case "4":
        return "CM1";
      default: {
        const neverGrade: never = grade;
        return neverGrade;
      }
    }
  }
  if (locale === "pt") {
    if (grade === "PK") return "Pré-escola";
    if (grade === "K") return "Jardim";
    return `${grade}.º ano`;
  }
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
  if (locale === "hi") return ["सो", "मं", "बु", "गु", "शु", "श", "र"][index] ?? "";
  if (locale === "zh") return ["一", "二", "三", "四", "五", "六", "日"][index] ?? "";
  if (locale === "fr") return ["L", "M", "M", "J", "V", "S", "D"][index] ?? "";
  if (locale === "pt") return ["S", "T", "Q", "Q", "S", "S", "D"][index] ?? "";
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

const SHAPES_PT: Record<string, { one: string; article: string }> = {
  circle: { one: "círculo", article: "o" },
  triangle: { one: "triângulo", article: "o" },
  square: { one: "quadrado", article: "o" },
  rectangle: { one: "retângulo", article: "o" },
  pentagon: { one: "pentágono", article: "o" },
  hexagon: { one: "hexágono", article: "o" },
  cube: { one: "cubo", article: "o" },
  sphere: { one: "esfera", article: "a" },
  cone: { one: "cone", article: "o" },
  cylinder: { one: "cilindro", article: "o" },
};

const SHAPES_FR: Record<string, { one: string; article: string }> = {
  circle: { one: "cercle", article: "le" },
  triangle: { one: "triangle", article: "le" },
  square: { one: "carré", article: "le" },
  rectangle: { one: "rectangle", article: "le" },
  pentagon: { one: "pentagone", article: "le" },
  hexagon: { one: "hexagone", article: "l'" },
  cube: { one: "cube", article: "le" },
  sphere: { one: "sphère", article: "la" },
  cone: { one: "cône", article: "le" },
  cylinder: { one: "cylindre", article: "le" },
};

const SHAPES_ZH: Record<string, string> = {
  circle: "圆形",
  triangle: "三角形",
  square: "正方形",
  rectangle: "长方形",
  pentagon: "五边形",
  hexagon: "六边形",
  cube: "正方体",
  sphere: "球体",
  cone: "圆锥",
  cylinder: "圆柱",
};

const SHAPES_HI: Record<string, string> = {
  circle: "वृत्त",
  triangle: "त्रिभुज",
  square: "वर्ग",
  rectangle: "आयत",
  pentagon: "पंचभुज",
  hexagon: "षट्भुज",
  cube: "घन",
  sphere: "गोला",
  cone: "शंकु",
  cylinder: "बेलन",
};

export function shapeWord(id: string): string {
  if (locale === "hi") return SHAPES_HI[id] ?? id;
  if (locale === "zh") return SHAPES_ZH[id] ?? id;
  if (locale === "fr") return SHAPES_FR[id]?.one ?? id;
  if (locale === "pt") return SHAPES_PT[id]?.one ?? id;
  if (locale !== "es") return id;
  return SHAPES[id]?.one ?? id;
}

export function shapeWithArticle(id: string): string {
  if (locale === "hi") return SHAPES_HI[id] ?? id;
  if (locale === "zh") return SHAPES_ZH[id] ?? id;
  if (locale === "fr") {
    const row = SHAPES_FR[id];
    if (!row) return id;
    return row.article.endsWith("'") ? `${row.article}${row.one}` : `${row.article} ${row.one}`;
  }
  if (locale === "pt") {
    const row = SHAPES_PT[id];
    if (!row) return id;
    return `${row.article} ${row.one}`;
  }
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

const PARTS_PT: Record<string, string> = {
  halves: "as metades",
  thirds: "os terços",
  fourths: "os quartos",
  unequal: "as partes que não são iguais",
  "not equal": "que não são iguais",
};

const PARTS_FR: Record<string, string> = {
  halves: "les moitiés",
  thirds: "les tiers",
  fourths: "les quarts",
  unequal: "les parties qui ne sont pas égales",
  "not equal": "qui ne sont pas égales",
};

const PARTS_ZH: Record<string, string> = {
  halves: "二分之一",
  thirds: "三分之一",
  fourths: "四分之一",
  unequal: "不相等的部分",
  "not equal": "不相等",
};

const PARTS_HI: Record<string, string> = {
  halves: "आधे भाग",
  thirds: "तिहाई",
  fourths: "चौथाई",
  unequal: "बराबर नहीं भाग",
  "not equal": "जो बराबर नहीं",
};

export function partPhrase(id: string): string {
  if (locale === "hi") return PARTS_HI[id] ?? id;
  if (locale === "zh") return PARTS_ZH[id] ?? id;
  if (locale === "fr") return PARTS_FR[id] ?? id;
  if (locale === "pt") return PARTS_PT[id] ?? id;
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

const NOUNS_PT: Record<string, [string, string]> = {
  apple: ["maçã", "maçãs"],
  apples: ["maçã", "maçãs"],
  fish: ["peixe", "peixes"],
  star: ["estrela", "estrelas"],
  stars: ["estrela", "estrelas"],
  cookie: ["biscoito", "biscoitos"],
  cookies: ["biscoito", "biscoitos"],
  frog: ["sapo", "sapos"],
  frogs: ["sapo", "sapos"],
  bag: ["sacola", "sacolas"],
  bags: ["sacola", "sacolas"],
  cat: ["gato", "gatos"],
  cats: ["gato", "gatos"],
  dog: ["cachorro", "cachorros"],
  dogs: ["cachorro", "cachorros"],
  squishee: ["squishee", "squishees"],
  squishees: ["squishee", "squishees"],
  ball: ["bola", "bolas"],
  balls: ["bola", "bolas"],
  banana: ["banana", "bananas"],
  bananas: ["banana", "bananas"],
  snake: ["cobra", "cobras"],
  snakes: ["cobra", "cobras"],
  carrot: ["cenoura", "cenouras"],
  carrots: ["cenoura", "cenouras"],
  bone: ["osso", "ossos"],
  bones: ["osso", "ossos"],
  candy: ["doce", "doces"],
  candies: ["doce", "doces"],
  bug: ["bichinho", "bichinhos"],
  bugs: ["bichinho", "bichinhos"],
};

const FEMININE_PT = new Set(["maçã", "estrela", "sacola", "bola", "banana", "cobra", "cenoura"]);

const NOUNS_FR: Record<string, [string, string]> = {
  apple: ["pomme", "pommes"],
  apples: ["pomme", "pommes"],
  fish: ["poisson", "poissons"],
  star: ["étoile", "étoiles"],
  stars: ["étoile", "étoiles"],
  cookie: ["biscuit", "biscuits"],
  cookies: ["biscuit", "biscuits"],
  frog: ["grenouille", "grenouilles"],
  frogs: ["grenouille", "grenouilles"],
  bag: ["sac", "sacs"],
  bags: ["sac", "sacs"],
  cat: ["chat", "chats"],
  cats: ["chat", "chats"],
  dog: ["chien", "chiens"],
  dogs: ["chien", "chiens"],
  squishee: ["squishee", "squishees"],
  squishees: ["squishee", "squishees"],
  ball: ["balle", "balles"],
  balls: ["balle", "balles"],
  banana: ["banane", "bananes"],
  bananas: ["banane", "bananes"],
  snake: ["serpent", "serpents"],
  snakes: ["serpent", "serpents"],
  carrot: ["carotte", "carottes"],
  carrots: ["carotte", "carottes"],
  bone: ["os", "os"],
  bones: ["os", "os"],
  candy: ["bonbon", "bonbons"],
  candies: ["bonbon", "bonbons"],
  bug: ["insecte", "insectes"],
  bugs: ["insecte", "insectes"],
};

const FEMININE_FR = new Set(["pomme", "étoile", "grenouille", "balle", "banane", "carotte"]);

/** Noun plus the measure word used in 有几只 / 有几个. */
const NOUNS_ZH: Record<string, [string, string]> = {
  apple: ["苹果", "个"],
  apples: ["苹果", "个"],
  fish: ["鱼", "条"],
  star: ["星星", "颗"],
  stars: ["星星", "颗"],
  cookie: ["饼干", "块"],
  cookies: ["饼干", "块"],
  frog: ["青蛙", "只"],
  frogs: ["青蛙", "只"],
  bag: ["袋子", "个"],
  bags: ["袋子", "个"],
  cat: ["猫", "只"],
  cats: ["猫", "只"],
  dog: ["狗", "只"],
  dogs: ["狗", "只"],
  squishee: ["squishee", "个"],
  squishees: ["squishee", "个"],
  ball: ["球", "个"],
  balls: ["球", "个"],
  banana: ["香蕉", "根"],
  bananas: ["香蕉", "根"],
  snake: ["蛇", "条"],
  snakes: ["蛇", "条"],
  carrot: ["胡萝卜", "根"],
  carrots: ["胡萝卜", "根"],
  bone: ["骨头", "根"],
  bones: ["骨头", "根"],
  candy: ["糖果", "颗"],
  candies: ["糖果", "颗"],
  bug: ["虫子", "只"],
  bugs: ["虫子", "只"],
};

/** "3条鱼". Used only inside Chinese sentences. */
export function countedNoun(name: string, n: number): string {
  const row = NOUNS_ZH[name];
  if (!row) return `${n}个${name}`;
  return `${n}${row[1]}${row[0]}`;
}

export function nounMeasure(name: string): string {
  return NOUNS_ZH[name]?.[1] ?? "个";
}

/** singular, plural, gender. Used only for Hindi agreement. */
const NOUNS_HI: Record<string, [string, string, "m" | "f"]> = {
  apple: ["सेब", "सेब", "m"],
  apples: ["सेब", "सेब", "m"],
  fish: ["मछली", "मछलियाँ", "f"],
  star: ["तारा", "तारे", "m"],
  stars: ["तारा", "तारे", "m"],
  cookie: ["बिस्कुट", "बिस्कुट", "m"],
  cookies: ["बिस्कुट", "बिस्कुट", "m"],
  frog: ["मेंढक", "मेंढक", "m"],
  frogs: ["मेंढक", "मेंढक", "m"],
  bag: ["थैला", "थैले", "m"],
  bags: ["थैला", "थैले", "m"],
  cat: ["बिल्ली", "बिल्लियाँ", "f"],
  cats: ["बिल्ली", "बिल्लियाँ", "f"],
  dog: ["कुत्ता", "कुत्ते", "m"],
  dogs: ["कुत्ता", "कुत्ते", "m"],
  squishee: ["squishee", "squishees", "m"],
  squishees: ["squishee", "squishees", "m"],
  ball: ["गेंद", "गेंदें", "f"],
  balls: ["गेंद", "गेंदें", "f"],
  banana: ["केला", "केले", "m"],
  bananas: ["केला", "केले", "m"],
  snake: ["साँप", "साँप", "m"],
  snakes: ["साँप", "साँप", "m"],
  carrot: ["गाजर", "गाजरें", "f"],
  carrots: ["गाजर", "गाजरें", "f"],
  bone: ["हड्डी", "हड्डियाँ", "f"],
  bones: ["हड्डी", "हड्डियाँ", "f"],
  candy: ["टॉफी", "टॉफियाँ", "f"],
  candies: ["टॉफी", "टॉफियाँ", "f"],
  bug: ["कीड़ा", "कीड़े", "m"],
  bugs: ["कीड़ा", "कीड़े", "m"],
};

/** English plural helper stays put. Spanish, Portuguese, and French use real singular and plural. */
export function thingName(name: string, n: number, english: string): string {
  if (locale === "hi") {
    const row = NOUNS_HI[name];
    if (!row) return english;
    return n === 1 ? row[0] : row[1];
  }
  if (locale === "zh") return NOUNS_ZH[name]?.[0] ?? english;
  if (locale === "fr") {
    const pair = NOUNS_FR[name];
    if (!pair) return english;
    return n === 1 ? pair[0] : pair[1];
  }
  if (locale === "pt") {
    const pair = NOUNS_PT[name];
    if (!pair) return english;
    return n === 1 ? pair[0] : pair[1];
  }
  if (locale !== "es") return english;
  const pair = NOUNS[name];
  if (!pair) return english;
  return n === 1 ? pair[0] : pair[1];
}

/** English vowel labels such as "short i". Letter patterns stay as written. */
export function patternName(label: string): string {
  if (locale === "fr") {
    const short = /^short ([aeiou])$/.exec(label);
    if (short?.[1]) return `${short[1]} bref`;
    return label;
  }
  if (locale === "pt") {
    const short = /^short ([aeiou])$/.exec(label);
    if (short?.[1]) return `${short[1]} curto`;
    return label;
  }
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

const COIN_PT: Record<string, { one: string; many: string }> = {
  penny: { one: "centavo", many: "centavos" },
  nickel: { one: "moeda de 5", many: "moedas de 5" },
  dime: { one: "moeda de 10", many: "moedas de 10" },
  quarter: { one: "moeda de 25", many: "moedas de 25" },
  dollar: { one: "dólar", many: "dólares" },
};

const COIN_FR: Record<string, { one: string; many: string }> = {
  penny: { one: "pièce de 1 cent", many: "pièces de 1 cent" },
  nickel: { one: "pièce de 5 cents", many: "pièces de 5 cents" },
  dime: { one: "pièce de 10 cents", many: "pièces de 10 cents" },
  quarter: { one: "pièce de 25 cents", many: "pièces de 25 cents" },
  dollar: { one: "dollar", many: "dollars" },
};

const COIN_ZH: Record<string, string> = {
  penny: "1美分硬币",
  nickel: "5美分硬币",
  dime: "10美分硬币",
  quarter: "25美分硬币",
  dollar: "美元",
};

const COIN_HI: Record<string, string> = {
  penny: "1 सेंट का सिक्का",
  nickel: "5 सेंट का सिक्का",
  dime: "10 सेंट का सिक्का",
  quarter: "25 सेंट का सिक्का",
  dollar: "डॉलर",
};

export function coinWord(kind: string, n = 1): string {
  if (locale === "hi") return COIN_HI[kind] ?? kind;
  if (locale === "zh") return COIN_ZH[kind] ?? kind;
  if (locale === "fr") {
    const row = COIN_FR[kind];
    if (!row) return kind;
    return n === 1 ? row.one : row.many;
  }
  if (locale === "pt") {
    const row = COIN_PT[kind];
    if (!row) return kind;
    return n === 1 ? row.one : row.many;
  }
  if (locale !== "es") return kind;
  const row = COIN_ES[kind];
  if (!row) return kind;
  return n === 1 ? row.one : row.many;
}

export function coinButton(kind: string, english: string): string {
  if (locale === "hi") return COIN_HI[kind] ?? english;
  if (locale === "zh") return COIN_ZH[kind] ?? english;
  const row = locale === "fr" ? COIN_FR[kind] : locale === "pt" ? COIN_PT[kind] : locale === "es" ? COIN_ES[kind] : undefined;
  if (!row) return english;
  const word = row.one;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** "a nickel" / "un níquel" / "uma moeda de 5" for praise lines. */
export function coinAsA(kind: string, englishLower: string): string {
  if (locale === "hi") return COIN_HI[kind] ? `एक ${COIN_HI[kind]}` : englishLower;
  if (locale === "zh") return COIN_ZH[kind] ? `一枚${COIN_ZH[kind]}` : englishLower;
  if (locale === "fr") {
    switch (kind) {
      case "penny":
        return "une pièce de 1 cent";
      case "nickel":
        return "une pièce de 5 cents";
      case "dime":
        return "une pièce de 10 cents";
      case "quarter":
        return "une pièce de 25 cents";
      case "dollar":
        return "un dollar";
      default:
        return englishLower;
    }
  }
  if (locale === "pt") {
    switch (kind) {
      case "penny":
        return "um centavo";
      case "nickel":
        return "uma moeda de 5";
      case "dime":
        return "uma moeda de 10";
      case "quarter":
        return "uma moeda de 25";
      case "dollar":
        return "um dólar";
      default:
        return englishLower;
    }
  }
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

/** "The star is above the box" / "La estrella está arriba de la caja" / "A estrela está em cima da caixa". */
export function starPlace(place: "above" | "below" | "beside" | "behind"): string {
  switch (place) {
    case "above":
      return t("The star is above the box", "La estrella está arriba de la caja", "A estrela está em cima da caixa", "L'étoile est au-dessus de la boîte");
    case "below":
      return t("The star is below the box", "La estrella está abajo de la caja", "A estrela está embaixo da caixa", "L'étoile est en dessous de la boîte");
    case "beside":
      return t("The star is beside the box", "La estrella está al lado de la caja", "A estrela está ao lado da caixa", "L'étoile est à côté de la boîte");
    case "behind":
      return t("The star is behind the box", "La estrella está detrás de la caja", "A estrela está atrás da caixa", "L'étoile est derrière la boîte");
    default: {
      const neverPlace: never = place;
      return neverPlace;
    }
  }
}

/**
 * Spanish agreement for a shaded fraction. "Medio" and "cuarto" are masculine,
 * and more than one part is plural: "dos cuartos están sombreados".
 */
export function spanishShaded(answer: string): string {
  const match = /^(\d+)\/(\d+)$/.exec(answer);
  if (!match) return `${answer} está sombreado`;
  const num = Number(match[1]);
  const den = Number(match[2]);
  const words = spanishFraction(num, den);
  const line = num === 1 ? `${words} está sombreado` : `${words} están sombreados`;
  return line.charAt(0).toUpperCase() + line.slice(1);
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

function traitWord(trait: string): string {
  if (locale === "hi") return hindiPack?.TRAIT_HI[trait] ?? trait;
  if (locale === "zh") return chinesePack?.TRAIT_ZH[trait] ?? trait;
  if (locale === "fr") return frenchPack?.TRAIT_FR[trait] ?? trait;
  if (locale === "pt") return portuguesePack?.TRAIT_PT[trait] ?? trait;
  if (locale === "es") return TRAIT_ES[trait] ?? trait;
  return trait;
}

/** "Peach the sweet" / "Peach, la dulce," / "Peach, a doce," / "Peach, la douce," */
export function starLead(name: string, trait: string): string {
  const ptTrait = locale === "pt" ? traitWord(trait) : (portuguesePack?.TRAIT_PT[trait] ?? trait);
  const frTrait = locale === "fr" ? traitWord(trait) : (frenchPack?.TRAIT_FR[trait] ?? trait);
  const zhTrait = locale === "zh" ? traitWord(trait) : (chinesePack?.TRAIT_ZH[trait] ?? trait);
  const hiTrait = locale === "hi" ? traitWord(trait) : (hindiPack?.TRAIT_HI[trait] ?? trait);
  return t(
    `${name} the ${trait}`,
    `${name}, ${TRAIT_ES[trait] ?? trait},`,
    `${name}, ${ptTrait},`,
    `${name}, ${frTrait},`,
    `${name}，${zhTrait}，`,
    `${name}, ${hiTrait},`,
  );
}

export function gamePill(title: string, num: number): string {
  return t(
    `${title} · Level ${num}`,
    `${show(title)} · Nivel ${num}`,
    `${show(title)} · Nível ${num}`,
    `${show(title)} · Niveau ${num}`,
    `${show(title)} · 第${num}关`,
    `${show(title)} · स्तर ${num}`,
  );
}

/** French elides de/que before a vowel: d'os, qu'étoiles. Combien stays invariable. */
function frenchVowelStart(word: string): boolean {
  return /^[aeiouàâäéèêëîïôùûüœæh]/i.test(word);
}

/** "que pommes" or "qu'os". */
export function frenchThan(word: string): string {
  return frenchVowelStart(word) ? `qu'${word}` : `que ${word}`;
}

/** "de pommes" or "d'os". */
export function frenchDe(word: string): string {
  return frenchVowelStart(word) ? `d'${word}` : `de ${word}`;
}

function howManyLead(name: string, englishPlural: string, count: number): string {
  const one = thingName(name, 1, name);
  const word = thingName(name, Math.max(count, 2), englishPlural);
  if (locale === "zh") {
    const row = NOUNS_ZH[name];
    const noun = row?.[0] ?? word;
    const measure = row?.[1] ?? "个";
    return `有几${measure}${noun}`;
  }
  if (locale === "hi") {
    const row = NOUNS_HI[name];
    const noun = row ? (count === 1 ? row[0] : row[1]) : word;
    const lead = row?.[2] === "f" ? "कितनी" : "कितने";
    return `${lead} ${noun}`;
  }
  if (locale === "fr") return `Combien ${frenchDe(word)}`;
  if (locale === "pt") {
    const lead = FEMININE_PT.has(one) ? "Quantas" : "Quantos";
    return `${lead} ${word}`;
  }
  const lead = FEMININE.has(one) ? "Cuántas" : "Cuántos";
  return `${lead} ${word}`;
}

/** "cuántos plátanos" or "quantas cenouras" in a how-many-more question. */
export function howManyMorePhrase(name: string, englishPlural: string): string {
  if (locale !== "es" && locale !== "pt" && locale !== "fr" && locale !== "zh" && locale !== "hi") return englishPlural;
  return howManyLead(name, englishPlural, 2);
}

/** "cuántos plátanos", "quantas cenouras", or "combien de pommes" in a how-many-less question. */
export function howManyLessPhrase(name: string, englishPlural: string): string {
  if (locale !== "es" && locale !== "pt" && locale !== "fr" && locale !== "zh" && locale !== "hi") return englishPlural;
  return howManyLead(name, englishPlural, 2);
}

/** True when the noun uses feminine agreement. English is never feminine here. */
export function nounIsFeminine(name: string): boolean {
  const one = thingName(name, 1, name);
  if (locale === "hi") return NOUNS_HI[name]?.[2] === "f" || NOUNS_HI[one]?.[2] === "f";
  if (locale === "fr") return FEMININE_FR.has(one);
  if (locale === "pt") return FEMININE_PT.has(one);
  if (locale === "es") return FEMININE.has(one);
  return false;
}

/** "bananas" / "cuántos plátanos" or "quantas cenouras". */
export function howManyPhrase(name: string, n: number, englishPlural: string): string {
  if (locale !== "es" && locale !== "pt" && locale !== "fr" && locale !== "zh" && locale !== "hi") return englishPlural;
  return howManyLead(name, englishPlural, n);
}

export function longShort(long: boolean): string {
  if (locale === "hi") return long ? "सबसे लंबा" : "सबसे छोटा";
  if (locale === "zh") return long ? "最长" : "最短";
  if (locale === "fr") return long ? "le plus long" : "le plus court";
  if (locale === "pt") return long ? "mais comprido" : "mais curto";
  if (locale !== "es") return long ? "longest" : "shortest";
  return long ? "más largo" : "más corto";
}

/** Adjective agrees with the noun. English stays "longest" / "shortest". */
export function longShortOf(name: string, long: boolean): string {
  if (locale === "hi") {
    const fem = nounIsFeminine(name);
    if (long) return fem ? "सबसे लंबी" : "सबसे लंबा";
    return fem ? "सबसे छोटी" : "सबसे छोटा";
  }
  if (locale === "zh") return long ? "最长" : "最短";
  if (locale === "fr") {
    const word = thingName(name, 1, name);
    const fem = FEMININE_FR.has(word);
    if (long) return fem ? "la plus longue" : "le plus long";
    return fem ? "la plus courte" : "le plus court";
  }
  if (locale === "pt") {
    const word = thingName(name, 1, name);
    const fem = FEMININE_PT.has(word);
    if (long) return fem ? "mais comprida" : "mais comprido";
    return fem ? "mais curta" : "mais curto";
  }
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

const PT_ONES = [
  "zero",
  "um",
  "dois",
  "três",
  "quatro",
  "cinco",
  "seis",
  "sete",
  "oito",
  "nove",
  "dez",
  "onze",
  "doze",
  "treze",
  "quatorze",
  "quinze",
  "dezesseis",
  "dezessete",
  "dezoito",
  "dezenove",
] as const;

const PT_TENS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"] as const;

const PT_HUNDREDS = [
  "",
  "cento",
  "duzentos",
  "trezentos",
  "quatrocentos",
  "quinhentos",
  "seiscentos",
  "setecentos",
  "oitocentos",
  "novecentos",
] as const;

function ptUnder100(n: number): string {
  if (n < 20) return PT_ONES[n] ?? String(n);
  const tens = PT_TENS[Math.floor(n / 10)] ?? "";
  const ones = n % 10;
  return ones ? `${tens} e ${PT_ONES[ones]}` : tens;
}

/** Cardinal for a Brazilian clip. 100 is "cem"; 101 is "cento e um". */
export function portugueseNumberWords(n: number): string {
  if (!Number.isInteger(n) || n < 0) return String(n);
  if (n < 100) return ptUnder100(n);
  if (n === 100) return "cem";
  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    if (!rest) return hundreds === 1 ? "cem" : (PT_HUNDREDS[hundreds] ?? String(n));
    const head = PT_HUNDREDS[hundreds] ?? "";
    return `${head} e ${ptUnder100(rest)}`;
  }
  if (n === 1000) return "mil";
  return String(n);
}

/**
 * Portuguese agreement for a shaded fraction. "Meio" and "quarto" are masculine,
 * and more than one part is plural: "dois quartos estão pintados".
 */
export function portugueseShaded(answer: string): string {
  const match = /^(\d+)\/(\d+)$/.exec(answer);
  if (!match) return `${answer} está pintado`;
  const num = Number(match[1]);
  const den = Number(match[2]);
  const words = portugueseFraction(num, den);
  const line = num === 1 ? `${words} está pintado` : `${words} estão pintados`;
  return line.charAt(0).toUpperCase() + line.slice(1);
}

/** Fraction speech with no slash: "um meio", "dois terços". */
export function portugueseFraction(num: number, den: number): string {
  const head = num === 1 ? "um" : portugueseNumberWords(num);
  const forms: Record<number, [string, string]> = {
    2: ["meio", "meios"],
    3: ["terço", "terços"],
    4: ["quarto", "quartos"],
    6: ["sexto", "sextos"],
    5: ["quinto", "quintos"],
    8: ["oitavo", "oitavos"],
    10: ["décimo", "décimos"],
    12: ["doze avos", "doze avos"],
  };
  const pair = forms[den];
  if (!pair) return `${num} de ${den}`;
  return `${head} ${num === 1 ? pair[0] : pair[1]}`;
}

export function portugueseMinuteWords(minutes: number): string {
  if (minutes === 0) return "em ponto";
  if (minutes === 15) return "e um quarto";
  if (minutes === 30) return "e meia";
  if (minutes === 45) return "e quarenta e cinco";
  return `e ${portugueseNumberWords(minutes)}`;
}

const FR_UNDER_20 = [
  "zéro",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
  "dix-sept",
  "dix-huit",
  "dix-neuf",
] as const;

function frenchUnder100(n: number): string {
  if (n < 20) return FR_UNDER_20[n] ?? String(n);
  if (n < 70) {
    const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"][Math.floor(n / 10)] ?? "";
    const ones = n % 10;
    if (ones === 0) return tens;
    if (ones === 1) return `${tens} et un`;
    return `${tens}-${FR_UNDER_20[ones]}`;
  }
  if (n < 80) {
    if (n === 71) return "soixante et onze";
    return `soixante-${FR_UNDER_20[n - 60]}`;
  }
  if (n === 80) return "quatre-vingts";
  return `quatre-vingt-${FR_UNDER_20[n - 80]}`;
}

/** Cardinal for a French clip. 80 is "quatre-vingts"; 81 is "quatre-vingt-un". 200 is "deux cents"; 201 is "deux cent un". */
export function frenchNumberWords(n: number): string {
  if (!Number.isInteger(n) || n < 0) return String(n);
  if (n < 100) return frenchUnder100(n);
  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    const head = hundreds === 1 ? "cent" : `${frenchNumberWords(hundreds)} cent`;
    if (!rest) return hundreds === 1 ? "cent" : `${head}s`;
    return `${head} ${frenchUnder100(rest)}`;
  }
  if (n === 1000) return "mille";
  return String(n);
}

/**
 * French agreement for a shaded fraction. "Demi" and "quart" are masculine,
 * and more than one part is plural: "deux quarts sont coloriés".
 */
export function frenchShaded(answer: string): string {
  const match = /^(\d+)\/(\d+)$/.exec(answer);
  if (!match) return `${answer} est colorié`;
  const num = Number(match[1]);
  const den = Number(match[2]);
  const words = frenchFraction(num, den);
  const line = num === 1 ? `${words} est colorié` : `${words} sont coloriés`;
  return line.charAt(0).toUpperCase() + line.slice(1);
}

/** Fraction speech with no slash: "un demi", "deux quarts". */
export function frenchFraction(num: number, den: number): string {
  const head = num === 1 ? "un" : frenchNumberWords(num);
  const forms: Record<number, [string, string]> = {
    2: ["demi", "demis"],
    3: ["tiers", "tiers"],
    4: ["quart", "quarts"],
    5: ["cinquième", "cinquièmes"],
    6: ["sixième", "sixièmes"],
    8: ["huitième", "huitièmes"],
    10: ["dixième", "dixièmes"],
    12: ["douzième", "douzièmes"],
  };
  const pair = forms[den];
  if (!pair) return `${num} sur ${den}`;
  return `${head} ${num === 1 ? pair[0] : pair[1]}`;
}

export function frenchMinuteWords(minutes: number): string {
  if (minutes === 0) return "pile";
  if (minutes === 15) return "et quart";
  if (minutes === 30) return "et demie";
  if (minutes === 45) return "moins le quart";
  return `et ${frenchNumberWords(minutes)}`;
}

export function portuguesePersona(id: string, known: boolean): PersonaEs | null {
  if (!portuguesePack) return null;
  return known ? (portuguesePack.PERSONA_PT[id] ?? null) : portuguesePack.PERSONA_FALLBACK_PT;
}

export function portugueseBoss(gameId: string): BossEs | null {
  return portuguesePack?.BOSS_PT[gameId] ?? null;
}

export function frenchPersona(id: string, known: boolean): PersonaEs | null {
  if (!frenchPack) return null;
  return known ? (frenchPack.PERSONA_FR[id] ?? null) : frenchPack.PERSONA_FALLBACK_FR;
}

export function frenchBoss(gameId: string): BossEs | null {
  return frenchPack?.BOSS_FR[gameId] ?? null;
}

const ZH_DIGIT = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"] as const;

function chineseUnder100(n: number): string {
  if (n < 10) return ZH_DIGIT[n] ?? String(n);
  if (n === 10) return "十";
  if (n < 20) return `十${ZH_DIGIT[n - 10] ?? ""}`;
  const tens = ZH_DIGIT[Math.floor(n / 10)] ?? "";
  const ones = n % 10;
  return ones ? `${tens}十${ZH_DIGIT[ones]}` : `${tens}十`;
}

/** Mainland school reading. 2 is 二, 200 is 二百, 2000 is 两千, 101 is 一百零一. */
export function chineseNumberWords(n: number): string {
  if (!Number.isInteger(n) || n < 0) return String(n);
  if (n < 100) return chineseUnder100(n);
  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    const head = `${ZH_DIGIT[hundreds]}百`;
    if (!rest) return head;
    if (rest < 10) return `${head}零${ZH_DIGIT[rest]}`;
    return `${head}${chineseUnder100(rest)}`;
  }
  if (n < 10000) {
    const thousands = Math.floor(n / 1000);
    const head = `${thousands === 2 ? "两" : ZH_DIGIT[thousands]}千`;
    const rest = n % 1000;
    if (!rest) return head;
    if (rest < 100) return `${head}零${chineseNumberWords(rest)}`;
    return `${head}${chineseNumberWords(rest)}`;
  }
  return String(n);
}

export function chineseFraction(num: number, den: number): string {
  if (!Number.isInteger(num) || !Number.isInteger(den) || den <= 0) return `${num}/${den}`;
  return `${chineseNumberWords(den)}分之${chineseNumberWords(num)}`;
}

export function chineseMinuteWords(minutes: number): string {
  if (minutes === 0) return "点整";
  if (minutes === 15) return "点一刻";
  if (minutes === 30) return "点半";
  if (minutes === 45) return "差一刻";
  return `点${chineseNumberWords(minutes)}分`;
}

export function chinesePersona(id: string, known: boolean): PersonaEs | null {
  if (!chinesePack) return null;
  return known ? (chinesePack.PERSONA_ZH[id] ?? null) : chinesePack.PERSONA_FALLBACK_ZH;
}

export function chineseBoss(gameId: string): BossEs | null {
  return chinesePack?.BOSS_ZH[gameId] ?? null;
}

const HI_UNDER_100 = [
  "शून्य", "एक", "दो", "तीन", "चार", "पाँच", "छह", "सात", "आठ", "नौ",
  "दस", "ग्यारह", "बारह", "तेरह", "चौदह", "पंद्रह", "सोलह", "सत्रह", "अठारह", "उन्नीस",
  "बीस", "इक्कीस", "बाईस", "तेईस", "चौबीस", "पच्चीस", "छब्बीस", "सत्ताईस", "अट्ठाईस", "उनतीस",
  "तीस", "इकतीस", "बत्तीस", "तैंतीस", "चौंतीस", "पैंतीस", "छत्तीस", "सैंतीस", "अड़तीस", "उनतालीस",
  "चालीस", "इकतालीस", "बयालीस", "तैंतालीस", "चौवालीस", "पैंतालीस", "छियालीस", "सैंतालीस", "अड़तालीस", "उनचास",
  "पचास", "इक्यावन", "बावन", "तिरपन", "चौवन", "पचपन", "छप्पन", "सत्तावन", "अट्ठावन", "उनसठ",
  "साठ", "इकसठ", "बासठ", "तिरसठ", "चौंसठ", "पैंसठ", "छियासठ", "सड़सठ", "अड़सठ", "उनहत्तर",
  "सत्तर", "इकहत्तर", "बहत्तर", "तिहत्तर", "चौहत्तर", "पचहत्तर", "छिहत्तर", "सतहत्तर", "अठहत्तर", "उन्यासी",
  "अस्सी", "इक्यासी", "बयासी", "तिरासी", "चौरासी", "पचासी", "छियासी", "सत्तासी", "अठासी", "नवासी",
  "नब्बे", "इक्यानवे", "बानवे", "तिरानवे", "चौरानवे", "पचानवे", "छियानवे", "सत्तानवे", "अट्ठानवे", "निन्यानवे",
] as const;

/** School Hindi. 101 is एक सौ एक, 2000 is दो हज़ार, 100000 is एक लाख. */
export function hindiNumberWords(n: number): string {
  if (!Number.isInteger(n) || n < 0) return String(n);
  if (n < 100) return HI_UNDER_100[n] ?? String(n);
  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    const head = hundreds === 1 ? "एक सौ" : `${HI_UNDER_100[hundreds]} सौ`;
    return rest ? `${head} ${hindiNumberWords(rest)}` : head;
  }
  if (n < 100000) {
    const thousands = Math.floor(n / 1000);
    const rest = n % 1000;
    const head = `${hindiNumberWords(thousands)} हज़ार`;
    return rest ? `${head} ${hindiNumberWords(rest)}` : head;
  }
  if (n < 10000000) {
    const lakhs = Math.floor(n / 100000);
    const rest = n % 100000;
    const head = `${hindiNumberWords(lakhs)} लाख`;
    return rest ? `${head} ${hindiNumberWords(rest)}` : head;
  }
  return String(n);
}

/** "दो बटा तीन". One half and one quarter use the school names. */
export function hindiFraction(num: number, den: number): string {
  if (!Number.isInteger(num) || !Number.isInteger(den) || den <= 0) return `${num}/${den}`;
  if (num === 1 && den === 2) return "आधा";
  if (num === 1 && den === 4) return "एक चौथाई";
  if (num === 3 && den === 4) return "तीन चौथाई";
  return `${hindiNumberWords(num)} बटा ${hindiNumberWords(den)}`;
}

export function hindiMinuteWords(minutes: number): string {
  if (minutes === 0) return "बजे";
  if (minutes === 15) return "सवा";
  if (minutes === 30) return "साढ़े";
  if (minutes === 45) return "पौने";
  return `बजकर ${hindiNumberWords(minutes)} मिनट`;
}

export function hindiPersona(id: string, known: boolean): PersonaEs | null {
  if (!hindiPack) return null;
  return known ? (hindiPack.PERSONA_HI[id] ?? null) : hindiPack.PERSONA_FALLBACK_HI;
}

export function hindiBoss(gameId: string): BossEs | null {
  return hindiPack?.BOSS_HI[gameId] ?? null;
}
