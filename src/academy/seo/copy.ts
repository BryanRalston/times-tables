import type { Grade } from "../model";

/** Search languages. English is the x-default page, with no URL prefix. */
export type SeoLang = "en" | "es" | "pt-BR" | "fr" | "zh-Hans" | "hi" | "ar";

export interface SeoLocale {
  id: SeoLang;
  hreflang: string;
  htmlLang: string;
  dir: "ltr" | "rtl";
  /** Path prefix. Empty for English. */
  prefix: string;
}

export const SEO_LOCALES: readonly SeoLocale[] = [
  { id: "en", hreflang: "en", htmlLang: "en", dir: "ltr", prefix: "" },
  { id: "es", hreflang: "es", htmlLang: "es", dir: "ltr", prefix: "es" },
  { id: "pt-BR", hreflang: "pt-BR", htmlLang: "pt-BR", dir: "ltr", prefix: "pt-br" },
  { id: "fr", hreflang: "fr", htmlLang: "fr", dir: "ltr", prefix: "fr" },
  { id: "zh-Hans", hreflang: "zh-Hans", htmlLang: "zh-Hans", dir: "ltr", prefix: "zh-hans" },
  { id: "hi", hreflang: "hi", htmlLang: "hi", dir: "ltr", prefix: "hi" },
  { id: "ar", hreflang: "ar", htmlLang: "ar", dir: "rtl", prefix: "ar" },
];

export function localeById(id: SeoLang): SeoLocale {
  const row = SEO_LOCALES.find((locale) => locale.id === id);
  if (!row) throw new Error(id);
  return row;
}

export interface Phrase {
  en: string;
  es: string;
  "pt-BR": string;
  fr: string;
  "zh-Hans": string;
  hi: string;
  ar: string;
}

export function phrase(en: string, es: string, pt: string, fr: string, zh: string, hi: string, ar: string): Phrase {
  return { en, es, "pt-BR": pt, fr, "zh-Hans": zh, hi, ar };
}

export function say(row: Phrase, lang: SeoLang): string {
  return row[lang];
}

export interface UiCopy {
  play: string;
  note: string;
  related: string;
  worksheets: string;
  privacy: string;
  standards: string;
  answerKey: string;
  allSheets: string;
  languages: string;
  madeFor: string;
  shot: string;
}

const UI: Record<SeoLang, Omit<UiCopy, "madeFor" | "shot"> & { madeFor: (grades: string) => string; shot: (name: string) => string }> = {
  en: {
    play: "Play free",
    note: "Free, no ads, no accounts, 7 languages.",
    related: "Related",
    worksheets: "Worksheets",
    privacy: "Privacy",
    standards: "Common Core",
    answerKey: "Answer key",
    allSheets: "All worksheets",
    languages: "Languages",
    madeFor: (grades) => `Made for ${grades}.`,
    shot: (name) => `Screenshot of the ${name} game`,
  },
  es: {
    play: "Jugar gratis",
    note: "Gratis, sin anuncios, sin cuentas, 7 idiomas.",
    related: "Relacionado",
    worksheets: "Fichas",
    privacy: "Privacidad",
    standards: "Common Core",
    answerKey: "Clave de respuestas",
    allSheets: "Todas las fichas",
    languages: "Idiomas",
    madeFor: (grades) => `Hecho para ${grades}.`,
    shot: (name) => `Captura del juego de ${name}`,
  },
  "pt-BR": {
    play: "Jogar grátis",
    note: "Grátis, sem anúncios, sem contas, 7 idiomas.",
    related: "Relacionados",
    worksheets: "Folhas",
    privacy: "Privacidade",
    standards: "Common Core",
    answerKey: "Gabarito",
    allSheets: "Todas as folhas",
    languages: "Idiomas",
    madeFor: (grades) => `Feito para ${grades}.`,
    shot: (name) => `Captura de tela do jogo de ${name}`,
  },
  fr: {
    play: "Jouer gratuitement",
    note: "Gratuit, sans pub, sans compte, 7 langues.",
    related: "Dans le même genre",
    worksheets: "Fiches",
    privacy: "Confidentialité",
    standards: "Common Core",
    answerKey: "Corrigé",
    allSheets: "Toutes les fiches",
    languages: "Langues",
    madeFor: (grades) => `Pour ${grades}.`,
    shot: (name) => `Capture du jeu ${name}`,
  },
  "zh-Hans": {
    play: "免费玩",
    note: "免费，无广告，不用注册，7种语言。",
    related: "相关内容",
    worksheets: "练习纸",
    privacy: "隐私",
    standards: "共同核心标准",
    answerKey: "答案",
    allSheets: "全部练习纸",
    languages: "语言",
    madeFor: (grades) => `适合${grades}。`,
    shot: (name) => `${name}游戏的截图`,
  },
  hi: {
    play: "मुफ़्त खेलें",
    note: "मुफ़्त, कोई विज्ञापन नहीं, कोई खाता नहीं, 7 भाषाएँ।",
    related: "और देखें",
    worksheets: "वर्कशीट",
    privacy: "गोपनीयता",
    standards: "कॉमन कोर",
    answerKey: "उत्तर",
    allSheets: "सारी वर्कशीट",
    languages: "भाषाएँ",
    madeFor: (grades) => `${grades} के लिए।`,
    shot: (name) => `${name} खेल का स्क्रीनशॉट`,
  },
  ar: {
    play: "العب مجانًا",
    note: "مجاني، بلا إعلانات، بلا حسابات، ٧ لغات.",
    related: "صفحات قريبة",
    worksheets: "أوراق عمل",
    privacy: "الخصوصية",
    standards: "المعايير الأساسية المشتركة",
    answerKey: "مفتاح الإجابات",
    allSheets: "كل أوراق العمل",
    languages: "اللغات",
    madeFor: (grades) => `مناسب لـ${grades}.`,
    shot: (name) => `لقطة من لعبة ${name}`,
  },
};

export function uiCopy(lang: SeoLang, grades: string, shotName: string): UiCopy {
  const row = UI[lang];
  return {
    play: row.play,
    note: row.note,
    related: row.related,
    worksheets: row.worksheets,
    privacy: row.privacy,
    standards: row.standards,
    answerKey: row.answerKey,
    allSheets: row.allSheets,
    languages: row.languages,
    madeFor: row.madeFor(grades),
    shot: row.shot(shotName),
  };
}

const GRADE_ORDER: Grade[] = ["PK", "K", "1", "2", "3", "4"];

/** Ages a US grade usually means, for schema.org typicalAgeRange. */
const AGE: Record<Grade, [number, number]> = {
  PK: [4, 5],
  K: [5, 6],
  "1": [6, 7],
  "2": [7, 8],
  "3": [8, 9],
  "4": [9, 10],
};

export function ageRange(grades: readonly Grade[]): string {
  const ages = grades.flatMap((grade) => AGE[grade]);
  const low = Math.min(...ages);
  const high = Math.max(...ages);
  return `${low}-${high}`;
}

function knownGrades(grades: readonly Grade[]): string {
  return grades.join(",");
}

export function gradePhrase(lang: SeoLang, grades: readonly Grade[]): string {
  const key = knownGrades(grades);
  const table = GRADE_PHRASES[lang];
  const hit = table[key];
  if (hit) return hit;
  if (grades.length === 1) return singleGrade(lang, grades[0]!);
  return grades.map((grade) => singleGrade(lang, grade)).join(", ");
}

function singleGrade(lang: SeoLang, grade: Grade): string {
  const one = GRADE_PHRASES[lang][grade];
  if (!one) throw new Error(`${lang} ${grade}`);
  return one;
}

const GRADE_PHRASES: Record<SeoLang, Record<string, string>> = {
  en: {
    PK: "Pre-K",
    K: "kindergarten",
    "1": "grade 1",
    "2": "grade 2",
    "3": "grade 3",
    "4": "grade 4",
    "PK,K,1,2,3,4": "Pre-K to grade 4",
    "K,1,2,3,4": "kindergarten through grade 4",
    "1,2,3,4": "grades 1–4",
    "2,3,4": "grades 2–4",
    "1,2,3": "grades 1–3",
    "2,3": "grades 2–3",
    "3,4": "grades 3–4",
    "1,2": "grades 1–2",
    "K,1": "kindergarten and grade 1",
    "PK,K": "Pre-K and kindergarten",
    "PK,K,1": "Pre-K through grade 1",
    "K,1,2": "kindergarten through grade 2",
  },
  es: {
    PK: "prekínder",
    K: "kínder",
    "1": "grado 1",
    "2": "grado 2",
    "3": "grado 3",
    "4": "grado 4",
    "PK,K,1,2,3,4": "de prekínder a grado 4",
    "K,1,2,3,4": "de kínder a grado 4",
    "1,2,3,4": "grados 1 a 4",
    "2,3,4": "grados 2 a 4",
    "1,2,3": "grados 1 a 3",
    "2,3": "grados 2 a 3",
    "3,4": "grados 3 a 4",
    "1,2": "grados 1 a 2",
    "K,1": "kínder y grado 1",
    "PK,K": "prekínder y kínder",
    "PK,K,1": "de prekínder a grado 1",
    "K,1,2": "de kínder a grado 2",
  },
  "pt-BR": {
    PK: "pré-escola",
    K: "jardim",
    "1": "1.º ano",
    "2": "2.º ano",
    "3": "3.º ano",
    "4": "4.º ano",
    "PK,K,1,2,3,4": "da pré-escola ao 4.º ano",
    "K,1,2,3,4": "do jardim ao 4.º ano",
    "1,2,3,4": "do 1.º ao 4.º ano",
    "2,3,4": "do 2.º ao 4.º ano",
    "1,2,3": "do 1.º ao 3.º ano",
    "2,3": "2.º e 3.º ano",
    "3,4": "3.º e 4.º ano",
    "1,2": "1.º e 2.º ano",
    "K,1": "jardim e 1.º ano",
    "PK,K": "pré-escola e jardim",
    "PK,K,1": "da pré-escola ao 1.º ano",
    "K,1,2": "do jardim ao 2.º ano",
  },
  fr: {
    PK: "la maternelle",
    K: "la grande section",
    "1": "le CP",
    "2": "le CE1",
    "3": "le CE2",
    "4": "le CM1",
    "PK,K,1,2,3,4": "de la maternelle au CM1",
    "K,1,2,3,4": "de la grande section au CM1",
    "1,2,3,4": "du CP au CM1",
    "2,3,4": "du CE1 au CM1",
    "1,2,3": "du CP au CE2",
    "2,3": "CE1 et CE2",
    "3,4": "CE2 et CM1",
    "1,2": "CP et CE1",
    "K,1": "la grande section et le CP",
    "PK,K": "la maternelle et la grande section",
    "PK,K,1": "de la maternelle au CP",
    "K,1,2": "de la grande section au CE1",
  },
  "zh-Hans": {
    PK: "学前班",
    K: "幼儿园",
    "1": "一年级",
    "2": "二年级",
    "3": "三年级",
    "4": "四年级",
    "PK,K,1,2,3,4": "学前班到四年级",
    "K,1,2,3,4": "幼儿园到四年级",
    "1,2,3,4": "一至四年级",
    "2,3,4": "二至四年级",
    "1,2,3": "一至三年级",
    "2,3": "二、三年级",
    "3,4": "三、四年级",
    "1,2": "一、二年级",
    "K,1": "幼儿园和一年级",
    "PK,K": "学前班和幼儿园",
    "PK,K,1": "学前班到一年级",
    "K,1,2": "幼儿园到二年级",
  },
  hi: {
    PK: "नर्सरी",
    K: "केजी",
    "1": "कक्षा 1",
    "2": "कक्षा 2",
    "3": "कक्षा 3",
    "4": "कक्षा 4",
    "PK,K,1,2,3,4": "नर्सरी से कक्षा 4",
    "K,1,2,3,4": "केजी से कक्षा 4",
    "1,2,3,4": "कक्षा 1 से 4",
    "2,3,4": "कक्षा 2 से 4",
    "1,2,3": "कक्षा 1 से 3",
    "2,3": "कक्षा 2 और 3",
    "3,4": "कक्षा 3 और 4",
    "1,2": "कक्षा 1 और 2",
    "K,1": "केजी और कक्षा 1",
    "PK,K": "नर्सरी और केजी",
    "PK,K,1": "नर्सरी से कक्षा 1",
    "K,1,2": "केजी से कक्षा 2",
  },
  ar: {
    PK: "ما قبل الروضة",
    K: "الروضة",
    "1": "الصف الأول",
    "2": "الصف الثاني",
    "3": "الصف الثالث",
    "4": "الصف الرابع",
    "PK,K,1,2,3,4": "ما قبل الروضة حتى الصف الرابع",
    "K,1,2,3,4": "الروضة حتى الصف الرابع",
    "1,2,3,4": "الصف الأول حتى الرابع",
    "2,3,4": "الصف الثاني حتى الرابع",
    "1,2,3": "الصف الأول حتى الثالث",
    "2,3": "الصفين الثاني والثالث",
    "3,4": "الصفين الثالث والرابع",
    "1,2": "الصفين الأول والثاني",
    "K,1": "الروضة والصف الأول",
    "PK,K": "ما قبل الروضة والروضة",
    "PK,K,1": "ما قبل الروضة حتى الصف الأول",
    "K,1,2": "الروضة حتى الصف الثاني",
  },
};

