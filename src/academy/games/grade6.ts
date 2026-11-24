import type { Rng } from "@/lib/rng";
import { getLocale, t } from "../i18n";
import type { FractionBoard, PatternBoard, VariableBoard } from "./boards";
import { nearChoices, sceneQuestion, uniqueChoices } from "./pick";
import type { ChoiceQ, SheetItem } from "./types";

/**
 * Grade 6 slice 1: evaluate expressions with a letter and match equivalents
 * (6.EE.A), small whole-number exponents (6.EE.A.1), divide fractions
 * (6.NS.A), and GCF / LCM (6.NS.B). Small friendly numbers. No negatives.
 */

const LRI = "\u2066";
const PDI = "\u2069";

const SUPER: Record<string, string> = {
  "0": "\u2070",
  "1": "\u00b9",
  "2": "\u00b2",
  "3": "\u00b3",
  "4": "\u2074",
  "5": "\u2075",
  "6": "\u2076",
  "7": "\u2077",
  "8": "\u2078",
  "9": "\u2079",
};

/** Print 7^2 as 7² in titles, hints, and praise. Board expr stays on a caret. */
export function powerPretty(base: number, exp: number): string {
  const expText = String(exp).replace(/[0-9]/g, (digit) => SUPER[digit] ?? digit);
  return `${base}${expText}`;
}

export function prettyExponents(text: string): string {
  return text.replace(/(\d+)\^(\d+)/g, (_full, base: string, exp: string) => powerPretty(Number(base), Number(exp)));
}

export function mathText(text: string): string {
  const pretty = prettyExponents(text);
  return getLocale() === "ar" ? `${LRI}${pretty}${PDI}` : pretty;
}

/** Short pal line on a grade 6 expressions or exponents card. */
export function exprPalLine(board: Pick<VariableBoard, "mode" | "ask" | "letter">): string {
  if (board.mode === "exponents") {
    return t(
      "Multiply it by itself.",
      "Multiplícalo por sí mismo.",
      "Multiplique por ele mesmo.",
      "Multiplie-le par lui-même.",
      "把它乘自己一次。",
      "इसे अपने से गुणा करो।",
      "اضربه في نفسه.",
    );
  }
  if (board.ask === "match") {
    return t(
      "Count the letters.",
      "Cuenta las letras.",
      "Conte as letras.",
      "Compte les lettres.",
      "数一数字母。",
      "अक्षर गिनो।",
      "عُدّ الحروف.",
    );
  }
  return t(
    "Swap in the number for the letter.",
    "Cambia la letra por el número.",
    "Troque a letra pelo número.",
    "Remplace la lettre par le nombre.",
    "把字母换成数字。",
    "अक्षर की जगह संख्या रखो।",
    "بدّل الحرف بالعدد.",
  );
}

export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.trunc(a));
  let y = Math.abs(Math.trunc(b));
  while (y) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x;
}

export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / gcd(a, b);
}

export type ExprAsk = "value" | "match";

export interface ExprForm {
  expr: string;
  value: number;
  letter: string;
  letterValue: number;
  steps: string[];
  ask: ExprAsk;
  choices?: string[];
  answer: string;
}

const LETTERS = ["x", "n", "y"] as const;

function boardFrom(form: ExprForm, mode: "exprEval" | "exponents"): VariableBoard {
  return {
    game: "variables",
    mode,
    op: "×",
    extraOp: "+",
    a: form.letterValue,
    b: 0,
    c: form.value,
    box: "result",
    left: form.letterValue,
    right: 0,
    result: form.value,
    extra: null,
    expr: form.expr,
    ask: form.ask,
    steps: form.steps,
    letter: form.letter,
  };
}

function evalHint(): string {
  return t(
    "Replace the letter with the number, then multiply and add.",
    "Cambia la letra por el número, luego multiplica y suma.",
    "Troque a letra pelo número, depois multiplique e some.",
    "Remplace la lettre par le nombre, puis multiplie et additionne.",
    "先把字母换成数字，再乘、再加。",
    "अक्षर की जगह संख्या रखो, फिर गुणा और जोड़ करो।",
    "بدّل الحرف بالعدد، ثم اضرب واجمع.",
  );
}

