import type { Locale } from "./types";

export type { Locale };

export const LOCALES: Locale[] = ["en", "es", "pt-BR"];

export const LOCALE_NATIVE: Record<Locale, string> = {
  en: "English",
  es: "Español",
  "pt-BR": "Português (Brasil)",
};

export function parseLocale(v: unknown): Locale {
  return v === "es" || v === "pt-BR" ? v : "en";
}

export type Ui = {
  language: string;
  home: string;
  lessons: string;
  shelf: string;
  grownups: string;
  tabsAria: string;
  grade3: string;
  path: string;
  namedPath: (name: string) => string;
  check: string;
  yourAnswer: string;
  skip: string;
  play: string;
  playLeftover: string;
  startWalk: string;
  walkAgain: string;
  walkDone: string;
  todaysWalk: string;
  niceWalk: string;
  tryAgain: string;
  takeWhatYouSee: string;
  nIs: (n: string) => string;
  countCoins: string;
  takeCoins: string;
  bankTap: string;
  yourSet: string;
  makeAmount: (fmt: string) => string;
  readPointer: string;
  tapPicture: string;
  now: string;
  unitPage: string;
  anotherKid: string;
  whoPlaying: string;
  nameOnPath: string;
  optional: string;
  classIsOn: string;
  followCalendar: string;
  weekendExtraUses: string;
  resetDevice: string;
  tapAgainReset: string;
  resetBlurb: string;
  grownupBlurb: string;
  kidsBlurb: string;
  startHere: string;
  whatsHiding: string;
  leftoverBlurb: string;
  yearMap: string;
  lessonsMenu: string;
  nothingLeaves: string;
  youEarnedCoins: (n: number) => string;
  squisheeShelf: string;
  rareShelf: string;
  shelfBlurb: (have: number, total: number) => string;
  rareBlurb: string;
  coins: string;
  buy: string;
  notEnough: string;
  rareBadge: string;
  pokeThe: (name: string) => string;
  whoHid: string;
  findPairs: string;
  toShelf: string;
  schoolDaysLeft: (n: number) => string;
  newReview: (fresh: number, review: number, remain: number) => string;
  hourPlus: string;
  hourMinus: string;
  plus5min: string;
  minus5min: string;
  plus1min: string;
  minus1min: string;
  orderEmpty: string;
  clear: string;
  fridayCheck: string;
  weekendExtra: string;
  walkOf: (day: string) => string;
  of: (a: number, b: number) => string;
  streak: (n: number) => string;
  unitN: (n: number) => string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  lessonsIntro: string;
  unitDays: (days: number, remain: number, walks: number) => string;
  kid1: string;
};

