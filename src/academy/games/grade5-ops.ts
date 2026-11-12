import type { Rng } from "@/lib/rng";
import { t } from "../i18n";
import type { AddBoard, ShareBoard, TimesBoard } from "./boards";
import { mathText } from "./grade5";
import { sceneQuestion, uniqueChoices } from "./pick";
import { MINUS, TIMES, type ChoiceQ, type SheetItem } from "./types";

/**
 * Grade 5 slice 3 (5.NBT.B): multi-digit multiplication, division with
 * two-digit divisors, and decimal operations to hundredths.
 * Tap-and-think cards. Every card has exactly one right tile and three
 * plausible slips (a missed zero, a carry, a place-value or point slip).
 */

/* ---------- shared number helpers ---------- */

/** `h` is a count of hundredths. Prints the shortest exact decimal: 705 → "7.05", 270 → "2.7", 300 → "3". */
export function hundredthsText(h: number): string {
  const whole = Math.floor(h / 100);
  const frac = h % 100;
  if (frac === 0) return String(whole);
  if (frac % 10 === 0) return `${whole}.${frac / 10}`;
  return `${whole}.${String(frac).padStart(2, "0")}`;
}

/** Digits after the point in the shortest form. */
export function decimalPlaces(h: number): 0 | 1 | 2 {
  if (h % 100 === 0) return 0;
  return h % 10 === 0 ? 1 : 2;
}

/** Place parts of a whole number, biggest first, zeros dropped: 347 → [300, 40, 7]. */
export function placeParts(n: number): number[] {
  const parts: number[] = [];
  let unit = 1;
  let rest = n;
  while (rest > 0) {
    const digit = rest % 10;
    if (digit > 0) parts.unshift(digit * unit);
    rest = Math.floor(rest / 10);
    unit *= 10;
  }
  return parts;
}

function textChoices(rng: Rng, answer: string, pool: readonly (string | null)[], pinned: readonly (string | null)[]): string[] {
  const clean = (items: readonly (string | null)[]) => items.filter((item): item is string => item != null && item !== answer);
  return uniqueChoices(rng, answer, clean(pool), clean(pinned));
}

/* ---------- multi-digit multiplication (5.NBT.B.5) ---------- */

/** Grade 5 multiply: 2-digit × 2-digit or 3-digit × 2-digit. Neither factor is a multiple of 10. */
export const BIG_MULTI_MAX = { a: 999, b: 99, product: 99_999 } as const;

function rollBigMulti(rng: Rng): { a: number; b: number } {
  for (let guard = 0; guard < 40; guard += 1) {
    const three = rng.next() < 0.55;
    const a = three ? rng.int(102, 489) : rng.int(23, 98);
    const b = three ? rng.int(12, 39) : rng.int(12, 89);
    if (a % 10 === 0 || b % 10 === 0) continue;
    if (a * b > BIG_MULTI_MAX.product) continue;
    return { a, b };
  }
  return { a: 247, b: 36 };
}

export function makeBigMultiQuestion(rng: Rng): ChoiceQ {
  const { a, b } = rollBigMulti(rng);
  const product = a * b;
  const ones = b % 10;
  const tens = Math.floor(b / 10);
  // The classic slip: the tens row is written without its zero.
  const noShift = a * ones + a * tens;
  const carry = rng.next() < 0.5 ? product + 100 : product - 100;
  const answer = String(product);
  const expr = `${a} ${TIMES} ${b}`;
  const board: TimesBoard = { game: "times", mode: "bigMulti", a, b };
  const pool = [product + a, product - a, a * (b + 10), a * (b - 10), product + 1000, product - 1000, product + 10, noShift].filter((n) => n > 0).map(String);
  return sceneQuestion(rng, {
    game: "times",
    title: t(`What is ${mathText(expr)}?`, `¿Cuánto es ${mathText(expr)}?`, `Quanto é ${mathText(expr)}?`, `Combien font ${mathText(expr)} ?`, `${expr}是多少？`, `${mathText(expr)} कितना है?`, `كم يساوي ${mathText(expr)}؟`),
    hint: t(
      "Split each number by place. Multiply the parts, then add them.",
      "Separa cada número por lugares. Multiplica las partes y luego súmalas.",
      "Separe cada número por posições. Multiplique as partes e depois some.",
      "Décompose chaque nombre par rang. Multiplie les parties, puis additionne-les.",
      "把每个数按数位拆开。先把各部分相乘，再相加。",
      "हर संख्या को स्थान के अनुसार तोड़ो। भागों का गुणा करो, फिर जोड़ो।",
      "جزّئ كل عدد حسب المنازل. اضرب الأجزاء، ثم اجمعها.",
    ),
    answer,
    choices: textChoices(rng, answer, pool, [String(carry), rng.next() < 0.5 ? String(noShift) : String(product + a)]),
    skill: "times:bigMulti",
    tags: ["bigMulti"],
    solved: `${expr} = ${product}`,
    picture: expr,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `bigMulti:${a}x${b}`,
  });
}