function matchHint(): string {
  return t(
    "The same expression can look different. Try distributing or combining.",
    "La misma expresión puede verse distinta. Prueba a distribuir o juntar.",
    "A mesma expressão pode parecer diferente. Tente distribuir ou juntar.",
    "La même expression peut avoir un autre visage. Essaie de distribuer ou de regrouper.",
    "同一个式子可以写成不同的样子。试着展开或合并。",
    "एक ही व्यंजक अलग दिख सकता है। बांटो या जोड़कर देखो।",
    "يمكن أن تبدو العبارة نفسها بشكل مختلف. جرّب التوزيع أو الجمع.",
  );
}

function expHint(): string {
  return prettyExponents(
    t(
      "An exponent tells how many times to multiply the base by itself. 2^3 means 2 × 2 × 2.",
      "El exponente dice cuántas veces se multiplica la base por sí misma. 2^3 significa 2 × 2 × 2.",
      "O expoente diz quantas vezes multiplicar a base por ela mesma. 2^3 significa 2 × 2 × 2.",
      "L'exposant dit combien de fois multiplier la base par elle-même. 2^3 veut dire 2 × 2 × 2.",
      "指数告诉你底数要乘自己几次。2^3 就是 2 × 2 × 2。",
      "घातांक बताता है कि आधार को अपने से कितनी बार गुणा करना है। 2^3 का मतलब 2 × 2 × 2 है।",
      "الأس يقول كم مرة نضرب الأساس في نفسه. 2^3 يعني 2 × 2 × 2.",
    ),
  );
}

function divHint(divNum: number, divDen: number, den: number, num: number): string {
  const piece = `${divNum}/${divDen}`;
  const whole = `${num}/${den}`;
  return t(
    `How many ${piece}s fit in ${whole}?`,
    `¿Cuántos ${piece} caben en ${whole}?`,
    `Quantos ${piece} cabem em ${whole}?`,
    `Combien de ${piece} tiennent dans ${whole} ?`,
    `${whole}里面能放下几个${piece}？`,
    `${whole} में कितने ${piece} समाते हैं?`,
    `كم ${piece} يدخل في ${whole}؟`,
  );
}

function gcfHint(): string {
  return t(
    "The greatest common factor is the biggest number that divides both.",
    "El máximo común divisor es el número más grande que divide a ambos.",
    "O máximo divisor comum é o maior número que divide os dois.",
    "Le plus grand commun diviseur est le plus grand nombre qui divise les deux.",
    "最大公因数是能同时整除这两个数的最大的数。",
    "महत्तम समापवर्तक वह सबसे बड़ी संख्या है जो दोनों को भाग देती है।",
    "العامل المشترك الأكبر هو أكبر عدد يقسم العددين معًا.",
  );
}

function lcmHint(): string {
  return t(
    "The least common multiple is the smallest number that both go into.",
    "El mínimo común múltiplo es el número más pequeño en el que caben ambos.",
    "O mínimo múltiplo comum é o menor número em que os dois cabem.",
    "Le plus petit commun multiple est le plus petit nombre que les deux atteignent.",
    "最小公倍数是这两个数都能整除的最小的数。",
    "लघुत्तम समापवर्त्य वह सबसे छोटी संख्या है जिसमें दोनों समाते हैं।",
    "المضاعف المشترك الأصغر هو أصغر عدد يدخل فيه العددان معًا.",
  );
}