export function joinCodes(lang: SeoLang, codes: readonly string[]): string {
  if (codes.length === 0) return "";
  if (codes.length === 1) return codes[0]!;
  const head = codes.slice(0, -1);
  const tail = codes[codes.length - 1]!;
  if (lang === "zh-Hans") return codes.join("、");
  if (lang === "ar") return `${head.join("، ")} و${tail}`;
  const and = lang === "es" ? "y" : lang === "pt-BR" ? "e" : lang === "fr" ? "et" : lang === "hi" ? "और" : "and";
  return `${head.join(", ")} ${and} ${tail}`;
}

export function pageTitle(lang: SeoLang, name: string, grades: string): string {
  switch (lang) {
    case "en":
      return `Free ${name} game for kids (${grades}) | Squishee Academy`;
    case "es":
      return `Juego gratis de ${name} para niños (${grades}) | Squishee Academy`;
    case "pt-BR":
      return `Jogo grátis de ${name} para crianças (${grades}) | Squishee Academy`;
    case "fr":
      return `Jeu gratuit de ${name} pour les enfants (${grades}) | Squishee Academy`;
    case "zh-Hans":
      return `免费${name}游戏（${grades}） | Squishee Academy`;
    case "hi":
      return `बच्चों के लिए मुफ़्त ${name} खेल (${grades}) | Squishee Academy`;
    case "ar":
      return `لعبة ${name} المجانية للأطفال (${grades}) | Squishee Academy`;
    default: {
      const neverLang: never = lang;
      return neverLang;
    }
  }
}

export function pageH1(lang: SeoLang, name: string): string {
  switch (lang) {
    case "en":
      return `Free ${name} game for kids`;
    case "es":
      return `Juego gratis de ${name} para niños`;
    case "pt-BR":
      return `Jogo grátis de ${name} para crianças`;
    case "fr":
      return `Jeu gratuit de ${name} pour les enfants`;
    case "zh-Hans":
      return `免费${name}游戏`;
    case "hi":
      return `बच्चों के लिए मुफ़्त ${name} खेल`;
    case "ar":
      return `لعبة ${name} المجانية للأطفال`;
    default: {
      const neverLang: never = lang;
      return neverLang;
    }
  }
}

export interface GameCopy {
  id: string;
  slug: string;
  /** Grades this game is honestly for. Skill pages can be narrower. */
  grades: Grade[];
  name: Phrase;
  blurb: Phrase;
}

