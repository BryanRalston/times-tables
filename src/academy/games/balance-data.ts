import type { Rng } from "@/lib/rng";
import { easeOf, type Ease } from "../adapt";
import { t } from "../i18n";
import type { BalanceBoard, BalanceLevel, BalanceOp } from "./boards";
import { mathText } from "./grade5";
import { nearChoices, sceneQuestion } from "./pick";
import { MINUS, TIMES, type ChoiceQ, type SheetItem } from "./types";

/**
 * Balance Scale, grade 6 one-step equations (6.EE.B.5, 6.EE.B.7).
 * Whole numbers only: x + p = q, x − p = q, p × x = q, and x ÷ p = q.
 * No negatives, no fractions, no two-step equations.
 */
export const BALANCE_LEVELS = ["addsub", "times", "divide", "mix"] as const;
export type { BalanceLevel, BalanceOp };

const DIV = "÷";

/** Friendly whole-number ranges. Easy leans on the small end, Hard on the large end. */
export const BALANCE_RANGE = {
  addsub: {
    gentle: { pMax: 8, xMax: 10, qMax: 18 },
    steady: { pMax: 12, xMax: 20, qMax: 32 },
    firm: { pMax: 20, xMax: 40, qMax: 50 },
  },
  times: {
    gentle: { pMax: 5, xMax: 8, qMax: 40 },
    steady: { pMax: 9, xMax: 12, qMax: 81 },
    firm: { pMax: 12, xMax: 15, qMax: 144 },
  },
  divide: {
    gentle: { pMax: 5, xMax: 8, qMax: 40 },
    steady: { pMax: 9, xMax: 12, qMax: 81 },
    firm: { pMax: 12, xMax: 15, qMax: 144 },
  },
} as const;

export function isBalanceLevel(value: unknown): value is BalanceLevel {
  return typeof value === "string" && (BALANCE_LEVELS as readonly string[]).includes(value);
}

export function leftText(board: Pick<BalanceBoard, "op" | "p">): string {
  switch (board.op) {
    case "add":
      return `x + ${board.p}`;
    case "sub":
      return `x ${MINUS} ${board.p}`;
    case "times":
      return `${board.p} ${TIMES} x`;
    case "divide":
      return `x ${DIV} ${board.p}`;
    default: {
      const neverOp: never = board.op;
      return neverOp;
    }
  }
}

export function equationText(board: Pick<BalanceBoard, "op" | "p" | "q">): string {
  return `${leftText(board)} = ${board.q}`;
}

export function solvedText(board: Pick<BalanceBoard, "op" | "p" | "q" | "x">): string {
  return `${equationText(board)}, x = ${board.x}`;
}

/** The equation must hold, and every value must be a positive whole number. */
export function equationHolds(board: Pick<BalanceBoard, "op" | "p" | "q" | "x">): boolean {
  if (![board.x, board.p, board.q].every((n) => Number.isInteger(n) && n >= 1)) return false;
  switch (board.op) {
    case "add":
      return board.x + board.p === board.q;
    case "sub":
      return board.x - board.p === board.q;
    case "times":
      return board.p * board.x === board.q;
    case "divide":
      return board.x === board.p * board.q;
    default: {
      const neverOp: never = board.op;
      return neverOp;
    }
  }
}

function hintFor(op: BalanceOp): string {
  switch (op) {
    case "add":
      return t(
        "Subtract from both sides.",
        "Resta en los dos lados.",
        "Subtrai nos dois lados.",
        "Soustrais des deux côtés.",
        "两边同时减去。",
        "दोनों तरफ से घटाओ।",
        "اطرح من الطرفين.",
      );
    case "sub":
      return t(
        "Add to both sides.",
        "Suma en los dos lados.",
        "Soma nos dois lados.",
        "Ajoute des deux côtés.",
        "两边同时加上。",
        "दोनों तरफ जोड़ो।",
        "أضف إلى الطرفين.",
      );
    case "times":
      return t(
        "Divide both sides.",
        "Divide en los dos lados.",
        "Divide nos dois lados.",
        "Divise les deux côtés.",
        "两边同时除以。",
        "दोनों तरफ भाग दो।",
        "اقسم الطرفين.",
      );
    case "divide":
      return t(
        "Multiply both sides.",
        "Multiplica en los dos lados.",
        "Multiplica nos dois lados.",
        "Multiplie les deux côtés.",
        "两边同时乘以。",
        "दोनों तरफ गुणा करो।",
        "اضرب الطرفين.",
      );
    default: {
      const neverOp: never = op;
      return neverOp;
    }
  }
}

export function balanceHint(op: BalanceOp, specific = false): string {
  if (!specific) {
    return t(
      "Do the same to both sides.",
      "Haz lo mismo en los dos lados.",
      "Faz o mesmo nos dois lados.",
      "Fais la même chose des deux côtés.",
      "两边做同样的。",
      "दोनों तरफ एक जैसा करो।",
      "افعل الشيء نفسه في الطرفين.",
    );
  }
  return hintFor(op);
}