export const UI: Record<Locale, Ui> = {
  en: {
    language: "Language",
    home: "Home",
    lessons: "Lessons",
    shelf: "Shelf",
    grownups: "Grown-ups",
    tabsAria: "Home, lessons, and shelf",
    grade3: "Grade 3",
    path: "Grade 3 Path",
    namedPath: (name) => `${name}'s path`,
    check: "Check",
    yourAnswer: "Your answer",
    skip: "Skip",
    play: "Play",
    playLeftover: "Play leftover",
    startWalk: "Start today's walk",
    walkAgain: "Walk again",
    walkDone: "Walk done",
    todaysWalk: "Today's walk",
    niceWalk: "Nice walk",
    tryAgain: "Try again.",
    takeWhatYouSee: "Take what you can see.",
    nIs: (n) => `n is ${n}.`,
    countCoins: "Count the coins. Type how many cents.",
    takeCoins: "Take the coins you can see.",
    bankTap: "Bank — tap to add",
    yourSet: "Your set — tap to take back",
    makeAmount: (fmt) => `Make ${fmt}`,
    readPointer: "Read the pointer",
    tapPicture: "Tap a picture, then its category.",
    now: "Now",
    unitPage: "Unit page",
    anotherKid: "Another kid",
    whoPlaying: "Who is playing",
    nameOnPath: "Name on the path",
    optional: "Optional",
    classIsOn: "Class is on",
    followCalendar: "Follow the school calendar",
    weekendExtraUses: "Weekend extra uses Friday's unit",
    resetDevice: "Reset this device",
    tapAgainReset: "Tap again to reset",
    resetBlurb: "Reset clears stars, streak, and the leftover visit. It does not leave the device either.",
    grownupBlurb:
      "Class is on only changes the suggested daily walk. Every lesson stays playable — she can pick Q4 in August. Daily walks stay 8–12 new plus review; a unit cannot be finished in a weekend.",
    kidsBlurb: "Each kid has their own stars, streak, and squishee shelf. Questions shuffle per kid.",
    startHere: "Start here",
    whatsHiding: "What's hiding",
    leftoverBlurb: "6 + n = 10 on a ten-frame. Then Home and every lesson.",
    yearMap: "The year map.",
    lessonsMenu: "is the menu — pick any unit, any day.",
    nothingLeaves: "Nothing leaves this device.",
    youEarnedCoins: (n) => `You earned ${n} coins!`,
    squisheeShelf: "Squishee shop",
    rareShelf: "Rare squishees",
    shelfBlurb: (have, total) => `Spend coins on a toy. Poke the ones you have — ${have} of ${total}.`,
    rareBlurb: "Rares cost more coins.",
    coins: "Coins",
    buy: "Buy",
    notEnough: "Need more coins",
    rareBadge: "Rare",
    pokeThe: (name) => `Poke the ${name}`,
    whoHid: "Who hid?",
    findPairs: "Find the pairs",
    toShelf: "Shelf",
    schoolDaysLeft: (n) => `${n} school days left in this unit`,
    newReview: (fresh, review, remain) => `${fresh} new · ${review} review · ${remain} school days left in this unit`,
    hourPlus: "Hour +",
    hourMinus: "Hour −",
    plus5min: "+5 min",
    minus5min: "−5 min",
    plus1min: "+1 min",
    minus1min: "−1 min",
    orderEmpty: "tap the numbers in order",
    clear: "Clear",
    fridayCheck: "Friday check",
    weekendExtra: "Weekend extra",
    walkOf: (day) => `${day}'s walk`,
    of: (a, b) => `${a} of ${b}`,
    streak: (n) => `School-day streak ${n}`,
    unitN: (n) => `Unit ${n}`,
    q1: "Quarter 1",
    q2: "Quarter 2",
    q3: "Quarter 3",
    q4: "Quarter 4",
    lessonsIntro: "Every unit, every activity. Calendar marks Now — nothing is locked. Pick Q4 in August if you want.",
    unitDays: (days, remain, walks) =>
      `${days} school days in this unit · ${remain} left on the calendar · ${walks} walks done. Practice anytime — it is not a 1–2 day finish.`,
    kid1: "Kid 1",
  },
  es: {
    language: "Idioma",
    home: "Inicio",
    lessons: "Lecciones",
    shelf: "Estante",
    grownups: "Adultos",
    tabsAria: "Inicio, lecciones y estante",
    grade3: "3.º grado",
    path: "Camino de 3.º",
    namedPath: (name) => `Camino de ${name}`,
    check: "Comprobar",
    yourAnswer: "Tu respuesta",
    skip: "Saltar",
    play: "Jugar",
    playLeftover: "Jugar a lo que se esconde",
    startWalk: "Empezar el paseo de hoy",
    walkAgain: "Pasear otra vez",
    walkDone: "Paseo listo",
    todaysWalk: "Paseo de hoy",
    niceWalk: "Buen paseo",
    tryAgain: "Otra vez.",
    takeWhatYouSee: "Toma lo que ves.",
    nIs: (n) => `n es ${n}.`,
    countCoins: "Cuenta las monedas. Escribe cuántos centavos.",
    takeCoins: "Toma las monedas que ves.",
    bankTap: "Banco — toca para sumar",
    yourSet: "Tu conjunto — toca para devolver",
    makeAmount: (fmt) => `Arma ${fmt}`,
    readPointer: "Lee el puntero",
    tapPicture: "Toca una foto, luego su categoría.",
    now: "Ahora",
    unitPage: "Página de la unidad",
    anotherKid: "Otra niña o niño",
    whoPlaying: "Quién juega",
    nameOnPath: "Nombre en el camino",
    optional: "Opcional",
    classIsOn: "La clase está en",
    followCalendar: "Seguir el calendario escolar",
    weekendExtraUses: "El extra de fin de semana usa la unidad del viernes",
    resetDevice: "Reiniciar este aparato",
    tapAgainReset: "Toca otra vez para reiniciar",
    resetBlurb: "Reiniciar borra estrellas, racha y la primera visita. Nada sale del aparato.",
    grownupBlurb:
      "La clase está en solo cambia el paseo diario sugerido. Toda lección se puede jugar — puede elegir Q4 en agosto. Los paseos siguen siendo 8–12 nuevos más repaso; una unidad no se termina en un fin de semana.",
    kidsBlurb: "Cada niña o niño tiene sus estrellas, racha y estante. Las preguntas se mezclan por persona.",
    startHere: "Empieza aquí",
    whatsHiding: "Qué se esconde",
    leftoverBlurb: "6 + n = 10 en un marco de diez. Luego Inicio y cada lección.",
    yearMap: "El mapa del año.",
    lessonsMenu: "es el menú — elige cualquier unidad, cualquier día.",
    nothingLeaves: "Nada sale de este aparato.",
    youEarnedCoins: (n) => `¡Ganaste ${n} monedas!`,
    squisheeShelf: "Tienda de squishees",
    rareShelf: "Squishees raros",
    shelfBlurb: (have, total) => `Gasta monedas en un juguete. Toca los que tienes — ${have} de ${total}.`,
    rareBlurb: "Los raros cuestan más monedas.",
    coins: "Monedas",
    buy: "Comprar",
    notEnough: "Faltan monedas",
    rareBadge: "Raro",
    pokeThe: (name) => `Toca el ${name}`,
    whoHid: "¿Quién se escondió?",
    findPairs: "Encuentra las parejas",
    toShelf: "Estante",
    schoolDaysLeft: (n) => `${n} días escolares en esta unidad`,
    newReview: (fresh, review, remain) => `${fresh} nuevas · ${review} repaso · ${remain} días escolares en esta unidad`,
    hourPlus: "Hora +",
    hourMinus: "Hora −",
    plus5min: "+5 min",
    minus5min: "−5 min",
    plus1min: "+1 min",
    minus1min: "−1 min",
    orderEmpty: "toca los números en orden",
    clear: "Borrar",
    fridayCheck: "Chequeo de viernes",
    weekendExtra: "Extra de fin de semana",
    walkOf: (day) => `Paseo del ${day}`,
    of: (a, b) => `${a} de ${b}`,
    streak: (n) => `Racha de días escolares ${n}`,
    unitN: (n) => `Unidad ${n}`,
    q1: "Trimestre 1",
    q2: "Trimestre 2",
    q3: "Trimestre 3",
    q4: "Trimestre 4",
    lessonsIntro: "Cada unidad, cada actividad. El calendario marca Ahora — nada está cerrado. Elige Q4 en agosto si quieres.",
    unitDays: (days, remain, walks) =>
      `${days} días escolares en esta unidad · ${remain} en el calendario · ${walks} paseos hechos. Practica cuando quieras — no se termina en 1 o 2 días.`,
    kid1: "Niño 1",
  },
  "pt-BR": {
    language: "Idioma",
    home: "Início",
    lessons: "Lições",
    shelf: "Estante",
    grownups: "Adultos",
    tabsAria: "Início, lições e estante",
    grade3: "3.º ano",
    path: "Caminho do 3.º",
    namedPath: (name) => `Caminho de ${name}`,
    check: "Conferir",
    yourAnswer: "Sua resposta",
    skip: "Pular",
    play: "Jogar",
    playLeftover: "Jogar o que está escondido",
    startWalk: "Começar o passeio de hoje",
    walkAgain: "Passear de novo",
    walkDone: "Passeio feito",
    todaysWalk: "Passeio de hoje",
    niceWalk: "Bom passeio",
    tryAgain: "Tenta de novo.",
    takeWhatYouSee: "Pegue o que você vê.",
    nIs: (n) => `n é ${n}.`,
    countCoins: "Conte as moedas. Digite quantos centavos.",
    takeCoins: "Pegue as moedas que você vê.",
    bankTap: "Banco — toque para somar",
    yourSet: "Seu conjunto — toque para devolver",
    makeAmount: (fmt) => `Monte ${fmt}`,
    readPointer: "Leia o ponteiro",
    tapPicture: "Toque numa figura, depois na categoria.",
    now: "Agora",
    unitPage: "Página da unidade",
    anotherKid: "Outra criança",
    whoPlaying: "Quem está jogando",
    nameOnPath: "Nome no caminho",
    optional: "Opcional",
    classIsOn: "A turma está em",
    followCalendar: "Seguir o calendário escolar",
    weekendExtraUses: "O extra de fim de semana usa a unidade de sexta",
    resetDevice: "Reiniciar este aparelho",
    tapAgainReset: "Toque de novo para reiniciar",
    resetBlurb: "Reiniciar apaga estrelas, sequência e a primeira visita. Nada sai do aparelho.",
    grownupBlurb:
      "A turma está em só muda o passeio diário sugerido. Toda lição continua jogável — ela pode escolher Q4 em agosto. Os passeios seguem 8–12 novos mais revisão; uma unidade não termina num fim de semana.",
    kidsBlurb: "Cada criança tem suas estrelas, sequência e estante. As perguntas misturam por pessoa.",
    startHere: "Comece aqui",
    whatsHiding: "O que está escondido",
    leftoverBlurb: "6 + n = 10 num quadro de dez. Depois Início e cada lição.",
    yearMap: "O mapa do ano.",
    lessonsMenu: "é o menu — escolha qualquer unidade, qualquer dia.",
    nothingLeaves: "Nada sai deste aparelho.",
    youEarnedCoins: (n) => `Você ganhou ${n} moedas!`,
    squisheeShelf: "Loja de squishees",
    rareShelf: "Squishees raros",
    shelfBlurb: (have, total) => `Gaste moedas num brinquedo. Toque nos que você tem — ${have} de ${total}.`,
    rareBlurb: "Os raros custam mais moedas.",
    coins: "Moedas",
    buy: "Comprar",
    notEnough: "Faltam moedas",
    rareBadge: "Raro",
    pokeThe: (name) => `Toque o ${name}`,
    whoHid: "Quem se escondeu?",
    findPairs: "Ache os pares",
    toShelf: "Estante",
    schoolDaysLeft: (n) => `${n} dias letivos nesta unidade`,
    newReview: (fresh, review, remain) => `${fresh} novas · ${review} revisão · ${remain} dias letivos nesta unidade`,
    hourPlus: "Hora +",
    hourMinus: "Hora −",
    plus5min: "+5 min",
    minus5min: "−5 min",
    plus1min: "+1 min",
    minus1min: "−1 min",
    orderEmpty: "toque os números em ordem",
    clear: "Limpar",
    fridayCheck: "Checagem de sexta",
    weekendExtra: "Extra de fim de semana",
    walkOf: (day) => `Passeio de ${day}`,
    of: (a, b) => `${a} de ${b}`,
    streak: (n) => `Sequência de dias letivos ${n}`,
    unitN: (n) => `Unidade ${n}`,
    q1: "Bimestre 1",
    q2: "Bimestre 2",
    q3: "Bimestre 3",
    q4: "Bimestre 4",
    lessonsIntro: "Cada unidade, cada atividade. O calendário marca Agora — nada está trancado. Escolha Q4 em agosto se quiser.",
    unitDays: (days, remain, walks) =>
      `${days} dias letivos nesta unidade · ${remain} no calendário · ${walks} passeios feitos. Pratique quando quiser — não acaba em 1 ou 2 dias.`,
    kid1: "Criança 1",
  },
};