export const GAME_COPY: readonly GameCopy[] = [
  {
    id: "times",
    slug: "times-tables-game",
    grades: ["2", "3", "4"],
    name: phrase("times tables", "tablas de multiplicar", "tabuada", "tables de multiplication", "乘法口诀", "पहाड़े", "جداول الضرب"),
    blurb: phrase(
      "Kids practice multiplication facts, factors, multi-digit multiplication, and division with remainders.",
      "Los niños practican las tablas, los factores, la multiplicación de varias cifras y la división con residuo.",
      "As crianças praticam a tabuada, fatores, multiplicação com vários dígitos e divisão com resto.",
      "Les enfants s'exercent aux tables, aux facteurs, à la multiplication à plusieurs chiffres et à la division avec reste.",
      "孩子练习乘法口诀、因数、多位数乘法和有余数的除法。",
      "बच्चे पहाड़े, गुणनखंड, कई अंकों की गुणा और शेष वाली भाग का अभ्यास करते हैं।",
      "يتدرّب الأطفال على جداول الضرب والعوامل والضرب بعدة أرقام والقسمة مع باقٍ.",
    ),
  },
  {
    id: "add",
    slug: "addition-subtraction-game",
    grades: ["K", "1", "2", "3", "4"],
    name: phrase("addition and subtraction", "sumas y restas", "adição e subtração", "additions et soustractions", "加减法", "जोड़ और घटाव", "الجمع والطرح"),
    blurb: phrase(
      "Kids add and subtract, from facts within 5 up through the thousands.",
      "Los niños suman y restan, desde cuentas hasta el 5 hasta los millares.",
      "As crianças somam e subtraem, de contas até 5 até os milhares.",
      "Les enfants additionnent et soustraient, des calculs jusqu'à 5 jusqu'aux milliers.",
      "孩子从5以内一直练到千位数的加减。",
      "बच्चे 5 के अंदर से लेकर हज़ारों तक जोड़ और घटाव करते हैं।",
      "يجمع الأطفال ويطرحون، من حقائق ضمن 5 حتى الألوف.",
    ),
  },
  {
    id: "time",
    slug: "telling-time-game",
    grades: ["1", "2", "3", "4"],
    name: phrase("telling time", "la hora", "horas", "lecture de l'heure", "认识钟表", "समय देखना", "قراءة الساعة"),
    blurb: phrase(
      "Kids read an analog clock to the hour, half hour, quarter hour, and five minutes, then find elapsed time.",
      "Los niños leen el reloj analógico en punto, a la media, a los cuartos y de 5 en 5, y luego el tiempo transcurrido.",
      "As crianças leem o relógio analógico em horas, meias horas, quartos de hora e de 5 em 5, e depois o tempo decorrido.",
      "Les enfants lisent l'horloge à l'heure pile, à la demie, au quart d'heure et de 5 en 5, puis le temps écoulé.",
      "孩子认整点、半点、一刻钟和5分钟，再算经过的时间。",
      "बच्चे घंटा, साढ़े घंटा, सवा घंटा और 5 मिनट वाली घड़ी पढ़ते हैं, फिर बीता समय निकालते हैं।",
      "يقرأ الأطفال الساعة التناظرية عند الساعة ونصفها وربعها وكل 5 دقائق، ثم يحسبون الوقت المنقضي.",
    ),
  },
  {
    id: "money",
    slug: "money-game",
    grades: ["PK", "K", "1", "2", "3", "4"],
    name: phrase("counting money", "contar dinero", "contar dinheiro", "compter la monnaie", "认识钱币", "पैसे गिनना", "عدّ النقود"),
    blurb: phrase(
      "Kids name coins, count them, make an amount, make change, and solve money problems.",
      "Los niños nombran monedas, las cuentan, forman una cantidad, dan cambio y resuelven problemas de dinero.",
      "As crianças nomeiam moedas, contam, formam um valor, dão troco e resolvem problemas de dinheiro.",
      "Les enfants nomment les pièces, les comptent, composent une somme, rendent la monnaie et résolvent des problèmes d'argent.",
      "孩子认识硬币、数钱、凑出一个金额、找零钱，并做钱的应用题。",
      "बच्चे सिक्कों के नाम बताते हैं, गिनते हैं, राशि बनाते हैं, छुट्टे देते हैं और पैसे के सवाल हल करते हैं।",
      "يسمّي الأطفال العملات ويعدّونها ويكوّنون مبلغًا ويعيدون الباقي ويحلّون مسائل النقود.",
    ),
  },
  {
    id: "sight",
    slug: "sight-words-game",
    grades: ["K", "1", "2", "3", "4"],
    name: phrase("sight words", "palabras frecuentes", "palavras de uso frequente", "mots fréquents", "常见词", "आम शब्द", "الكلمات البصرية"),
    blurb: phrase(
      "Kids hear a sight word, match a picture, and fill a sentence. Lists follow Dolch and Fry, plus a grade 4 vocabulary list.",
      "Los niños oyen una palabra frecuente, unen un dibujo y completan una frase. Las listas siguen Dolch y Fry, y hay vocabulario de grado 4.",
      "As crianças ouvem uma palavra frequente, ligam um desenho e completam uma frase. As listas seguem Dolch e Fry, com vocabulário do 4.º ano.",
      "Les enfants entendent un mot fréquent, associent une image et complètent une phrase. Les listes suivent Dolch et Fry, avec un vocabulaire de CM1.",
      "孩子听常见词、配图片、补全句子。词表按Dolch和Fry，另有四年级词汇。",
      "बच्चे एक आम शब्द सुनते हैं, चित्र मिलाते हैं और वाक्य पूरा करते हैं। सूचियाँ Dolch और Fry पर हैं, साथ में कक्षा 4 के शब्द।",
      "يسمع الأطفال كلمة بصرية ويطابقون صورة ويكملون جملة. القوائم تتبع دولش وفراي، مع مفردات الصف الرابع.",
    ),
  },
  {
    id: "spelling",
    slug: "spelling-game",
    grades: ["K", "1", "2", "3", "4"],
    name: phrase("spelling", "ortografía", "ortografia", "orthographe", "拼写", "वर्तनी", "الإملاء"),
    blurb: phrase(
      "Kids hear a word and build it from letter tiles, from CVC words through grade 4 spelling.",
      "Los niños oyen una palabra y la arman con letras, desde palabras CVC hasta la ortografía de grado 4.",
      "As crianças ouvem uma palavra e montam com letras, de palavras CVC até a ortografia do 4.º ano.",
      "Les enfants entendent un mot et le construisent avec des lettres, des mots CVC jusqu'à l'orthographe du CM1.",
      "孩子听单词并用字母块拼出来，从CVC词到四年级拼写。",
      "बच्चे शब्द सुनकर अक्षरों से बनाते हैं, CVC शब्दों से कक्षा 4 की वर्तनी तक।",
      "يسمع الأطفال كلمة ويبنيها من بطاقات الحروف، من كلمات CVC حتى إملاء الصف الرابع.",
    ),
  },
  {
    id: "count",
    slug: "counting-game",
    grades: ["PK", "K", "1", "2", "3", "4"],
    name: phrase("counting", "contar", "contagem", "dénombrement", "数数", "गिनती", "العدّ"),
    blurb: phrase(
      "Kids count objects, compare groups, find the number before and after, and fill a ten-frame.",
      "Los niños cuentan objetos, comparan grupos, hallan el número anterior y el siguiente, y llenan un tablero de diez.",
      "As crianças contam objetos, comparam grupos, acham o número anterior e o seguinte e preenchem um quadro de dez.",
      "Les enfants comptent des objets, comparent des groupes, trouvent le nombre d'avant et d'après, et remplissent une grille de dix.",
      "孩子数物体、比较多少、找前后的数，并填十格框。",
      "बच्चे चीज़ें गिनते हैं, समूह तुलनाते हैं, पहले और बाद का नंबर ढूँढते हैं और दस का खाना भरते हैं।",
      "يعدّ الأطفال الأشياء ويقارنون المجموعات ويجدون العدد السابق والتالي ويملؤون إطار العشرة.",
    ),
  },
  {
    id: "place",
    slug: "place-value-game",
    grades: ["1", "2", "3", "4"],
    name: phrase("place value", "valor posicional", "valor posicional", "valeur de position", "数位", "स्थानीय मान", "القيمة المنزلية"),
    blurb: phrase(
      "Kids work with tens and ones, expanded form, comparing, rounding, and place value up to 1,000,000.",
      "Los niños trabajan decenas y unidades, la forma desarrollada, comparar, redondear y el valor posicional hasta 1.000.000.",
      "As crianças trabalham dezenas e unidades, forma decomposta, comparação, arredondamento e valor posicional até 1.000.000.",
      "Les enfants travaillent les dizaines et les unités, la forme développée, la comparaison, l'arrondi et la valeur de position jusqu'à 1 000 000.",
      "孩子练习十和一、展开式、比较、四舍五入，以及直到一百万的数位。",
      "बच्चे दहाई और इकाई, विस्तारित रूप, तुलना, पूर्णांक और 10,00,000 तक का स्थानीय मान सीखते हैं।",
      "يعمل الأطفال على العشرات والآحاد والصورة الموسّعة والمقارنة والتقريب والقيمة المنزلية حتى 1,000,000.",
    ),
  },
  {
    id: "shapes",
    slug: "shapes-geometry-game",
    grades: ["PK", "K", "1", "2", "3", "4"],
    name: phrase("shapes and geometry", "figuras y geometría", "formas e geometria", "formes et géométrie", "图形与几何", "आकार और ज्यामिति", "الأشكال والهندسة"),
    blurb: phrase(
      "Kids name flat and solid shapes, position words, sides, angles, and lines of symmetry.",
      "Los niños nombran figuras planas y sólidas, palabras de posición, lados, ángulos y ejes de simetría.",
      "As crianças nomeiam formas planas e sólidas, palavras de posição, lados, ângulos e eixos de simetria.",
      "Les enfants nomment les formes plates et les solides, les mots de position, les côtés, les angles et les axes de symétrie.",
      "孩子认识平面和立体图形、位置词、边、角和对称轴。",
      "बच्चे समतल और ठोस आकार, जगह के शब्द, भुजाएँ, कोण और सममिति रेखा के नाम बताते हैं।",
      "يسمّي الأطفال الأشكال المسطّحة والمجسمات وكلمات الموضع والأضلاع والزوايا ومحاور التناظر.",
    ),
  },
  {
    id: "fractions",
    slug: "fractions-game",
    grades: ["1", "2", "3", "4"],
    name: phrase("fractions", "fracciones", "frações", "fractions", "分数", "भिन्न", "الكسور"),
    blurb: phrase(
      "Kids shade parts of a whole, compare fractions, find equivalents, add like fractions, and read decimals.",
      "Los niños colorean partes de un entero, comparan fracciones, hallan equivalentes, suman fracciones iguales y leen decimales.",
      "As crianças pintam partes de um inteiro, comparam frações, acham equivalentes, somam frações de mesmo denominador e leem decimais.",
      "Les enfants colorient des parts d'un entier, comparent des fractions, trouvent des équivalentes, additionnent des fractions de même dénominateur et lisent des décimales.",
      "孩子涂出一个整体的一部分、比较分数、找等值分数、加同分母分数，并读小数。",
      "बच्चे पूरे का हिस्सा रंगते हैं, भिन्नों की तुलना करते हैं, बराबर भिन्न ढूँढते हैं, समान हर वाली भिन्न जोड़ते हैं और दशमलव पढ़ते हैं।",
      "يظلّل الأطفال أجزاء الكل ويقارنون الكسور ويجدون المكافئ ويجمعون كسورًا متشابهة ويقرؤون الأعداد العشرية.",
    ),
  },
  {
    id: "measure",
    slug: "measurement-game",
    grades: ["PK", "K", "1", "2", "3", "4"],
    name: phrase("measurement", "medidas", "medidas", "mesures", "测量", "माप", "القياس"),
    blurb: phrase(
      "Kids compare length, measure inches on a ruler, read graphs, and find area and perimeter.",
      "Los niños comparan longitudes, miden pulgadas con una regla, leen gráficas y hallan el área y el perímetro.",
      "As crianças comparam comprimentos, medem polegadas na régua, leem gráficos e acham área e perímetro.",
      "Les enfants comparent des longueurs, mesurent des pouces sur une règle, lisent des graphiques et trouvent l'aire et le périmètre.",
      "孩子比较长短、用尺子量英寸、看图表，并求面积和周长。",
      "बच्चे लंबाई तुलनाते हैं, रूलर पर इंच मापते हैं, ग्राफ पढ़ते हैं और क्षेत्रफल व परिमाप निकालते हैं।",
      "يقارن الأطفال الأطوال ويقيسون البوصات بالمسطرة ويقرؤون الرسوم ويجدون المساحة والمحيط.",
    ),
  },
  {
    id: "phonics",
    slug: "phonics-game",
    grades: ["PK", "K", "1", "2", "3", "4"],
    name: phrase("phonics", "fonética", "consciência fonológica", "phonologie", "自然拼读", "ध्वनि ज्ञान", "الصوتيات"),
    blurb: phrase(
      "Kids name letters, hear sounds, rhyme, and blend CVC words. A speaker reads the sound.",
      "Los niños nombran letras, oyen sonidos, riman y juntan palabras CVC. Una voz lee el sonido.",
      "As crianças nomeiam letras, ouvem sons, rimam e juntam palavras CVC. Uma voz lê o som.",
      "Les enfants nomment les lettres, entendent les sons, trouvent des rimes et fusionnent des mots CVC. Une voix lit le son.",
      "孩子认字母、听发音、找押韵并拼读CVC词。会有声音读出发音。",
      "बच्चे अक्षरों के नाम बताते हैं, ध्वनि सुनते हैं, तुक मिलाते हैं और CVC शब्द जोड़ते हैं। एक आवाज़ ध्वनि पढ़ती है।",
      "يسمّي الأطفال الحروف ويسمعون الأصوات ويجدون القافية ويمزجون كلمات CVC. صوت يقرأ الحرف.",
    ),
  },
  {
    id: "problems",
    slug: "word-problems-game",
    grades: ["K", "1", "2", "3", "4"],
    name: phrase("word problems", "problemas", "problemas", "problèmes", "应用题", "शब्द समस्याएँ", "المسائل الكلامية"),
    blurb: phrase(
      "Kids solve short add, subtract, multiply, share, and two-step stories, with a picture and the story read aloud.",
      "Los niños resuelven historias cortas de sumar, restar, multiplicar, repartir y de dos pasos, con un dibujo y la historia leída en voz alta.",
      "As crianças resolvem histórias curtas de somar, subtrair, multiplicar, repartir e de dois passos, com um desenho e a história lida em voz alta.",
      "Les enfants résolvent de courtes histoires d'addition, de soustraction, de multiplication, de partage et à deux étapes, avec une image et l'histoire lue à voix haute.",
      "孩子做短的加减、乘法、平均分和两步应用题，有图，故事会读出来。",
      "बच्चे जोड़, घटाव, गुणा, बाँटने और दो चरणों की छोटी कहानियाँ हल करते हैं, चित्र के साथ और कहानी ज़ोर से पढ़ी जाती है।",
      "يحلّ الأطفال قصصًا قصيرة للجمع والطرح والضرب والتوزيع وخطوتين، مع صورة والقصة مقروءة بصوت.",
    ),
  },
  {
    id: "variables",
    slug: "missing-numbers-game",
    grades: ["K", "1", "2", "3", "4"],
    name: phrase("missing numbers", "números que faltan", "números que faltam", "nombres manquants", "缺数", "गायब संख्या", "الأعداد الناقصة"),
    blurb: phrase(
      "Kids find the missing number in addition, subtraction, multiplication, and two-step equations. A first look at variables.",
      "Los niños hallan el número que falta en sumas, restas, multiplicaciones y ecuaciones de dos pasos. Un primer vistazo a las variables.",
      "As crianças acham o número que falta em adições, subtrações, multiplicações e equações de dois passos. Um primeiro contato com variáveis.",
      "Les enfants trouvent le nombre manquant dans des additions, des soustractions, des multiplications et des équations à deux étapes. Un premier regard sur les variables.",
      "孩子在加减、乘法和两步算式里找缺的数。这是变量的第一步。",
      "बच्चे जोड़, घटाव, गुणा और दो चरणों की समीकरण में गायब संख्या ढूँढते हैं। चर का पहला परिचय।",
      "يجد الأطفال العدد الناقص في الجمع والطرح والضرب ومعادلات من خطوتين. نظرة أولى إلى المتغيرات.",
    ),
  },
  {
    id: "graphs",
    slug: "graphs-game",
    grades: ["PK", "K", "1", "2", "3", "4"],
    name: phrase("graphs", "gráficas", "gráficos", "graphiques", "图表", "ग्राफ", "الرسوم البيانية"),
    blurb: phrase(
      "Kids sort and count, tally up to three groups, read picture and bar graphs, use a scale, and read a line plot with fractions.",
      "Los niños clasifican y cuentan, hacen recuentos de hasta tres grupos, leen gráficas de dibujos y de barras, usan una escala y leen un diagrama de puntos con fracciones.",
      "As crianças classificam e contam, fazem listas de até três grupos, leem gráficos de figuras e de barras, usam uma escala e leem um diagrama de pontos com frações.",
      "Les enfants trient et comptent, font des décomptes jusqu'à trois groupes, lisent des graphiques illustrés et à barres, utilisent une échelle et lisent un diagramme à points avec des fractions.",
      "孩子分类计数、给最多三组画正字、看象形图和条形图、读刻度，并看带分数的折线点图。",
      "बच्चे छाँटते और गिनते हैं, तीन समूहों तक टैली बनाते हैं, चित्र और बार ग्राफ पढ़ते हैं, पैमाना इस्तेमाल करते हैं और भिन्नों वाला लाइन प्लॉट पढ़ते हैं।",
      "يصنّف الأطفال ويعدّون ويضعون علامات حتى ثلاث مجموعات ويقرؤون رسوم الصور والأعمدة ويستخدمون مقياسًا ويقرؤون مخطط نقاط بالكسور.",
    ),
  },
  {
    id: "share",
    slug: "sharing-game",
    grades: ["PK", "K", "1", "2", "3", "4"],
    name: phrase("fair shares", "repartos iguales", "partes iguais", "parts égales", "平均分", "बराबर बाँटना", "حصص متساوية"),
    blurb: phrase(
      "Kids deal cookies onto plates, make equal groups, practice division facts, and see what is left over.",
      "Los niños reparten galletas en platos, hacen grupos iguales, practican la división y ven lo que sobra.",
      "As crianças repartem biscoitos nos pratos, fazem grupos iguais, praticam a divisão e veem o que sobra.",
      "Les enfants partagent des biscuits dans des assiettes, font des groupes égaux, s'exercent à la division et voient ce qui reste.",
      "孩子把饼干分到盘子里，做成相等的组，练习除法，再看还剩多少。",
      "बच्चे बिस्कुट प्लेटों पर बाँटते हैं, बराबर समूह बनाते हैं, भाग का अभ्यास करते हैं और देखते हैं कितने बचते हैं।",
      "يوزّع الأطفال البسكويت على الأطباق ويكوّنون مجموعات متساوية ويتدرّبون على القسمة ويرون ما يبقى.",
    ),
  },
  {
    id: "grid",
    slug: "grid-garden-game",
    grades: ["2", "3", "4"],
    name: phrase("grid garden", "jardín de cuadrícula", "jardim quadriculado", "jardin quadrillé", "方格园", "ग्रिड बगीचा", "حديقة المربعات"),
    blurb: phrase(
      "Kids count unit squares in a shape, walk the fence around it, and find a missing side.",
      "Los niños cuentan cuadrados unidad, recorren el borde y hallan un lado que falta.",
      "As crianças contam quadrados unitários, percorrem a cerca e acham um lado que falta.",
      "Les enfants comptent les carrés unités, font le tour de la figure et trouvent un côté manquant.",
      "孩子数图形里的方格，沿着四周走一圈，再求缺的边。",
      "बच्चे आकृति के इकाई वर्ग गिनते हैं, बाड़ के चारों ओर चलते हैं और छूटी भुजा निकालते हैं।",
      "يعدّ الأطفال مربعات الوحدة ويدورون حول الشكل ويجدون الضلع الناقص.",
    ),
  },
  {
    id: "signs",
    slug: "compare-numbers-game",
    grades: ["K", "1", "2", "3", "4"],
    name: phrase("compare", "compara", "compare", "compare", "比较", "तुलना", "قارن"),
    blurb: phrase(
      "Kids compare numbers with less than, equal to, and greater than, from 10 up through four digits.",
      "Los niños comparan números con menor, igual y mayor, desde el 10 hasta cuatro cifras.",
      "As crianças comparam números com menor, igual e maior, do 10 até quatro algarismos.",
      "Les enfants comparent des nombres avec plus petit, égal et plus grand, de 10 jusqu'à quatre chiffres.",
      "孩子用小于、等于和大于比较数字，从10一直到四位数。",
      "बच्चे छोटी, बराबर और बड़ी से संख्याएँ तुलना करते हैं, 10 से चार अंकों तक।",
      "يقارن الأطفال الأعداد بأصغر ويساوي وأكبر، من 10 حتى أربعة أرقام.",
    ),
  },
  {
    id: "jumps",
    slug: "ten-more-game",
    grades: ["1", "2", "3", "4"],
    name: phrase("10 more", "10 más", "10 mais", "10 plus", "加10", "10 जमा", "10 زائد"),
    blurb: phrase(
      "Kids add or take away 10, 100, or 1000 and watch the other digits stay put.",
      "Los niños suman o quitan 10, 100 o 1000 y ven que las otras cifras se quedan.",
      "As crianças somam ou tiram 10, 100 ou 1000 e veem que os outros algarismos ficam.",
      "Les enfants ajoutent ou enlèvent 10, 100 ou 1000 et voient que les autres chiffres restent.",
      "孩子加上或减去10、100或1000，其他数位不动。",
      "बच्चे 10, 100 या 1000 जोड़ते या घटाते हैं और बाकी अंक वैसे ही रहते हैं।",
      "يضيف الأطفال أو ينقصون 10 أو 100 أو 1000 وتبقى الأرقام الأخرى.",
    ),
  },
  {
    id: "ticks",
    slug: "fractions-on-a-number-line-game",
    grades: ["2", "3", "4"],
    name: phrase(
      "number line fractions",
      "fracciones en la recta",
      "frações na reta",
      "fractions sur une droite",
      "数轴上的分数",
      "संख्या रेखा की भिन्न",
      "كسور خط الأعداد",
    ),
    blurb: phrase(
      "Kids find a fraction on a number line whose middle ticks are blank.",
      "Los niños hallan una fracción en una recta cuyas marcas del medio van en blanco.",
      "As crianças acham uma fração numa reta cujas marcas do meio ficam em branco.",
      "Les enfants trouvent une fraction sur une droite dont les traits du milieu sont vides.",
      "孩子在中间刻度为空的数轴上找分数。",
      "बच्चे उस संख्या रेखा पर भिन्न ढूँढते हैं जिसके बीच के निशान खाली हैं।",
      "يجد الأطفال كسرًا على خط أعداد علاماته الوسطى فارغة.",
    ),
  },
  {
    id: "about",
    slug: "rounding-word-problems-game",
    grades: ["3", "4"],
    name: phrase(
      "rounding stories",
      "historias de redondeo",
      "histórias de arredondamento",
      "histoires d'arrondi",
      "四舍五入的故事",
      "पूर्णांक की कहानियाँ",
      "قصص التقريب",
    ),
    blurb: phrase(
      "Kids round the number in a short story to the nearest 10 or 100.",
      "Los niños redondean el número de una historia corta a la decena o a la centena.",
      "As crianças arredondam o número de uma história curta para a dezena ou a centena.",
      "Les enfants arrondissent le nombre d'une courte histoire à la dizaine ou à la centaine.",
      "孩子把短故事里的数四舍五入到十或百。",
      "बच्चे छोटी कहानी की संख्या को निकटतम 10 या 100 तक बनाते हैं।",
      "يقرّب الأطفال عدد قصة قصيرة إلى أقرب 10 أو 100.",
    ),
  },
  {
    id: "patterns",
    slug: "number-patterns-game",
    grades: ["K", "1", "2", "3", "4"],
    name: phrase("number patterns", "patrones numéricos", "padrões numéricos", "suites de nombres", "数字规律", "संख्या के पैटर्न", "أنماط الأعداد"),
    blurb: phrase(
      "Kids count by tens, fives, twos, and hundreds, then find the rule that grows the pattern.",
      "Los niños cuentan de 10 en 10, de 5 en 5, de 2 en 2 y de 100 en 100, y luego hallan la regla.",
      "As crianças contam de 10 em 10, de 5 em 5, de 2 em 2 e de 100 em 100, e depois acham a regra.",
      "Les enfants comptent de 10 en 10, de 5 en 5, de 2 en 2 et de 100 en 100, puis trouvent la règle.",
      "孩子按10、5、2和100往后数，再找出规律。",
      "बच्चे दस, पाँच, दो और सौ के अंतर से गिनते हैं, फिर नियम ढूँढते हैं।",
      "يعدّ الأطفال بالعشرات والخمسات والاثنين والمئات، ثم يجدون القاعدة.",
    ),
  },
];

