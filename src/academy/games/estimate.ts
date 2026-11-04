import type { Rng } from "@/lib/rng";
import { STORY_STARS } from "../buddy/persona";
import { countedNoun, t, thingName } from "../i18n";
import { countName, type EstimateKind, type ProblemBoard } from "./boards";
import { sceneQuestion, uniqueChoices } from "./pick";
import type { ChoiceQ, SheetItem } from "./types";

/** Grade 3 estimation stories: rounding (3.NBT.A.1) and checking an answer with tens (3.OA.D.8). */

const ESTIMATE_THINGS = [
  { name: "apples", emoji: "🍎", ar: "التفاحات" },
  { name: "stars", emoji: "⭐", ar: "النجوم" },
  { name: "cookies", emoji: "🍪", ar: "قطع البسكويت" },
  { name: "balls", emoji: "⚽", ar: "الكرات" },
] as const;

export const ESTIMATE_KINDS: readonly EstimateKind[] = ["ten", "hundred", "sum", "diff", "check"];

export function roundTo(n: number, place: number): number {
  return Math.floor((n + place / 2) / place) * place;
}

/** Two-digit number that is not a multiple of ten and does not end in 5, so rounding is never a coin flip. */
function clearTwoDigit(rng: Rng, lo: number, hi: number): number {
  for (let guard = 0; guard < 40; guard += 1) {
    const n = rng.int(lo, hi);
    if (n % 10 !== 0 && n % 10 !== 5) return n;
  }
  return lo % 10 === 0 ? lo + 2 : lo;
}

/**
 * Arabic stories name the things with a definite plural and state the count as "عدد … هو n",
 * so no number-noun agreement (3-10 plural, 11+ singular tamyiz) is ever needed.
 */
function items(thing: string, n: number): string {
  return thingName(thing, n, countName(thing, n));
}

function roundChoices(rng: Rng, n: number, place: number, answer: number): string[] {
  const lower = Math.floor(n / place) * place;
  const upper = lower + place;
  const pool = [lower, upper, upper + place, lower - place, upper + 2 * place].filter((v) => v > 0 && v !== answer);
  return uniqueChoices(rng, String(answer), [...new Set(pool)].slice(0, 3).map(String));
}

function tensChoices(rng: Rng, answer: number): string[] {
  const pool = [answer - 10, answer + 10, answer + 20, answer - 20, answer + 30].filter((v) => v > 0);
  return uniqueChoices(rng, String(answer), pool.slice(0, 3).map(String));
}

/** Same ones digit on every choice, so only an estimate tells them apart. */
function checkChoices(rng: Rng, exact: number): string[] {
  const pool = [exact + 40, exact - 30, exact + 70, exact + 100].filter((v) => v > 0);
  return uniqueChoices(rng, String(exact), pool.slice(0, 3).map(String));
}