function rollValueForm(rng: Rng): ExprForm {
  const letter = rng.pick([...LETTERS]);
  const x = rng.int(2, 6);
  const kind = rng.int(0, 3);
  if (kind === 0) {
    const a = rng.int(2, 5);
    const expr = `${a}${letter}`;
    const value = a * x;
    return {
      expr,
      value,
      letter,
      letterValue: x,
      ask: "value",
      answer: String(value),
      steps: [`${a} × ${x} = ${value}`],
    };
  }
  if (kind === 1) {
    const b = rng.int(1, 9);
    const expr = `${letter} + ${b}`;
    const value = x + b;
    return {
      expr,
      value,
      letter,
      letterValue: x,
      ask: "value",
      answer: String(value),
      steps: [`${x} + ${b} = ${value}`],
    };
  }
  if (kind === 2) {
    const a = rng.int(2, 5);
    const b = rng.int(1, 5);
    const expr = `${a}(${letter} + ${b})`;
    const inner = x + b;
    const value = a * inner;
    return {
      expr,
      value,
      letter,
      letterValue: x,
      ask: "value",
      answer: String(value),
      steps: [`${letter} + ${b} = ${x} + ${b} = ${inner}`, `${a} × ${inner} = ${value}`],
    };
  }
  const a = rng.int(2, 5);
  const b = rng.int(1, 9);
  const expr = `${a}${letter} + ${b}`;
  const product = a * x;
  const value = product + b;
  return {
    expr,
    value,
    letter,
    letterValue: x,
    ask: "value",
    answer: String(value),
    steps: [`${a} × ${x} = ${product}`, `${product} + ${b} = ${value}`],
  };
}

interface MatchItem {
  given: string;
  answer: string;
  slips: string[];
}

function matchBank(letter: string): MatchItem[] {
  return [
    { given: `3(${letter} + 2)`, answer: `3${letter} + 6`, slips: [`3${letter} + 2`, `3 + ${letter} + 2`, `3${letter} + 5`] },
    { given: `2(${letter} + 4)`, answer: `2${letter} + 8`, slips: [`2${letter} + 4`, `2 + ${letter} + 4`, `2${letter} + 6`] },
    { given: `4(${letter} + 1)`, answer: `4${letter} + 4`, slips: [`4${letter} + 1`, `4 + ${letter} + 1`, `4${letter} + 5`] },
    { given: `5(${letter} + 3)`, answer: `5${letter} + 15`, slips: [`5${letter} + 3`, `5 + ${letter} + 3`, `5${letter} + 8`] },
    { given: `2${letter} + 2${letter}`, answer: `4${letter}`, slips: [`2${letter}`, `2${letter} + 2`, `8${letter}`] },
    { given: `${letter} + ${letter} + ${letter}`, answer: `3${letter}`, slips: [`${letter} + 3`, `2${letter}`, `3 + ${letter}`] },
    { given: `2${letter} + 5 + 1`, answer: `2${letter} + 6`, slips: [`2${letter} + 5`, `3${letter} + 5`, `2${letter} + 4`] },
    { given: `${letter} + 3 + ${letter}`, answer: `2${letter} + 3`, slips: [`${letter} + 3`, `2${letter} + 6`, `${letter} + ${letter} + 3 + 3`] },
  ];
}

function rollMatchForm(rng: Rng): ExprForm {
  const letter = rng.pick([...LETTERS]);
  const item = rng.pick(matchBank(letter));
  return {
    expr: item.given,
    value: 0,
    letter,
    letterValue: 0,
    ask: "match",
    answer: item.answer,
    choices: item.slips,
    steps: [item.answer],
  };
}

export function rollExprForm(rng: Rng): ExprForm {
  return rng.next() < 0.55 ? rollValueForm(rng) : rollMatchForm(rng);
}

