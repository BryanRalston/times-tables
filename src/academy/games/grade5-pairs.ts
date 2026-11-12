import type { Rng } from "@/lib/rng";
import { t } from "../i18n";
import type { GridBoard, PatternBoard, PlaneBoard, TwoRules } from "./boards";
import { mathText } from "./grade5";
import { sceneQuestion, uniqueChoices } from "./pick";
import type { ChoiceQ, SheetItem } from "./types";

/**
 * Grade 5 slice 4: two rules and ordered pairs (5.OA.B.3) in Number Patterns,
 * and the coordinate plane, quadrant I only (5.G.A), in Grid Garden.
 * Tap-and-think cards. Every card has one right tile and three plausible
 * slips: swapped coordinates, a point one step off, or only one rule applied.
 */

/* ---------- shared ---------- */

/** Coordinates are whole numbers from 0 to 10 on both axes. No negatives, no other quadrants. */
export const PLANE_MAX = 10;

/** Two rules: steps 1–15, B is A times 2 to 5, five terms from 0, so no term passes 60. */
export const TWO_RULES_RANGE = { ruleMax: 15, timesMin: 2, timesMax: 5, count: 5, termMax: 60 } as const;

/** "(3, 5)". Choice ids stay in this plain form; the tile and the plane draw it left to right. */
export function pairText(x: number, y: number): string {
  return `(${x}, ${y})`;
}

export function parsePair(text: string): { x: number; y: number } | null {
  const match = /^\((\d+), (\d+)\)$/.exec(text);
  return match ? { x: Number(match[1]), y: Number(match[2]) } : null;
}

function onPlane(x: number, y: number): boolean {
  return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x <= PLANE_MAX && y <= PLANE_MAX;
}

function textChoices(rng: Rng, answer: string, pool: readonly (string | null)[], pinned: readonly (string | null)[]): string[] {
  const clean = (items: readonly (string | null)[]) => items.filter((item): item is string => item != null && item !== answer);
  return uniqueChoices(rng, answer, clean(pool), clean(pinned));
}

function pairOrNull(x: number, y: number): string | null {
  return onPlane(x, y) ? pairText(x, y) : null;
}

/* ---------- two rules and ordered pairs (5.OA.B.3) ---------- */

export function termOf(rule: number, index: number): number {
  return rule * index;
}

export function twoRuleTerms(two: Pick<TwoRules, "ruleA" | "ruleB" | "count">): { a: number[]; b: number[] } {
  const index = Array.from({ length: two.count }, (_, i) => i);
  return { a: index.map((i) => termOf(two.ruleA, i)), b: index.map((i) => termOf(two.ruleB, i)) };
}

export function timesOf(two: Pick<TwoRules, "ruleA" | "ruleB">): number {
  return two.ruleB / two.ruleA;
}

export function relationText(k: number): string {
  return `× ${k}`;
}

export function rollTwoRules(rng: Rng): TwoRules {
  for (let guard = 0; guard < 40; guard += 1) {
    const ruleA = rng.int(1, 6);
    const k = rng.int(TWO_RULES_RANGE.timesMin, TWO_RULES_RANGE.timesMax);
    const ruleB = ruleA * k;
    if (ruleB > TWO_RULES_RANGE.ruleMax) continue;
    const roll = rng.next();
    const ask: TwoRules["ask"] = roll < 0.4 ? "missing" : roll < 0.7 ? "relation" : "pair";
    const col = ask === "relation" ? 0 : rng.int(2, TWO_RULES_RANGE.count - 1);
    const row: TwoRules["row"] = ask === "missing" && rng.next() < 0.3 ? "a" : "b";
    return { ruleA, ruleB, count: TWO_RULES_RANGE.count, ask, col, row };
  }
  return { ruleA: 3, ruleB: 6, count: TWO_RULES_RANGE.count, ask: "missing", col: 3, row: "b" };
}

export function twoRulesAnswer(two: TwoRules): string {
  const { a, b } = twoRuleTerms(two);
  switch (two.ask) {
    case "missing":
      return String((two.row === "a" ? a : b)[two.col] ?? 0);
    case "relation":
      return relationText(timesOf(two));
    case "pair":
      return pairText(a[two.col] ?? 0, b[two.col] ?? 0);
    default: {
      const neverAsk: never = two.ask;
      return neverAsk;
    }
  }
}