const SKILL_TEXT = `
times:count|2s, 5s, and 10s in small groups|2, 5 y 10 en grupos pequeños|2, 5 e 10 em grupos pequenos|2, 5 et 10 en petits groupes|小组里的2、5、10|छोटे समूहों में 2, 5 और 10|2 و5 و10 في مجموعات صغيرة
times:twos|2s, 5s, and 10s|2, 5 y 10|2, 5 e 10|2, 5 et 10|2、5、10的口诀|2, 5 और 10 के पहाड़े|2 و5 و10
times:mix|mixed facts through the 5s|tablas mezcladas hasta el 5|tabuada misturada até o 5|tables mélangées jusqu'à 5|5以内的混合口诀|5 तक के मिश्रित पहाड़े|حقائق مختلطة حتى 5
times:toTen|times tables up to 10|tablas hasta el 10|tabuada até o 10|tables jusqu'à 10|10以内的乘法口诀|10 तक के पहाड़े|جداول الضرب حتى 10
times:factors|factors and multiples|factores y múltiplos|fatores e múltiplos|facteurs et multiples|因数和倍数|गुणनखंड और गुणज|العوامل والمضاعفات
times:multi|multi-digit multiplication|multiplicación de varias cifras|multiplicação com vários dígitos|multiplication à plusieurs chiffres|多位数乘法|कई अंकों की गुणा|الضرب بعدة أرقام
times:divide|division with remainders|división con residuo|divisão com resto|division avec reste|有余数的除法|शेष वाली भाग|القسمة مع باقٍ
add:within5|addition and subtraction within 5|sumas y restas hasta el 5|adição e subtração até 5|additions et soustractions jusqu'à 5|5以内的加减|5 के अंदर जोड़ और घटाव|الجمع والطرح ضمن 5
add:within10|addition and subtraction within 10|sumas y restas hasta el 10|adição e subtração até 10|additions et soustractions jusqu'à 10|10以内的加减|10 के अंदर जोड़ और घटाव|الجمع والطرح ضمن 10
add:within20|addition and subtraction within 20|sumas y restas hasta el 20|adição e subtração até 20|additions et soustractions jusqu'à 20|20以内的加减|20 के अंदर जोड़ और घटाव|الجمع والطرح ضمن 20
add:tens|tens and ones|decenas y unidades|dezenas e unidades|dizaines et unités|十和一|दहाई और इकाई|عشرات وآحاد
add:within100|addition and subtraction within 100|sumas y restas hasta el 100|adição e subtração até 100|additions et soustractions jusqu'à 100|100以内的加减|100 के अंदर जोड़ और घटाव|الجمع والطرح ضمن 100
add:within1000|addition and subtraction within 1000|sumas y restas hasta el 1000|adição e subtração até 1000|additions et soustractions jusqu'à 1000|1000以内的加减|1000 के अंदर जोड़ और घटाव|الجمع والطرح ضمن 1000
add:thousands|addition in the thousands|sumas de millares|adição de milhares|additions de milliers|千位数加法|हज़ारों का जोड़|جمع الألوف
time:hour|telling time to the hour|la hora en punto|horas em ponto|l'heure pile|整点|पूरा घंटा|الساعة التامة
time:half|telling time to the half hour|la hora y media|meia hora|la demie|半点|साढ़े घंटा|الساعة والنصف
time:quarter|telling time to the quarter hour|la hora y cuarto|quartos de hora|le quart d'heure|一刻钟|सवा घंटा|ربع الساعة
time:fives|telling time to five minutes|la hora de 5 en 5|horas de 5 em 5|l'heure de 5 en 5|5分钟|5 मिनट का समय|الوقت كل 5 دقائق
time:elapsed|elapsed time|tiempo transcurrido|tempo decorrido|temps écoulé|经过的时间|बीता समय|الوقت المنقضي
money:name|naming coins|nombrar monedas|nomear moedas|nommer les pièces|认识硬币|सिक्कों के नाम|تسمية العملات
money:count|counting coins|contar monedas|contar moedas|compter les pièces|数硬币|सिक्के गिनना|عدّ العملات
money:make|making an amount|formar una cantidad|formar um valor|composer une somme|凑出金额|राशि बनाना|تكوين مبلغ
money:change|making change|dar cambio|dar troco|rendre la monnaie|找零|छुट्टे देना|إعادة الباقي
money:dollars|dollars and cents|dólares y centavos|dólares e centavos|dollars et cents|元和分|डॉलर और सेंट|دولارات وسنتات
money:spend|money word problems|problemas de dinero|problemas de dinheiro|problèmes d'argent|钱的应用题|पैसे के सवाल|مسائل النقود
sight:preprimer|pre-primer sight words|palabras de preprimaria|palavras pré-silábicas iniciais|mots fréquents avant la lecture|学前常见词|शुरुआती आम शब्द|كلمات بصرية ما قبل القراءة
sight:primer|primer sight words|palabras de primaria inicial|palavras iniciais|mots fréquents du début|入门常见词|प्राइमर के आम शब्द|كلمات بصرية أولى
sight:first|first-grade sight words|palabras frecuentes de grado 1|palavras frequentes do 1.º ano|mots fréquents du CP|一年级常见词|कक्षा 1 के आम शब्द|كلمات بصرية للصف الأول
sight:second|second-grade sight words|palabras frecuentes de grado 2|palavras frequentes do 2.º ano|mots fréquents du CE1|二年级常见词|कक्षा 2 के आम शब्द|كلمات بصرية للصف الثاني
sight:third|third-grade sight words|palabras frecuentes de grado 3|palavras frequentes do 3.º ano|mots fréquents du CE2|三年级常见词|कक्षा 3 के आम शब्द|كلمات بصرية للصف الثالث
sight:fourth|grade 4 vocabulary|vocabulario de grado 4|vocabulário do 4.º ano|vocabulaire de CM1|四年级词汇|कक्षा 4 के शब्द|مفردات الصف الرابع
spelling:cvc|CVC words|palabras CVC|palavras CVC|mots CVC|CVC词|CVC शब्द|كلمات CVC
spelling:digraphs|digraphs|dígrafos|dígrafos|digrammes|二合字母|डिग्राफ|الحروف المزدوجة
spelling:blends|consonant blends|grupos consonánticos|encontros consonantais|groupes de consonnes|辅音连缀|व्यंजन समूह|تجمعات الحروف الساكنة
spelling:long|long vowels|vocales largas|vogais longas|voyelles longues|长元音|दीर्घ स्वर|حروف العلة الطويلة
spelling:patterns|grade 2 and 3 spelling patterns|patrones de grado 2 y 3|padrões do 2.º e 3.º ano|schémas du CE1 et du CE2|二、三年级拼写规律|कक्षा 2 और 3 के वर्तनी पैटर्न|أنماط إملاء الصفين الثاني والثالث
spelling:grade4|grade 4 spelling|ortografía de grado 4|ortografia do 4.º ano|orthographe de CM1|四年级拼写|कक्षा 4 की वर्तनी|إملاء الصف الرابع
count:objects|counting to 10|contar hasta 10|contar até 10|compter jusqu'à 10|数到10|10 तक गिनती|العدّ حتى 10
count:to20|counting to 20|contar hasta 20|contar até 20|compter jusqu'à 20|数到20|20 तक गिनती|العدّ حتى 20
count:compare|more and less|más y menos|mais e menos|plus et moins|多少比较|ज़्यादा और कम|أكثر وأقل
count:neighbor|numbers before and after|el número anterior y el siguiente|o número anterior e o seguinte|le nombre d'avant et d'après|前后的数|पहले और बाद की संख्या|العدد السابق والتالي
count:subitize|dot patterns|patrones de puntos|padrões de pontos|motifs de points|点子图|बिंदु पैटर्न|أنماط النقاط
count:tenframe|ten-frames|tableros de diez|quadros de dez|grilles de dix|十格框|दस के खाने|إطارات العشرة
count:build|building a ten-frame|armar un tablero de diez|montar um quadro de dez|construire une grille de dix|摆十格框|दस का खाना बनाना|بناء إطار العشرة
place:blocks|tens and ones blocks|bloques de decenas y unidades|blocos de dezenas e unidades|blocs de dizaines et d'unités|十和一的积木|दहाई और इकाई के ब्लॉक|مكعبات العشرات والآحاد
place:expanded|expanded form|forma desarrollada|forma decomposta|forme développée|展开式|विस्तारित रूप|الصورة الموسّعة
place:compare|comparing numbers|comparar números|comparar números|comparer des nombres|比较数字|संख्याओं की तुलना|مقارنة الأعداد
place:round10|rounding to the nearest 10|redondear a la decena|arredondar para a dezena|arrondir à la dizaine|四舍五入到十|निकटतम 10 तक पूर्णांक|التقريب لأقرب عشرة
place:round100|rounding to the nearest 100|redondear a la centena|arredondar para a centena|arrondir à la centaine|四舍五入到百|निकटतम 100 तक पूर्णांक|التقريب لأقرب مئة
place:build|building a number|formar un número|montar um número|construire un nombre|搭一个数|संख्या बनाना|بناء عدد
place:big|place value to one million|valor posicional hasta un millón|valor posicional até um milhão|valeur de position jusqu'au million|百万以内的数位|दस लाख तक स्थानीय मान|القيمة المنزلية حتى المليون
place:roundBig|rounding large numbers|redondear números grandes|arredondar números grandes|arrondir de grands nombres|大数四舍五入|बड़ी संख्याओं का पूर्णांक|تقريب الأعداد الكبيرة
shapes:color|colors|colores|cores|couleurs|颜色|रंग|الألوان
shapes:match|matching shapes|emparejar figuras|combinar formas|associer des formes|配对图形|आकार मिलाना|مطابقة الأشكال
shapes:pattern|shape patterns|patrones de figuras|padrões de formas|suites de formes|图形规律|आकार के पैटर्न|أنماط الأشكال
shapes:flat|flat shapes|figuras planas|formas planas|formes plates|平面图形|समतल आकार|الأشكال المسطّحة
shapes:solid|solid shapes|cuerpos geométricos|sólidos geométricos|solides|立体图形|ठोस आकार|المجسمات
shapes:position|position words|palabras de posición|palavras de posição|mots de position|位置词|जगह के शब्द|كلمات الموضع
shapes:sort|flat and solid shapes|figuras planas y sólidas|formas planas e sólidas|formes plates et solides|平面和立体|समतल और ठोस आकार|أشكال مسطّحة ومجسمات
shapes:traits|what makes a shape|qué define una figura|o que define uma forma|ce qui fait une forme|图形的特征|आकार की पहचान|ما يميّز الشكل
shapes:compose|joining shapes|unir figuras|juntar formas|assembler des formes|拼图形|आकार जोड़ना|ضمّ الأشكال
shapes:sides|sides and corners|lados y esquinas|lados e cantos|côtés et coins|边和角|भुजाएँ और कोने|أضلاع وزوايا
shapes:faces|faces of solid shapes|caras de los cuerpos|faces dos sólidos|faces des solides|立体的面|ठोस आकार के फलक|أوجه المجسمات
shapes:rows|rows of squares|filas de cuadrados|fileiras de quadrados|rangées de carrés|方块的行|वर्गों की पंक्तियाँ|صفوف المربعات
shapes:symmetry|symmetry|simetría|simetria|symétrie|对称|सममिति|التناظر
shapes:quads|quadrilaterals|cuadriláteros|quadriláteros|quadrilatères|四边形|चतुर्भुज|الأشكال الرباعية
shapes:share|unit fractions of a shape|fracciones unitarias de una figura|frações unitárias de uma forma|fractions unitaires d'une forme|图形的单位分数|आकार की इकाई भिन्न|كسور الوحدة في شكل
shapes:parts|halves, thirds, and fourths|mitades, tercios y cuartos|metades, terços e quartos|moitiés, tiers et quarts|二分之一、三分之一和四分之一|आधा, तिहाई और चौथाई|أنصاف وأثلاث وأرباع
shapes:cover|covering a rectangle|cubrir un rectángulo|cobrir um retângulo|couvrir un rectangle|铺满长方形|आयत ढकना|تغطية مستطيل
shapes:fold|lines of symmetry|ejes de simetría|eixos de simetria|axes de symétrie|对称轴|सममिति रेखाएँ|محاور التناظر
shapes:angles|angles|ángulos|ângulos|angles|角|कोण|الزوايا
fractions:parts|parts of a whole|partes de un entero|partes de um inteiro|parts d'un entier|一个整体的部分|पूरे के हिस्से|أجزاء الكل
fractions:unit|unit fractions|fracciones unitarias|frações unitárias|fractions unitaires|单位分数|इकाई भिन्न|كسور الوحدة
fractions:line|fractions on a number line|fracciones en la recta|frações na reta numérica|fractions sur une droite|数线上的分数|संख्या रेखा पर भिन्न|كسور على خط الأعداد
fractions:compare|comparing fractions|comparar fracciones|comparar frações|comparer des fractions|比较分数|भिन्नों की तुलना|مقارنة الكسور
fractions:equivalent|equivalent fractions|fracciones equivalentes|frações equivalentes|fractions équivalentes|等值分数|बराबर भिन्न|كسور مكافئة
fractions:shade|shading a fraction|colorear una fracción|pintar uma fração|colorier une fraction|涂分数|भिन्न रंगना|تظليل كسر
fractions:addLike|adding like fractions|sumar fracciones iguales|somar frações de mesmo denominador|additionner des fractions de même dénominateur|加同分母分数|समान हर वाली भिन्न जोड़ना|جمع كسور متشابهة
fractions:decimals|decimals|decimales|decimais|décimales|小数|दशमलव|الأعداد العشرية
measure:size|bigger and smaller|más grande y más pequeño|maior e menor|plus grand et plus petit|大小|बड़ा और छोटा|أكبر وأصغر
measure:compare|longer and shorter|más largo y más corto|mais longo e mais curto|plus long et plus court|长短|लंबा और छोटा|أطول وأقصر
measure:picture|picture graphs|gráficas de dibujos|gráficos de figuras|graphiques illustrés|象形图|चित्र ग्राफ|رسوم الصور
measure:bar|bar graphs|gráficas de barras|gráficos de barras|graphiques à barres|条形图|बार ग्राफ|رسوم الأعمدة
measure:ruler|measuring with a ruler|medir con una regla|medir com uma régua|mesurer avec une règle|用尺子量|रूलर से माप|القياس بالمسطرة
measure:more|how many more|cuántos más|quantos a mais|combien de plus|多多少|कितने ज़्यादा|كم زيادة
measure:area|area|área|área|aire|面积|क्षेत्रफल|المساحة
measure:perimeter|perimeter|perímetro|perímetro|périmètre|周长|परिमाप|المحيط
phonics:letters|letter names|nombres de las letras|nomes das letras|noms des lettres|字母名称|अक्षरों के नाम|أسماء الحروف
phonics:sounds|letter sounds|sonidos de las letras|sons das letras|sons des lettres|字母发音|अक्षरों की ध्वनि|أصوات الحروف
phonics:begin|beginning sounds|sonidos iniciales|sons iniciais|sons du début|开头音|शुरुआती ध्वनि|أصوات البداية
phonics:rhyme|rhyming words|palabras que riman|palavras que rimam|mots qui riment|押韵的词|तुकबंदी वाले शब्द|كلمات مقفّاة
phonics:cvc|CVC blending|unir sonidos CVC|juntar sons CVC|fusion de mots CVC|拼读CVC|CVC जोड़ना|مزج كلمات CVC
phonics:end|ending sounds|sonidos finales|sons finais|sons de la fin|结尾音|अंतिम ध्वनि|أصوات النهاية
problems:add|addition stories|historias de sumar|histórias de adição|histoires d'addition|加法故事|जोड़ की कहानियाँ|قصص الجمع
problems:sub|subtraction stories|historias de restar|histórias de subtração|histoires de soustraction|减法故事|घटाव की कहानियाँ|قصص الطرح
problems:mult|multiplication stories|historias de multiplicar|histórias de multiplicação|histoires de multiplication|乘法故事|गुणा की कहानियाँ|قصص الضرب
problems:div|sharing stories|historias de repartir|histórias de repartir|histoires de partage|平均分的故事|बाँटने की कहानियाँ|قصص التوزيع
problems:picture|picture word problems|problemas con dibujos|problemas com desenhos|problèmes illustrés|看图应用题|चित्र वाली समस्याएँ|مسائل بالصور
problems:steps|two-step word problems|problemas de dos pasos|problemas de dois passos|problèmes à deux étapes|两步应用题|दो चरणों की समस्याएँ|مسائل من خطوتين
variables:addend|missing addends within 10|sumandos que faltan hasta el 10|parcelas que faltam até 10|termes manquants jusqu'à 10|10以内缺的加数|10 के अंदर गायब जोड़|حدود جمع ناقصة ضمن 10
variables:either|missing numbers within 20|números que faltan hasta el 20|números que faltam até 20|nombres manquants jusqu'à 20|20以内的缺数|20 के अंदर गायब संख्या|أعداد ناقصة ضمن 20
variables:factor|missing factors|factores que faltan|fatores que faltam|facteurs manquants|缺的因数|गायब गुणनखंड|عوامل ناقصة
variables:times|missing numbers in multiplication|números que faltan en la multiplicación|números que faltam na multiplicação|nombres manquants dans une multiplication|乘法里的缺数|गुणा में गायब संख्या|أعداد ناقصة في الضرب
variables:steps|two-step missing numbers|números que faltan en dos pasos|números que faltam em dois passos|nombres manquants en deux étapes|两步算式的缺数|दो चरणों में गायब संख्या|أعداد ناقصة في خطوتين
graphs:sort|sorting and counting|clasificar y contar|classificar e contar|trier et compter|分类计数|छाँटना और गिनना|التصنيف والعدّ
graphs:tally|tally charts|recuentos|listas de contagem|décomptes|正字统计|टैली चार्ट|جداول العدّ
graphs:picture|picture graphs for data|gráficas de dibujos de datos|gráficos de figuras de dados|graphiques illustrés de données|数据象形图|आँकड़ों के चित्र ग्राफ|رسوم صور للبيانات
graphs:bar|bar graphs for data|gráficas de barras de datos|gráficos de barras de dados|graphiques à barres de données|数据条形图|आँकड़ों के बार ग्राफ|رسوم أعمدة للبيانات
graphs:scale|scaled graphs|gráficas con escala|gráficos com escala|graphiques à échelle|带刻度的图表|पैमाने वाले ग्राफ|رسوم بمقياس
graphs:line|line plots|diagramas de puntos|diagramas de pontos|diagrammes à points|折线点图|लाइन प्लॉट|مخططات النقاط
share:pairs|two equal plates|dos platos iguales|dois pratos iguais|deux assiettes égales|两个一样的盘子|दो बराबर प्लेट|طبقان متساويان
share:fair|equal shares|repartos iguales|partes iguais|parts égales|平均分|बराबर बाँट|حصص متساوية
share:groups|groups of the same size|grupos del mismo tamaño|grupos do mesmo tamanho|groupes de même taille|同样多的一组|एक जैसे समूह|مجموعات متساوية
share:facts|division facts|division exacta|divisão exata|division exacte|除法口诀|भाग के तथ्य|حقائق القسمة
share:left|leftovers|lo que sobra|o que sobra|ce qui reste|剩下的|बचे हुए|الباقي
grid:tiles|counting unit squares|contar cuadrados unidad|contar quadrados unitários|compter les carrés unités|数单位方格|इकाई वर्ग गिनना|عدّ مربعات الوحدة
grid:fence|distance around a shape|distancia alrededor|distância ao redor|tour d'une figure|图形的周长|आकृति के चारों ओर|المسافة حول الشكل
grid:side|a missing side|un lado que falta|um lado que falta|un côté manquant|缺的边|छूटी भुजा|ضلع ناقص
patterns:tens|counting by tens|contar de 10 en 10|contar de 10 em 10|compter de 10 en 10|十个十个数|दस-दस गिनना|العدّ بالعشرات
patterns:fives|counting by fives|contar de 5 en 5|contar de 5 em 5|compter de 5 en 5|五个五个数|पाँच-पाँच गिनना|العدّ بالخمسات
patterns:twos|counting by twos|contar de 2 en 2|contar de 2 em 2|compter de 2 en 2|两个两个数|दो-दो गिनना|العدّ بالاثنين
patterns:hundreds|counting by hundreds|contar de 100 en 100|contar de 100 em 100|compter de 100 en 100|一百一百地数|सौ-सौ गिनना|العدّ بالمئات
patterns:rule|the next number|el número que sigue|o próximo número|le nombre suivant|下一个数|अगली संख्या|العدد التالي
patterns:grow|the rule of a pattern|la regla del patrón|a regra do padrão|la règle de la suite|规律是什么|पैटर्न का नियम|قاعدة النمط
signs:to10|comparing numbers to 10|comparar números hasta el 10|comparar números até 10|comparer les nombres jusqu'à 10|比较10以内的数|10 तक तुलना|مقارنة الأعداد حتى 10
signs:tens|comparing two-digit numbers|comparar números de dos cifras|comparar números de dois algarismos|comparer les nombres à deux chiffres|比较两位数|दो अंकों की तुलना|مقارنة عددين من رقمين
signs:hundreds|comparing three-digit numbers|comparar números de tres cifras|comparar números de três algarismos|comparer les nombres à trois chiffres|比较三位数|तीन अंकों की तुलना|مقارنة عددين من ثلاثة أرقام
signs:big|comparing big numbers|comparar números grandes|comparar números grandes|comparer de grands nombres|比较大数|बड़ी संख्याओं की तुलना|مقارنة الأعداد الكبيرة
jumps:ten|ten more and ten less|10 más y 10 menos|10 a mais e 10 a menos|10 de plus et 10 de moins|多10和少10|10 अधिक और 10 कम|10 أكثر و10 أقل
jumps:hundred|100 more and 100 less|100 más y 100 menos|100 a mais e 100 a menos|100 de plus et 100 de moins|多100和少100|100 अधिक और 100 कम|100 أكثر و100 أقل
jumps:thousand|1000 more and 1000 less|1000 más y 1000 menos|1000 a mais e 1000 a menos|1000 de plus et 1000 de moins|多1000和少1000|1000 अधिक और 1000 कम|1000 أكثر و1000 أقل
ticks:fourths|fourths on a blank line|cuartos en una recta en blanco|quartos numa reta em branco|quarts sur une droite vide|空数轴上的四分|खाली रेखा पर चौथाई|أرباع على خط فارغ
ticks:sixths|sixths on a blank line|sextos en una recta en blanco|sextos numa reta em branco|sixièmes sur une droite vide|空数轴上的六分|खाली रेखा पर छठाई|أسداس على خط فارغ
ticks:eighths|eighths on a blank line|octavos en una recta en blanco|oitavos numa reta em branco|huitièmes sur une droite vide|空数轴上的八分|खाली रेखा पर आठवाँ|أثمان على خط فارغ
ticks:past|fractions past one|fracciones después del uno|frações depois do um|fractions après un|大于1的分数|एक के बाद की भिन्न|كسور بعد الواحد
about:ten|rounding a story to the nearest 10|redondear una historia a la decena|arredondar uma história para a dezena|arrondir une histoire à la dizaine|把故事四舍五入到十|कहानी को निकटतम 10|تقريب قصة لأقرب 10
about:hundred|rounding a story to the nearest 100|redondear una historia a la centena|arredondar uma história para a centena|arrondir une histoire à la centaine|把故事四舍五入到百|कहानी को निकटतम 100|تقريب قصة لأقرب 100
about:mix|rounding a story to either place|redondear una historia a la decena o la centena|arredondar uma história para a dezena ou a centena|arrondir une histoire à la dizaine ou à la centaine|把故事四舍五入到十或百|कहानी को 10 या 100|تقريب قصة إلى 10 أو 100
`;