export function makeEstimateQuestion(rng: Rng, prefer: readonly string[] = []): ChoiceQ {
  const kinds = ESTIMATE_KINDS.filter((kind) => prefer.includes(kind));
  const kind = rng.pick(kinds.length > 0 ? [...kinds] : [...ESTIMATE_KINDS]);
  const star = rng.pick([...STORY_STARS]);
  const who = star.name;
  const pal = star.pal;
  const thing = rng.pick([...ESTIMATE_THINGS]);
  const arThings = thing.ar;
  const board = (a: number, b: number, op: ProblemBoard["op"]): ProblemBoard => ({
    game: "problems",
    mode: "estimate",
    estimate: kind,
    op,
    a,
    b,
    emoji: thing.emoji,
    thing: thing.name,
  });
  const base = {
    game: "problems",
    skill: "problems:estimate",
    tags: ["estimate", kind],
    picture: thing.emoji,
    hands: false,
    quietChoices: false,
    labels: {},
  };

  if (kind === "ten" || kind === "hundred") {
    const place = kind === "ten" ? 10 : 100;
    const n = kind === "ten" ? clearTwoDigit(rng, 12, 98) : (() => {
      for (let guard = 0; guard < 40; guard += 1) {
        const v = rng.int(110, 990);
        const tens = Math.floor(v / 10) % 10;
        if (v % 100 !== 0 && tens !== 5) return v;
      }
      return 362;
    })();
    const answer = roundTo(n, place);
    const zhThing = countedNoun(thing.name, n);
    const title =
      kind === "ten"
        ? t(
            `${who} counts ${n} ${items(thing.name, n)}. What is ${n} rounded to the nearest ten?`,
            `${who} cuenta ${n} ${items(thing.name, n)}. ¿Cuánto es ${n} redondeado a la decena más cercana?`,
            `${who} conta ${n} ${items(thing.name, n)}. Quanto é ${n} arredondado para a dezena mais próxima?`,
            `${who} compte ${n} ${items(thing.name, n)}. Combien fait ${n} arrondi à la dizaine la plus proche ?`,
            `${who}数了${zhThing}。把${n}四舍五入到整十数是多少？`,
            `${who} ${n} ${items(thing.name, n)} गिनता है। ${n} को सबसे पास की दहाई तक गोल करो तो कितना होगा?`,
            `يعدّ ${who} ${arThings}. عدد ${arThings} هو ${n}. كم يصبح ${n} مقرّبًا إلى أقرب عشرة؟`,
          )
        : t(
            `${who} counts ${n} ${items(thing.name, n)}. What is ${n} rounded to the nearest hundred?`,
            `${who} cuenta ${n} ${items(thing.name, n)}. ¿Cuánto es ${n} redondeado a la centena más cercana?`,
            `${who} conta ${n} ${items(thing.name, n)}. Quanto é ${n} arredondado para a centena mais próxima?`,
            `${who} compte ${n} ${items(thing.name, n)}. Combien fait ${n} arrondi à la centaine la plus proche ?`,
            `${who}数了${zhThing}。把${n}四舍五入到整百数是多少？`,
            `${who} ${n} ${items(thing.name, n)} गिनता है। ${n} को सबसे पास के सैकड़े तक गोल करो तो कितना होगा?`,
            `يعدّ ${who} ${arThings}. عدد ${arThings} هو ${n}. كم يصبح ${n} مقرّبًا إلى أقرب مئة؟`,
          );
    const hint =
      kind === "ten"
        ? t("Look at the ones digit. 5 or more rounds up.", "Mira las unidades. 5 o más redondea hacia arriba.", "Olhe as unidades. 5 ou mais arredonda para cima.", "Regarde les unités. 5 ou plus, on arrondit au-dessus.", "看个位。5或以上就进一。", "इकाई का अंक देखो। 5 या ज़्यादा हो तो ऊपर गोल करो।", "انظر إلى رقم الآحاد. 5 أو أكثر نقرّب إلى الأعلى.")
        : t("Look at the tens digit. 5 or more rounds up.", "Mira las decenas. 5 o más redondea hacia arriba.", "Olhe as dezenas. 5 ou mais arredonda para cima.", "Regarde les dizaines. 5 ou plus, on arrondit au-dessus.", "看十位。5或以上就进一。", "दहाई का अंक देखो। 5 या ज़्यादा हो तो ऊपर गोल करो।", "انظر إلى رقم العشرات. 5 أو أكثر نقرّب إلى الأعلى.");
    return sceneQuestion(rng, {
      ...base,
      title,
      hint,
      answer: String(answer),
      choices: roundChoices(rng, n, place, answer),
      solved: t(`${n} rounds to ${answer}`, `${n} se redondea a ${answer}`, `${n} arredonda para ${answer}`, `${n} s'arrondit à ${answer}`, `${n}四舍五入是${answer}`, `${n} गोल होकर ${answer} होता है`, `${n} يُقرَّب إلى ${answer}`),
      board: board(n, place, "+"),
      factKey: `estimate:${kind}:${n}`,
    });
  }

  const tensHint = t("Round each number to the nearest ten first.", "Primero redondea cada número a la decena más cercana.", "Primeiro arredonde cada número para a dezena mais próxima.", "Arrondis d'abord chaque nombre à la dizaine la plus proche.", "先把每个数四舍五入到整十数。", "पहले हर संख्या को सबसे पास की दहाई तक गोल करो।", "قرّب كل عدد إلى أقرب عشرة أولًا.");

  if (kind === "diff") {
    const a = clearTwoDigit(rng, 51, 98);
    const b = clearTwoDigit(rng, 11, a - 21);
    const ra = roundTo(a, 10);
    const rb = roundTo(b, 10);
    const answer = ra - rb;
    return sceneQuestion(rng, {
      ...base,
      title: t(
        `${who} has ${a} ${items(thing.name, a)} and gives ${b} to ${pal}. About how many are left?`,
        `${who} tiene ${a} ${items(thing.name, a)} y le da ${b} a ${pal}. ¿Aproximadamente cuánto queda?`,
        `${who} tem ${a} ${items(thing.name, a)} e dá ${b} para ${pal}. Aproximadamente quanto sobra?`,
        `${who} a ${a} ${items(thing.name, a)} et en donne ${b} à ${pal}. À peu près combien en reste-t-il ?`,
        `${who}有${countedNoun(thing.name, a)}，给了${pal}${countedNoun(thing.name, b)}。差不多还剩多少？`,
        `${who} के पास ${a} ${items(thing.name, a)} हैं और ${pal} को ${b} देता है। लगभग कितने बचे?`,
        `عدد ${arThings} عند ${who} هو ${a}. يعطي ${pal} منها ${b}. كم بقي تقريبًا؟`,
      ),
      hint: tensHint,
      answer: String(answer),
      choices: tensChoices(rng, answer),
      solved: `${ra} - ${rb} = ${answer}`,
      board: board(a, b, "-"),
      factKey: `estimate:diff:${a}-${b}`,
    });
  }

  const a = clearTwoDigit(rng, 21, 69);
  const b = clearTwoDigit(rng, 21, 69);
  const ra = roundTo(a, 10);
  const rb = roundTo(b, 10);
  if (kind === "sum") {
    const answer = ra + rb;
    return sceneQuestion(rng, {
      ...base,
      title: t(
        `${who} has ${a} ${items(thing.name, a)}. ${pal} has ${b}. About how many in all?`,
        `${who} tiene ${a} ${items(thing.name, a)}. ${pal} tiene ${b}. ¿Cuál es el total aproximado?`,
        `${who} tem ${a} ${items(thing.name, a)}. ${pal} tem ${b}. Qual é o total aproximado?`,
        `${who} a ${a} ${items(thing.name, a)}. ${pal} en a ${b}. À peu près combien en tout ?`,
        `${who}有${countedNoun(thing.name, a)}。${pal}有${countedNoun(thing.name, b)}。差不多一共有多少？`,
        `${who} के पास ${a} ${items(thing.name, a)} हैं। ${pal} के पास ${b} हैं। लगभग कुल कितने हैं?`,
        `عدد ${arThings} عند ${who} هو ${a}، وعند ${pal} هو ${b}. كم المجموع تقريبًا؟`,
      ),
      hint: tensHint,
      answer: String(answer),
      choices: tensChoices(rng, answer),
      solved: `${ra} + ${rb} = ${answer}`,
      board: board(a, b, "+"),
      factKey: `estimate:sum:${a}+${b}`,
    });
  }

  const exact = a + b;
  const est = ra + rb;
  return sceneQuestion(rng, {
    ...base,
    title: t(
      `${who} has ${a} ${items(thing.name, a)}. ${pal} brings ${b} more. Which total makes sense?`,
      `${who} tiene ${a} ${items(thing.name, a)}. ${pal} trae ${b} más. ¿Qué total tiene sentido?`,
      `${who} tem ${a} ${items(thing.name, a)}. ${pal} traz ${b} a mais. Qual total faz sentido?`,
      `${who} a ${a} ${items(thing.name, a)}. ${pal} en apporte ${b} de plus. Quel total a du sens ?`,
      `${who}有${countedNoun(thing.name, a)}。${pal}又拿来${countedNoun(thing.name, b)}。哪个总数可能是对的？`,
      `${who} के पास ${a} ${items(thing.name, a)} हैं। ${pal} ${b} और लाता है। कौन सा कुल सही लगता है?`,
      `عدد ${arThings} عند ${who} هو ${a}. ثم يضيف ${pal} إليها ${b}. أي مجموع معقول؟`,
    ),
    hint: t("Round to tens. Which total is close?", "Redondea a decenas. ¿Qué total está cerca?", "Arredonde para dezenas. Qual total está perto?", "Arrondis aux dizaines. Quel total est proche ?", "先凑成整十数。哪个总数接近？", "दहाई तक गोल करो। कौन सा कुल पास है?", "قرّب إلى العشرات. أي مجموع قريب؟"),
    answer: String(exact),
    choices: checkChoices(rng, exact),
    solved: t(`${ra} + ${rb} = ${est}. ${exact} is close`, `${ra} + ${rb} = ${est}. ${exact} está cerca`, `${ra} + ${rb} = ${est}. ${exact} está perto`, `${ra} + ${rb} = ${est}. ${exact} est proche`, `${ra} + ${rb} = ${est}。${exact}很接近`, `${ra} + ${rb} = ${est}। ${exact} पास है`, `${ra} + ${rb} = ${est}. ${exact} قريب`),
    board: board(a, b, "+"),
    factKey: `estimate:check:${a}+${b}`,
  });
}

export function estimateSheet(rng: Rng): SheetItem {
  const q = makeEstimateQuestion(rng);
  return { prompt: q.title, answer: q.answer };
}