export const NAMES: Record<Locale, string[]> = {
  en: ["Maya", "Leo", "Priya", "Sam", "Ava", "Noah", "Elena", "Kai", "Rosa", "Ben", "Lila", "Omar", "June", "Theo", "Nia", "Wes", "Ivy", "Cole", "Amir", "Zoe", "Hugo", "Mila"],
  es: ["Maya", "Leo", "Sofía", "Sam", "Ava", "Noé", "Elena", "Kai", "Rosa", "Ben", "Lucía", "Omar", "Inés", "Teo", "Nia", "Luis", "Ivy", "Nico", "Amir", "Zoe", "Hugo", "Mila"],
  "pt-BR": ["Maya", "Leo", "Sofia", "Sam", "Ava", "Noé", "Elena", "Kai", "Rosa", "Ben", "Lila", "Omar", "Inês", "Theo", "Nia", "Caio", "Ivy", "Bia", "Amir", "Zoe", "Hugo", "Mila"],
};

export const THINGS: Record<Locale, string[]> = {
  en: ["apples", "stickers", "marbles", "crayons", "shells", "cards", "blocks", "beads", "squishees", "buttons", "acorns", "pencils", "erasers", "grapes", "stars", "seeds", "stamps", "ribbons"],
  es: ["manzanas", "pegatinas", "canicas", "crayones", "conchas", "cartas", "bloques", "cuentas", "squishees", "botones", "bellotas", "lápices", "gomas", "uvas", "estrellas", "semillas", "sellos", "cintas"],
  "pt-BR": ["maçãs", "adesivos", "bolinhas", "gizes", "conchas", "cartas", "blocos", "contas", "squishees", "botões", "bolotas", "lápis", "borrachas", "uvas", "estrelas", "sementes", "carimbos", "fitas"],
};

export const SHAPE: Record<Locale, Record<string, string>> = {
  en: { triangle: "triangle", quadrilateral: "quadrilateral", pentagon: "pentagon", hexagon: "hexagon", octagon: "octagon" },
  es: { triangle: "triángulo", quadrilateral: "cuadrilátero", pentagon: "pentágono", hexagon: "hexágono", octagon: "octágono" },
  "pt-BR": { triangle: "triângulo", quadrilateral: "quadrilátero", pentagon: "pentágono", hexagon: "hexágono", octagon: "octógono" },
};

export const PLACE: Record<Locale, string[]> = {
  en: ["ones", "tens", "hundreds", "thousands", "ten thousands", "hundred thousands"],
  es: ["unidades", "decenas", "centenas", "unidades de millar", "decenas de millar", "centenas de millar"],
  "pt-BR": ["unidades", "dezenas", "centenas", "unidades de milhar", "dezenas de milhar", "centenas de milhar"],
};

export const GRAPH_CATS: Record<Locale, { id: string; label: string }[]> = {
  en: [
    { id: "cat", label: "cats" },
    { id: "frog", label: "frogs" },
    { id: "duck", label: "ducks" },
    { id: "pig", label: "pigs" },
    { id: "owl", label: "owls" },
    { id: "shark", label: "sharks" },
    { id: "bunny", label: "bunnies" },
    { id: "panda", label: "pandas" },
  ],
  es: [
    { id: "cat", label: "gatos" },
    { id: "frog", label: "ranas" },
    { id: "duck", label: "patos" },
    { id: "pig", label: "cerdos" },
    { id: "owl", label: "búhos" },
    { id: "shark", label: "tiburones" },
    { id: "bunny", label: "conejos" },
    { id: "panda", label: "pandas" },
  ],
  "pt-BR": [
    { id: "cat", label: "gatos" },
    { id: "frog", label: "sapos" },
    { id: "duck", label: "patos" },
    { id: "pig", label: "porcos" },
    { id: "owl", label: "corujas" },
    { id: "shark", label: "tubarões" },
    { id: "bunny", label: "coelhos" },
    { id: "panda", label: "pandas" },
  ],
};