function twoRulesTitle(ask: TwoRules["ask"]): string {
  switch (ask) {
    case "missing":
      return t(
        "Both patterns start at 0. What number is missing?",
        "Los dos patrones empiezan en 0. ¿Qué número falta?",
        "Os dois padrões começam em 0. Que número está faltando?",
        "Les deux suites commencent à 0. Quel nombre manque ?",
        "两个规律都从0开始。缺的数是多少？",
        "दोनों पैटर्न 0 से शुरू होते हैं। कौन-सी संख्या छूटी है?",
        "يبدأ النمطان من 0. ما العدد الناقص؟",
      );
    case "relation":
      return t(
        "How do you get each B term from its A term?",
        "¿Cómo obtienes cada término de B a partir de su término de A?",
        "Como você obtém cada termo de B a partir do termo de A?",
        "Comment obtiens-tu chaque terme de B à partir de son terme de A ?",
        "怎样由A中的每一项得到B中对应的项？",
        "A के हर पद से B का पद कैसे मिलता है?",
        "كيف تحصل على كل حدّ في B من الحدّ المقابل له في A؟",
      );
    case "pair":
      return t(
        "Which ordered pair (A, B) matches the shaded terms?",
        "¿Qué par ordenado (A, B) corresponde a los términos sombreados?",
        "Qual par ordenado (A, B) corresponde aos termos destacados?",
        "Quel couple (A, B) correspond aux termes surlignés ?",
        "哪个有序数对(A, B)对应涂色的两项？",
        "रंगे हुए पदों से कौन-सा क्रमित युग्म (A, B) बनता है?",
        `أي زوج مرتب ${mathText("(A, B)")} يطابق الحدّين المظلّلين؟`,
      );
    default: {
      const neverAsk: never = ask;
      return neverAsk;
    }
  }
}

export function twoRulesHint(): string {
  return t(
    "Find each pattern's jump. Then compare the terms in the same column.",
    "Busca el salto de cada patrón. Luego compara los términos de la misma columna.",
    "Encontre o salto de cada padrão. Depois compare os termos da mesma coluna.",
    "Trouve le saut de chaque suite. Puis compare les termes de la même colonne.",
    "先找出每个规律每次加多少，再比较同一列的两项。",
    "हर पैटर्न की छलांग ढूँढो। फिर एक ही कॉलम के पदों की तुलना करो।",
    "اعرف قفزة كل نمط، ثم قارن الحدّين في العمود نفسه.",
  );
}

export function twoRulesSolved(two: TwoRules): string {
  const answer = twoRulesAnswer(two);
  switch (two.ask) {
    case "missing":
      return t(
        `The missing number is ${answer}`,
        `El número que falta es ${answer}`,
        `O número que falta é ${answer}`,
        `Le nombre manquant est ${answer}`,
        `缺的数是${answer}`,
        `छूटी संख्या ${answer} है`,
        `العدد الناقص ${answer}`,
      );
    case "relation": {
      const k = timesOf(two);
      return t(
        `Each B term is ${k} times its A term`,
        `Cada término de B es ${k} veces su término de A`,
        `Cada termo de B é ${k} vezes o termo de A`,
        `Chaque terme de B vaut ${k} fois son terme de A`,
        `B中每一项都是A中对应项的${k}倍`,
        `B का हर पद A के पद का ${k} गुना है`,
        `كل حدّ في B يساوي حدّ A مضروبًا في ${k}`,
      );
    }
    case "pair":
      return t(
        `The ordered pair is ${answer}`,
        `El par ordenado es ${answer}`,
        `O par ordenado é ${answer}`,
        `Le couple est ${answer}`,
        `有序数对是${answer}`,
        `क्रमित युग्म ${answer} है`,
        `الزوج المرتب ${mathText(answer)}`,
      );
    default: {
      const neverAsk: never = two.ask;
      return neverAsk;
    }
  }
}