function loadSkills(): Record<string, Phrase> {
  const out: Record<string, Phrase> = {};
  for (const line of SKILL_TEXT.trim().split("\n")) {
    const parts = line.split("|");
    if (parts.length !== 8) throw new Error(`skill row ${line}`);
    const [key, en, es, pt, fr, zh, hi, ar] = parts;
    if (!key || !en || !es || !pt || !fr || !zh || !hi || !ar) throw new Error(`skill row ${line}`);
    out[key] = phrase(en, es, pt, fr, zh, hi, ar);
  }
  return out;
}

const SKILLS = loadSkills();

export function skillPhrase(gameId: string, levelId: string): Phrase {
  const row = SKILLS[`${gameId}:${levelId}`];
  if (!row) throw new Error(`missing skill copy ${gameId}:${levelId}`);
  return row;
}

export function skillKeys(): string[] {
  return Object.keys(SKILLS);
}

/** Parenthetical grade labels already printed on the English worksheet titles. */
const SHEET_GRADES: Record<string, Phrase> = {
  "Grades 2–4": phrase("Grades 2–4", "grados 2 a 4", "2.º ao 4.º ano", "CE1 au CM1", "二至四年级", "कक्षा 2–4", "الصف الثاني حتى الرابع"),
  "K–1": phrase("K–1", "kínder y grado 1", "jardim e 1.º ano", "grande section et CP", "幼儿园至一年级", "केजी और कक्षा 1", "الروضة والصف الأول"),
  "Grades 1–2": phrase("Grades 1–2", "grados 1 a 2", "1.º e 2.º ano", "CP et CE1", "一至二年级", "कक्षा 1–2", "الصفان الأول والثاني"),
  "Grade 1": phrase("Grade 1", "grado 1", "1.º ano", "CP", "一年级", "कक्षा 1", "الصف الأول"),
  "Grades 2–3": phrase("Grades 2–3", "grados 2 a 3", "2.º e 3.º ano", "CE1 et CE2", "二至三年级", "कक्षा 2–3", "الصفان الثاني والثالث"),
  "Grades 1–4": phrase("Grades 1–4", "grados 1 a 4", "1.º ao 4.º ano", "CP au CM1", "一至四年级", "कक्षा 1–4", "الصف الأول حتى الرابع"),
  "K–4": phrase("K–4", "de kínder a grado 4", "do jardim ao 4.º ano", "de la grande section au CM1", "幼儿园到四年级", "केजी से कक्षा 4", "الروضة حتى الصف الرابع"),
  "Pre-K–4": phrase("Pre-K–4", "de prekínder a grado 4", "da pré-escola ao 4.º ano", "de la maternelle au CM1", "学前班到四年级", "नर्सरी से कक्षा 4", "ما قبل الروضة حتى الصف الرابع"),
  "Pre-K": phrase("Pre-K", "prekínder", "pré-escola", "maternelle", "学前班", "नर्सरी", "ما قبل الروضة"),
  "Grade 4": phrase("Grade 4", "grado 4", "4.º ano", "CM1", "四年级", "कक्षा 4", "الصف الرابع"),
  "Grades 3–4": phrase("Grades 3–4", "grados 3 a 4", "3.º e 4.º ano", "CE2 et CM1", "三至四年级", "कक्षा 3–4", "الصفان الثالث والرابع"),
};

