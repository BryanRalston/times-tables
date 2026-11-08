import type { Rng } from "@/lib/rng";
import { getLocale, t } from "../i18n";
import type { FractionBoard, PlaceBoard, VariableBoard } from "./boards";
import { nearChoices, sceneQuestion, uniqueChoices } from "./pick";
import { MINUS, TIMES, type ChoiceQ } from "./types";

/**
 * Grade 5 levels (slice 1): decimals to thousandths, a fraction times a whole
 * number or a fraction, and order of operations with parentheses.
 * Whole numbers stay at or under 100. At most three operations. No negatives.
 */

const LRI = "\u2066";
const PDI = "\u2069";

/** Arabic reads right to left. Keep a printed expression in one left-to-right run. */
export function mathText(text: string): string {
  return getLocale() === "ar" ? `${LRI}${text}${PDI}` : text;
}

/* ---------- decimals to thousandths (5.NBT.A.3, 5.NBT.A.4) ---------- */

/** `v` is a count of thousandths. `places` is how many digits show after the point. */
export function thousandthsText(v: number, places: number): string {
  const whole = Math.floor(v / 1000);
  const frac = String(v % 1000).padStart(3, "0").slice(0, places);
  return `${whole}.${frac}`;
}

function placeWord(places: 1 | 2): string {
  return places === 1
    ? t("tenth", "décimo", "décimo", "dixième", "十分位", "दशांश", "عُشر")
    : t("hundredth", "centésimo", "centésimo", "centième", "百分位", "शतांश", "جزء من مئة");
}

function makeThousandthsValue(rng: Rng): ChoiceQ {
  const digits = rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4);
  const whole = digits[0] ?? 1;
  const frac = [digits[1] ?? 2, digits[2] ?? 3, digits[3] ?? 4];
  const v = whole * 1000 + (frac[0] ?? 0) * 100 + (frac[1] ?? 0) * 10 + (frac[2] ?? 0);
  const text = thousandthsText(v, 3);
  const place = rng.int(1, 3);
  const digit = frac[place - 1] ?? 1;
  const values = [1, 2, 3].map((p) => `0.${"0".repeat(p - 1)}${digit}`);
  const answer = values[place - 1] ?? "0.1";
  const others = values.filter((_, i) => i !== place - 1);
  const board: PlaceBoard = { game: "place", mode: "thousandths", ask: "value", text, place };
  return sceneQuestion(rng, {
    game: "place",
    title: t(`What is the value of the ${digit} in ${text}?`, `¿Cuál es el valor del ${digit} en ${text}?`, `Qual é o valor do ${digit} em ${text}?`, `Quelle est la valeur du ${digit} dans ${text} ?`, `${text}里面的${digit}表示多少？`, `${text} में ${digit} का मान क्या है?`, `ما قيمة الرقم ${digit} في العدد ${text}؟`),
    hint: t(
      "Tenths, hundredths, thousandths. Each place is 10 times smaller.",
      "Décimos, centésimos, milésimos. Cada lugar es 10 veces menor.",
      "Décimos, centésimos, milésimos. Cada posição é 10 vezes menor.",
      "Dixièmes, centièmes, millièmes. Chaque rang est 10 fois plus petit.",
      "十分位、百分位、千分位。每一位都比前一位小10倍。",
      "दशांश, शतांश, सहस्रांश। हर स्थान 10 गुना छोटा है।",
      "الأعشار ثم الأجزاء من المئة ثم من الألف. كل منزلة أصغر 10 مرات.",
    ),
    answer,
    choices: uniqueChoices(rng, answer, [String(digit), ...others]),
    skill: "place:thousandths",
    tags: ["thousandths"],
    solved: `${digit} → ${answer}`,
    picture: text,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `thousandths:value:${text}:${place}`,
  });
}

