import type { Rng } from "@/lib/rng";
import { t } from "../i18n";
import { pickTalk } from "./flavor";
import { addCard } from "./cards";
import { DotModel, Equation, SquisheeImg, cx } from "../ui/bits";
import { fourChoices, qid } from "./choices";
import { makeBigAddQuestion, spanSheet } from "./span";
import { MINUS, type ChoiceQ, type GameModule, type SheetItem } from "./types";

export const ADD_LEVELS = ["within5", "within10", "within20", "tens", "within100", "within1000", "thousands"] as const;
export type AddLevel = (typeof ADD_LEVELS)[number];

export const ADD_MAX: Record<AddLevel, number> = {
  within5: 5,
  within10: 10,
  within20: 20,
  tens: 100,
  within100: 100,
  within1000: 1000,
  thousands: 9999,
};

export function isAddLevel(v: unknown): v is AddLevel {
  return typeof v === "string" && (ADD_LEVELS as readonly string[]).includes(v);
}

/** Two-digit plus a one-digit or a multiple of 10. Sums stay within 100. */
function tensOperands(rng: Rng): { op: "+" | "-"; pink: number; teal: number; total: number } {
  if (rng.next() < 0.55) {
    const a = rng.int(10, 90);
    if (rng.next() < 0.5) {
      const b = rng.int(0, Math.min(9, 100 - a));
      return { op: "+", pink: a, teal: b, total: a + b };
    }
    const b = rng.int(0, Math.floor((100 - a) / 10)) * 10;
    return { op: "+", pink: a, teal: b, total: a + b };
  }
  const total = rng.int(10, 100);
  const teal = rng.next() < 0.5 ? rng.int(0, Math.min(9, total)) : rng.int(0, Math.floor(total / 10)) * 10;
  return { op: "-", pink: total - teal, teal, total };
}

export function makeAddQuestion(rng: Rng, level: AddLevel): ChoiceQ {
  if (level === "within1000" || level === "thousands") return makeBigAddQuestion(rng, level);
  if (level === "tens") return makeTensQuestion(rng);
  const max = ADD_MAX[level];
  const sub = rng.next() < (max <= 10 ? 0.28 : 0.45);
  const roll = rng.next();
  let op: "+" | "-" = "+";
  let pink = 0;
  let teal = 0;
  let left: number | null = 0;
  let right: number | null = 0;
  let result: number | null = 0;
  let hidden = 0;
  let solved = "";

  if (!sub) {
    const sum = rng.int(1, max);
    pink = rng.int(0, sum);
    teal = sum - pink;
    solved = `${pink} + ${teal} = ${sum}`;
    if (roll < 0.5) {
      left = pink;
      right = null;
      result = sum;
      hidden = teal;
    } else if (roll < 0.82) {
      left = pink;
      right = teal;
      result = null;
      hidden = sum;
    } else {
      left = null;
      right = teal;
      result = sum;
      hidden = pink;
    }
  } else {
    op = "-";
    const total = rng.int(1, max);
    teal = rng.int(0, total);
    pink = total - teal;
    solved = `${total} ${MINUS} ${teal} = ${pink}`;
    if (roll < 0.55) {
      left = total;
      right = teal;
      result = null;
      hidden = pink;
    } else if (roll < 0.85) {
      left = total;
      right = null;
      result = pink;
      hidden = teal;
    } else {
      left = null;
      right = teal;
      result = pink;
      hidden = total;
    }
  }

  const tags: string[] = [];
  if (op === "+" && pink === teal) tags.push("doubles");
  if (op === "+" && pink + teal === 10) tags.push("make10");

  const wild = op === "+" ? pink + (pink + teal) : (pink + teal) + teal;
  return {
    id: qid(rng),
    game: "add",
    title: addTitle(rng, op),
    hint: max <= 20 ? t("Count the dots", "Cuenta los puntos") : t("Count the tens and the ones", "Cuenta las decenas y las unidades"),
    praise: t(`Yes! ${solved}`, `¡Sí! ${solved}`, `Sim! ${solved}`, `Oui ! ${solved}`, `对！${solved}`, `हाँ! ${solved}`, `نعم! ${solved}`),
    almost: t(`Almost! ${solved}`, `¡Casi! ${solved}`, `Quase! ${solved}`, `Presque ! ${solved}`, `差一点！${solved}`, `लगभग! ${solved}`, `تقريبًا! ${solved}`),
    answer: String(hidden),
    choices: fourChoices(rng, hidden, [hidden - 1, hidden + 1, wild, hidden + 2, hidden - 2]),
    skill: `add:${level}`,
    tags,
    visual: { kind: "add", op, left, right, result, pink, teal, max, hidden, solved },
  };
}

