import type { Rng } from "@/lib/rng";
import { STORY_STARS, type StoryStar } from "../buddy/persona";
import { countedNoun, howManyPhrase, nounMeasure, starLead, t, thingName } from "../i18n";
import { problemsCard } from "./cards";
import { countName, type ProblemBoard } from "./boards";
import { nearChoices, sceneQuestion, uniqueChoices } from "./pick";
import { makeStepsQuestion, spanSheet } from "./span";
import { SceneCard, StoryGroups, sceneModule } from "./scene-ui";
import type { ChoiceQ, PromptProps, SheetItem } from "./types";

export const PROBLEM_LEVELS = ["add", "sub", "mult", "div", "picture", "steps"] as const;
export type ProblemLevel = (typeof PROBLEM_LEVELS)[number];

const THINGS = [
  { name: "apples", emoji: "🍎" },
  { name: "fish", emoji: "🐟" },
  { name: "stars", emoji: "⭐" },
  { name: "cookies", emoji: "🍪" },
  { name: "balls", emoji: "⚽" },
  { name: "frogs", emoji: "🐸" },
] as const;

export function isProblemLevel(value: unknown): value is ProblemLevel {
  return typeof value === "string" && (PROBLEM_LEVELS as readonly string[]).includes(value);
}

function storyValue(op: ProblemBoard["op"], a: number, b: number): number {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return a / b;
    default: {
      const neverOp: never = op;
      return neverOp;
    }
  }
}

function starOf(rng: Rng): StoryStar {
  return rng.pick([...STORY_STARS]);
}