const ONES_EN = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const TEENS_EN = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS_EN = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function enBelow100(n: number): string {
  if (n < 10) return ONES_EN[n] ?? String(n);
  if (n < 20) return TEENS_EN[n - 10] ?? String(n);
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o ? `${TENS_EN[t]}-${ONES_EN[o]}` : (TENS_EN[t] ?? String(n));
}
function enBelow1000(n: number): string {
  const hundreds = Math.floor(n / 100);
  const below = n % 100;
  const parts: string[] = [];
  if (hundreds) parts.push(`${ONES_EN[hundreds]} hundred`);
  if (below) parts.push(enBelow100(below));
  return parts.join(" ");
}

const ONES_ES = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
const TEENS_ES = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"];
const TENS_ES = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const HUND_ES = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

function esBelow100(n: number, apocope = false): string {
  if (n === 0) return "";
  if (n === 1) return apocope ? "un" : "uno";
  if (n < 10) return ONES_ES[n] ?? String(n);
  if (n < 20) return TEENS_ES[n - 10] ?? String(n);
  if (n === 20) return "veinte";
  if (n === 21) return apocope ? "veintiún" : "veintiuno";
  if (n === 22) return "veintidós";
  if (n === 23) return "veintitrés";
  if (n === 26) return "veintiséis";
  if (n < 30) return `veinti${ONES_ES[n - 20]}`;
  const t = Math.floor(n / 10);
  const o = n % 10;
  if (!o) return TENS_ES[t] ?? String(n);
  if (o === 1) return `${TENS_ES[t]} y ${apocope ? "un" : "uno"}`;
  return `${TENS_ES[t]} y ${ONES_ES[o]}`;
}
function esBelow1000(n: number, apocope = false): string {
  if (n === 0) return "";
  if (n === 100) return "cien";
  const hundreds = Math.floor(n / 100);
  const below = n % 100;
  const parts: string[] = [];
  if (hundreds) parts.push(HUND_ES[hundreds] ?? "");
  if (below) parts.push(esBelow100(below, apocope));
  return parts.filter(Boolean).join(" ");
}

const ONES_PT = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
const TEENS_PT = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const TENS_PT = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const HUND_PT = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function ptBelow100(n: number): string {
  if (n === 0) return "";
  if (n < 10) return ONES_PT[n] ?? String(n);
  if (n < 20) return TEENS_PT[n - 10] ?? String(n);
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o ? `${TENS_PT[t]} e ${ONES_PT[o]}` : (TENS_PT[t] ?? String(n));
}
function ptBelow1000(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cem";
  const hundreds = Math.floor(n / 100);
  const below = n % 100;
  const parts: string[] = [];
  if (hundreds) parts.push(HUND_PT[hundreds] ?? "");
  if (below) parts.push(ptBelow100(below));
  return parts.filter(Boolean).join(" e ");
}

export function wordForm(n: number, locale: Locale = "en"): string {
  if (n === 0) return locale === "es" ? "cero" : locale === "pt-BR" ? "zero" : "zero";
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  if (locale === "es") {
    const parts: string[] = [];
    if (thousands === 1) parts.push("mil");
    else if (thousands) parts.push(`${esBelow1000(thousands, true)} mil`);
    if (rest) parts.push(esBelow1000(rest));
    return parts.join(" ");
  }
  if (locale === "pt-BR") {
    const parts: string[] = [];
    if (thousands === 1) parts.push("mil");
    else if (thousands) parts.push(`${ptBelow1000(thousands)} mil`);
    if (rest) parts.push(ptBelow1000(rest));
    return parts.join(" ");
  }
  const parts: string[] = [];
  if (thousands) parts.push(`${enBelow1000(thousands)} thousand`);
  if (rest) parts.push(enBelow1000(rest));
  return parts.join(" ");
}

export type QCopy = {
  leftoverHint: string;
  tensHint: string;
  groupsHint: string;
  groupsOf: (g: number, s: number) => string;
  groupsEach: (g: number, product: number) => string;
  jumpsOf: (jumps: number, size: number) => string;
  jumpsCount: (size: number, product: number) => string;
  jumpsSize: (jumps: number, product: number) => string;
  rowsOf: (r: number, c: number) => string;
  arrayRows: (product: number, cols: number) => string;
  arrayCols: (product: number, rows: number) => string;
  rectArea: (r: number, c: number) => string;
  whichInWords: (n: string) => string;
  whichNumber: (words: string) => string;
  whatPlace: (n: string, digit: number) => string;
  whatValue: (n: string, digit: number, place: string) => string;
  buildHundreds: (target: number) => string;
  leastToGreatest: string;
  greatestToLeast: string;
  familyFact: (a: number, b: number) => string;
  howManySides: string;
  howManyVertices: string;
  isPolygon: string;
  yes: string;
  no: string;
  verticesOf: (name: string) => string;
  polygonName: string;
  combineTT: string;
  combineTQ: string;
  combineQQ: string;
  combineTP: string;
  subdivideQ: string;
  subdivideP: string;
  subdivideH: string;
  dataPrompt: string;
  dataOk: string[];
  dataNo: string[];
  fractionLine: string;
  fractionOnLine: string;
  unitFraction: (den: number) => string;
  mixedName: string;
  closerTo: (frac: string) => string;
  shaded: string;
  whatTime: string;
  elapsedHours: (start: string, end: string) => string;
  makeMoney: (fmt: string) => string;
  makeHint: string;
  changeMoney: (cost: string, pay: string) => string;
  howManyCents: string;
  unitSquares: string;
  squaresHide: (shown: number) => string;
  periName: (name: string) => string;
  periMissing: (name: string, peri: number, shown: number) => string;
  sortHowMany: (focus: string) => string;
  sortHint: string;
  graphTitle: string;
  graphMost: string;
  graphLeast: string;
  graphHowMany: (focus: string) => string;
  graphMore: (a: string, b: string) => string;
  graphAll: string;
  graphKey: (k: number) => string;
  patternRule: string;
  patternDown: string;
  patternUp: string;
  howLong: (unit: string) => string;
  howHeavy: (unit: string) => string;
  howMuchLiquid: (unit: string) => string;
  aboutHowMuch: (a: number, op: string, b: number) => string;
  wordBags: (name: string, groups: number, size: number, thing: string) => string;
  wordTake: (name: string, total: number, shown: number, thing: string) => string;
  wordTakeHint: string;
  wordCompare: (name: string, a: number, thing: string, b: number) => string;
  wordTwoAdd: (name: string, groups: number, size: number, thing: string, extra: number) => string;
  wordTwoTake: (name: string, groups: number, size: number, thing: string, extra: number) => string;
  wordTwoHint: string;
  wordSee: (name: string, shown: number, thing: string, total: number) => string;
  measureUnits: { prompt: string; answer: string; choices: string[] }[];
};