function makeThousandthsRound(rng: Rng): ChoiceQ {
  const places: 1 | 2 = rng.next() < 0.5 ? 2 : 1;
  const whole = rng.int(1, 9);
  let v = whole * 1000 + rng.int(101, 999);
  if (v % 10 === 0) v += rng.int(1, 9);
  const step = places === 2 ? 10 : 100;
  const down = Math.floor(v / step) * step;
  const up = down + step;
  const nearest = v - down >= step / 2 ? up : down;
  const answer = thousandthsText(nearest, places);
  const other = nearest === up ? down : up;
  const wrongPlace = places === 2 ? Math.floor((v + 50) / 100) * 100 : Math.floor((v + 5) / 10) * 10;
  const pool = [
    { n: other, p: places },
    { n: wrongPlace, p: places === 2 ? 1 : 2 },
    { n: nearest + step, p: places },
    { n: Math.max(0, nearest - step), p: places },
    { n: v, p: 3 },
  ];
  const seen = new Set<number>([nearest]);
  const texts: string[] = [];
  for (const item of pool) {
    if (seen.has(item.n)) continue;
    seen.add(item.n);
    texts.push(thousandthsText(item.n, item.p));
  }
  const text = thousandthsText(v, 3);
  const board: PlaceBoard = { game: "place", mode: "thousandths", ask: "round", text, place: places };
  return sceneQuestion(rng, {
    game: "place",
    title: t(
      `Round ${text} to the nearest ${placeWord(places)}`,
      `Redondea ${text} al ${placeWord(places)} más cercano`,
      `Arredonde ${text} para o ${placeWord(places)} mais próximo`,
      `Arrondis ${text} au ${placeWord(places)} le plus proche`,
      `把${text}四舍五入到${placeWord(places)}`,
      `${text} को निकटतम ${placeWord(places)} तक पूर्णांक बनाओ`,
      `قرّب ${text} إلى أقرب ${placeWord(places)}`,
    ),
    hint: t(
      "Look at the digit to the right. 5 or more rounds up.",
      "Mira el dígito de la derecha. 5 o más, sube.",
      "Olhe o algarismo à direita. 5 ou mais arredonda para cima.",
      "Regarde le chiffre à droite. 5 ou plus, on arrondit au-dessus.",
      "看右边的数字。是5或更大就进一。",
      "दाईं ओर का अंक देखो। 5 या अधिक हो तो ऊपर पूर्णांक करो।",
      "انظر إلى الرقم على اليمين. إذا كان 5 أو أكثر فقرّب إلى الأعلى.",
    ),
    answer,
    choices: uniqueChoices(rng, answer, texts),
    skill: "place:thousandths",
    tags: ["thousandths"],
    solved: answer,
    picture: text,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `thousandths:round:${text}:${places}`,
  });
}

function makeThousandthsOrder(rng: Rng): ChoiceQ {
  const whole = rng.int(0, 9);
  const values: number[] = [];
  const texts: string[] = [];
  const shapes = rng.shuffle([1, 2, 3, 3]);
  let guard = 0;
  while (values.length < 4 && guard < 80) {
    guard += 1;
    const places = shapes[values.length] ?? 3;
    const digits = [rng.int(1, 9), rng.int(0, 9), rng.int(1, 9)];
    const raw = whole * 1000 + (digits[0] ?? 1) * 100 + (places >= 2 ? (digits[1] ?? 0) * 10 : 0) + (places >= 3 ? (digits[2] ?? 1) : 0);
    if (values.includes(raw)) continue;
    // A trailing zero would print as a different-looking copy of a shorter decimal.
    if (places === 2 && digits[1] === 0) continue;
    values.push(raw);
    texts.push(thousandthsText(raw, places));
  }
  if (values.length < 4) {
    return makeThousandthsValue(rng);
  }
  const greatest = rng.next() < 0.65;
  const target = greatest ? Math.max(...values) : Math.min(...values);
  const answer = texts[values.indexOf(target)] ?? "";
  const text = texts.join(" · ");
  const board: PlaceBoard = { game: "place", mode: "thousandths", ask: "greatest", text, place: 3 };
  return sceneQuestion(rng, {
    game: "place",
    title: greatest
      ? t("Which decimal is the greatest?", "¿Qué decimal es el mayor?", "Qual decimal é o maior?", "Quel décimal est le plus grand ?", "哪个小数最大？", "कौन सा दशमलव सबसे बड़ा है?", "أي عدد عشري هو الأكبر؟")
      : t("Which decimal is the least?", "¿Qué decimal es el menor?", "Qual decimal é o menor?", "Quel décimal est le plus petit ?", "哪个小数最小？", "कौन सा दशमलव सबसे छोटा है?", "أي عدد عشري هو الأصغر؟"),
    hint: t(
      "Compare the tenths first. Then the hundredths. Then the thousandths.",
      "Compara primero los décimos, luego los centésimos y luego los milésimos.",
      "Compare primeiro os décimos, depois os centésimos e depois os milésimos.",
      "Compare d'abord les dixièmes, puis les centièmes, puis les millièmes.",
      "先比十分位，再比百分位，最后比千分位。",
      "पहले दशांश की तुलना करो, फिर शतांश, फिर सहस्रांश।",
      "قارن الأعشار أولًا، ثم الأجزاء من المئة، ثم من الألف.",
    ),
    answer,
    choices: uniqueChoices(rng, answer, texts.filter((item) => item !== answer)),
    skill: "place:thousandths",
    tags: ["thousandths"],
    solved: answer,
    picture: text,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `thousandths:order:${greatest ? "max" : "min"}:${[...texts].sort().join(",")}`,
  });
}