export function bigMultiSheet(rng: Rng): SheetItem {
  const { a, b } = rollBigMulti(rng);
  return { prompt: `${a} ${TIMES} ${b} =`, answer: String(a * b) };
}

/* ---------- division with two-digit divisors (5.NBT.B.6) ---------- */

/** Up to four-digit dividends, two-digit divisors 11–49 (not 20, 30, 40), whole-number quotients. */
export const LONG_DIV_RANGE = { divisorMin: 11, divisorMax: 49, dividendMax: 9999, quotientMin: 10, quotientMax: 99 } as const;

export function rollLongDiv(rng: Rng): { total: number; divisor: number; quotient: number; remainder: number } {
  for (let guard = 0; guard < 60; guard += 1) {
    const divisor = rng.int(LONG_DIV_RANGE.divisorMin, LONG_DIV_RANGE.divisorMax);
    if (divisor % 10 === 0) continue;
    const quotient = rng.next() < 0.45 ? rng.int(10, 40) : rng.int(21, 99);
    if (quotient % 10 === 0) continue;
    const remainder = rng.next() < 0.45 ? 0 : rng.int(1, divisor - 1);
    const total = divisor * quotient + remainder;
    if (total < 100 || total > LONG_DIV_RANGE.dividendMax) continue;
    return { total, divisor, quotient, remainder };
  }
  return { total: 864, divisor: 24, quotient: 36, remainder: 0 };
}

export function remainderText(quotient: number, remainder: number): string {
  return remainder === 0 ? String(quotient) : `${quotient} remainder ${remainder}`;
}

function longDivTitle(rng: Rng, total: number, divisor: number, remainder: number): string {
  const expr = `${total} ÷ ${divisor}`;
  if (rng.next() < 0.4) {
    return t(`What is ${mathText(expr)}?`, `¿Cuánto es ${mathText(expr)}?`, `Quanto é ${mathText(expr)}?`, `Combien font ${mathText(expr)} ?`, `${expr}是多少？`, `${mathText(expr)} कितना है?`, `كم يساوي ${mathText(expr)}؟`);
  }
  if (remainder === 0) {
    return t(
      `The bakery packs ${total} cookies into boxes of ${divisor}. How many boxes?`,
      `La panadería empaca ${total} galletas en cajas de ${divisor}. ¿Cuántas cajas?`,
      `A padaria embala ${total} biscoitos em caixas de ${divisor}. Quantas caixas?`,
      `La boulangerie range ${total} biscuits dans des boîtes de ${divisor}. Combien de boîtes ?`,
      `面包店把${total}块饼干装进盒子，每盒${divisor}块。一共装几盒？`,
      `बेकरी ${total} बिस्कुट ${divisor}-${divisor} के डिब्बों में भरती है। कितने डिब्बे?`,
      `في المخبز بسكويت عدده ${total}، ويُعبّأ في علب تتسع كل منها لـ ${divisor}. كم علبة؟`,
    );
  }
  return t(
    `The bakery packs ${total} cookies into boxes of ${divisor}. How many full boxes, and how many are left?`,
    `La panadería empaca ${total} galletas en cajas de ${divisor}. ¿Cuántas cajas llenas y cuántas sobran?`,
    `A padaria embala ${total} biscoitos em caixas de ${divisor}. Quantas caixas cheias e quantos sobram?`,
    `La boulangerie range ${total} biscuits dans des boîtes de ${divisor}. Combien de boîtes pleines, et combien en reste-t-il ?`,
    `面包店把${total}块饼干装进盒子，每盒${divisor}块。能装满几盒？还剩几块？`,
    `बेकरी ${total} बिस्कुट ${divisor}-${divisor} के डिब्बों में भरती है। कितने भरे डिब्बे, और कितने बचे?`,
    `في المخبز بسكويت عدده ${total}، ويُعبّأ في علب تتسع كل منها لـ ${divisor}. كم علبة ممتلئة، وكم يبقى؟`,
  );
}