function storyTitle(rng: Rng, level: Exclude<ProblemLevel, "picture">, star: StoryStar, a: number, b: number, thing: string): string {
  const items = countName(thing, a);
  const each = countName(thing, b);
  const esItems = thingName(thing, a, items);
  const esEach = thingName(thing, b, each);
  const esMany = howManyPhrase(thing, 2, thing);
  const lead = starLead(star.name, star.trait);
  const bags = countName("bags", a);
  const esBags = thingName("bags", a, bags);
  const roll = rng.int(0, 2);
  if (level === "add") {
    if (roll === 0) {
      return t(
        `${star.name} the ${star.trait} has ${a} ${items}. ${star.pal} brings ${b} more. How many ${thing} now?`,
        `${lead} tiene ${a} ${esItems}. ${star.pal} trae ${b} más. ¿${esMany} hay ahora?`, `${lead} tem ${a} ${esItems}. ${star.pal} traz ${b} a mais. ${esMany} tem agora?`,
      `${lead} a ${a} ${esItems}. ${star.pal} en apporte ${b} de plus. ${esMany} y a-t-il maintenant ?`, `${lead}有${countedNoun(thing, a)}。${star.pal}又拿来${countedNoun(thing, b)}。现在${esMany}？`);
    }
    if (roll === 1) {
      return t(
        `${star.name} finds ${a} ${items} and ${star.pal} finds ${b}. How many ${thing} in all?`,
        `${star.name} encuentra ${a} ${esItems} y ${star.pal} encuentra ${b}. ¿${esMany} hay en total?`, `${star.name} encontra ${a} ${esItems} e ${star.pal} encontra ${b}. ${esMany} tem ao todo?`,
      `${star.name} trouve ${a} ${esItems} et ${star.pal} trouve ${b}. ${esMany} y a-t-il en tout ?`, `${star.name}找到${countedNoun(thing, a)}，${star.pal}找到${countedNoun(thing, b)}。一共${esMany}？`);
    }
    return t(
      `There are ${a} ${items} with ${star.name} and ${b} with ${star.pal}. How many ${thing} altogether?`,
      `Hay ${a} ${esItems} con ${star.name} y ${b} con ${star.pal}. ¿${esMany} hay en total?`, `Tem ${a} ${esItems} com ${star.name} e ${b} com ${star.pal}. ${esMany} tem ao todo?`,
    `Il y a ${a} ${esItems} avec ${star.name} et ${b} avec ${star.pal}. ${esMany} y a-t-il en tout ?`, `${star.name}那里有${countedNoun(thing, a)}，${star.pal}那里有${countedNoun(thing, b)}。一共${esMany}？`);
  }
  if (level === "sub") {
    if (roll === 0) {
      return t(
        `${star.name} has ${a} ${items} and gives ${b} to ${star.pal}. How many ${thing} are left?`,
        `${star.name} tiene ${a} ${esItems} y le da ${b} a ${star.pal}. ¿${esMany} quedan?`, `${star.name} tem ${a} ${esItems} e dá ${b} para ${star.pal}. ${esMany} sobram?`,
      `${star.name} a ${a} ${esItems} et en donne ${b} à ${star.pal}. ${esMany} en reste-t-il ?`, `${star.name}有${countedNoun(thing, a)}，给了${star.pal} ${countedNoun(thing, b)}。还剩几${nounMeasure(thing)}${esItems}？`);
    }
    if (roll === 1) {
      return t(
        `${star.name} the ${star.trait} sees ${a} ${items}. ${b} go to ${star.pal}. How many ${thing} are left?`,
        `${lead} ve ${a} ${esItems}. ${b} se van con ${star.pal}. ¿${esMany} quedan?`, `${lead} vê ${a} ${esItems}. ${b} vão com ${star.pal}. ${esMany} sobram?`,
      `${lead} voit ${a} ${esItems}. ${b} partent avec ${star.pal}. ${esMany} en reste-t-il ?`, `${lead}看见${countedNoun(thing, a)}。有${countedNoun(thing, b)}到${star.pal}那里去了。还剩几${nounMeasure(thing)}${esItems}？`);
    }
    return t(
      `${star.name} starts with ${a} ${items} and shares ${b} with ${star.pal}. How many ${thing} are left?`,
      `${star.name} empieza con ${a} ${esItems} y comparte ${b} con ${star.pal}. ¿${esMany} quedan?`, `${star.name} começa com ${a} ${esItems} e reparte ${b} com ${star.pal}. ${esMany} sobram?`,
    `${star.name} commence avec ${a} ${esItems} et partage ${b} avec ${star.pal}. ${esMany} en reste-t-il ?`, `${star.name}一开始有${countedNoun(thing, a)}，分给${star.pal} ${countedNoun(thing, b)}。还剩几${nounMeasure(thing)}${esItems}？`);
  }
  if (level === "mult") {
    if (roll === 0) {
      return t(
        `${star.name} has ${a} ${bags} with ${b} ${each} in each bag. How many ${thing}?`,
        `${star.name} tiene ${a} ${esBags} con ${b} ${esEach} en cada bolsa. ¿${esMany} hay?`, `${star.name} tem ${a} ${esBags} com ${b} ${esEach} em cada sacola. ${esMany} tem?`,
      `${star.name} a ${a} ${esBags} avec ${b} ${esEach} dans chaque sac. ${esMany} y a-t-il ?`, `${star.name}有${countedNoun("bags", a)}，每个里面有${countedNoun(thing, b)}。${esMany}？`);
    }
    if (roll === 1) {
      return t(
        `${star.name} the ${star.trait} makes ${a} rows of ${b} ${each}. How many ${thing}?`,
        `${lead} hace ${a} filas de ${b} ${esEach}. ¿${esMany} hay?`, `${lead} faz ${a} linhas de ${b} ${esEach}. ${esMany} tem?`,
      `${lead} fait ${a} lignes de ${b} ${esEach}. ${esMany} y a-t-il ?`, `${lead}摆了${a}行，每行${countedNoun(thing, b)}。${esMany}？`);
    }
    return t(
      `${star.pal} sets out ${a} groups of ${b} ${each} for ${star.name}. How many ${thing}?`,
      `${star.pal} pone ${a} grupos de ${b} ${esEach} para ${star.name}. ¿${esMany} hay?`, `${star.pal} põe ${a} grupos de ${b} ${esEach} para ${star.name}. ${esMany} tem?`,
    `${star.pal} pose ${a} groupes de ${b} ${esEach} pour ${star.name}. ${esMany} y a-t-il ?`, `${star.pal}为${star.name}摆了${a}组，每组${countedNoun(thing, b)}。${esMany}？`);
  }
  if (roll === 0) {
    return t(
      `${star.name} has ${a} ${items} shared into ${b} equal groups. How many ${thing} are in each group?`,
      `${star.name} pone ${a} ${esItems} en ${b} grupos iguales. ¿${esMany} hay en cada grupo?`, `${star.name} põe ${a} ${esItems} em ${b} grupos iguais. ${esMany} tem em cada grupo?`,
    `${star.name} met ${a} ${esItems} dans ${b} groupes égaux. ${esMany} y a-t-il dans chaque groupe ?`, `${star.name}把${countedNoun(thing, a)}平均分成${b}组。每组有几${nounMeasure(thing)}${esItems}？`);
  }
  if (roll === 1) {
    return t(
      `${star.name} the ${star.trait} shares ${a} ${items} with ${b} friends. How many ${thing} does each friend get?`,
      `${lead} comparte ${a} ${esItems} con ${b} amigos. ¿${esMany} recibe cada amigo?`, `${lead} reparte ${a} ${esItems} com ${b} amigos. ${esMany} cada amigo recebe?`,
    `${lead} partage ${a} ${esItems} avec ${b} copains. ${esMany} chaque copain reçoit-il ?`, `${lead}把${countedNoun(thing, a)}分给${b}个朋友。每个朋友分到几${nounMeasure(thing)}${esItems}？`);
  }
  return t(
    `${star.pal} and ${star.name} split ${a} ${items} into ${b} equal piles. How many ${thing} in each pile?`,
    `${star.pal} y ${star.name} parten ${a} ${esItems} en ${b} montones iguales. ¿${esMany} hay en cada montón?`, `${star.pal} e ${star.name} dividem ${a} ${esItems} em ${b} montes iguais. ${esMany} tem em cada monte?`,
  `${star.pal} et ${star.name} partagent ${a} ${esItems} en ${b} tas égaux. ${esMany} y a-t-il dans chaque tas ?`, `${star.pal}和${star.name}把${countedNoun(thing, a)}分成${b}堆，每堆一样多。每堆有几${nounMeasure(thing)}${esItems}？`);
}

