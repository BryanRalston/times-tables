import type { Rng } from "@/lib/rng";
import { bandFor } from "../grade-map";
import type { Grade } from "../model";
import { CoinRow } from "../ui/coins";
import { SquisheeImg, cx } from "../ui/bits";
import { fourChoices, qid } from "./choices";
import {
  COIN_CENTS,
  COIN_NAME,
  composePile,
  describePile,
  emptyPile,
  formatCents,
  nameKinds,
  oneCoin,
  pileCents,
  type CoinKind,
} from "./money-model";
import type { ChoiceQ, CoinPile, GameModule, MoneyMode, MoneyVisual, SheetItem } from "./types";

export const MONEY_LEVELS = ["name", "count", "make", "change", "dollars"] as const;
export type MoneyLevel = (typeof MONEY_LEVELS)[number];

const LEVELS = [
  { id: "name", label: "Name the coins", num: 1 },
  { id: "count", label: "Count coins", num: 2 },
  { id: "make", label: "Make an amount", num: 3 },
  { id: "change", label: "Make change", num: 4 },
  { id: "dollars", label: "Dollars and cents", num: 5 },
] as const;

const BARS = [
  { key: "money:name", label: "Name coins" },
  { key: "money:count", label: "Count coins" },
  { key: "money:make", label: "Make an amount" },
  { key: "money:change", label: "Make change" },
  { key: "money:dollars", label: "Dollars and cents" },
];

const CHIPS = [
  { key: "money:name", label: "Names coins" },
  { key: "money:count", label: "Counts coins" },
  { key: "money:make", label: "Makes an amount" },
  { key: "money:change", label: "Makes change" },
  { key: "money:dollars", label: "Dollars and cents" },
];

const PAYS: CoinPile[] = [
  oneCoin("quarter"),
  { penny: 0, nickel: 0, dime: 0, quarter: 2, dollar: 0 },
  { penny: 0, nickel: 0, dime: 0, quarter: 3, dollar: 0 },
  { penny: 0, nickel: 0, dime: 5, quarter: 0, dollar: 0 },
  { penny: 0, nickel: 0, dime: 0, quarter: 4, dollar: 0 },
  oneCoin("dollar"),
];

const MAKE_TARGETS = [10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 75];

export function isMoneyLevel(value: unknown): value is MoneyLevel {
  return typeof value === "string" && (MONEY_LEVELS as readonly string[]).includes(value);
}

function defaultLevel(grade: Grade): MoneyLevel {
  const start = bandFor("money", grade)?.start;
  if (isMoneyLevel(start)) return start;
  switch (grade) {
    case "K":
      return "name";
    case "1":
      return "count";
    case "2":
      return "make";
    case "3":
      return "dollars";
    default: {
      const neverGrade: never = grade;
      return neverGrade;
    }
  }
}

function centChoices(rng: Rng, answer: number, preferred: number[]): string[] {
  return fourChoices(rng, answer, preferred).map((label) => formatCents(Number(label)));
}

function hintFor(kind: CoinKind): string {
  switch (kind) {
    case "penny":
      return "Copper. It says 1.";
    case "nickel":
      return "Silver. It says 5.";
    case "dime":
      return "Small and silver. It says 10.";
    case "quarter":
      return "The biggest silver coin. It says 25.";
    case "dollar":
      return "A green bill. It says $1.";
    default: {
      const neverKind: never = kind;
      return neverKind;
    }
  }
}

function countPile(rng: Rng): CoinPile {
  const kinds: CoinKind[] = ["penny", "nickel", "dime", "quarter"];
  const pile = emptyPile();
  const n = rng.int(1, 3);
  for (let i = 0; i < n; i++) {
    const kind = rng.pick(kinds);
    if (kind === "quarter" && pile.quarter >= 1) continue;
    if (pileCents(pile) + COIN_CENTS[kind] > 50) continue;
    pile[kind] += 1;
  }
  if (pileCents(pile) === 0) pile.penny = rng.int(1, 5);
  return pile;
}