export function makeLongDivQuestion(rng: Rng): ChoiceQ {
  const { total, divisor, quotient, remainder } = rollLongDiv(rng);
  const answer = remainderText(quotient, remainder);
  const board: ShareBoard = { game: "share", mode: "longDiv", total, plates: divisor, each: quotient, leftover: remainder };
  let pool: string[];
  let pinned: string[];
  if (remainder === 0) {
    pool = [quotient + 1, quotient - 1, quotient + 10, quotient - 10, quotient + 2, quotient * 10].filter((n) => n > 0).map(String);
    pinned = [String(rng.next() < 0.5 ? quotient + 1 : quotient - 1), String(quotient + 10)];
  } else {
    const nudge = remainder + 1 < divisor ? remainder + 1 : remainder - 1;
    pool = [
      remainderText(quotient + 1, remainder),
      remainderText(quotient - 1, remainder),
      nudge > 0 ? remainderText(quotient, nudge) : null,
      // A leftover bigger than the divisor means one more box fits.
      remainderText(quotient - 1, remainder + divisor),
      remainderText(quotient + 10, remainder),
    ].filter((item): item is string => item != null);
    pinned = [remainderText(quotient - 1, remainder + divisor), remainderText(quotient + 1, remainder)];
  }
  return sceneQuestion(rng, {
    game: "share",
    title: longDivTitle(rng, total, divisor, remainder),
    hint: t(
      `How many ${divisor}s fit? Try ${divisor} × 10 first.`,
      `¿Cuántos ${divisor} caben? Prueba primero ${divisor} × 10.`,
      `Quantos ${divisor} cabem? Tente primeiro ${divisor} × 10.`,
      `Combien de fois ${divisor} ? Essaie d'abord ${divisor} × 10.`,
      `能装下几个${divisor}？先试试${divisor} × 10。`,
      `${divisor} कितनी बार आता है? पहले ${divisor} × 10 आज़माओ।`,
      `كم مرة يدخل ${divisor}؟ جرّب أولًا ${mathText(`${divisor} × 10`)}.`,
    ),
    answer,
    choices: textChoices(rng, answer, pool, pinned),
    skill: "share:longDiv",
    tags: ["share", "longDiv"],
    solved: `${total} ÷ ${divisor} = ${answer}`,
    picture: `${total} ÷ ${divisor}`,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `longDiv:${total}/${divisor}`,
  });
}

export function longDivSheet(rng: Rng): SheetItem {
  const { total, divisor, quotient, remainder } = rollLongDiv(rng);
  return { prompt: `${total} ÷ ${divisor} =`, answer: remainderText(quotient, remainder) };
}

/* ---------- decimal operations to hundredths (5.NBT.B.7) ---------- */

/** Every value is a count of hundredths. Sums, differences, and products stay under 100. */
export const DECIMAL_OPS_MAX = 9999;

export type DecimalOp = "+" | "-" | "×" | "÷";

function rollDecimal(rng: Rng, lo: number, hi: number, places: 1 | 2): number {
  for (let guard = 0; guard < 30; guard += 1) {
    const h = places === 1 ? rng.int(Math.ceil(lo / 10), Math.floor(hi / 10)) * 10 : rng.int(lo, hi);
    if (decimalPlaces(h) === places) return h;
  }
  return places === 1 ? 270 : 345;
}

export interface DecimalFact {
  op: DecimalOp;
  left: number;
  right: number;
  result: number;
  /** 10 when the think-it-through step counts tenths, 100 for hundredths. */
  unit: 10 | 100;
  /** Wrong answers a child really makes, in hundredths. */
  slips: number[];
}