export function makeThousandthsQuestion(rng: Rng): ChoiceQ {
  const roll = rng.next();
  if (roll < 0.4) return makeThousandthsValue(rng);
  if (roll < 0.7) return makeThousandthsRound(rng);
  return makeThousandthsOrder(rng);
}

/* ---------- multiply fractions (5.NF.B.4) ---------- */

export function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

export function simplestFraction(num: number, den: number): string {
  const g = gcd(num, den) || 1;
  const n = num / g;
  const d = den / g;
  return d === 1 ? String(n) : `${n}/${d}`;
}

function sameValue(n1: number, d1: number, n2: number, d2: number): boolean {
  return n1 * d2 === n2 * d1;
}

const TIMES_DENS = [2, 3, 4, 5, 6] as const;

function makeFracTimesWhole(rng: Rng): ChoiceQ {
  const den = rng.pick([...TIMES_DENS]);
  const num = rng.int(1, den - 1);
  const k = rng.int(1, den <= 3 ? 6 : 4);
  const whole = den * k;
  const answer = num * k;
  const board: FractionBoard = { game: "fractions", mode: "fracTimes", num, den, num2: 1, den2: 1, whole };
  const expr = `${num}/${den} ${TIMES} ${whole}`;
  return sceneQuestion(rng, {
    game: "fractions",
    title: t(`What is ${mathText(expr)}?`, `¿Cuánto es ${mathText(expr)}?`, `Quanto é ${mathText(expr)}?`, `Combien font ${mathText(expr)} ?`, `${expr}是多少？`, `${mathText(expr)} कितना है?`, `كم يساوي ${mathText(expr)}؟`),
    hint: t(
      "Split the whole number into equal parts. Then count the parts you need.",
      "Reparte el número entero en partes iguales. Luego cuenta las partes que necesitas.",
      "Divida o número inteiro em partes iguais. Depois conte as partes de que precisa.",
      "Partage le nombre en parts égales. Puis compte les parts qu'il faut.",
      "先把整数平均分，再数出需要的份数。",
      "पूरी संख्या को बराबर भागों में बाँटो। फिर जितने भाग चाहिए उतने गिनो।",
      "قسّم العدد الصحيح إلى أجزاء متساوية ثم عُدّ الأجزاء التي تحتاجها.",
    ),
    answer: String(answer),
    choices: nearChoices(rng, answer, 1, 30, [k, num * whole, num + whole].filter((n) => n !== answer && n <= 30)),
    skill: "fractions:fracTimes",
    tags: ["fracTimes"],
    solved: `${expr} = ${answer}`,
    picture: expr,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `fracTimes:${num}/${den}x${whole}`,
  });
}

