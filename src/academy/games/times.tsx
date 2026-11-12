import { parseTimesKey, timesKey } from "@/lib/practice";
import { makeFluencyItem } from "@/lib/questions";
import type { Rng } from "@/lib/rng";
import { t } from "../i18n";
import { buddyName, pickTalk } from "./flavor";
import type { FluencyData, Question } from "@/lib/types";
import { timesCard } from "./cards";
import { makeDivideQuestion, makeFactorQuestion, makeMultiQuestion, spanSheet } from "./span";
import { Equation, Groups, SquisheeImg, cx } from "../ui/bits";
import { fourChoices, qid } from "./choices";
import { bigMultiSheet, makeBigMultiQuestion } from "./grade5-ops";
import { BigMultiArt } from "./grade5-ops-art";
import { SceneCard } from "./scene-ui";
import { TIMES, type ChoiceQ, type GameModule, type SheetItem } from "./types";

export const TIMES_LEVELS = ["count", "twos", "mix", "toTen", "factors", "multi", "divide", "bigMulti"] as const;
export type TimesLevel = (typeof TIMES_LEVELS)[number];

export const TIMES_SPEC: Record<TimesLevel, { factors: number[]; max: number }> = {
  count: { factors: [2, 5, 10], max: 5 },
  twos: { factors: [2, 5, 10], max: 10 },
  mix: { factors: [2, 3, 4, 5, 10], max: 10 },
  toTen: { factors: [2, 3, 4, 5, 6, 7, 8, 9, 10], max: 10 },
  factors: { factors: [2, 3, 4, 5, 10], max: 10 },
  multi: { factors: [2, 3, 4, 5, 10], max: 9 },
  divide: { factors: [2, 3, 4, 5, 10], max: 9 },
  /** Grade 5 multi-digit multiply (5.NBT.B.5) does not use the fact engine. See BIG_MULTI_MAX in grade5-ops. */
  bigMulti: { factors: [], max: 99 },
};

/** 6, 7, 8, and 9 are grade 3 facts (3.OA). Earlier levels may still use 10. */
const LATER_FACTORS = [6, 7, 8, 9];

export function isTimesLevel(v: unknown): v is TimesLevel {
  return typeof v === "string" && (TIMES_LEVELS as readonly string[]).includes(v);
}

function fluencyTimes(q: Question): { a: number; b: number } | null {
  const data = q.data;
  if (!data || typeof data !== "object") return null;
  if (!("op" in data) || !("a" in data) || !("b" in data) || "mode" in data) return null;
  const row = data as FluencyData;
  if (row.op !== "×") return null;
  if (!Number.isInteger(row.a) || !Number.isInteger(row.b)) return null;
  return { a: row.a, b: row.b };
}

function partnerOk(level: TimesLevel, partner: number, spec: { max: number }): boolean {
  if (partner < 1 || partner > spec.max) return false;
  if (level === "toTen") return true;
  return !LATER_FACTORS.includes(partner);
}

function partnersFor(level: TimesLevel, spec: { max: number }): number[] {
  const partners: number[] = [];
  for (let n = 1; n <= spec.max; n++) {
    if (partnerOk(level, n, spec)) partners.push(n);
  }
  return partners;
}

function orientFactors(
  level: TimesLevel,
  a: number,
  b: number,
  spec: { factors: number[]; max: number },
): { a: number; b: number } | null {
  const aOk = spec.factors.includes(a) && partnerOk(level, b, spec);
  const bOk = spec.factors.includes(b) && partnerOk(level, a, spec);
  if (aOk) return { a, b };
  if (bOk) return { a: b, b: a };
  return null;
}

function preferInLevel(keys: string[], level: TimesLevel, spec: { factors: number[]; max: number }): string[] {
  return keys.filter((key) => {
    const parsed = parseTimesKey(key);
    if (!parsed) return false;
    return orientFactors(level, parsed.a, parsed.b, spec) !== null;
  });
}

/** Equal groups of 2, 5, or 10 stay small enough to count. */
function countFactOk(level: TimesLevel, fact: { a: number; b: number }): boolean {
  if (level !== "count") return true;
  return fact.a * fact.b <= 20;
}

/** Multiplication fact from Squishee Math's fluency engine, kept inside the level. */
/** Hard ("ease:firm") skips trivial facts: no ×1, and from Multiply to 10 up no ×2 either. */
function firmFactOk(level: TimesLevel, fact: { a: number; b: number }, firm: boolean): boolean {
  if (!firm) return true;
  const low = Math.min(fact.a, fact.b);
  if (low < 2) return false;
  if (level === "toTen" && low < 3) return false;
  return true;
}

export function nextTimesFact(rng: Rng, level: TimesLevel, prefer: string[] = []): { a: number; b: number } {
  const spec = TIMES_SPEC[level];
  const firm = prefer.includes("ease:firm");
  const usable = preferInLevel(prefer, level, spec);
  for (let i = 0; i < 8; i++) {
    const q = makeFluencyItem(rng, spec.factors, i === 0 && usable.length ? usable : undefined);
    const fact = fluencyTimes(q);
    if (!fact) continue;
    const oriented = orientFactors(level, fact.a, fact.b, spec);
    if (oriented && countFactOk(level, oriented) && firmFactOk(level, oriented, firm)) return oriented;
  }
  const partners = partnersFor(level, spec);
  for (let i = 0; i < 40; i++) {
    const fact = { a: rng.pick(spec.factors), b: rng.pick(partners) };
    if (countFactOk(level, fact) && firmFactOk(level, fact, firm)) return fact;
  }
  return { a: 2, b: 2 };
}