function makeName(rng: Rng): ChoiceQ {
  const kind = rng.pick(nameKinds());
  const name = COIN_NAME[kind];
  const choices = rng.shuffle(nameKinds().map((row) => COIN_NAME[row]));
  return {
    id: qid(rng),
    game: "money",
    title: "What coin is this?",
    hint: hintFor(kind),
    praise: `Yes! That is a ${name.toLowerCase()}.`,
    almost: `Almost! That one is a ${name.toLowerCase()}.`,
    answer: name,
    choices,
    skill: "money:name",
    tags: ["coins"],
    visual: { kind: "money", mode: "name", coins: oneCoin(kind) },
  };
}

function makeCount(rng: Rng): ChoiceQ {
  const coins = countPile(rng);
  const total = pileCents(coins);
  return {
    id: qid(rng),
    game: "money",
    title: "How much money?",
    hint: "Add the coins",
    praise: `Yes! ${describePile(coins)} is ${formatCents(total)}.`,
    almost: `Almost! ${describePile(coins)} is ${formatCents(total)}.`,
    answer: formatCents(total),
    choices: centChoices(rng, total, [total + 1, total - 1, total + 5, total - 5, total + 10]),
    skill: "money:count",
    tags: ["coins"],
    visual: { kind: "money", mode: "count", coins },
  };
}

function makeMake(rng: Rng): ChoiceQ {
  const target = rng.pick(MAKE_TARGETS);
  const amounts = [target];
  const pool = MAKE_TARGETS.filter((n) => n !== target);
  while (amounts.length < 4 && pool.length) {
    const next = pool.splice(rng.int(0, pool.length - 1), 1)[0];
    if (next != null) amounts.push(next);
  }
  const piles: Record<string, CoinPile> = {};
  const labels: Record<string, string> = {};
  const keys = amounts.map((_, i) => `p${i}`);
  amounts.forEach((cents, i) => {
    const key = keys[i]!;
    const pile = composePile(rng, cents, false);
    piles[key] = pile;
    labels[key] = describePile(pile);
  });
  const answer = "p0";
  return {
    id: qid(rng),
    game: "money",
    title: `Which coins make ${formatCents(target)}?`,
    hint: "Count each group",
    praise: `Yes! ${labels[answer]} makes ${formatCents(target)}.`,
    almost: `Almost! ${labels[answer]} makes ${formatCents(target)}.`,
    answer,
    choices: rng.shuffle(keys),
    skill: "money:make",
    tags: ["coins"],
    visual: { kind: "money", mode: "make", coins: emptyPile(), priceCents: target, piles, labels },
  };
}

function makeChange(rng: Rng): ChoiceQ {
  const paid = rng.pick(PAYS);
  const paidCents = pileCents(paid);
  const steps: number[] = [];
  for (let price = 5; price < paidCents; price += 5) steps.push(price);
  const price = rng.pick(steps.length ? steps : [1]);
  const change = paidCents - price;
  return {
    id: qid(rng),
    game: "money",
    title: "How much change?",
    hint: `You pay ${formatCents(paidCents)}. The price is ${formatCents(price)}.`,
    praise: `Yes! The change is ${formatCents(change)}.`,
    almost: `Almost! The change is ${formatCents(change)}.`,
    answer: formatCents(change),
    choices: centChoices(rng, change, [change + 5, change - 5, change + 10, price, paidCents]),
    skill: "money:change",
    tags: ["coins", "change"],
    visual: { kind: "money", mode: "change", coins: paid, priceCents: price },
  };
}

function makeDollars(rng: Rng): ChoiceQ {
  const dollars = rng.int(1, 2);
  const cents = rng.pick([5, 10, 15, 20, 25, 30, 40, 50, 65, 75]);
  const coins = composePile(rng, cents, false);
  coins.dollar = dollars;
  const total = pileCents(coins);
  return {
    id: qid(rng),
    game: "money",
    title: "How much money?",
    hint: "Dollars, then cents",
    praise: `Yes! That is ${formatCents(total)}.`,
    almost: `Almost! That is ${formatCents(total)}.`,
    answer: formatCents(total),
    choices: centChoices(rng, total, [total + 5, total - 5, total + 10, total - 25, dollars * 100, cents]),
    skill: "money:dollars",
    tags: ["coins", "dollars"],
    visual: { kind: "money", mode: "dollars", coins },
  };
}