function makeStory(rng: Rng, level: Exclude<ProblemLevel, "picture">): ChoiceQ {
  const star = starOf(rng);
  const thing = rng.pick([...THINGS]);
  let a = 1;
  let b = 1;
  let op: ProblemBoard["op"] = "+";
  if (level === "add") {
    a = rng.int(1, 9);
    b = rng.int(1, 10 - a);
    op = "+";
  } else if (level === "sub") {
    a = rng.int(1, 12);
    b = rng.int(1, a);
    op = "-";
  } else if (level === "mult") {
    a = rng.int(1, 5);
    b = rng.int(1, 5);
    op = "×";
  } else {
    b = rng.int(2, 5);
    const quotient = rng.int(1, 5);
    a = b * quotient;
    op = "÷";
  }
  const title = storyTitle(rng, level, star, a, b, thing.name);
  const answer = storyValue(op, a, b);
  const board: ProblemBoard = { game: "problems", mode: level, op, a, b, emoji: thing.emoji, thing: thing.name };
  const hi = level === "add" ? 12 : level === "sub" ? 12 : 25;
  return sceneQuestion(rng, {
    game: "problems",
    title,
    hint: t("Use the picture, then pick the number", "Mira el dibujo y elige el número"),
    answer: String(answer),
    choices: nearChoices(rng, answer, 0, hi),
    skill: `problems:${level}`,
    tags: [level],
    solved: `${a} ${op} ${b} = ${answer}`,
    picture: thing.emoji.repeat(Math.min(8, Math.max(1, answer))),
    hands: false,
    quietChoices: false,
    labels: {},
    board,
    factKey: `${level}:${a}${op}${b}`,
  });
}

function groupPicture(emoji: string, groups: number, size: number): string {
  return Array.from({ length: groups }, () => emoji.repeat(size)).join(" ");
}

function pictureOptions(groups: number, size: number): Array<{ groups: number; size: number }> {
  const options = [{ groups, size }];
  const seen = new Set([`${groups}x${size}`]);
  const candidates = [
    { groups, size: size === 4 ? 1 : size + 1 },
    { groups: groups === 4 ? 2 : groups + 1, size },
    { groups: 1, size: Math.min(4, groups * size) },
    { groups: size, size: groups },
    { groups, size: 1 },
    { groups: 2, size: 2 },
    { groups: 3, size: 3 },
    { groups: 4, size: 1 },
    { groups: 4, size: 4 },
  ];
  for (const row of candidates) {
    if (row.groups < 1 || row.groups > 4 || row.size < 1 || row.size > 4) continue;
    const key = `${row.groups}x${row.size}`;
    if (seen.has(key)) continue;
    seen.add(key);
    options.push(row);
    if (options.length === 4) break;
  }
  return options;
}