export function makeExprEvalQuestion(rng: Rng): ChoiceQ {
  const form = rollExprForm(rng);
  const board = boardFrom(form, "exprEval");
  const title =
    form.ask === "match"
      ? t(
          `Which expression is the same as ${mathText(form.expr)}?`,
          `¿Qué expresión es igual a ${mathText(form.expr)}?`,
          `Qual expressão é igual a ${mathText(form.expr)}?`,
          `Quelle expression est la même que ${mathText(form.expr)} ?`,
          `哪个式子和${mathText(form.expr)}一样？`,
          `कौन सा व्यंजक ${mathText(form.expr)} के बराबर है?`,
          `أي عبارة تساوي ${mathText(form.expr)}؟`,
        )
      : t(
          `What is ${mathText(form.expr)} when ${form.letter} = ${form.letterValue}?`,
          `¿Cuánto vale ${mathText(form.expr)} cuando ${form.letter} = ${form.letterValue}?`,
          `Quanto vale ${mathText(form.expr)} quando ${form.letter} = ${form.letterValue}?`,
          `Combien vaut ${mathText(form.expr)} quand ${form.letter} = ${form.letterValue} ?`,
          `${form.letter} = ${form.letterValue} 时，${mathText(form.expr)} 等于多少？`,
          `${form.letter} = ${form.letterValue} हो तो ${mathText(form.expr)} कितना है?`,
          `كم يساوي ${mathText(form.expr)} عندما ${form.letter} = ${form.letterValue}؟`,
        );
  const choices =
    form.ask === "match"
      ? uniqueChoices(rng, form.answer, form.choices ?? [])
      : nearChoices(rng, form.value, 0, 80, [form.value + 1, Math.max(0, form.value - 1), form.letterValue]);
  const solved =
    form.ask === "match"
      ? t(
          `${mathText(form.expr)} is the same as ${mathText(form.answer)}`,
          `${mathText(form.expr)} es igual a ${mathText(form.answer)}`,
          `${mathText(form.expr)} é igual a ${mathText(form.answer)}`,
          `${mathText(form.expr)} est la même que ${mathText(form.answer)}`,
          `${mathText(form.expr)} 和 ${mathText(form.answer)} 一样`,
          `${mathText(form.expr)} ${mathText(form.answer)} के बराबर है`,
          `${mathText(form.expr)} يساوي ${mathText(form.answer)}`,
        )
      : t(
          `When ${form.letter} = ${form.letterValue}, ${mathText(form.expr)} = ${form.value}`,
          `Cuando ${form.letter} = ${form.letterValue}, ${mathText(form.expr)} = ${form.value}`,
          `Quando ${form.letter} = ${form.letterValue}, ${mathText(form.expr)} = ${form.value}`,
          `Quand ${form.letter} = ${form.letterValue}, ${mathText(form.expr)} = ${form.value}`,
          `${form.letter} = ${form.letterValue} 时，${mathText(form.expr)} = ${form.value}`,
          `${form.letter} = ${form.letterValue} हो तो ${mathText(form.expr)} = ${form.value}`,
          `عندما ${form.letter} = ${form.letterValue}، ${mathText(form.expr)} = ${form.value}`,
        );
  return sceneQuestion(rng, {
    game: "variables",
    title,
    hint: form.ask === "match" ? matchHint() : evalHint(),
    answer: form.answer,
    choices,
    skill: "variables:exprEval",
    tags: ["exprEval", form.ask],
    solved,
    picture: form.expr,
    hands: false,
    quietChoices: form.ask === "match",
    labels: {},
    board,
    factKey: `exprEval:${form.ask}:${form.expr}:${form.letterValue}:${form.answer}`,
  });
}

export function exprEvalSheet(rng: Rng): SheetItem {
  const form = rollValueForm(rng);
  return { prompt: `${form.expr} when ${form.letter} = ${form.letterValue}`, answer: String(form.value) };
}

/** Base, exponent, and value. All whole and friendly. */
export const EXPONENT_FACTS: readonly [number, number, number][] = [
  [2, 2, 4],
  [2, 3, 8],
  [2, 4, 16],
  [2, 5, 32],
  [3, 2, 9],
  [3, 3, 27],
  [4, 2, 16],
  [4, 3, 64],
  [5, 2, 25],
  [5, 3, 125],
  [6, 2, 36],
  [7, 2, 49],
  [8, 2, 64],
  [9, 2, 81],
  [10, 2, 100],
];

export function powerText(base: number, exp: number): string {
  return `${base}^${exp}`;
}

export function powerProduct(base: number, exp: number): string {
  return Array.from({ length: exp }, () => String(base)).join(" × ");
}