export function sheetGradeLabel(englishTitle: string, lang: SeoLang): string {
  const match = /\(([^)]+)\)/.exec(englishTitle);
  const key = match?.[1];
  if (!key) throw new Error(`worksheet title has no grade: ${englishTitle}`);
  const row = SHEET_GRADES[key];
  if (!row) throw new Error(`worksheet grade ${key}`);
  return say(row, lang);
}

function rest(es: string, pt: string, fr: string, zh: string, hi: string, ar: string): Phrase {
  return phrase("", es, pt, fr, zh, hi, ar);
}

const SHEET_H1: Record<string, Phrase> = {
  "Mixed multiplication facts": rest("operaciones mixtas de multiplicar", "fatos mistos de multiplicação", "multiplications mélangées", "混合乘法", "मिश्रित गुणा", "حقائق ضرب مختلطة"),
  "Addition within 10": rest("sumas hasta el 10", "adição até 10", "additions jusqu'à 10", "10以内的加法", "10 के अंदर जोड़", "الجمع ضمن 10"),
  "Addition within 20": rest("sumas hasta el 20", "adição até 20", "additions jusqu'à 20", "20以内的加法", "20 के अंदर जोड़", "الجمع ضمن 20"),
  "Subtraction within 10": rest("restas hasta el 10", "subtração até 10", "soustractions jusqu'à 10", "10以内的减法", "10 के अंदर घटाव", "الطرح ضمن 10"),
  "Subtraction within 20": rest("restas hasta el 20", "subtração até 20", "soustractions jusqu'à 20", "20以内的减法", "20 के अंदर घटाव", "الطرح ضمن 20"),
  "Addition and subtraction": rest("sumas y restas", "adição e subtração", "additions et soustractions", "加减法", "जोड़ और घटाव", "الجمع والطرح"),
  "Telling time to the hour": rest("la hora en punto", "horas em ponto", "l'heure pile", "整点", "पूरा घंटा", "الساعة التامة"),
  "Telling time to the half hour": rest("la hora y media", "meia hora", "la demie", "半点", "साढ़े घंटा", "الساعة والنصف"),
  "Telling time to the quarter hour": rest("la hora y cuarto", "quartos de hora", "le quart d'heure", "一刻钟", "सवा घंटा", "ربع الساعة"),
  "Telling time to five minutes": rest("la hora de 5 en 5", "horas de 5 em 5", "l'heure de 5 en 5", "5分钟的时间", "5 मिनट का समय", "الوقت كل 5 دقائق"),
  "Counting coins": rest("contar monedas", "contar moedas", "compter les pièces", "数硬币", "सिक्के गिनना", "عدّ العملات"),
  "Counting pennies and nickels": rest("contar peniques y monedas de cinco", "contar pennies e nickels", "compter les pièces de 1 et de 5 cents", "数1分和5分硬币", "पेनी और निकेल गिनना", "عدّ البنسات والنيكل"),
  "Counting dimes and quarters": rest("contar monedas de diez y de veinticinco", "contar dimes e quarters", "compter les pièces de 10 et de 25 cents", "数10分和25分硬币", "डाइम और क्वार्टर गिनना", "عدّ الدايم والربع دولار"),
  "Making change from a dollar": rest("cambio de un dólar", "troco de um dólar", "monnaie sur un dollar", "从1美元找零", "एक डॉलर के छुट्टे", "الباقي من دولار"),
  "Dollars and cents": rest("dólares y centavos", "dólares e centavos", "dollars et cents", "元和分", "डॉलर और सेंट", "دولارات وسنتات"),
  "Counting to 20": rest("contar hasta 20", "contar até 20", "compter jusqu'à 20", "数到20", "20 तक गिनती", "العدّ حتى 20"),
  "Place value blocks": rest("bloques de valor posicional", "blocos de valor posicional", "blocs de valeur de position", "数位积木", "स्थानीय मान के ब्लॉक", "مكعبات القيمة المنزلية"),
  "Naming shapes": rest("nombrar figuras", "nomear formas", "nommer les formes", "图形的名字", "आकार के नाम", "تسمية الأشكال"),
  "Fractions of a whole": rest("fracciones de un entero", "frações de um inteiro", "fractions d'un entier", "整体的分数", "पूरे की भिन्न", "كسور الكل"),
  "Measuring length": rest("medir longitudes", "medir comprimentos", "mesurer des longueurs", "量长度", "लंबाई मापना", "قياس الطول"),
  "Beginning sounds": rest("sonidos iniciales", "sons iniciais", "sons du début", "开头音", "शुरुआती ध्वनि", "أصوات البداية"),
  "Addition word problems": rest("problemas de sumar", "problemas de adição", "problèmes d'addition", "加法应用题", "जोड़ की समस्याएँ", "مسائل الجمع"),
  "Missing number equations": rest("ecuaciones con un número que falta", "equações com um número que falta", "équations à nombre manquant", "缺数算式", "गायब संख्या वाली समीकरण", "معادلات بعدد ناقص"),
  "Counting to 10": rest("contar hasta 10", "contar até 10", "compter jusqu'à 10", "数到10", "10 तक गिनती", "العدّ حتى 10"),
  "Colors and patterns": rest("colores y patrones", "cores e padrões", "couleurs et suites", "颜色和规律", "रंग और पैटर्न", "ألوان وأنماط"),
  "Bigger and smaller": rest("más grande y más pequeño", "maior e menor", "plus grand et plus petit", "大小", "बड़ा और छोटा", "أكبر وأصغر"),
  "Letter names": rest("nombres de las letras", "nomes das letras", "noms des lettres", "字母名称", "अक्षरों के नाम", "أسماء الحروف"),
  "Multi-digit multiplication": rest("multiplicación de varias cifras", "multiplicação com vários dígitos", "multiplication à plusieurs chiffres", "多位数乘法", "कई अंकों की गुणा", "الضرب بعدة أرقام"),
  "Division with remainders": rest("división con residuo", "divisão com resto", "division avec reste", "有余数的除法", "शेष वाली भाग", "القسمة مع باقٍ"),
  "Place value to 1,000,000": rest("valor posicional hasta 1.000.000", "valor posicional até 1.000.000", "valeur de position jusqu'à 1 000 000", "直到100万的数位", "10,00,000 तक स्थानीय मान", "القيمة المنزلية حتى 1,000,000"),
  "Like fractions and decimals": rest("fracciones iguales y decimales", "frações de mesmo denominador e decimais", "fractions de même dénominateur et décimales", "同分母分数和小数", "समान भिन्न और दशमलव", "كسور متشابهة وأعداد عشرية"),
  "Area, time, and money": rest("área, tiempo y dinero", "área, tempo e dinheiro", "aire, temps et argent", "面积、时间和钱", "क्षेत्रफल, समय और पैसे", "المساحة والوقت والنقود"),
  "Data and graphs": rest("datos y gráficas", "dados e gráficos", "données et graphiques", "数据和图表", "आँकड़े और ग्राफ", "بيانات ورسوم"),
  "Fair shares": rest("repartos iguales", "partes iguais", "parts égales", "平均分", "बराबर बाँटना", "حصص متساوية"),
  "Grid garden": rest("jardín de cuadrícula", "jardim quadriculado", "jardin quadrillé", "方格园", "ग्रिड बगीचा", "حديقة المربعات"),
  "Number patterns": rest("patrones numéricos", "padrões numéricos", "suites de nombres", "数字规律", "संख्या के पैटर्न", "أنماط الأعداد"),
  "Compare numbers": rest("comparar números", "comparar números", "comparer des nombres", "比较数字", "संख्याओं की तुलना", "مقارنة الأعداد"),
  "Ten more": rest("10 más", "10 mais", "10 de plus", "多10", "10 अधिक", "10 أكثر"),
  "Number line fractions": rest("fracciones en la recta", "frações na reta", "fractions sur une droite", "数轴上的分数", "संख्या रेखा की भिन्न", "كسور خط الأعداد"),
  "Rounding stories": rest("historias de redondeo", "histórias de arredondamento", "histoires d'arrondi", "四舍五入的故事", "पूर्णांक की कहानियाँ", "قصص التقريب"),
};