function twoRulesChoices(rng: Rng, two: TwoRules): string[] {
  const { a, b } = twoRuleTerms(two);
  const answer = twoRulesAnswer(two);
  switch (two.ask) {
    case "missing": {
      const own = two.row === "a" ? a : b;
      const other = two.row === "a" ? b : a;
      const rule = two.row === "a" ? two.ruleA : two.ruleB;
      const otherRule = two.row === "a" ? two.ruleB : two.ruleA;
      const value = own[two.col] ?? 0;
      const prev = own[two.col - 1] ?? 0;
      const ok = (n: number) => (n >= 0 && n <= TWO_RULES_RANGE.termMax + TWO_RULES_RANGE.ruleMax ? String(n) : null);
      // Slips: read the other row, one term off, used the other pattern's rule.
      const pinned = [ok(other[two.col] ?? -1), ok(prev + otherRule)];
      const pool = [ok(value + rule), ok(value - rule), ok(value + 1), ok(value - 1), ok(value + 2)];
      return textChoices(rng, answer, pool, pinned);
    }
    case "relation": {
      const k = timesOf(two);
      // The classic slip: "B is 3 more" only works for the first pair.
      const pinned = [`+ ${two.ruleB - two.ruleA}`];
      const pool = [relationText(k + 1), k - 1 >= 2 ? relationText(k - 1) : relationText(k + 2), `+ ${two.ruleB}`];
      return textChoices(rng, answer, pool, pinned);
    }
    case "pair": {
      const x = a[two.col] ?? 0;
      const y = b[two.col] ?? 0;
      const pinned = [pairText(y, x)];
      const pool = [pairText(x, y - two.ruleB), pairText(x + two.ruleA, y), pairText(x - two.ruleA, y), pairText(x, y + two.ruleB)];
      return textChoices(rng, answer, pool, pinned);
    }
    default: {
      const neverAsk: never = two.ask;
      return neverAsk;
    }
  }
}

export function twoRulesBoard(two: TwoRules): PatternBoard {
  const { a } = twoRuleTerms(two);
  return { game: "patterns", mode: "twoRules", terms: a, step: two.ruleA, answer: two.ruleB, two };
}

export function makeTwoRulesQuestion(rng: Rng): ChoiceQ {
  const two = rollTwoRules(rng);
  const answer = twoRulesAnswer(two);
  return sceneQuestion(rng, {
    game: "patterns",
    title: twoRulesTitle(two.ask),
    hint: twoRulesHint(),
    answer,
    choices: twoRulesChoices(rng, two),
    skill: "patterns:twoRules",
    tags: ["patterns", "twoRules"],
    solved: twoRulesSolved(two),
    picture: "pattern",
    hands: false,
    quietChoices: two.ask !== "missing",
    labels: {},
    board: twoRulesBoard(two),
    factKey: `twoRules:${two.ruleA}:${two.ruleB}:${two.ask}:${two.row}${two.col}`,
  });
}

export function twoRulesSheet(rng: Rng): SheetItem {
  const two = rollTwoRules(rng);
  const { a, b } = twoRuleTerms(two);
  const col = Math.max(2, two.col);
  const shownB = b.map((n, i) => (i === col ? "?" : String(n)));
  return { prompt: `A: ${a.join(", ")}  ·  B: ${shownB.join(", ")}`, answer: String(b[col] ?? 0) };
}

/* ---------- coordinate plane, quadrant I (5.G.A) ---------- */

const LETTERS = ["A", "B", "C", "D"] as const;

/** Rule pairs for plotted patterns. Four points from (0, 0) stay inside 0–10. */
const PLANE_STEPS: readonly (readonly [number, number])[] = [
  [1, 2],
  [1, 3],
  [2, 1],
  [3, 1],
  [2, 3],
  [3, 2],
];

function rollPoint(rng: Rng): { x: number; y: number } {
  const x = rng.int(1, 9);
  let y = rng.int(1, 9);
  if (y === x) y = x === 9 ? 2 : x + 1;
  return { x, y };
}