export function exponentSlips(base: number, exp: number, value: number): number[] {
  const pool: number[] = [];
  const add = (n: number) => {
    if (Number.isInteger(n) && n > 0 && n !== value && n <= 200 && !pool.includes(n)) pool.push(n);
  };
  add(base * exp);
  add(base + exp);
  if (exp > 1) add(base ** (exp - 1));
  add(base ** (exp + 1));
  if (base > 1) add((base - 1) ** exp);
  add((base + 1) ** exp);
  add(value + 1);
  add(value - 1);
  add(value + base);
  add(value - base);
  add(base * (exp + 1));
  add(base * 10);
  return pool;
}

export function rollExponentForm(rng: Rng): ExprForm {
  const [base, exp, value] = rng.pick([...EXPONENT_FACTS]);
  const expr = powerText(base, exp);
  const product = powerProduct(base, exp);
  const slips = exponentSlips(base, exp, value).map(String);
  if (rng.next() < 0.45) {
    return {
      expr,
      value,
      letter: "",
      letterValue: 0,
      ask: "match",
      answer: String(value),
      choices: slips,
      steps: [`${expr} = ${product} = ${value}`],
    };
  }
  return {
    expr,
    value,
    letter: "",
    letterValue: 0,
    ask: "value",
    answer: String(value),
    choices: slips,
    steps: [`${expr} = ${product} = ${value}`],
  };
}

export function makeExponentsQuestion(rng: Rng): ChoiceQ {
  const form = rollExponentForm(rng);
  const board = boardFrom(form, "exponents");
  const title =
    form.ask === "match"
      ? t(
          `Which number is ${mathText(form.expr)}?`,
          `¿Qué número es ${mathText(form.expr)}?`,
          `Qual número é ${mathText(form.expr)}?`,
          `Quel nombre est ${mathText(form.expr)} ?`,
          `${mathText(form.expr)} 等于几？`,
          `${mathText(form.expr)} कौन सी संख्या है?`,
          `ما العدد الذي يساوي ${mathText(form.expr)}؟`,
        )
      : t(
          `What is ${mathText(form.expr)}?`,
          `¿Cuánto es ${mathText(form.expr)}?`,
          `Quanto é ${mathText(form.expr)}?`,
          `Combien fait ${mathText(form.expr)} ?`,
          `${mathText(form.expr)} 是多少？`,
          `${mathText(form.expr)} कितना है?`,
          `كم يساوي ${mathText(form.expr)}؟`,
        );
  return sceneQuestion(rng, {
    game: "variables",
    title,
    hint: expHint(),
    answer: form.answer,
    choices: uniqueChoices(rng, form.answer, form.choices ?? []),
    skill: "variables:exponents",
    tags: ["exponents"],
    solved: `${mathText(form.expr)} = ${form.value}`,
    picture: form.expr,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `exponents:${form.expr}`,
  });
}

export function exponentsSheet(rng: Rng): SheetItem {
  const form = rollExponentForm(rng);
  return { prompt: `${prettyExponents(form.expr)} =`, answer: String(form.value) };
}

/** Dividend num/den divided by divisor divNum/divDen, whole-number quotient. */
export const FRAC_DIV_FACTS: readonly [number, number, number, number, number][] = [
  [1, 2, 1, 4, 2],
  [1, 2, 1, 6, 3],
  [1, 2, 1, 8, 4],
  [1, 2, 1, 10, 5],
  [3, 4, 1, 4, 3],
  [3, 4, 1, 8, 6],
  [1, 4, 1, 8, 2],
  [2, 3, 1, 3, 2],
  [2, 3, 1, 6, 4],
  [5, 6, 1, 6, 5],
  [4, 5, 1, 5, 4],
  [3, 5, 1, 5, 3],
  [3, 5, 1, 10, 6],
  [5, 8, 1, 8, 5],
  [3, 8, 1, 8, 3],
  [2, 5, 1, 10, 4],
  [1, 3, 1, 6, 2],
  [5, 6, 1, 12, 10],
  [2, 1, 1, 4, 8],
  [3, 1, 1, 2, 6],
  [4, 1, 1, 4, 16],
  [2, 1, 1, 3, 6],
  [3, 4, 1, 12, 9],
  [2, 3, 1, 9, 6],
];

export function fractionText(num: number, den: number): string {
  if (den === 1) return String(num);
  return `${num}/${den}`;
}