function makePicture(rng: Rng): ChoiceQ {
  const star = starOf(rng);
  const thing = rng.pick([...THINGS]);
  const groups = rng.int(2, 4);
  const size = rng.int(1, 4);
  const options = pictureOptions(groups, size);
  const ids = options.map((_, i) => `p${i}`);
  const pictures: Record<string, string> = {};
  const labels: Record<string, string> = {};
  options.forEach((row, i) => {
    pictures[ids[i]!] = groupPicture(thing.emoji, row.groups, row.size);
    labels[ids[i]!] = "";
  });
  const board: ProblemBoard = {
    game: "problems",
    mode: "picture",
    op: "×",
    a: groups,
    b: size,
    emoji: thing.emoji,
    thing: thing.name,
  };
  return sceneQuestion(rng, {
    game: "problems",
    title:
      rng.next() < 0.5
        ? t(
            `${star.name} the ${star.trait} needs ${groups} groups of ${size} ${countName(thing.name, size)}. Which picture shows that?`,
            `${starLead(star.name, star.trait)} necesita ${groups} grupos de ${size} ${thingName(thing.name, size, countName(thing.name, size))}. ¿Qué dibujo lo muestra?`, `${starLead(star.name, star.trait)} precisa de ${groups} grupos de ${size} ${thingName(thing.name, size, countName(thing.name, size))}. Qual desenho mostra isso?`,
          `${starLead(star.name, star.trait)} a besoin de ${groups} groupes de ${size} ${thingName(thing.name, size, countName(thing.name, size))}. Quel dessin montre ça ?`, `${starLead(star.name, star.trait)}需要${groups}组，每组${countedNoun(thing.name, size)}。哪张图是这样？`)
        : t(
            `${star.name} draws ${groups} groups of ${size} ${countName(thing.name, size)} for ${star.pal}. Which picture matches?`,
            `${star.name} dibuja ${groups} grupos de ${size} ${thingName(thing.name, size, countName(thing.name, size))} para ${star.pal}. ¿Qué dibujo es igual?`, `${star.name} desenha ${groups} grupos de ${size} ${thingName(thing.name, size, countName(thing.name, size))} para ${star.pal}. Qual desenho é igual?`,
          `${star.name} dessine ${groups} groupes de ${size} ${thingName(thing.name, size, countName(thing.name, size))} pour ${star.pal}. Quel dessin est pareil ?`, `${star.name}为${star.pal}画了${groups}组，每组${countedNoun(thing.name, size)}。哪张图和它一样？`),
    hint: t("Count the groups and how many are in each group", "Cuenta los grupos y cuántos hay en cada uno"),
    answer: "p0",
    choices: uniqueChoices(rng, "p0", [], ids),
    skill: "problems:picture",
    tags: ["picture"],
    solved: t(`${groups} groups of ${size}`, `${groups} grupos de ${size}`, `${groups} grupos de ${size}`, `${groups} groupes de ${size}`, `${groups}组，每组${size}个`),
    picture: groupPicture(thing.emoji, groups, size),
    hands: true,
    quietChoices: false,
    labels,
    pictures,
    board,
    factKey: `picture:${groups}x${size}:${thing.name}`,
  });
}

export function makeProblemQuestion(rng: Rng, level: ProblemLevel): ChoiceQ {
  switch (level) {
    case "add":
      return makeStory(rng, "add");
    case "sub":
      return makeStory(rng, "sub");
    case "mult":
      return makeStory(rng, "mult");
    case "div":
      return makeStory(rng, "div");
    case "picture":
      return makePicture(rng);
    case "steps":
      return makeStepsQuestion(rng);
    default: {
      const neverLevel: never = level;
      return neverLevel;
    }
  }
}