export function sheetH1(englishH1: string, lang: SeoLang): string {
  if (lang === "en") return englishH1;
  const times = /^Multiplication by (\d+)s$/.exec(englishH1);
  if (times) {
    const n = times[1]!;
    switch (lang) {
      case "es":
        return `multiplicación por ${n}`;
      case "pt-BR":
        return `multiplicação por ${n}`;
      case "fr":
        return `multiplication par ${n}`;
      case "zh-Hans":
        return `${n}的乘法`;
      case "hi":
        return `${n} का पहाड़ा`;
      case "ar":
        return `الضرب في ${n}`;
      default: {
        const neverLang: never = lang;
        return neverLang;
      }
    }
  }
  const row = SHEET_H1[englishH1];
  if (!row) throw new Error(`worksheet h1 ${englishH1}`);
  return say(row, lang);
}

export function sheetTitle(lang: SeoLang, h1: string, grades: string): string {
  switch (lang) {
    case "en":
      return "";
    case "es":
      return `Ficha gratis de ${h1} (${grades}) | Squishee Academy`;
    case "pt-BR":
      return `Folha grátis de ${h1} (${grades}) | Squishee Academy`;
    case "fr":
      return `Fiche gratuite : ${h1} (${grades}) | Squishee Academy`;
    case "zh-Hans":
      return `免费练习纸：${h1}（${grades}） | Squishee Academy`;
    case "hi":
      return `मुफ़्त वर्कशीट: ${h1} (${grades}) | Squishee Academy`;
    case "ar":
      return `ورقة عمل مجانية: ${h1} (${grades}) | Squishee Academy`;
    default: {
      const neverLang: never = lang;
      return neverLang;
    }
  }
}