function makeFracTimesFrac(rng: Rng): ChoiceQ {
  let den = 2;
  let den2 = 2;
  let guard = 0;
  do {
    den = rng.pick([...TIMES_DENS]);
    den2 = rng.pick([...TIMES_DENS]);
    guard += 1;
  } while (den * den2 > 24 && guard < 40);
  const num = rng.int(1, den - 1);
  const num2 = rng.int(1, den2 - 1);
  const topProduct = num * num2;
  const bottomProduct = den * den2;
  const answer = simplestFraction(topProduct, bottomProduct);
  const board: FractionBoard = { game: "fractions", mode: "fracTimes", num, den, num2, den2, whole: 0 };
  const expr = `${num}/${den} ${TIMES} ${num2}/${den2}`;
  const candidates: [number, number][] = [
    [num + num2, den + den2],
    [topProduct, den + den2],
    [num + num2, bottomProduct],
    [num, den],
    [num2, den2],
    [num * den2, den * num2 + 1],
    [topProduct + 1, bottomProduct],
    [Math.max(1, topProduct - 1), bottomProduct],
    [1, bottomProduct],
    [topProduct, bottomProduct + 1],
  ];
  const pool: string[] = [];
  for (const [n, d] of candidates) {
    if (n <= 0 || d <= 0 || n >= d) continue;
    if (sameValue(n, d, topProduct, bottomProduct)) continue;
    const text = simplestFraction(n, d);
    if (!pool.includes(text) && text !== answer) pool.push(text);
  }
  for (const fallback of ["1/2", "1/3", "1/4", "2/3", "3/4", "1/6", "5/6", "3/8", "1/8", "5/12"]) {
    const [n, d] = fallback.split("/").map(Number) as [number, number];
    if (!sameValue(n, d, topProduct, bottomProduct) && !pool.includes(fallback)) pool.push(fallback);
  }
  const pinned = pool.slice(0, 3);
  return sceneQuestion(rng, {
    game: "fractions",
    title: t(`What is ${mathText(expr)}?`, `¿Cuánto es ${mathText(expr)}?`, `Quanto é ${mathText(expr)}?`, `Combien font ${mathText(expr)} ?`, `${expr}是多少？`, `${mathText(expr)} कितना है?`, `كم يساوي ${mathText(expr)}؟`),
    hint: t(
      "Multiply the tops. Multiply the bottoms. Then simplify.",
      "Multiplica los números de arriba y los de abajo. Luego simplifica.",
      "Multiplique os de cima e os de baixo. Depois simplifique.",
      "Multiplie les numérateurs, puis les dénominateurs. Ensuite simplifie.",
      "分子乘分子，分母乘分母，再约分。",
      "ऊपर वाली संख्याएँ गुणा करो, नीचे वाली भी, फिर सरल करो।",
      "اضرب البسطين ثم اضرب المقامين ثم بسّط.",
    ),
    answer,
    choices: uniqueChoices(rng, answer, pool, pinned),
    skill: "fractions:fracTimes",
    tags: ["fracTimes"],
    solved: `${expr} = ${answer}`,
    picture: expr,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `fracTimes:${num}/${den}x${num2}/${den2}`,
  });
}

export function makeFracTimesQuestion(rng: Rng): ChoiceQ {
  return rng.next() < 0.45 ? makeFracTimesWhole(rng) : makeFracTimesFrac(rng);
}

/* ---------- add and subtract unlike fractions (5.NF.A.1) ---------- */

/** Denominator pairs whose common denominator stays at or under 12. */
export const UNLIKE_PAIRS: ReadonlyArray<readonly [number, number]> = [
  [2, 3], [2, 4], [2, 5], [2, 6], [2, 8], [3, 4], [3, 6], [3, 9], [3, 12], [4, 6], [4, 8], [4, 12], [6, 12],
];

function lcmOf(a: number, b: number): number {
  return (a * b) / gcd(a, b);
}