function nudge(rng: Rng, n: number): number {
  if (n <= 0) return 1;
  if (n >= PLANE_MAX) return PLANE_MAX - 1;
  return rng.next() < 0.5 ? n + 1 : n - 1;
}

export function rollPlane(rng: Rng): PlaneBoard {
  const roll = rng.next();
  if (roll < 0.35) {
    const target = rollPoint(rng);
    return { ask: "read", points: [{ ...target, label: "" }], target, stepX: 0, stepY: 0 };
  }
  if (roll < 0.7) {
    const target = rollPoint(rng);
    const spots = [target, { x: target.y, y: target.x }, { x: nudge(rng, target.x), y: target.y }, { x: target.x, y: nudge(rng, target.y) }];
    const order = rng.shuffle([0, 1, 2, 3]);
    const points = order.map((spot, i) => ({ ...spots[spot]!, label: LETTERS[i]! }));
    return { ask: "find", points, target, stepX: 0, stepY: 0 };
  }
  const [stepX, stepY] = rng.pick(PLANE_STEPS);
  const points = [0, 1, 2].map((i) => ({ x: stepX * i, y: stepY * i, label: "" }));
  return { ask: "pattern", points, target: { x: stepX * 3, y: stepY * 3 }, stepX, stepY };
}

export function planeAnswer(plane: PlaneBoard): string {
  if (plane.ask === "find") return plane.points.find((p) => p.x === plane.target.x && p.y === plane.target.y)?.label ?? "A";
  return pairText(plane.target.x, plane.target.y);
}

function planeTitle(plane: PlaneBoard): string {
  const p = pairText(plane.target.x, plane.target.y);
  switch (plane.ask) {
    case "read":
      return t(
        "What are the coordinates of the point?",
        "¿Cuáles son las coordenadas del punto?",
        "Quais são as coordenadas do ponto?",
        "Quelles sont les coordonnées du point ?",
        "这个点的坐标是多少？",
        "इस बिंदु के निर्देशांक क्या हैं?",
        "ما إحداثيات النقطة؟",
      );
    case "find":
      return t(`Which point is at ${p}?`, `¿Qué punto está en ${p}?`, `Qual ponto está em ${p}?`, `Quel point est en ${p} ?`, `哪个点在${p}？`, `कौन-सा बिंदु ${p} पर है?`, `أي نقطة عند ${mathText(p)}؟`);
    case "pattern": {
      const a = plane.stepX;
      const b = plane.stepY;
      return t(
        `Two rules: x adds ${a}, y adds ${b}. Which point comes next?`,
        `Dos reglas: x suma ${a}, y suma ${b}. ¿Qué punto sigue?`,
        `Duas regras: x soma ${a}, y soma ${b}. Qual ponto vem depois?`,
        `Deux règles : x augmente de ${a}, y de ${b}. Quel point vient ensuite ?`,
        `两个规律：x每次加${a}，y每次加${b}。下一个点是哪个？`,
        `दो नियम: x में ${a} जोड़ो, y में ${b} जोड़ो। अगला बिंदु कौन-सा है?`,
        `قاعدتان: ${mathText(`x + ${a}`)} و${mathText(`y + ${b}`)}. ما النقطة التالية؟`,
      );
    }
    default: {
      const neverAsk: never = plane.ask;
      return neverAsk;
    }
  }
}

export function planeHint(ask: PlaneBoard["ask"]): string {
  if (ask === "pattern") {
    return t(
      "Add the x rule to x and the y rule to y.",
      "Suma la regla de x a x y la regla de y a y.",
      "Some a regra de x ao x e a regra de y ao y.",
      "Ajoute la règle de x à x et la règle de y à y.",
      "x加上x的规律，y加上y的规律。",
      "x में x का नियम और y में y का नियम जोड़ो।",
      "أضف قاعدة x إلى x، وقاعدة y إلى y.",
    );
  }
  return t(
    "Go across the x-axis first, then up the y-axis.",
    "Primero avanza por el eje x y luego sube por el eje y.",
    "Primeiro ande pelo eixo x, depois suba pelo eixo y.",
    "Avance d'abord sur l'axe des x, puis monte sur l'axe des y.",
    "先沿x轴向右走，再沿y轴向上走。",
    "पहले x-अक्ष पर आगे जाओ, फिर y-अक्ष पर ऊपर।",
    "تحرّك أولًا على محور x، ثم اصعد على محور y.",
  );
}