export function sheetDescription(lang: SeoLang, h1: string, grades: string): string {
  switch (lang) {
    case "en":
      return "";
    case "es":
      return `Ficha imprimible gratis de ${h1} para ${grades}. Trae las respuestas. Sin registro y sin anuncios.`;
    case "pt-BR":
      return `Folha imprimível grátis de ${h1} para ${grades}. Traz o gabarito. Sem cadastro e sem anúncios.`;
    case "fr":
      return `Fiche à imprimer gratuite : ${h1}, pour ${grades}. Le corrigé est inclus. Sans inscription et sans pub.`;
    case "zh-Hans":
      return `可打印的免费${h1}练习纸，适合${grades}。附答案。不用注册，没有广告。`;
    case "hi":
      return `${grades} के लिए ${h1} की मुफ़्त छापने योग्य वर्कशीट। उत्तर साथ में हैं। न साइन अप, न विज्ञापन।`;
    case "ar":
      return `ورقة قابلة للطباعة مجانًا عن ${h1} لـ${grades}. مع الإجابات. بلا تسجيل وبلا إعلانات.`;
    default: {
      const neverLang: never = lang;
      return neverLang;
    }
  }
}

export function sheetIndexTitle(lang: SeoLang): string {
  switch (lang) {
    case "en":
      return "Free Pre-K to Grade 4 Math Worksheets | Squishee Academy";
    case "es":
      return "Fichas gratis de mates de prekínder a grado 4 | Squishee Academy";
    case "pt-BR":
      return "Folhas grátis de matemática da pré-escola ao 4.º ano | Squishee Academy";
    case "fr":
      return "Fiches de maths gratuites, de la maternelle au CM1 | Squishee Academy";
    case "zh-Hans":
      return "学前班到四年级的免费数学练习纸 | Squishee Academy";
    case "hi":
      return "नर्सरी से कक्षा 4 तक मुफ़्त गणित वर्कशीट | Squishee Academy";
    case "ar":
      return "أوراق رياضيات مجانية من ما قبل الروضة حتى الصف الرابع | Squishee Academy";
    default: {
      const neverLang: never = lang;
      return neverLang;
    }
  }
}

export function sheetIndexDescription(lang: SeoLang): string {
  switch (lang) {
    case "en":
      return "Free printable math worksheets for Pre-K to grade 4. Times tables, addition, subtraction, elapsed time, counting coins, money problems, thousands, and area. Answer keys included. No signup.";
    case "es":
      return "Fichas de mates imprimibles y gratis, de prekínder a grado 4. Tablas, sumas, restas, tiempo transcurrido, monedas, problemas de dinero, millares y área. Con respuestas. Sin registro.";
    case "pt-BR":
      return "Folhas de matemática imprimíveis e grátis, da pré-escola ao 4.º ano. Tabuada, adição, subtração, tempo decorrido, moedas, problemas de dinheiro, milhares e área. Com gabarito. Sem cadastro.";
    case "fr":
      return "Fiches de maths à imprimer, gratuites, de la maternelle au CM1. Tables, additions, soustractions, temps écoulé, pièces, problèmes d'argent, milliers et aire. Corrigé inclus. Sans inscription.";
    case "zh-Hans":
      return "学前班到四年级的免费可打印数学练习纸。乘法口诀、加减、经过的时间、数硬币、钱的应用题、千位数和面积。附答案。不用注册。";
    case "hi":
      return "नर्सरी से कक्षा 4 तक मुफ़्त छापने योग्य गणित वर्कशीट। पहाड़े, जोड़, घटाव, बीता समय, सिक्के, पैसे के सवाल, हज़ार और क्षेत्रफल। उत्तर साथ में। बिना साइन अप।";
    case "ar":
      return "أوراق رياضيات مجانية للطباعة من ما قبل الروضة حتى الصف الرابع. جداول الضرب والجمع والطرح والوقت المنقضي وعدّ العملات ومسائل النقود والألوف والمساحة. مع الإجابات. بلا تسجيل.";
    default: {
      const neverLang: never = lang;
      return neverLang;
    }
  }
}

export function sheetIndexH1(lang: SeoLang): string {
  switch (lang) {
    case "en":
      return "Free worksheets";
    case "es":
      return "Fichas gratis";
    case "pt-BR":
      return "Folhas grátis";
    case "fr":
      return "Fiches gratuites";
    case "zh-Hans":
      return "免费练习纸";
    case "hi":
      return "मुफ़्त वर्कशीट";
    case "ar":
      return "أوراق عمل مجانية";
    default: {
      const neverLang: never = lang;
      return neverLang;
    }
  }
}

export function sheetIndexLede(lang: SeoLang): string {
  switch (lang) {
    case "en":
      return "Print a page. Every sheet has an answer key. Nothing to sign up for.";
    case "es":
      return "Imprime una página. Cada ficha trae las respuestas. No hay que registrarse.";
    case "pt-BR":
      return "Imprima uma página. Cada folha traz o gabarito. Não precisa cadastro.";
    case "fr":
      return "Imprime une page. Chaque fiche a son corrigé. Rien à inscrire.";
    case "zh-Hans":
      return "打印一页。每张都有答案。不用注册。";
    case "hi":
      return "एक पन्ना छापें। हर वर्कशीट के उत्तर हैं। साइन अप नहीं करना।";
    case "ar":
      return "اطبع صفحة. كل ورقة معها الإجابات. لا تسجيل.";
    default: {
      const neverLang: never = lang;
      return neverLang;
    }
  }
}

export { GRADE_ORDER };