function measureEn(): QCopy["measureUnits"] {
  return [
    { prompt: "Best unit for the length of a pencil?", answer: "inch", choices: ["inch", "yard", "mile", "gallon"] },
    { prompt: "Best unit for the length of a classroom?", answer: "meter", choices: ["centimeter", "meter", "mile", "gram"] },
    { prompt: "Best unit for a watermelon?", answer: "pound", choices: ["ounce", "pound", "inch", "cup"] },
    { prompt: "Best unit for a spoon of water?", answer: "milliliter", choices: ["liter", "milliliter", "yard", "kilogram"] },
    { prompt: "Do you need an estimate or an exact measure to fill a prescription?", answer: "exact", choices: ["estimate", "exact"] },
    { prompt: "Best unit for the mass of a grape?", answer: "gram", choices: ["gram", "kilogram", "liter", "mile"] },
    { prompt: "Best unit for a bottle of milk?", answer: "liter", choices: ["liter", "milliliter", "inch", "ton"] },
    { prompt: "Best unit for a paper clip?", answer: "centimeter", choices: ["centimeter", "kilometer", "gallon", "ton"] },
    { prompt: "Best unit for a kid's height?", answer: "centimeter", choices: ["mile", "centimeter", "gallon", "ton"] },
    { prompt: "Best unit for a bag of apples?", answer: "kilogram", choices: ["milliliter", "kilogram", "inch", "second"] },
    { prompt: "Do you need an estimate or an exact measure to buy paint for a wall?", answer: "estimate", choices: ["estimate", "exact"] },
  ];
}