export function makeAddUnlikeQuestion(rng: Rng): ChoiceQ {
  let den = 2;
  let den2 = 3;
  let num = 1;
  let num2 = 1;
  let op: "+" | "-" = "+";
  let common = 6;
  let top = 5;
  for (let guard = 0; guard < 80; guard += 1) {
    const pair = rng.pick([...UNLIKE_PAIRS]);
    const flip = rng.next() < 0.5;
    den = flip ? pair[1] : pair[0];
    den2 = flip ? pair[0] : pair[1];
    num = rng.int(1, den - 1);
    num2 = rng.int(1, den2 - 1);
    // Addends come in simplest form, so 6/12 never shows up as a starting fraction.
    if (gcd(num, den) !== 1 || gcd(num2, den2) !== 1) continue;
    op = rng.next() < 0.6 ? "+" : "-";
    common = lcmOf(den, den2);
    const a = num * (common / den);
    const b = num2 * (common / den2);
    if (op === "-" && a <= b) continue;
    top = op === "+" ? a + b : a - b;
    if (top > common) continue;
    break;
  }
  const a = num * (common / den);
  const b = num2 * (common / den2);
  top = op === "+" ? a + b : a - b;
  if (top <= 0 || top > common) {
    den = 2; den2 = 4; num = 1; num2 = 1; op = "+"; common = 4; top = 3;
  }
  const answer = simplestFraction(top, common);
  const sign = op === "+" ? "+" : MINUS;
  const expr = `${num}/${den} ${sign} ${num2}/${den2}`;
  const naiveTop = op === "+" ? num + num2 : Math.abs(num - num2);
  const candidates: [number, number][] = [
    [naiveTop, den + den2],
    [naiveTop, common],
    [naiveTop, Math.max(den, den2)],
    [top + 1, common],
    [top - 1, common],
    [op === "+" ? Math.abs(a - b) : a + b, common],
    [top, common + 1],
  ];
  const pool: string[] = [];
  for (const [n, d] of candidates) {
    if (n <= 0 || d <= 0 || n > d) continue;
    if (sameValue(n, d, top, common)) continue;
    const text = simplestFraction(n, d);
    if (!pool.includes(text) && text !== answer) pool.push(text);
  }
  for (const fallback of ["1/2", "1/3", "2/3", "1/4", "3/4", "1/6", "5/6", "5/12", "7/12", "3/8"]) {
    const [n, d] = fallback.split("/").map(Number) as [number, number];
    if (!sameValue(n, d, top, common) && !pool.includes(fallback)) pool.push(fallback);
  }
  const board: FractionBoard = { game: "fractions", mode: "addUnlike", num, den, num2, den2, op, common };
  return sceneQuestion(rng, {
    game: "fractions",
    title: t(`What is ${mathText(expr)}?`, `¿Cuánto es ${mathText(expr)}?`, `Quanto é ${mathText(expr)}?`, `Combien font ${mathText(expr)} ?`, `${expr}是多少？`, `${mathText(expr)} कितना है?`, `كم يساوي ${mathText(expr)}؟`),
    hint: t(
      "Cut both into same-size parts first. Then add or take away the tops.",
      "Primero parte las dos en partes del mismo tamaño. Luego suma o resta los de arriba.",
      "Primeiro divida as duas em partes do mesmo tamanho. Depois some ou subtraia os de cima.",
      "Coupe d'abord les deux en parts de même taille. Puis ajoute ou retire les numérateurs.",
      "先把两个分数分成一样大的份，再把分子相加或相减。",
      "पहले दोनों को एक जैसे आकार के भागों में बाँटो। फिर ऊपर वाली संख्याएँ जोड़ो या घटाओ।",
      "قسّم الكسرين أولًا إلى أجزاء متساوية الحجم، ثم اجمع البسطين أو اطرحهما.",
    ),
    answer,
    choices: uniqueChoices(rng, answer, pool, pool.slice(0, 2)),
    skill: "fractions:addUnlike",
    tags: ["addUnlike"],
    solved: `${expr} = ${a}/${common} ${sign} ${b}/${common} = ${answer}`,
    picture: expr,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `addUnlike:${expr}`,
  });
}