function rollAddSub(rng: Rng, op: "+" | "-"): DecimalFact {
  const leftPlaces: 1 | 2 = rng.next() < 0.6 ? 2 : 1;
  const rightPlaces: 1 | 2 = leftPlaces === 2 ? (rng.next() < 0.55 ? 1 : 2) : 2;
  for (let guard = 0; guard < 40; guard += 1) {
    const big = rollDecimal(rng, 120, 4999, leftPlaces);
    const small = rollDecimal(rng, 11, 1999, rightPlaces);
    if (op === "+") {
      const result = big + small;
      if (result > DECIMAL_OPS_MAX || decimalPlaces(result) === 0) continue;
      // Lining up the last digits instead of the points reads 2.7 as 0.27.
      const misaligned = rightPlaces === 1 && leftPlaces === 2 ? big + small / 10 : leftPlaces === 1 && rightPlaces === 2 ? big / 10 + small : result + 100;
      return { op, left: big, right: small, result, unit: 100, slips: [misaligned, result + 10, result - 10, result + 100, result - 100] };
    }
    if (small >= big) continue;
    const result = big - small;
    if (decimalPlaces(result) === 0) continue;
    const misaligned = rightPlaces === 1 && leftPlaces === 2 ? big - small / 10 : leftPlaces === 1 && rightPlaces === 2 ? big / 10 - small : result - 100;
    return { op, left: big, right: small, result, unit: 100, slips: [misaligned, result + 10, result - 10, result + 100, result - 100] };
  }
  return { op: "+", left: 345, right: 270, result: 615, unit: 100, slips: [372, 625, 605, 715, 515] };
}

function rollTimes(rng: Rng): DecimalFact {
  if (rng.next() < 0.4) {
    // Tenths times tenths lands on hundredths: 0.3 × 0.4 = 0.12.
    const a = rng.int(2, 9);
    const b = rng.int(2, 9);
    const result = a * b;
    return { op: "×", left: a * 10, right: b * 10, result, unit: 100, slips: [result * 10, (a + b) * 10, result + 1, result * 100] };
  }
  for (let guard = 0; guard < 40; guard += 1) {
    const places: 1 | 2 = rng.next() < 0.5 ? 1 : 2;
    const left = rollDecimal(rng, 12, 999, places);
    const whole = rng.int(2, 9);
    const result = left * whole;
    if (result > DECIMAL_OPS_MAX || decimalPlaces(result) === 0) continue;
    return { op: "×", left, right: whole * 100, result, unit: places === 1 ? 10 : 100, slips: [result * 10, result + left, result - left, places === 1 ? result + 10 : result + 1, result % 10 === 0 ? result / 10 : result + 100] };
  }
  return { op: "×", left: 235, right: 300, result: 705, unit: 100, slips: [7050, 940, 470, 706, 805] };
}

function rollDivide(rng: Rng): DecimalFact {
  if (rng.next() < 0.35) {
    // Dividing by tenths: how many 0.4s fit in 2.8? A whole-number answer.
    const d = rng.int(2, 9);
    const q = rng.int(2, 12);
    const left = q * d * 10;
    const result = q * 100;
    return { op: "÷", left, right: d * 10, result, unit: 10, slips: [q * 10, q * 1000, result + 100, result - 100] };
  }
  for (let guard = 0; guard < 40; guard += 1) {
    const places: 1 | 2 = rng.next() < 0.55 ? 1 : 2;
    const result = rollDecimal(rng, 11, 999, places);
    const whole = rng.int(2, 9);
    const left = result * whole;
    if (left > DECIMAL_OPS_MAX) continue;
    return { op: "÷", left, right: whole * 100, result, unit: places === 1 ? 10 : 100, slips: [result * 10, places === 1 ? result + 10 : result + 1, places === 1 ? result - 10 : result - 1, result % 10 === 0 ? result / 10 : result + 100] };
  }
  return { op: "÷", left: 480, right: 400, result: 120, unit: 10, slips: [1200, 130, 110, 12] };
}

export function rollDecimalFact(rng: Rng): DecimalFact {
  const roll = rng.next();
  if (roll < 0.3) return rollAddSub(rng, "+");
  if (roll < 0.55) return rollAddSub(rng, "-");
  if (roll < 0.8) return rollTimes(rng);
  return rollDivide(rng);
}

export function decimalExpr(fact: Pick<DecimalFact, "op" | "left" | "right">): string {
  const sign = fact.op === "-" ? MINUS : fact.op;
  return `${hundredthsText(fact.left)} ${sign} ${hundredthsText(fact.right)}`;
}