export function findXTitle(kind: "find" | "what" = "find"): string {
  if (kind === "what") {
    return t("What is x?", "¿Cuál es x?", "Qual é o x?", "Quel est x ?", "x 是多少？", "x क्या है?", "ما قيمة x؟");
  }
  return t("Find x.", "Encuentra x.", "Descobre o x.", "Trouve x.", "求 x。", "x ढूँढो।", "جد x.");
}

function slips(board: BalanceBoard): number[] {
  const { op, p, q, x } = board;
  const out: number[] = [];
  const push = (n: number) => {
    if (Number.isInteger(n) && n >= 1 && n !== x) out.push(n);
  };
  push(p);
  push(q);
  push(x + 1);
  push(x - 1);
  if (op === "add") {
    push(q + p);
    push(p + 1);
  } else if (op === "sub") {
    if (q > p) push(q - p);
    push(q + 1);
  } else if (op === "times") {
    push(q + p);
    push(p * (x + 1) === q ? x + 2 : q - p);
    if (q > p) push(q - p);
  } else {
    push(q + p);
    push(p * (q + 1));
    if (q > 1) push(q - 1);
  }
  return out;
}

export function balanceChoices(rng: Rng, board: BalanceBoard): string[] {
  const hi = Math.max(board.x + 12, board.q + board.p, 20);
  return nearChoices(rng, board.x, 1, hi, slips(board));
}

function pickOp(level: BalanceLevel, ease: Ease, rng: Rng): BalanceOp {
  if (level === "times") return "times";
  if (level === "divide") return "divide";
  if (level === "addsub") return rng.next() < 0.5 ? "add" : "sub";
  if (ease === "gentle") return rng.next() < 0.7 ? "add" : "sub";
  if (ease === "steady") {
    const bag: BalanceOp[] = ["add", "sub", "times"];
    return bag[rng.int(0, bag.length - 1)]!;
  }
  const bag: BalanceOp[] = ["add", "sub", "times", "divide"];
  return bag[rng.int(0, bag.length - 1)]!;
}

function rollTriple(rng: Rng, op: BalanceOp, ease: Ease): { x: number; p: number; q: number } {
  for (let i = 0; i < 24; i += 1) {
    if (op === "add") {
      const span = BALANCE_RANGE.addsub[ease];
      const p = rng.int(1, span.pMax);
      const x = rng.int(1, span.xMax);
      const q = x + p;
      if (q <= span.qMax) return { x, p, q };
    } else if (op === "sub") {
      const span = BALANCE_RANGE.addsub[ease];
      const p = rng.int(1, span.pMax);
      const q = rng.int(1, span.xMax);
      const x = q + p;
      if (x <= span.xMax + span.pMax && x <= 50 && q >= 1) return { x, p, q };
    } else if (op === "times") {
      const span = BALANCE_RANGE.times[ease];
      const p = rng.int(2, span.pMax);
      const xMax = Math.min(span.xMax, Math.floor(span.qMax / p));
      if (xMax < 2) continue;
      const x = rng.int(2, xMax);
      const q = p * x;
      if (q <= span.qMax) return { x, p, q };
    } else {
      const span = BALANCE_RANGE.divide[ease];
      const p = rng.int(2, span.pMax);
      const qMax = Math.min(span.xMax, Math.floor(span.qMax / p));
      if (qMax < 2) continue;
      const q = rng.int(2, qMax);
      const x = p * q;
      if (x <= span.qMax && x >= 4) return { x, p, q };
    }
  }
  // A tiny safe fallback so a unlucky roll still makes a legal card.
  if (op === "add") return { x: 4, p: 3, q: 7 };
  if (op === "sub") return { x: 9, p: 4, q: 5 };
  if (op === "times") return { x: 4, p: 3, q: 12 };
  return { x: 12, p: 3, q: 4 };
}

export function rollBalance(rng: Rng, level: BalanceLevel, prefer: readonly string[] = []): BalanceBoard {
  const ease = easeOf(prefer);
  const op = pickOp(level, ease, rng);
  const { x, p, q } = rollTriple(rng, op, ease);
  return { game: "balance", mode: level, op, x, p, q };
}

export function balanceCaptions(board: BalanceBoard): string[] {
  return [mathText(solvedText(board)), balanceHint(board.op), balanceHint(board.op, true)];
}

export function makeBalanceQuestion(rng: Rng, level: string, prefer: readonly string[] = []): ChoiceQ {
  const safe: BalanceLevel = isBalanceLevel(level) ? level : "addsub";
  const board = rollBalance(rng, safe, prefer);
  return sceneQuestion(rng, {
    game: "balance",
    picture: "balance",
    labels: {},
    skill: `balance:${safe}`,
    tags: [safe, board.op],
    title: findXTitle(rng.next() < 0.5 ? "find" : "what"),
    hint: rng.next() < 0.55 ? balanceHint(board.op) : balanceHint(board.op, true),
    answer: String(board.x),
    choices: balanceChoices(rng, board),
    solved: mathText(solvedText(board)),
    hands: false,
    quietChoices: true,
    board,
    factKey: `balance:${board.op}:${board.p}:${board.q}`,
  });
}

export function makeBalanceSheet(rng: Rng, level: string): SheetItem {
  const board = rollBalance(rng, isBalanceLevel(level) ? level : "addsub");
  return { prompt: mathText(`${equationText(board)}.  x =`), answer: String(board.x) };
}
