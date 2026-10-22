import type { Rng } from "@/lib/rng";
import { coinAsA, coinButton, t } from "../i18n";
import { buddyName, pickTalk } from "./flavor";
import { moneyCard } from "./cards";
import { CoinRow } from "../ui/coins";
import { SquisheeImg, cx } from "../ui/bits";
import { fourChoices, qid } from "./choices";
import { makeSpendQuestion, spanSheet } from "./span";
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

export const MONEY_LEVELS = ["name", "count", "make", "change", "dollars", "spend"] as const;
export type MoneyLevel = (typeof MONEY_LEVELS)[number];

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

function centChoices(rng: Rng, answer: number, preferred: number[]): string[] {
  return fourChoices(rng, answer, preferred).map((label) => formatCents(Number(label)));
}

function hintFor(kind: CoinKind): string {
  switch (kind) {
    case "penny":
      return t("Copper. It says 1.", "Es de cobre. Dice 1.");
    case "nickel":
      return t("Silver. It says 5.", "Es plateada. Dice 5.");
    case "dime":
      return t("Small and silver. It says 10.", "Es chiquita y plateada. Dice 10.");
    case "quarter":
      return t("The biggest silver coin. It says 25.", "Es la moneda plateada más grande. Dice 25.");
    case "dollar":
      return t("A green bill. It says $1.", "Es un billete verde. Dice $1.");
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
  const labels: Record<string, string> = {};
  for (const row of nameKinds()) labels[COIN_NAME[row]] = coinButton(row, COIN_NAME[row]);
  const coin = coinAsA(kind, name.toLowerCase());
  return {
    id: qid(rng),
    game: "money",
    title: (() => {
      const buddy = buddyName(rng);
      return pickTalk(rng, [
        ["What coin is this?", "¿Qué moneda es esta?"],
        [`${buddy} holds up a coin. What coin is it?`, `${buddy} muestra una moneda. ¿Cuál es?`, `${buddy} mostra uma moeda. Qual é?`, `${buddy} montre une pièce. Laquelle est-ce ?`, `${buddy}举起一枚硬币。这是哪种硬币？`],
      ]);
    })(),
    hint: hintFor(kind),
    praise: t(`Yes! That is a ${name.toLowerCase()}.`, `¡Sí! Es ${coin}.`, `Sim! É ${coin}.`, `Oui ! C'est ${coin}.`, `对！这是${coin}。`),
    almost: t(`Almost! That one is a ${name.toLowerCase()}.`, `¡Casi! Esa es ${coin}.`, `Quase! Essa é ${coin}.`, `Presque ! C'est ${coin}.`, `差一点！这枚是${coin}。`),
    answer: name,
    choices,
    skill: "money:name",
    tags: ["coins"],
    visual: { kind: "money", mode: "name", coins: oneCoin(kind), labels },
  };
}

function makeCount(rng: Rng): ChoiceQ {
  const coins = countPile(rng);
  const total = pileCents(coins);
  const pile = describePile(coins);
  return {
    id: qid(rng),
    game: "money",
    title: (() => {
      const buddy = buddyName(rng);
      return pickTalk(rng, [
        ["How much money?", "¿Cuánto dinero hay?"],
        [`${buddy} counts the coins. How much?`, `${buddy} cuenta las monedas. ¿Cuánto es?`, `${buddy} conta as moedas. Quanto é?`, `${buddy} compte les pièces. Combien est-ce ?`, `${buddy}在数硬币。一共多少钱？`],
      ]);
    })(),
    hint: t("Add the coins", "Suma las monedas"),
    praise: t(`Yes! ${pile} is ${formatCents(total)}.`, `¡Sí! ${pile} son ${formatCents(total)}.`, `Sim! ${pile} são ${formatCents(total)}.`, `Oui ! ${pile} font ${formatCents(total)}.`, `对！${pile}是${formatCents(total)}。`),
    almost: t(`Almost! ${pile} is ${formatCents(total)}.`, `¡Casi! ${pile} son ${formatCents(total)}.`, `Quase! ${pile} são ${formatCents(total)}.`, `Presque ! ${pile} font ${formatCents(total)}.`, `差一点！${pile}是${formatCents(total)}。`),
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
  const made = labels[answer] ?? "";
  const price = formatCents(target);
  return {
    id: qid(rng),
    game: "money",
    title: (() => {
      const buddy = buddyName(rng);
      return pickTalk(rng, [
        [`Which coins make ${price}?`, `¿Qué monedas forman ${price}?`, `Quais moedas formam ${price}?`, `Quelles pièces font ${price} ?`, `哪些硬币能凑成${price}？`],
        [`${buddy} needs ${price}. Which coins make it?`, `${buddy} necesita ${price}. ¿Qué monedas lo forman?`, `${buddy} precisa de ${price}. Quais moedas formam esse valor?`, `${buddy} a besoin de ${price}. Quelles pièces font cette somme ?`, `${buddy}需要${price}。哪些硬币能凑成它？`],
      ]);
    })(),
    hint: t("Count each group", "Cuenta cada grupo"),
    praise: t(`Yes! ${made} makes ${price}.`, `¡Sí! ${made} forman ${price}.`, `Sim! ${made} formam ${price}.`, `Oui ! ${made} font ${price}.`, `对！${made}能凑成${price}。`),
    almost: t(`Almost! ${made} makes ${price}.`, `¡Casi! ${made} forman ${price}.`, `Quase! ${made} formam ${price}.`, `Presque ! ${made} font ${price}.`, `差一点！${made}能凑成${price}。`),
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
  const paidLabel = formatCents(paidCents);
  const priceLabel = formatCents(price);
  const changeLabel = formatCents(change);
  return {
    id: qid(rng),
    game: "money",
    title: (() => {
      const buddy = buddyName(rng);
      return pickTalk(rng, [
        ["How much change?", "¿Cuánto es el cambio?"],
        [`${buddy} pays. How much change is left?`, `${buddy} paga. ¿Cuánto cambio sobra?`, `${buddy} paga. Quanto sobra de troco?`, `${buddy} paie. Combien de monnaie reste-t-il ?`, `${buddy}付了钱。要找回多少钱？`],
      ]);
    })(),
    hint: t(`You pay ${paidLabel}. The price is ${priceLabel}.`, `Pagas ${paidLabel}. El precio es ${priceLabel}.`, `Você paga ${paidLabel}. O preço é ${priceLabel}.`, `Tu paies ${paidLabel}. Le prix est ${priceLabel}.`, `你付${paidLabel}。价格是${priceLabel}。`),
    praise: t(`Yes! The change is ${changeLabel}.`, `¡Sí! El cambio es ${changeLabel}.`, `Sim! O troco é ${changeLabel}.`, `Oui ! La monnaie est ${changeLabel}.`, `对！找回的是${changeLabel}。`),
    almost: t(`Almost! The change is ${changeLabel}.`, `¡Casi! El cambio es ${changeLabel}.`, `Quase! O troco é ${changeLabel}.`, `Presque ! La monnaie est ${changeLabel}.`, `差一点！找回的是${changeLabel}。`),
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
  const amount = formatCents(total);
  return {
    id: qid(rng),
    game: "money",
    title: (() => {
      const buddy = buddyName(rng);
      return pickTalk(rng, [
        ["How many dollars and cents?", "¿Cuántos dólares y centavos hay?"],
        [`${buddy} has dollars and coins. How much?`, `${buddy} tiene dólares y monedas. ¿Cuánto es?`, `${buddy} tem dólares e moedas. Quanto é?`, `${buddy} a des dollars et des pièces. Combien est-ce ?`, `${buddy}有美元和硬币。一共多少钱？`],
      ]);
    })(),
    hint: t("Dollars, then cents", "Primero los dólares, luego los centavos"),
    praise: t(`Yes! That is ${amount}.`, `¡Sí! Son ${amount}.`, `Sim! São ${amount}.`, `Oui ! Ça fait ${amount}.`, `对！是${amount}。`),
    almost: t(`Almost! That is ${amount}.`, `¡Casi! Son ${amount}.`, `Quase! São ${amount}.`, `Presque ! Ça fait ${amount}.`, `差一点！是${amount}。`),
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
    case "spend":
      return makeSpendQuestion(rng);
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
      return { prompt: t(`Name the coin marked ${COIN_CENTS[kind]}:`, `Nombra la moneda marcada ${COIN_CENTS[kind]}:`, `Diga a moeda marcada ${COIN_CENTS[kind]}:`, `Dis la pièce marquée ${COIN_CENTS[kind]} :`, `标着${COIN_CENTS[kind]}的硬币叫什么：`), answer: COIN_NAME[kind] };
    }
    case "count": {
      const coins = countPile(rng);
      const pile = describePile(coins);
      return { prompt: t(`${pile} =`, `${pile} =`, `${pile} =`, `${pile} =`, `${pile} =`), answer: formatCents(pileCents(coins)) };
    }
    case "make": {
      const target = rng.pick(MAKE_TARGETS);
      const way = describePile(composePile(rng, target, false));
      const price = formatCents(target);
      return { prompt: t(`Make ${price}. One way:`, `Forma ${price}. Una forma:`, `Monte ${price}. Um jeito:`, `Forme ${price}. Une façon :`, `凑出${price}。一种办法：`), answer: way };
    }
    case "change": {
      const paid = rng.int(2, 20) * 5;
      const price = rng.int(1, paid / 5 - 1) * 5;
      const paidLabel = formatCents(paid);
      const priceLabel = formatCents(price);
      return {
        prompt: t(`Pay ${paidLabel}. Price ${priceLabel}. Change =`, `Pagas ${paidLabel}. Precio ${priceLabel}. Cambio =`, `Você paga ${paidLabel}. Preço ${priceLabel}. Troco =`, `Tu paies ${paidLabel}. Prix ${priceLabel}. Monnaie =`, `你付${paidLabel}。价格${priceLabel}。找回 =`),
        answer: formatCents(paid - price),
      };
    }
    case "dollars": {
      const dollars = rng.int(1, 2);
      const cents = rng.pick([10, 25, 50, 75]);
      const word = dollars === 1 ? "dollar" : "dollars";
      const esWord = dollars === 1 ? "dólar" : "dólares";
      return {
        prompt: t(`${dollars} ${word} and ${cents}¢ =`, `${dollars} ${esWord} y ${cents}¢ =`, `${dollars} ${esWord} e ${cents}¢ =`, `${dollars} ${esWord} et ${cents}¢ =`, `${dollars} ${word}和${cents}¢ =`),
        answer: formatCents(dollars * 100 + cents),
      };
    }
    case "spend": {
      const printed = spanSheet(rng, "money", "spend");
      if (printed) return printed;
      return { prompt: t("A snack is $1.50 and a drink is $1.25. How much altogether?", "Una merienda cuesta $1.50 y un jugo cuesta $1.25. ¿Cuánto es en total?"), answer: "$2.75" };
    }
    default: {
      const neverLevel: never = safe;
      return neverLevel;
    }
  }
}

function MoneyArt({ visual, large }: { visual: MoneyVisual; large?: boolean }) {
  const mode: MoneyMode = visual.mode;
  if (mode === "make") return null;
  const pile = describePile(visual.coins);
  if (mode === "spend" && visual.coins.dollar === 0) return null;
  const label =
    mode === "name"
      ? t("A coin", "Una moneda")
      : mode === "change" || mode === "spend"
        ? t(`You pay ${pile}`, `Pagas ${pile}`, `Você paga ${pile}`, `Tu paies ${pile}`, `你付${pile}`)
        : pile;
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
      {(visual.mode === "change" || visual.mode === "spend") && visual.priceCents != null ? (
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
  ...moneyCard,
  makeQuestion: (rng, level) => makeMoneyQuestion(rng, isMoneyLevel(level) ? level : "name"),
  makeSheetItem: sheetItem,
  Prompt: MoneyPrompt,
  SheetBody: MoneySheet,
} satisfies GameModule;