function decimalHint(fact: DecimalFact): string {
  if (fact.op === "+" || fact.op === "-") {
    return t(
      "Line up the decimal points. Then work place by place.",
      "Alinea los puntos decimales. Luego trabaja lugar por lugar.",
      "Alinhe as vírgulas. Depois trabalhe posição por posição.",
      "Aligne les virgules. Puis travaille rang par rang.",
      "先对齐小数点，再一位一位地算。",
      "दशमलव बिंदु एक सीध में रखो। फिर हर स्थान पर काम करो।",
      "رتّب الفواصل العشرية فوق بعضها، ثم احسب منزلة بعد منزلة.",
    );
  }
  if (fact.unit === 10) {
    return t(
      "Think in tenths. Then put the point back.",
      "Piensa en décimos. Luego vuelve a poner el punto.",
      "Pense em décimos. Depois coloque a vírgula de volta.",
      "Pense en dixièmes. Puis remets la virgule.",
      "先想成十分之几来算，再把小数点放回去。",
      "दशांश में सोचो। फिर दशमलव बिंदु वापस लगाओ।",
      "فكّر بالأعشار، ثم أعد الفاصلة إلى مكانها.",
    );
  }
  return t(
    "Think in hundredths. Then put the point back.",
    "Piensa en centésimos. Luego vuelve a poner el punto.",
    "Pense em centésimos. Depois coloque a vírgula de volta.",
    "Pense en centièmes. Puis remets la virgule.",
    "先想成百分之几来算，再把小数点放回去。",
    "शतांश में सोचो। फिर दशमलव बिंदु वापस लगाओ।",
    "فكّر بالأجزاء من المئة، ثم أعد الفاصلة إلى مكانها.",
  );
}

export function makeDecimalOpsQuestion(rng: Rng): ChoiceQ {
  const fact = rollDecimalFact(rng);
  const expr = decimalExpr(fact);
  const answer = hundredthsText(fact.result);
  const slips = fact.slips.filter((n) => Number.isInteger(n) && n > 0 && n !== fact.result).map(hundredthsText);
  const extra = [fact.result + 1, fact.result + 10, fact.result - 10, fact.result + 100].filter((n) => n > 0).map(hundredthsText);
  const board: AddBoard = { game: "add", mode: "decimalOps", op: fact.op, left: fact.left, right: fact.right, result: fact.result, unit: fact.unit };
  return sceneQuestion(rng, {
    game: "add",
    title: t(`What is ${mathText(expr)}?`, `¿Cuánto es ${mathText(expr)}?`, `Quanto é ${mathText(expr)}?`, `Combien font ${mathText(expr)} ?`, `${expr}是多少？`, `${mathText(expr)} कितना है?`, `كم يساوي ${mathText(expr)}؟`),
    hint: decimalHint(fact),
    answer,
    choices: textChoices(rng, answer, [...slips, ...extra], slips.slice(0, 2)),
    skill: "add:decimalOps",
    tags: ["decimalOps", fact.op === "+" ? "plus" : fact.op === "-" ? "minus" : fact.op === "×" ? "times" : "divide"],
    solved: `${expr} = ${answer}`,
    picture: expr,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `decimalOps:${expr}`,
  });
}

export function decimalOpsSheet(rng: Rng): SheetItem {
  const fact = rollDecimalFact(rng);
  return { prompt: `${decimalExpr(fact)} =`, answer: hundredthsText(fact.result) };
}

/* ---------- the think-it-through step for × and ÷ ---------- */

export function tenthsWord(): string {
  return t("tenths", "décimos", "décimos", "dixièmes", "十分之几", "दशांश", "الأعشار");
}

export function hundredthsWord(): string {
  return t("hundredths", "centésimos", "centésimos", "centièmes", "百分之几", "शतांश", "الأجزاء من المئة");
}

/**
 * Whole-number version of a decimal × or ÷: 2.35 × 3 → 235 × 3 = 705 (hundredths),
 * 4.8 ÷ 4 → 48 ÷ 4 = 12 (tenths), 2.8 ÷ 0.4 → 28 ÷ 4 = 7, 0.3 × 0.4 → 3 × 4 = 12 (hundredths).
 */
export function decimalThink(board: Pick<AddBoard, "op" | "left" | "right" | "result" | "unit">): { left: number; right: number; result: number; line: string } {
  const wholeRight = board.right % 100 === 0;
  const scale = 100 / board.unit;
  let left = board.left / scale;
  let right = board.right / 100;
  let result = board.result / scale;
  if (!wholeRight && board.op === "×") {
    left = board.left / 10;
    right = board.right / 10;
    result = board.result;
  } else if (!wholeRight && board.op === "÷") {
    left = board.left / 10;
    right = board.right / 10;
    result = board.result / 100;
  }
  const sign = board.op === "÷" ? "÷" : TIMES;
  return { left, right, result, line: `${left} ${sign} ${right} = ${result}` };
}