export function addUnlikeSheet(rng: Rng): { prompt: string; answer: string } {
  const q = makeAddUnlikeQuestion(rng);
  const b = q.visual.kind === "scene" && q.visual.board.game === "fractions" && q.visual.board.mode === "addUnlike" ? q.visual.board : null;
  if (!b) return { prompt: "1/2 + 1/4 =", answer: "3/4" };
  return { prompt: `${b.num}/${b.den} ${b.op === "+" ? "+" : MINUS} ${b.num2}/${b.den2} =`, answer: q.answer };
}

/* ---------- order of operations (5.OA.A.1, 5.OA.A.2) ---------- */

export interface OrderForm {
  /** Printed expression. Parentheses decide the answer. */
  expr: string;
  value: number;
  /** The same numbers with the parentheses ignored, so the multiplication goes first. */
  ignoring: number;
  steps: string[];
}

const PLUS = "+";

/** An expression whose parentheses change the answer. Every result is a whole number from 1 to 100. */
export function rollOrderForm(rng: Rng): OrderForm {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const form = rollOrderOnce(rng);
    if (form.ignoring !== form.value && form.ignoring >= 0 && form.value <= 100 && form.ignoring <= 100) return form;
  }
  return { expr: `(2 ${PLUS} 3) ${TIMES} 4`, value: 20, ignoring: 14, steps: [`2 ${PLUS} 3 = 5`, `5 ${TIMES} 4 = 20`] };
}

function rollOrderOnce(rng: Rng): OrderForm {
  const kind = rng.int(0, 4);
  if (kind === 0) {
    const a = rng.int(1, 9);
    const b = rng.int(1, 9);
    const c = rng.int(2, 9);
    return { expr: `(${a} ${PLUS} ${b}) ${TIMES} ${c}`, value: (a + b) * c, ignoring: a + b * c, steps: [`${a} ${PLUS} ${b} = ${a + b}`, `${a + b} ${TIMES} ${c} = ${(a + b) * c}`] };
  }
  if (kind === 1) {
    const a = rng.int(2, 9);
    const b = rng.int(1, 9);
    const c = rng.int(1, 9);
    return { expr: `${a} ${TIMES} (${b} ${PLUS} ${c})`, value: a * (b + c), ignoring: a * b + c, steps: [`${b} ${PLUS} ${c} = ${b + c}`, `${a} ${TIMES} ${b + c} = ${a * (b + c)}`] };
  }
  if (kind === 2) {
    const b = rng.int(2, 5);
    const c = rng.int(2, 4);
    const a = b * c + rng.int(1, 6);
    return { expr: `(${a} ${MINUS} ${b}) ${TIMES} ${c}`, value: (a - b) * c, ignoring: a - b * c, steps: [`${a} ${MINUS} ${b} = ${a - b}`, `${a - b} ${TIMES} ${c} = ${(a - b) * c}`] };
  }
  if (kind === 3) {
    const a = rng.int(2, 9);
    const c = rng.int(1, 5);
    const b = c + rng.int(1, 5);
    return { expr: `${a} ${TIMES} (${b} ${MINUS} ${c})`, value: a * (b - c), ignoring: a * b - c, steps: [`${b} ${MINUS} ${c} = ${b - c}`, `${a} ${TIMES} ${b - c} = ${a * (b - c)}`] };
  }
  const a = rng.int(1, 6);
  const b = rng.int(1, 6);
  const d = rng.int(1, 5);
  const c = d + rng.int(1, 4);
  return {
    expr: `(${a} ${PLUS} ${b}) ${TIMES} (${c} ${MINUS} ${d})`,
    value: (a + b) * (c - d),
    ignoring: a + b * c - d,
    steps: [`${a} ${PLUS} ${b} = ${a + b}`, `${c} ${MINUS} ${d} = ${c - d}`, `${a + b} ${TIMES} ${c - d} = ${(a + b) * (c - d)}`],
  };
}