function sheetItem(rng: Rng, level: string): SheetItem {
  const safe: ProblemLevel = isProblemLevel(level) ? level : "add";
  switch (safe) {
    case "add": {
      const a = rng.int(1, 9);
      const b = rng.int(1, 10 - a);
      return {
        prompt: t(
          `Peach has ${a} ${countName("apples", a)}. Frog brings ${b} more. How many apples?`,
          `Peach tiene ${a} ${thingName("apples", a, countName("apples", a))}. Frog trae ${b} más. ¿Cuántas manzanas hay?`, `Peach tem ${a} ${thingName("apples", a, countName("apples", a))}. Frog traz ${b} a mais. Quantas maçãs tem?`,
        `Peach a ${a} ${thingName("apples", a, countName("apples", a))}. Frog en apporte ${b} de plus. Combien de pommes ?`, `Peach有${countedNoun("apples", a)}。Frog又拿来${countedNoun("apples", b)}。有几个苹果？`),
        answer: String(a + b),
      };
    }
    case "sub": {
      const a = rng.int(1, 12);
      const b = rng.int(1, a);
      return {
        prompt: t(
          `Bear has ${a} fish and gives ${b} to Panda. How many fish are left?`,
          `Bear tiene ${a} ${a === 1 ? "pez" : "peces"} y le da ${b} a Panda. ¿Cuántos peces quedan?`, `Bear tem ${a} ${a === 1 ? "peixe" : "peixes"} e dá ${b} para a Panda. Quantos peixes sobram?`,
        `Bear a ${a} ${a === 1 ? "poisson" : "poissons"} et en donne ${b} à Panda. Combien de poissons reste-t-il ?`, `Bear有${a}条鱼，给了Panda ${b}条。还剩几条鱼？`),
        answer: String(a - b),
      };
    }
    case "mult": {
      const a = rng.int(1, 5);
      const b = rng.int(1, 5);
      return {
        prompt: t(
          `Panda has ${a} bags with ${b} stars in each bag. How many stars?`,
          `Panda tiene ${a} ${thingName("bags", a, countName("bags", a))} con ${b} ${thingName("stars", b, countName("stars", b))} en cada bolsa. ¿Cuántas estrellas hay?`, `Panda tem ${a} ${thingName("bags", a, countName("bags", a))} com ${b} ${thingName("stars", b, countName("stars", b))} em cada sacola. Quantas estrelas tem?`,
        `Panda a ${a} ${thingName("bags", a, countName("bags", a))} avec ${b} ${thingName("stars", b, countName("stars", b))} dans chaque sac. Combien d'étoiles ?`, `Panda有${a}个袋子，每个袋子里有${b}颗星星。有几颗星星？`),
        answer: String(a * b),
      };
    }
    case "div": {
      const b = rng.int(2, 5);
      const q = rng.int(1, 5);
      return {
        prompt: t(
          `Fox has ${b * q} cookies shared with ${b} friends. How many cookies does each friend get?`,
          `Fox tiene ${b * q} galletas para ${b} amigos. ¿Cuántas galletas recibe cada amigo?`, `Fox tem ${b * q} biscoitos para ${b} amigos. Quantos biscoitos cada amigo recebe?`,
        `Fox a ${b * q} biscuits pour ${b} copains. Combien de biscuits chaque copain reçoit-il ?`, `Fox有${b * q}块饼干，分给${b}个朋友。每个朋友分到几块饼干？`),
        answer: String(q),
      };
    }
    case "picture": {
      const groups = rng.int(2, 4);
      const size = rng.int(1, 4);
      return {
        prompt: t(
          `Bunny draws ${groups} groups of ${size} frogs. How many frogs?`,
          `Bunny dibuja ${groups} grupos de ${size} ranas. ¿Cuántas ranas hay?`, `Bunny desenha ${groups} grupos de ${size} sapos. Quantos sapos tem?`,
        `Bunny dessine ${groups} groupes de ${size} grenouilles. Combien de grenouilles ?`, `Bunny画了${groups}组，每组${size}只青蛙。有几只青蛙？`),
        answer: String(groups * size),
      };
    }
    case "steps": {
      const printed = spanSheet(rng, "problems", "steps");
      if (printed) return printed;
      return { prompt: t("4 bags of 6 apples. Give away 5. How many are left?", "4 bolsas de 6 manzanas. Regala 5. ¿Cuántas quedan?"), answer: "19" };
    }
    default: {
      const neverLevel: never = safe;
      return neverLevel;
    }
  }
}

export function ProblemsPrompt({ question, reveal, mascot, happy }: PromptProps) {
  void reveal;
  if (question.visual.kind !== "scene" || question.visual.board.game !== "problems") return null;
  const board = question.visual.board;
  return (
    <SceneCard
      title={question.title}
      mascot={mascot}
      happy={happy}
      hint={question.hint}
      hands={question.visual.hands}
      answer={question.answer}
    >
      <ProblemArt board={board} />
    </SceneCard>
  );
}

function ProblemArt({ board }: { board: ProblemBoard }) {
  switch (board.mode) {
    case "add":
    case "sub":
    case "mult":
    case "div":
      return <StoryGroups op={board.op} a={board.a} b={board.b} emoji={board.emoji} />;
    case "picture":
      return <p className="ac-big-num">{t("?", "?")}</p>;
    case "steps":
      return <StoryGroups op="×" a={board.a} b={board.b} emoji={board.emoji} />;
    default: {
      const neverMode: never = board.mode;
      return neverMode;
    }
  }
}

export const problemsGame = sceneModule({
  ...problemsCard,
  short: "Word Problems",
  makeQuestion: (rng, level) => makeProblemQuestion(rng, isProblemLevel(level) ? level : "add"),
  makeSheetItem: sheetItem,
  Prompt: ProblemsPrompt,
});