function tableTags(a: number, b: number): string[] {
  const tags: string[] = [];
  if (a >= 2 && a <= 12) tags.push(`table:${a}`);
  if (b >= 2 && b <= 12 && b !== a) tags.push(`table:${b}`);
  return tags;
}

export function makeTimesQuestion(rng: Rng, level: TimesLevel, prefer: string[] = []): ChoiceQ {
  if (level === "factors") return makeFactorQuestion(rng);
  if (level === "multi") return makeMultiQuestion(rng);
  if (level === "divide") return makeDivideQuestion(rng);
  if (level === "bigMulti") return makeBigMultiQuestion(rng);
  const { a, b } = nextTimesFact(rng, level, prefer);
  const product = a * b;
  const solved = `${a} ${TIMES} ${b} = ${product}`;
  return {
    id: qid(rng),
    game: "times",
    title: (() => {
      const buddy = buddyName(rng);
      return pickTalk(rng, [
        ["Tap the answer!", "¡Toca la respuesta!"],
        [`${buddy} sets out ${a} groups of ${b}. How many?`, `${buddy} pone ${a} grupos de ${b}. ¿Cuántos hay?`, `${buddy} separa ${a} grupos de ${b}. Quantos há?`, `${buddy} pose ${a} groupes de ${b}. Combien ?`, `${buddy}摆了${a}组，每组${b}个。一共有几个？`, `${buddy} ${b} के ${a} समूह रखता है। कितने हैं?`, `${buddy} يضع ${a} مجموعات من ${b}. كم العدد؟`],
        [`How many is ${a} groups of ${b}?`, `¿Cuántos son ${a} grupos de ${b}?`, `Quantos são ${a} grupos de ${b}?`, `Combien font ${a} groupes de ${b} ?`, `${a}组，每组${b}个，一共有几个？`, `${b} के ${a} समूह कितने होते हैं?`, `كم عدد ${a} مجموعات من ${b}؟`],
      ]);
    })(),
    hint: a <= 6 ? t(`${a} groups of ${b}`, `${a} grupos de ${b}`, `${a} grupos de ${b}`, `${a} groupes de ${b}`, `${a}组，每组${b}个`, `${b} के ${a} समूह`, `${a} مجموعات من ${b}`) : t("Tap the product", "Toca el resultado"),
    praise: t(`Yes! ${solved}`, `¡Sí! ${solved}`, `Sim! ${solved}`, `Oui ! ${solved}`, `对！${solved}`, `हाँ! ${solved}`, `نعم! ${solved}`),
    almost: t(`Almost! ${solved}`, `¡Casi! ${solved}`, `Quase! ${solved}`, `Presque ! ${solved}`, `差一点！${solved}`, `लगभग! ${solved}`, `تقريبًا! ${solved}`),
    answer: String(product),
    choices: fourChoices(rng, product, [a * (b + 1), a * Math.max(0, b - 1), (a + 1) * b, a + b, product + a]),
    skill: `times:${level}`,
    tags: tableTags(a, b),
    factKey: timesKey(a, b),
    visual: { kind: "times", a, b, hidden: product, solved },
  };
}

function sheetItem(rng: Rng, level: string, focus?: number): SheetItem {
  const extra = spanSheet(rng, "times", level);
  if (extra) return extra;
  if (level === "bigMulti") return bigMultiSheet(rng);
  const safe = isTimesLevel(level) ? level : "toTen";
  const fact =
    focus && focus >= 2 && focus <= 12 ? { a: focus, b: rng.int(1, 10) } : nextTimesFact(rng, safe, []);
  return { prompt: `${fact.a} ${TIMES} ${fact.b} =`, answer: String(fact.a * fact.b) };
}

export function TimesPrompt({ question, reveal, mascot, happy }: { question: ChoiceQ; reveal: boolean; mascot: string; happy: boolean }) {
  if (question.visual.kind === "scene" && question.visual.board.game === "times") {
    return (
      <SceneCard title={question.title} mascot={mascot} happy={happy} hint={question.hint} hands={false} answer={question.answer}>
        <BigMultiArt board={question.visual.board} reveal={reveal} />
      </SceneCard>
    );
  }
  return (
    <section className="ac-qcard">
      <h1>{question.title}</h1>
      <SquisheeImg id={mascot} className={cx("ac-mascot", happy && "is-happy")} />
      <Equation visual={question.visual} reveal={reveal} answer={question.answer} />
      {question.visual.kind === "times" ? <Groups a={question.visual.a} b={question.visual.b} /> : null}
      <p className="ac-hint">{question.hint}</p>
    </section>
  );
}

export function TimesSheet({ items }: { items: SheetItem[] }) {
  return (
    <ol className="ac-problems">
      {items.map((item, i) => (
        <li key={`${item.prompt}-${i}`}>{item.prompt}</li>
      ))}
    </ol>
  );
}

export const timesGame = {
  ...timesCard,
  makeQuestion: (rng, level, prefer) => makeTimesQuestion(rng, isTimesLevel(level) ? level : "count", prefer),
  makeSheetItem: sheetItem,
  Prompt: TimesPrompt,
  SheetBody: TimesSheet,
} satisfies GameModule;