export function planeSolved(plane: PlaneBoard): string {
  const p = pairText(plane.target.x, plane.target.y);
  switch (plane.ask) {
    case "read":
      return t(`The point is at ${p}`, `El punto está en ${p}`, `O ponto está em ${p}`, `Le point est en ${p}`, `这个点在${p}`, `बिंदु ${p} पर है`, `النقطة عند ${mathText(p)}`);
    case "find": {
      const label = planeAnswer(plane);
      return t(`Point ${label} is at ${p}`, `El punto ${label} está en ${p}`, `O ponto ${label} está em ${p}`, `Le point ${label} est en ${p}`, `点${label}在${p}`, `बिंदु ${label} ${p} पर है`, `النقطة ${label} عند ${mathText(p)}`);
    }
    case "pattern":
      return t(`The next point is ${p}`, `El punto que sigue es ${p}`, `O próximo ponto é ${p}`, `Le point suivant est ${p}`, `下一个点是${p}`, `अगला बिंदु ${p} है`, `النقطة التالية ${mathText(p)}`);
    default: {
      const neverAsk: never = plane.ask;
      return neverAsk;
    }
  }
}

function planeChoices(rng: Rng, plane: PlaneBoard): string[] {
  const { x, y } = plane.target;
  const answer = planeAnswer(plane);
  switch (plane.ask) {
    case "find":
      // Letters stay in order so the tiles read like the plane's labels.
      return [...LETTERS];
    case "read":
      return textChoices(rng, answer, [pairOrNull(x + 1, y), pairOrNull(x - 1, y), pairOrNull(x, y + 1), pairOrNull(x, y - 1)], [pairOrNull(y, x)]);
    case "pattern": {
      const a = plane.stepX;
      const b = plane.stepY;
      // Slips: swapped, y used x's rule, x used y's rule, skipped a point, one off.
      const pinned = [pairOrNull(y, x), rng.next() < 0.5 ? pairOrNull(x, y - b + a) : pairOrNull(x - a + b, y)];
      const pool = [pairOrNull(x, y - b + a), pairOrNull(x - a + b, y), pairOrNull(x + a, y + b), pairOrNull(x, y + 1), pairOrNull(x + 1, y), pairOrNull(x - 1, y), pairOrNull(x, y - 1)];
      return textChoices(rng, answer, pool, pinned);
    }
    default: {
      const neverAsk: never = plane.ask;
      return neverAsk;
    }
  }
}

export function planeBoard(plane: PlaneBoard): GridBoard {
  return { game: "grid", mode: "coords", cells: [], rows: PLANE_MAX, cols: PLANE_MAX, edges: 0, known: 0, missing: 0, useArea: false, plane };
}

export function makePlaneQuestion(rng: Rng): ChoiceQ {
  const plane = rollPlane(rng);
  const pts = plane.points.map((p) => `${p.label}${p.x}.${p.y}`).join("-");
  return sceneQuestion(rng, {
    game: "grid",
    title: planeTitle(plane),
    hint: planeHint(plane.ask),
    answer: planeAnswer(plane),
    choices: planeChoices(rng, plane),
    skill: "grid:coords",
    tags: ["grid", "coords"],
    solved: planeSolved(plane),
    picture: "grid",
    hands: false,
    quietChoices: true,
    labels: {},
    board: planeBoard(plane),
    factKey: `coords:${plane.ask}:${pts}`,
  });
}

export function planeSheet(rng: Rng): SheetItem {
  const plane = rollPlane(rng);
  if (plane.ask === "pattern") {
    const pts = plane.points.map((p) => pairText(p.x, p.y)).join(", ");
    return { prompt: `${pts}, ?`, answer: pairText(plane.target.x, plane.target.y) };
  }
  const p = plane.target;
  return { prompt: `x = ${p.x}, y = ${p.y} → ( , )`, answer: pairText(p.x, p.y) };
}