function addTitle(rng: Rng, op: "+" | "-"): string {
  if (op === "+") {
    return pickTalk(rng, [
      ["Tap the missing number!", "¡Toca el número que falta!"],
      ["Count on. Tap the missing number!", "Sigue contando. ¡Toca el número que falta!"],
      ["What number is hiding?", "¿Qué número se esconde?"],
    ]);
  }
  return pickTalk(rng, [
    ["Tap the missing number!", "¡Toca el número que falta!"],
    ["What number is hiding?", "¿Qué número se esconde?"],
    ["Count on. Tap the missing number!", "Sigue contando. ¡Toca el número que falta!"],
  ]);
}

function makeTensQuestion(rng: Rng): ChoiceQ {
  const max = ADD_MAX.tens;
  const fact = tensOperands(rng);
  const { op, pink, teal, total } = fact;
  const roll = rng.next();
  let left: number | null = 0;
  let right: number | null = 0;
  let result: number | null = 0;
  let hidden = 0;
  let solved = "";
  if (op === "+") {
    solved = `${pink} + ${teal} = ${total}`;
    if (roll < 0.5) {
      left = pink;
      right = null;
      result = total;
      hidden = teal;
    } else if (roll < 0.82) {
      left = pink;
      right = teal;
      result = null;
      hidden = total;
    } else {
      left = null;
      right = teal;
      result = total;
      hidden = pink;
    }
  } else {
    solved = `${total} ${MINUS} ${teal} = ${pink}`;
    if (roll < 0.55) {
      left = total;
      right = teal;
      result = null;
      hidden = pink;
    } else if (roll < 0.85) {
      left = total;
      right = null;
      result = pink;
      hidden = teal;
    } else {
      left = null;
      right = teal;
      result = pink;
      hidden = total;
    }
  }
  return {
    id: qid(rng),
    game: "add",
    title: addTitle(rng, op),
    hint: t("Count the tens and the ones", "Cuenta las decenas y las unidades"),
    praise: t(`Yes! ${solved}`, `¡Sí! ${solved}`, `Sim! ${solved}`, `Oui ! ${solved}`, `对！${solved}`, `हाँ! ${solved}`, `نعم! ${solved}`),
    almost: t(`Almost! ${solved}`, `¡Casi! ${solved}`, `Quase! ${solved}`, `Presque ! ${solved}`, `差一点！${solved}`, `लगभग! ${solved}`, `تقريبًا! ${solved}`),
    answer: String(hidden),
    choices: fourChoices(rng, hidden, [hidden - 1, hidden + 1, hidden + 10, hidden - 10, hidden + 2]),
    skill: "add:tens",
    tags: [],
    visual: { kind: "add", op, left, right, result, pink, teal, max, hidden, solved },
  };
}

function sheetItem(rng: Rng, level: string): SheetItem {
  const extra = spanSheet(rng, "add", level);
  if (extra) return extra;
  if (level === "tens") {
    const fact = tensOperands(rng);
    if (fact.op === "+") return { prompt: `${fact.pink} + ${fact.teal} =`, answer: String(fact.total) };
    return { prompt: `${fact.total} ${MINUS} ${fact.teal} =`, answer: String(fact.pink) };
  }
  const max = ADD_MAX[isAddLevel(level) ? level : "within20"];
  if (rng.next() < 0.42) {
    const left = rng.int(0, max);
    const right = rng.int(0, left);
    return { prompt: `${left} ${MINUS} ${right} =`, answer: String(left - right) };
  }
  const sum = rng.int(0, max);
  const a = rng.int(0, sum);
  const b = sum - a;
  return { prompt: `${a} + ${b} =`, answer: String(sum) };
}

export function AddPrompt({ question, reveal, mascot, happy }: { question: ChoiceQ; reveal: boolean; mascot: string; happy: boolean }) {
  return (
    <section className="ac-qcard">
      <h1>{question.title}</h1>
      <SquisheeImg id={mascot} className={cx("ac-mascot", happy && "is-happy")} />
      <Equation visual={question.visual} reveal={reveal} answer={question.answer} />
      {question.visual.kind === "add" && question.visual.max <= 100 ? <DotModel visual={question.visual} /> : null}
      <p className="ac-hint">{question.hint}</p>
    </section>
  );
}

export function AddSheet({ items }: { items: SheetItem[] }) {
  return (
    <ol className="ac-problems">
      {items.map((item, i) => (
        <li key={`${item.prompt}-${i}`}>{item.prompt}</li>
      ))}
    </ol>
  );
}

export const addGame = {
  ...addCard,
  makeQuestion: (rng, level) => makeAddQuestion(rng, isAddLevel(level) ? level : "within5"),
  makeSheetItem: sheetItem,
  Prompt: AddPrompt,
  SheetBody: AddSheet,
} satisfies GameModule;