function orderBoard(base: Partial<VariableBoard> & Pick<VariableBoard, "expr" | "ask">): VariableBoard {
  return {
    game: "variables",
    mode: "orderOps",
    op: "×",
    extraOp: "+",
    a: 0,
    b: 0,
    c: 0,
    box: "result",
    left: null,
    right: null,
    result: null,
    extra: null,
    ...base,
  };
}

function makeOrderValue(rng: Rng): ChoiceQ {
  const form = rollOrderForm(rng);
  const answer = form.value;
  const board = orderBoard({ expr: form.expr, ask: "value", c: answer, steps: form.steps });
  const near = [answer + 1, answer - 1, answer + 2, answer - 2, answer + 10, answer - 10].filter((n) => n >= 1 && n <= 100 && n !== form.ignoring && n !== answer);
  return sceneQuestion(rng, {
    game: "variables",
    title: t("Solve. Do the parentheses first.", "Resuelve. Primero haz los paréntesis.", "Resolva. Faça primeiro os parênteses.", "Calcule. Fais d'abord les parenthèses.", "计算。先算括号里的。", "हल करो। पहले कोष्ठक का हिसाब करो।", "احسب. ابدأ بما بين القوسين."),
    hint: t("Parentheses first. Then the rest.", "Primero los paréntesis. Luego lo demás.", "Primeiro os parênteses. Depois o resto.", "D'abord les parenthèses. Puis le reste.", "先算括号，再算其他。", "पहले कोष्ठक, फिर बाकी।", "الأقواس أولًا ثم الباقي."),
    answer: String(answer),
    choices: uniqueChoices(rng, String(answer), near.map(String), [String(form.ignoring)]),
    skill: "variables:orderOps",
    tags: ["orderOps"],
    solved: `${mathText(form.expr)} = ${answer}`,
    picture: form.expr,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `orderOps:value:${form.expr}`,
  });
}

interface MatchForm {
  right: string;
  wrong: string[];
  value: number;
  title: string;
  steps: string[];
}