export function makeFracDivQuestion(rng: Rng): ChoiceQ {
  const [num, den, divNum, divDen, value] = rng.pick([...FRAC_DIV_FACTS]);
  const left = fractionText(num, den);
  const right = fractionText(divNum, divDen);
  const board: FractionBoard = { game: "fractions", mode: "fracDiv", num, den, num2: divNum, den2: divDen, whole: value };
  const prompt = `${mathText(`${left} ÷ ${right}`)}`;
  return sceneQuestion(rng, {
    game: "fractions",
    title: t(
      `What is ${prompt}?`,
      `¿Cuánto es ${prompt}?`,
      `Quanto é ${prompt}?`,
      `Combien fait ${prompt} ?`,
      `${prompt} 等于多少？`,
      `${prompt} कितना है?`,
      `كم يساوي ${prompt}؟`,
    ),
    hint: divHint(divNum, divDen, den, num),
    answer: String(value),
    choices: nearChoices(rng, value, 1, 24, [num, den, divDen, value + 1, Math.max(1, value - 1), num * divDen]),
    skill: "fractions:fracDiv",
    tags: ["fracDiv"],
    solved: `${prompt} = ${value}`,
    picture: `${left}÷${right}`,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `fracDiv:${left}:${right}`,
  });
}

export function fracDivSheet(rng: Rng): SheetItem {
  const [num, den, divNum, divDen, value] = rng.pick([...FRAC_DIV_FACTS]);
  return { prompt: `${fractionText(num, den)} ÷ ${fractionText(divNum, divDen)} =`, answer: String(value) };
}

export type FactorKind = "gcf" | "lcm";

export interface FactorFact {
  kind: FactorKind;
  a: number;
  b: number;
  value: number;
}

export const GCF_FACTS: readonly FactorFact[] = [
  { kind: "gcf", a: 8, b: 12, value: 4 },
  { kind: "gcf", a: 12, b: 18, value: 6 },
  { kind: "gcf", a: 9, b: 15, value: 3 },
  { kind: "gcf", a: 10, b: 25, value: 5 },
  { kind: "gcf", a: 14, b: 21, value: 7 },
  { kind: "gcf", a: 16, b: 24, value: 8 },
  { kind: "gcf", a: 6, b: 9, value: 3 },
  { kind: "gcf", a: 20, b: 30, value: 10 },
  { kind: "gcf", a: 4, b: 10, value: 2 },
  { kind: "gcf", a: 15, b: 25, value: 5 },
  { kind: "gcf", a: 18, b: 24, value: 6 },
  { kind: "gcf", a: 7, b: 21, value: 7 },
];

export const LCM_FACTS: readonly FactorFact[] = [
  { kind: "lcm", a: 4, b: 6, value: 12 },
  { kind: "lcm", a: 3, b: 5, value: 15 },
  { kind: "lcm", a: 2, b: 8, value: 8 },
  { kind: "lcm", a: 3, b: 9, value: 9 },
  { kind: "lcm", a: 4, b: 10, value: 20 },
  { kind: "lcm", a: 5, b: 6, value: 30 },
  { kind: "lcm", a: 2, b: 7, value: 14 },
  { kind: "lcm", a: 3, b: 4, value: 12 },
  { kind: "lcm", a: 6, b: 8, value: 24 },
  { kind: "lcm", a: 4, b: 5, value: 20 },
  { kind: "lcm", a: 2, b: 9, value: 18 },
  { kind: "lcm", a: 5, b: 10, value: 10 },
];

export function rollFactorFact(rng: Rng): FactorFact {
  return rng.next() < 0.5 ? rng.pick([...GCF_FACTS]) : rng.pick([...LCM_FACTS]);
}