export function qCopy(locale: Locale): QCopy {
  if (locale === "es") {
    return {
      leftoverHint: "Toma los puntos que ves. n es lo que se esconde.",
      tensHint: "Decenas que ves. n son las unidades que faltan.",
      groupsHint: "Cuenta un grupo, luego cuenta los grupos.",
      groupsOf: (g, s) => `${g} grupos de ${s}. ¿Cuántos en total?`,
      groupsEach: (g, product) => `${g} grupos. ${product} en total. ¿Cuántos en cada grupo?`,
      jumpsOf: (jumps, size) => `${jumps} saltos de ${size} en la recta. ¿Dónde caes?`,
      jumpsCount: (size, product) => `Saltos de ${size} llegan a ${product}. ¿Cuántos saltos?`,
      jumpsSize: (jumps, product) => `${jumps} saltos iguales llegan a ${product}. ¿De cuánto es cada salto?`,
      rowsOf: (r, c) => `${r} filas de ${c}. ¿Cuántos en total?`,
      arrayRows: (product, cols) => `Un arreglo de ${product}. ${cols} en cada fila. ¿Cuántas filas?`,
      arrayCols: (product, rows) => `Un arreglo de ${product}. ${rows} filas. ¿Cuántos en cada fila?`,
      rectArea: (r, c) => `Un rectángulo de ${r} por ${c}. ¿Área?`,
      whichInWords: (n) => `¿Cuál es ${n} en palabras?`,
      whichNumber: (words) => `¿Qué número es "${words}"?`,
      whatPlace: (n, digit) => `En ${n}, ¿en qué lugar está el ${digit}?`,
      whatValue: (n, digit, place) => `En ${n}, ¿cuál es el valor del ${digit} en ${place}?`,
      buildHundreds: (target) => `Arma ${target}. ¿Cuántas centenas?`,
      leastToGreatest: "De menor a mayor.",
      greatestToLeast: "De mayor a menor.",
      familyFact: (a, b) => `¿Qué hecho va con ${a} grupos de ${b}?`,
      howManySides: "¿Cuántos lados?",
      howManyVertices: "¿Cuántos vértices?",
      isPolygon: "¿Es un polígono?",
      yes: "sí",
      no: "no",
      verticesOf: (name) => `Un ${name} ¿cuántos vértices tiene?`,
      polygonName: "¿Cómo se llama este polígono?",
      combineTT: "Dos triángulos unidos por un lado forman ¿qué polígono?",
      combineTQ: "Un triángulo unido a un cuadrilátero por un lado forma ¿qué polígono?",
      combineQQ: "Dos cuadriláteros unidos por un lado pueden formar ¿qué polígono?",
      combineTP: "Un triángulo unido a un pentágono por un lado forma ¿qué polígono?",
      subdivideQ: "Este cuadrilátero se parte por una diagonal. ¿Cuántos triángulos?",
      subdivideP: "Este pentágono se parte desde un vértice. ¿Cuántos triángulos?",
      subdivideH: "Este hexágono se parte desde un vértice. ¿Cuántos triángulos?",
      dataPrompt: "¿Qué pregunta podemos responder juntando datos de la clase?",
      dataOk: [
        "¿Cuántas mascotas tiene nuestra clase?",
        "¿Cuántos eligieron manzana en el almuerzo?",
        "¿Cuántos squishees hay en el estante?",
        "¿Cuál es el color de zapato más común en el salón?",
        "¿Cuántos libros sacamos esta semana?",
      ],
      dataNo: [
        "¿De qué color es el cielo?",
        "¿Cuánto mediré el año que viene?",
        "¿Quién es el corredor más rápido para siempre?",
        "¿Nevará en Marte mañana?",
        "¿Cuál es mi número secreto favorito?",
      ],
      fractionLine: "en la recta numérica",
      fractionOnLine: "¿Qué fracción está marcada en la recta?",
      unitFraction: (den) => `Una pieza de ${den}. Nombra la fracción unitaria.`,
      mixedName: "Nombra el número mixto.",
      closerTo: (frac) => `¿${frac} está más cerca de 0, 1/2 o 1?`,
      shaded: "¿Qué fracción está sombreada?",
      whatTime: "¿Qué hora es?",
      elapsedHours: (start, end) => `Empieza ${start}. Termina ${end}. ¿Cuántas horas pasaron?`,
      makeMoney: (fmt) => `Arma ${fmt}. Toca billetes y monedas.`,
      makeHint: "Arma la cantidad. Comprueba cuando el total coincida.",
      changeMoney: (cost, pay) => `Un artículo cuesta ${cost}. Pagas ${pay}. ¿Cuánto de cambio?`,
      howManyCents: "¿Cuántos centavos?",
      unitSquares: "¿Cuántos cuadrados unitarios?",
      squaresHide: (shown) => `${shown} cuadrados se ven. n se esconden. ¿Área?`,
      periName: (name) => `¿Perímetro de este ${name}?`,
      periMissing: (name, peri, shown) => `Un ${name}. Los lados suman ${peri}. Ves ${shown}. n es el lado que falta.`,
      sortHowMany: (focus) => `Ordena cada foto. ¿Cuántos ${focus}?`,
      sortHint: "Toca una foto, luego la categoría. La gráfica crece.",
      graphTitle: "Nuestra colección",
      graphMost: "¿Cuál tiene más?",
      graphLeast: "¿Cuál tiene menos?",
      graphHowMany: (focus) => `¿Cuántos ${focus}?`,
      graphMore: (a, b) => `¿Cuántos ${a} más que ${b}?`,
      graphAll: "¿Cuántos en total?",
      graphKey: (k) => `Cada foto vale ${k}.`,
      patternRule: "¿Cuál es la regla?",
      patternDown: "El patrón se achica. ¿Qué número se esconde?",
      patternUp: "El patrón crece. ¿Qué número se esconde?",
      howLong: (unit) => `¿Cuánto mide? (${unit})`,
      howHeavy: (unit) => `¿Cuánto pesa? (${unit})`,
      howMuchLiquid: (unit) => `¿Cuánto líquido? (${unit})`,
      aboutHowMuch: (a, op, b) => `¿Más o menos cuánto es ${a} ${op} ${b}? (centena más cercana)`,
      wordBags: (name, groups, size, thing) => `${name} tiene ${groups} bolsas de ${size} ${thing}. ¿Cuántos hay en total?`,
      wordTake: (name, total, shown, thing) => `${name} tenía ${total} ${thing}. ${shown} están en el plato. ¿Cuántos se esconden?`,
      wordTakeHint: "Toma los que ves. n se esconde.",
      wordCompare: (name, a, thing, b) => `${name} tiene ${a} ${thing}. Un amigo tiene ${b}. ¿Cuántos más tiene ${name}?`,
      wordTwoAdd: (name, groups, size, thing, extra) =>
        `${name} tiene ${groups} paquetes de ${size} ${thing}, luego encuentra ${extra} más. ¿Cuántos ahora?`,
      wordTwoTake: (name, groups, size, thing, extra) =>
        `${name} tiene ${groups} paquetes de ${size} ${thing} y regala ${extra}. ¿Cuántos quedan?`,
      wordTwoHint: "Primero los grupos. Luego suma o quita.",
      wordSee: (name, shown, thing, total) =>
        `${name} ve ${shown} ${thing}. Algunos se esconden. Hay ${total} en total. ¿Cuántos se esconden?`,
      measureUnits: [
        { prompt: "¿Mejor unidad para el largo de un lápiz?", answer: "inch", choices: ["inch", "yard", "mile", "gallon"] },
        { prompt: "¿Mejor unidad para el largo de un salón?", answer: "meter", choices: ["centimeter", "meter", "mile", "gram"] },
        { prompt: "¿Mejor unidad para una sandía?", answer: "pound", choices: ["ounce", "pound", "inch", "cup"] },
        { prompt: "¿Mejor unidad para una cuchara de agua?", answer: "milliliter", choices: ["liter", "milliliter", "yard", "kilogram"] },
        { prompt: "¿Necesitas una estimación o una medida exacta para una receta médica?", answer: "exact", choices: ["estimate", "exact"] },
        { prompt: "¿Mejor unidad para la masa de una uva?", answer: "gram", choices: ["gram", "kilogram", "liter", "mile"] },
        { prompt: "¿Mejor unidad para una botella de leche?", answer: "liter", choices: ["liter", "milliliter", "inch", "ton"] },
        { prompt: "¿Mejor unidad para un clip?", answer: "centimeter", choices: ["centimeter", "kilometer", "gallon", "ton"] },
        { prompt: "¿Mejor unidad para la estatura de un niño?", answer: "centimeter", choices: ["mile", "centimeter", "gallon", "ton"] },
        { prompt: "¿Mejor unidad para una bolsa de manzanas?", answer: "kilogram", choices: ["milliliter", "kilogram", "inch", "second"] },
        { prompt: "¿Necesitas una estimación o una medida exacta para comprar pintura de una pared?", answer: "estimate", choices: ["estimate", "exact"] },
      ],
    };
  }
  if (locale === "pt-BR") {
    return {
      leftoverHint: "Pegue os pontos que você vê. n é o que está escondido.",
      tensHint: "Dezenas que você vê. n são as unidades que faltam.",
      groupsHint: "Conte um grupo, depois conte os grupos.",
      groupsOf: (g, s) => `${g} grupos de ${s}. Quantos no total?`,
      groupsEach: (g, product) => `${g} grupos. ${product} no total. Quantos em cada grupo?`,
      jumpsOf: (jumps, size) => `${jumps} saltos de ${size} na reta. Onde você cai?`,
      jumpsCount: (size, product) => `Saltos de ${size} chegam a ${product}. Quantos saltos?`,
      jumpsSize: (jumps, product) => `${jumps} saltos iguais chegam a ${product}. Qual é o tamanho de cada salto?`,
      rowsOf: (r, c) => `${r} fileiras de ${c}. Quantos no total?`,
      arrayRows: (product, cols) => `Um arranjo de ${product}. ${cols} em cada fileira. Quantas fileiras?`,
      arrayCols: (product, rows) => `Um arranjo de ${product}. ${rows} fileiras. Quantos em cada fileira?`,
      rectArea: (r, c) => `Um retângulo de ${r} por ${c}. Área?`,
      whichInWords: (n) => `Qual é ${n} por extenso?`,
      whichNumber: (words) => `Qual número é "${words}"?`,
      whatPlace: (n, digit) => `Em ${n}, que ordem está o ${digit}?`,
      whatValue: (n, digit, place) => `Em ${n}, qual é o valor do ${digit} em ${place}?`,
      buildHundreds: (target) => `Monte ${target}. Quantas centenas?`,
      leastToGreatest: "Do menor para o maior.",
      greatestToLeast: "Do maior para o menor.",
      familyFact: (a, b) => `Qual fato combina com ${a} grupos de ${b}?`,
      howManySides: "Quantos lados?",
      howManyVertices: "Quantos vértices?",
      isPolygon: "Isto é um polígono?",
      yes: "sim",
      no: "não",
      verticesOf: (name) => `Um ${name} tem quantos vértices?`,
      polygonName: "Como se chama este polígono?",
      combineTT: "Dois triângulos unidos por um lado formam qual polígono?",
      combineTQ: "Um triângulo unido a um quadrilátero por um lado forma qual polígono?",
      combineQQ: "Dois quadriláteros unidos por um lado podem formar qual polígono?",
      combineTP: "Um triângulo unido a um pentágono por um lado forma qual polígono?",
      subdivideQ: "Este quadrilátero é partido na diagonal. Quantos triângulos?",
      subdivideP: "Este pentágono é partido a partir de um vértice. Quantos triângulos?",
      subdivideH: "Este hexágono é partido a partir de um vértice. Quantos triângulos?",
      dataPrompt: "Qual pergunta podemos responder coletando dados da turma?",
      dataOk: [
        "Quantos animais de estimação a nossa turma tem?",
        "Quantos escolheram maçã no almoço?",
        "Quantos squishees estão na estante?",
        "Qual é a cor de sapato mais comum na sala?",
        "Quantos livros pegamos esta semana?",
      ],
      dataNo: [
        "De que cor é o céu?",
        "Qual será a minha altura no ano que vem?",
        "Quem é o corredor mais rápido para sempre?",
        "Vai nevar em Marte amanhã?",
        "Qual é o meu número secreto favorito?",
      ],
      fractionLine: "na reta numérica",
      fractionOnLine: "Que fração está marcada na reta?",
      unitFraction: (den) => `Um pedaço de ${den}. Nomeie a fração unitária.`,
      mixedName: "Nomeie o número misto.",
      closerTo: (frac) => `${frac} está mais perto de 0, 1/2 ou 1?`,
      shaded: "Que fração está pintada?",
      whatTime: "Que horas são?",
      elapsedHours: (start, end) => `Começa ${start}. Termina ${end}. Quantas horas passaram?`,
      makeMoney: (fmt) => `Monte ${fmt}. Toque notas e moedas.`,
      makeHint: "Monte o valor. Conferir quando o total bater.",
      changeMoney: (cost, pay) => `Um item custa ${cost}. Você paga ${pay}. Quanto de troco?`,
      howManyCents: "Quantos centavos?",
      unitSquares: "Quantos quadrados unitários?",
      squaresHide: (shown) => `${shown} quadrados aparecem. n se escondem. Área?`,
      periName: (name) => `Perímetro deste ${name}?`,
      periMissing: (name, peri, shown) => `Um ${name}. Os lados somam ${peri}. Você vê ${shown}. n é o lado que falta.`,
      sortHowMany: (focus) => `Separe cada figura. Quantos ${focus}?`,
      sortHint: "Toque numa figura, depois na categoria. O gráfico cresce.",
      graphTitle: "Nossa coleção",
      graphMost: "Qual tem mais?",
      graphLeast: "Qual tem menos?",
      graphHowMany: (focus) => `Quantos ${focus}?`,
      graphMore: (a, b) => `Quantos ${a} a mais que ${b}?`,
      graphAll: "Quantos no total?",
      graphKey: (k) => `Cada figura vale ${k}.`,
      patternRule: "Qual é a regra?",
      patternDown: "O padrão está diminuindo. Que número está escondido?",
      patternUp: "O padrão está crescendo. Que número está escondido?",
      howLong: (unit) => `Qual o comprimento? (${unit})`,
      howHeavy: (unit) => `Qual o peso? (${unit})`,
      howMuchLiquid: (unit) => `Quanto líquido? (${unit})`,
      aboutHowMuch: (a, op, b) => `Mais ou menos quanto é ${a} ${op} ${b}? (centena mais próxima)`,
      wordBags: (name, groups, size, thing) => `${name} tem ${groups} sacos de ${size} ${thing}. Quantos há no total?`,
      wordTake: (name, total, shown, thing) => `${name} tinha ${total} ${thing}. ${shown} estão no prato. Quantos estão escondidos?`,
      wordTakeHint: "Pegue os que você vê. n está escondido.",
      wordCompare: (name, a, thing, b) => `${name} tem ${a} ${thing}. Um amigo tem ${b}. Quantos a mais ${name} tem?`,
      wordTwoAdd: (name, groups, size, thing, extra) =>
        `${name} tem ${groups} pacotes de ${size} ${thing}, depois acha mais ${extra}. Quantos agora?`,
      wordTwoTake: (name, groups, size, thing, extra) =>
        `${name} tem ${groups} pacotes de ${size} ${thing} e dá ${extra}. Quantos sobram?`,
      wordTwoHint: "Primeiro os grupos. Depois some ou tire.",
      wordSee: (name, shown, thing, total) =>
        `${name} vê ${shown} ${thing}. Alguns estão escondidos. Há ${total} no total. Quantos se escondem?`,
      measureUnits: [
        { prompt: "Melhor unidade para o comprimento de um lápis?", answer: "inch", choices: ["inch", "yard", "mile", "gallon"] },
        { prompt: "Melhor unidade para o comprimento de uma sala?", answer: "meter", choices: ["centimeter", "meter", "mile", "gram"] },
        { prompt: "Melhor unidade para uma melancia?", answer: "pound", choices: ["ounce", "pound", "inch", "cup"] },
        { prompt: "Melhor unidade para uma colher de água?", answer: "milliliter", choices: ["liter", "milliliter", "yard", "kilogram"] },
        { prompt: "Você precisa de uma estimativa ou de uma medida exata para um remédio?", answer: "exact", choices: ["estimate", "exact"] },
        { prompt: "Melhor unidade para a massa de uma uva?", answer: "gram", choices: ["gram", "kilogram", "liter", "mile"] },
        { prompt: "Melhor unidade para uma garrafa de leite?", answer: "liter", choices: ["liter", "milliliter", "inch", "ton"] },
        { prompt: "Melhor unidade para um clipe?", answer: "centimeter", choices: ["centimeter", "kilometer", "gallon", "ton"] },
        { prompt: "Melhor unidade para a altura de uma criança?", answer: "centimeter", choices: ["mile", "centimeter", "gallon", "ton"] },
        { prompt: "Melhor unidade para um saco de maçãs?", answer: "kilogram", choices: ["milliliter", "kilogram", "inch", "second"] },
        { prompt: "Você precisa de uma estimativa ou de uma medida exata para comprar tinta de uma parede?", answer: "estimate", choices: ["estimate", "exact"] },
      ],
    };
  }
  return {
    leftoverHint: "Take the dots you can see. n is what's hiding.",
    tensHint: "Tens you can see. n is the leftover ones.",
    groupsHint: "Count one group, then count the groups.",
    groupsOf: (g, s) => `${g} groups of ${s}. How many in all?`,
    groupsEach: (g, product) => `${g} groups. ${product} in all. How many in each group?`,
    jumpsOf: (jumps, size) => `${jumps} jumps of ${size} on the number line. Where do you land?`,
    jumpsCount: (size, product) => `Jumps of ${size} land on ${product}. How many jumps?`,
    jumpsSize: (jumps, product) => `${jumps} equal jumps land on ${product}. How big is each jump?`,
    rowsOf: (r, c) => `${r} rows of ${c}. How many in all?`,
    arrayRows: (product, cols) => `An array of ${product}. ${cols} in each row. How many rows?`,
    arrayCols: (product, rows) => `An array of ${product}. ${rows} rows. How many in each row?`,
    rectArea: (r, c) => `A ${r} by ${c} rectangle. Area?`,
    whichInWords: (n) => `Which is ${n} in words?`,
    whichNumber: (words) => `Which number is "${words}"?`,
    whatPlace: (n, digit) => `In ${n}, what place is the ${digit} in?`,
    whatValue: (n, digit, place) => `In ${n}, what is the value of the ${digit} in the ${place}?`,
    buildHundreds: (target) => `Build ${target}. How many hundreds?`,
    leastToGreatest: "Least to greatest.",
    greatestToLeast: "Greatest to least.",
    familyFact: (a, b) => `Which fact belongs with ${a} groups of ${b}?`,
    howManySides: "How many sides?",
    howManyVertices: "How many vertices?",
    isPolygon: "Is this a polygon?",
    yes: "yes",
    no: "no",
    verticesOf: (name) => `A ${name} has how many vertices?`,
    polygonName: "What is this polygon called?",
    combineTT: "Two triangles joined on a side make which polygon?",
    combineTQ: "A triangle joined to a quadrilateral on one side makes which polygon?",
    combineQQ: "Two quadrilaterals joined on a side can make which polygon?",
    combineTP: "A triangle joined to a pentagon on one side makes which polygon?",
    subdivideQ: "This quadrilateral is split along a diagonal. How many triangles?",
    subdivideP: "This pentagon is split from one vertex. How many triangles?",
    subdivideH: "This hexagon is split from one vertex. How many triangles?",
    dataPrompt: "Which question can we answer by collecting class data?",
    dataOk: [
      "How many pets does our class have?",
      "How many kids chose apple at lunch?",
      "How many squishees are on the shelf?",
      "What is the most common shoe color in our room?",
      "How many books did we check out this week?",
    ],
    dataNo: [
      "What color is the sky?",
      "How tall will I be next year?",
      "Who is the fastest runner forever?",
      "Will it snow on Mars tomorrow?",
      "What is my favorite secret number?",
    ],
    fractionLine: "on the number line",
    fractionOnLine: "What fraction is marked on the number line?",
    unitFraction: (den) => `One piece of ${den}. Name the unit fraction.`,
    mixedName: "Name the mixed number.",
    closerTo: (frac) => `Is ${frac} closer to 0, 1/2, or 1?`,
    shaded: "What fraction is shaded?",
    whatTime: "What time is it?",
    elapsedHours: (start, end) => `Start ${start}. End ${end}. How many hours passed?`,
    makeMoney: (fmt) => `Make ${fmt}. Tap bills and coins.`,
    makeHint: "Build the amount. Check when the total matches.",
    changeMoney: (cost, pay) => `An item costs ${cost}. You pay ${pay}. How much change?`,
    howManyCents: "How many cents?",
    unitSquares: "How many unit squares?",
    squaresHide: (shown) => `${shown} squares showing. n hide. Area?`,
    periName: (name) => `Perimeter of this ${name}?`,
    periMissing: (name, peri, shown) => `A ${name}. Sides add to ${peri}. You see ${shown}. n is the missing side.`,
    sortHowMany: (focus) => `Sort every picture. How many ${focus}?`,
    sortHint: "Tap a picture, then the category. The graph grows.",
    graphTitle: "Our collection",
    graphMost: "Which has the most?",
    graphLeast: "Which has the least?",
    graphHowMany: (focus) => `How many ${focus}?`,
    graphMore: (a, b) => `How many more ${a} than ${b}?`,
    graphAll: "How many in all?",
    graphKey: (k) => `Each picture stands for ${k}.`,
    patternRule: "What is the rule?",
    patternDown: "The pattern is shrinking. What number is hiding?",
    patternUp: "The pattern is growing. What number is hiding?",
    howLong: (unit) => `How long? (${unit})`,
    howHeavy: (unit) => `How heavy? (${unit})`,
    howMuchLiquid: (unit) => `How much liquid? (${unit})`,
    aboutHowMuch: (a, op, b) => `About how much is ${a} ${op} ${b}? (nearest hundred)`,
    wordBags: (name, groups, size, thing) => `${name} has ${groups} bags of ${size} ${thing}. How many ${thing}?`,
    wordTake: (name, total, shown, thing) => `${name} had ${total} ${thing}. ${shown} are in the dish. How many are hiding?`,
    wordTakeHint: "Take the ones you can see. n is hiding.",
    wordCompare: (name, a, thing, b) => `${name} has ${a} ${thing}. A friend has ${b}. How many more does ${name} have?`,
    wordTwoAdd: (name, groups, size, thing, extra) =>
      `${name} has ${groups} packs of ${size} ${thing}, then finds ${extra} more. How many now?`,
    wordTwoTake: (name, groups, size, thing, extra) =>
      `${name} has ${groups} packs of ${size} ${thing} and gives away ${extra}. How many left?`,
    wordTwoHint: "Groups first. Then add or take. Scratch pad is there.",
    wordSee: (name, shown, thing, total) =>
      `${name} sees ${shown} ${thing}. Some are hiding. There are ${total} in all. How many hide?`,
    measureUnits: measureEn(),
  };
}