export function makeMoneyQuestion(rng: Rng, level: MoneyLevel): ChoiceQ {
  switch (level) {
    case "name":
      return makeName(rng);
    case "count":
      return makeCount(rng);
    case "make":
      return makeMake(rng);
    case "change":
      return makeChange(rng);
    case "dollars":
      return makeDollars(rng);
    default: {
      const neverLevel: never = level;
      return neverLevel;
    }
  }
}

function sheetItem(rng: Rng, level: string): SheetItem {
  const safe: MoneyLevel = isMoneyLevel(level) ? level : "count";
  switch (safe) {
    case "name": {
      const kind = rng.pick(nameKinds());
      return { prompt: `Name the coin marked ${COIN_CENTS[kind]}:`, answer: COIN_NAME[kind] };
    }
    case "count": {
      const coins = countPile(rng);
      return { prompt: `${describePile(coins)} =`, answer: formatCents(pileCents(coins)) };
    }
    case "make": {
      const target = rng.pick(MAKE_TARGETS);
      return { prompt: `Make ${formatCents(target)}. One way:`, answer: describePile(composePile(rng, target, false)) };
    }
    case "change": {
      const paid = rng.int(2, 20) * 5;
      const price = rng.int(1, paid / 5 - 1) * 5;
      return { prompt: `Pay ${formatCents(paid)}. Price ${formatCents(price)}. Change =`, answer: formatCents(paid - price) };
    }
    case "dollars": {
      const dollars = rng.int(1, 2);
      const cents = rng.pick([10, 25, 50, 75]);
      return { prompt: `${dollars} dollar${dollars === 1 ? "" : "s"} and ${cents}¢ =`, answer: formatCents(dollars * 100 + cents) };
    }
    default: {
      const neverLevel: never = safe;
      return neverLevel;
    }
  }
}

function labelFor(rows: { key: string; label: string }[], key: string): string | null {
  return rows.find((row) => row.key === key)?.label ?? null;
}

function MoneyArt({ visual, large }: { visual: MoneyVisual; large?: boolean }) {
  const mode: MoneyMode = visual.mode;
  if (mode === "make") return null;
  const label =
    mode === "name"
      ? "A coin"
      : mode === "change"
        ? `You pay ${describePile(visual.coins)}`
        : describePile(visual.coins);
  return <CoinRow pile={visual.coins} large={large ?? mode === "name"} label={label} />;
}

export function MoneyPrompt({
  question,
  mascot,
  happy,
}: {
  question: ChoiceQ;
  reveal: boolean;
  mascot: string;
  happy: boolean;
}) {
  if (question.visual.kind !== "money") return null;
  const visual = question.visual;
  return (
    <section className="ac-qcard">
      <h1>{question.title}</h1>
      <SquisheeImg id={mascot} className={cx("ac-mascot", happy && "is-happy")} />
      <MoneyArt visual={visual} />
      {visual.mode === "change" && visual.priceCents != null ? (
        <p className="ac-eq ac-money-price">{formatCents(visual.priceCents)}</p>
      ) : null}
      <p className="ac-hint">{question.hint}</p>
    </section>
  );
}

export function MoneySheet({ items }: { items: SheetItem[] }) {
  return (
    <ol className="ac-problems">
      {items.map((item, i) => (
        <li key={`${item.prompt}-${i}`}>{item.prompt}</li>
      ))}
    </ol>
  );
}

export const moneyGame = {
  id: "money",
  title: "Money",
  audience: "K–3",
  tint: "gold",
  mascot: "lemon",
  sheetSlug: "money",
  sheetScreen: "sheet-money",
  blurb:
    "Free printable coin practice for grades K–3. Name pennies, nickels, dimes, and quarters, count them, make an amount, make change within $1, and read dollars and cents.",
  sheetCount: 12,
  layout: "card",
  levels: [...LEVELS],
  defaultLevel,
  sheetDefaultLevel: "count",
  isLevel: isMoneyLevel,
  pill: (level) => `Money · Level ${level.num}`,
  makeQuestion: (rng, level) => makeMoneyQuestion(rng, isMoneyLevel(level) ? level : "name"),
  makeSheetItem: sheetItem,
  Prompt: MoneyPrompt,
  SheetBody: MoneySheet,
  bars: BARS,
  chips: CHIPS,
  skillLabel: (key) => labelFor(BARS, key) ?? labelFor(CHIPS, key),
  chipLabel: (key) => labelFor(CHIPS, key),
} satisfies GameModule;