export function makeGcfLcmQuestion(rng: Rng): ChoiceQ {
  const fact = rollFactorFact(rng);
  const board: PatternBoard = {
    game: "patterns",
    mode: "gcfLcm",
    terms: [fact.a, fact.b],
    step: fact.value,
    answer: fact.value,
    factor: { kind: fact.kind, a: fact.a, b: fact.b },
  };
  const title =
    fact.kind === "gcf"
      ? t(
          `What is the greatest common factor of ${fact.a} and ${fact.b}?`,
          `¿Cuál es el máximo común divisor de ${fact.a} y ${fact.b}?`,
          `Qual é o máximo divisor comum de ${fact.a} e ${fact.b}?`,
          `Quel est le plus grand commun diviseur de ${fact.a} et ${fact.b} ?`,
          `${fact.a} 和 ${fact.b} 的最大公因数是多少？`,
          `${fact.a} और ${fact.b} का महत्तम समापवर्तक क्या है?`,
          `ما العامل المشترك الأكبر للعدد ${fact.a} والعدد ${fact.b}؟`,
        )
      : t(
          `What is the least common multiple of ${fact.a} and ${fact.b}?`,
          `¿Cuál es el mínimo común múltiplo de ${fact.a} y ${fact.b}?`,
          `Qual é o mínimo múltiplo comum de ${fact.a} e ${fact.b}?`,
          `Quel est le plus petit commun multiple de ${fact.a} et ${fact.b} ?`,
          `${fact.a} 和 ${fact.b} 的最小公倍数是多少？`,
          `${fact.a} और ${fact.b} का लघुत्तम समापवर्त्य क्या है?`,
          `ما المضاعف المشترك الأصغر للعدد ${fact.a} والعدد ${fact.b}؟`,
        );
  const other = fact.kind === "gcf" ? lcm(fact.a, fact.b) : gcd(fact.a, fact.b);
  const slips = [other, fact.a, fact.b, fact.a + fact.b, Math.abs(fact.a - fact.b), fact.value * 2].filter((n) => n > 0 && n !== fact.value);
  const solved =
    fact.kind === "gcf"
      ? t(
          `The greatest common factor of ${fact.a} and ${fact.b} is ${fact.value}`,
          `El máximo común divisor de ${fact.a} y ${fact.b} es ${fact.value}`,
          `O máximo divisor comum de ${fact.a} e ${fact.b} é ${fact.value}`,
          `Le plus grand commun diviseur de ${fact.a} et ${fact.b} est ${fact.value}`,
          `${fact.a} 和 ${fact.b} 的最大公因数是 ${fact.value}`,
          `${fact.a} और ${fact.b} का महत्तम समापवर्तक ${fact.value} है`,
          `العامل المشترك الأكبر للعدد ${fact.a} والعدد ${fact.b} هو ${fact.value}`,
        )
      : t(
          `The least common multiple of ${fact.a} and ${fact.b} is ${fact.value}`,
          `El mínimo común múltiplo de ${fact.a} y ${fact.b} es ${fact.value}`,
          `O mínimo múltiplo comum de ${fact.a} e ${fact.b} é ${fact.value}`,
          `Le plus petit commun multiple de ${fact.a} et ${fact.b} est ${fact.value}`,
          `${fact.a} 和 ${fact.b} 的最小公倍数是 ${fact.value}`,
          `${fact.a} और ${fact.b} का लघुत्तम समापवर्त्य ${fact.value} है`,
          `المضاعف المشترك الأصغر للعدد ${fact.a} والعدد ${fact.b} هو ${fact.value}`,
        );
  return sceneQuestion(rng, {
    game: "patterns",
    title,
    hint: fact.kind === "gcf" ? gcfHint() : lcmHint(),
    answer: String(fact.value),
    choices: uniqueChoices(rng, String(fact.value), slips.map(String)),
    skill: "patterns:gcfLcm",
    tags: ["gcfLcm", fact.kind],
    solved,
    picture: `${fact.kind}:${fact.a}:${fact.b}`,
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `gcfLcm:${fact.kind}:${fact.a}:${fact.b}`,
  });
}

export function gcfLcmSheet(rng: Rng): SheetItem {
  const fact = rollFactorFact(rng);
  const word = fact.kind === "gcf" ? "GCF" : "LCM";
  return { prompt: `${word} of ${fact.a} and ${fact.b}`, answer: String(fact.value) };
}