function matchForm(rng: Rng): MatchForm {
  const kind = rng.int(0, 2);
  if (kind === 0) {
    const a = rng.int(2, 9);
    const b = rng.int(2, 9);
    const c = rng.pick([2, 3, 4, 5, 6, 7, 8, 9].filter((n) => n !== a && n !== b));
    return {
      right: `(${a} ${PLUS} ${b}) ${TIMES} ${c}`,
      wrong: [`${a} ${PLUS} ${b} ${TIMES} ${c}`, `(${a} ${PLUS} ${c}) ${TIMES} ${b}`, `${a} ${TIMES} (${b} ${PLUS} ${c})`],
      title: t(
        `Which expression matches? Add ${a} and ${b}, then multiply by ${c}.`,
        `¿Qué expresión coincide? Suma ${a} y ${b}, luego multiplica por ${c}.`,
        `Qual expressão combina? Some ${a} e ${b} e depois multiplique por ${c}.`,
        `Quelle expression correspond ? Ajoute ${a} et ${b}, puis multiplie par ${c}.`,
        `哪个算式对应？先把${a}和${b}相加，再乘${c}。`,
        `कौन सा व्यंजक मेल खाता है? ${a} और ${b} जोड़ो, फिर ${c} से गुणा करो।`,
        `أي تعبير يطابق؟ اجمع ${a} و${b} ثم اضرب في ${c}.`,
      ),
      value: (a + b) * c,
      steps: [`${a} ${PLUS} ${b} = ${a + b}`, `${a + b} ${TIMES} ${c} = ${(a + b) * c}`],
    };
  }
  if (kind === 1) {
    const b = rng.int(2, 5);
    let c = rng.int(2, 4);
    if (c === b) c = c + 1;
    const a = b * c + rng.int(1, 6);
    return {
      right: `(${a} ${MINUS} ${b}) ${TIMES} ${c}`,
      wrong: [`${a} ${MINUS} ${b} ${TIMES} ${c}`, `(${a} ${MINUS} ${c}) ${TIMES} ${b}`, `(${a} ${PLUS} ${b}) ${TIMES} ${c}`],
      title: t(
        `Which expression matches? Subtract ${b} from ${a}, then multiply by ${c}.`,
        `¿Qué expresión coincide? Resta ${b} de ${a}, luego multiplica por ${c}.`,
        `Qual expressão combina? Subtraia ${b} de ${a} e depois multiplique por ${c}.`,
        `Quelle expression correspond ? Retire ${b} de ${a}, puis multiplie par ${c}.`,
        `哪个算式对应？先用${a}减去${b}，再乘${c}。`,
        `कौन सा व्यंजक मेल खाता है? ${a} में से ${b} घटाओ, फिर ${c} से गुणा करो।`,
        `أي تعبير يطابق؟ اطرح ${b} من ${a} ثم اضرب في ${c}.`,
      ),
      value: (a - b) * c,
      steps: [`${a} ${MINUS} ${b} = ${a - b}`, `${a - b} ${TIMES} ${c} = ${(a - b) * c}`],
    };
  }
  const a = rng.int(2, 9);
  const b = rng.int(2, 9);
  const c = rng.pick([2, 3, 4, 5, 6, 7, 8, 9].filter((n) => n !== a && n !== b));
  return {
    right: `${a} ${TIMES} ${b} ${PLUS} ${c}`,
    wrong: [`${a} ${TIMES} (${b} ${PLUS} ${c})`, `(${a} ${PLUS} ${b}) ${TIMES} ${c}`, `${a} ${PLUS} ${b} ${TIMES} ${c}`],
    title: t(
      `Which expression matches? Multiply ${a} by ${b}, then add ${c}.`,
      `¿Qué expresión coincide? Multiplica ${a} por ${b}, luego suma ${c}.`,
      `Qual expressão combina? Multiplique ${a} por ${b} e depois some ${c}.`,
      `Quelle expression correspond ? Multiplie ${a} par ${b}, puis ajoute ${c}.`,
      `哪个算式对应？先把${a}乘${b}，再加${c}。`,
      `कौन सा व्यंजक मेल खाता है? ${a} को ${b} से गुणा करो, फिर ${c} जोड़ो।`,
      `أي تعبير يطابق؟ اضرب ${a} في ${b} ثم أضف ${c}.`,
    ),
    value: a * b + c,
    steps: [`${a} ${TIMES} ${b} = ${a * b}`, `${a * b} ${PLUS} ${c} = ${a * b + c}`],
  };
}

function makeOrderMatch(rng: Rng): ChoiceQ {
  let form = matchForm(rng);
  for (let attempt = 0; attempt < 40 && form.value > 100; attempt += 1) form = matchForm(rng);
  const answer = mathText(form.right);
  const wrong = form.wrong.map(mathText);
  const board = orderBoard({ expr: form.right, ask: "match", c: form.value, steps: form.steps });
  return sceneQuestion(rng, {
    game: "variables",
    title: form.title,
    hint: t(
      "Parentheses hold the step that comes first.",
      "Los paréntesis encierran el paso que va primero.",
      "Os parênteses guardam o passo que vem primeiro.",
      "Les parenthèses entourent l'étape qui vient en premier.",
      "括号里放的是最先做的那一步。",
      "कोष्ठक में वही चरण आता है जो पहले होता है।",
      "الأقواس تضم الخطوة التي تأتي أولًا.",
    ),
    answer,
    choices: uniqueChoices(rng, answer, wrong, wrong),
    skill: "variables:orderOps",
    tags: ["orderOps"],
    solved: answer,
    picture: form.right,
    hands: false,
    quietChoices: true,
    labels: {},
    board,
    factKey: `orderOps:match:${form.right}`,
  });
}

export function makeOrderOpsQuestion(rng: Rng): ChoiceQ {
  return rng.next() < 0.6 ? makeOrderValue(rng) : makeOrderMatch(rng);
}

export function orderOpsSheet(rng: Rng): { prompt: string; answer: string } {
  const form = rollOrderForm(rng);
  return { prompt: `${form.expr} =`, answer: String(form.value) };
}
