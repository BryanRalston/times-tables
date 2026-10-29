import type { Rng } from "@/lib/rng";
import { getLocale, t } from "../i18n";
import type { AboutBoard, AboutLevel } from "./boards";
import { roundHalfUp } from "./boards";
import { nearChoices, sceneQuestion } from "./pick";
import type { ChoiceQ, SheetItem } from "./types";

export const ABOUT_LEVELS = ["ten", "hundred", "mix"] as const;

export interface AboutTask {
  kind: "about";
  mode: AboutLevel;
  n: number;
  place: 10 | 100;
  answer: number;
  story: string;
  speech: string;
  skill: string;
  factKey: string;
  praise: string;
}

export function isAboutLevel(value: unknown): value is AboutLevel {
  return typeof value === "string" && (ABOUT_LEVELS as readonly string[]).includes(value);
}

export function aboutMatch(task: AboutTask, value: number): boolean {
  return value === task.answer;
}

export function roundSpeech(n: number, place: 10 | 100): string {
  return t(
    `Round ${n} to the nearest ${place}`,
    `Redondea ${n} a la ${place === 10 ? "decena" : "centena"} más cercana`,
    `Arredonde ${n} para a ${place === 10 ? "dezena" : "centena"} mais próxima`,
    `Arrondis ${n} à la ${place === 10 ? "dizaine" : "centaine"} la plus proche`,
    `把${n}四舍五入到最近的${place}`,
    `${n} को निकटतम ${place} तक पूर्णांक बनाओ`,
    `قرّب ${n} إلى أقرب ${place}`,
  );
}

export function roundSolved(n: number, answer: number): string {
  return t(
    `${n} rounds to ${answer}`,
    `${n} se redondea a ${answer}`,
    `${n} arredonda para ${answer}`,
    `${n} s'arrondit à ${answer}`,
    `${n}四舍五入是${answer}`,
    `${n} निकटतम ${answer} बनता है`,
    `${n} يُقرَّب إلى ${answer}`,
  );
}

export function roundHint(place: 10 | 100): string {
  if (place === 10) return t("Look at the ones. 5 or more rounds up.", "Mira las unidades. 5 o más, sube.");
  return t("Look at the tens. 50 or more rounds up.", "Mira las decenas. 50 o más, sube.");
}

export function roundTeach(place: 10 | 100): string {
  if (place === 10) return t("5 or more in the ones rounds up", "5 o más en las unidades sube");
  return t("50 or more in the tens rounds up", "50 o más en las decenas sube");
}

function storyFor(rng: Rng, n: number): string {
  const lines = [
    t(
      `The jar has ${n} stickers.`,
      `El frasco tiene ${n} calcomanías.`,
      `O pote tem ${n} adesivos.`,
      `Le pot a ${n} autocollants.`,
      `罐子里有${n}张贴纸。`,
      `जार में ${n} स्टिकर हैं।`,
      `في البرطمان ${n} ملصقًا.`,
    ),
    t(
      `The box has ${n} crayons.`,
      `La caja tiene ${n} crayones.`,
      `A caixa tem ${n} giz de cera.`,
      `La boîte a ${n} crayons.`,
      `盒子里有${n}支蜡笔。`,
      `डिब्बे में ${n} क्रेयॉन हैं।`,
      `في الصندوق ${n} قلمًا.`,
    ),
    t(
      `The shelf holds ${n} books.`,
      `El estante tiene ${n} libros.`,
      `A prateleira tem ${n} livros.`,
      `L'étagère a ${n} livres.`,
      `架子上有${n}本书。`,
      `शेल्फ पर ${n} किताबें हैं।`,
      `على الرف ${n} كتابًا.`,
    ),
    t(
      `The bag has ${n} marbles.`,
      `La bolsa tiene ${n} canicas.`,
      `A sacola tem ${n} bolinhas.`,
      `Le sac a ${n} billes.`,
      `袋子里有${n}颗弹珠。`,
      `थैले में ${n} कंचे हैं।`,
      `في الكيس ${n} بلية.`,
    ),
  ];
  return rng.pick(lines);
}

export function aboutStart(n: number, place: 10 | 100, answer: number): number {
  const down = Math.floor(n / place) * place;
  if (down !== answer) return down;
  const up = down + place;
  return up <= 1000 ? up : Math.max(0, down - place);
}

function roll(mode: AboutLevel, rng: Rng): AboutTask {
  let place: 10 | 100 = 10;
  let n = 48;
  switch (mode) {
    case "ten":
      place = 10;
      n = rng.int(10, 99);
      break;
    case "hundred":
      place = 100;
      n = rng.int(100, 999);
      break;
    case "mix":
      place = rng.next() < 0.5 ? 10 : 100;
      n = rng.int(100, 999);
      break;
    default: {
      const neverMode: never = mode;
      return neverMode;
    }
  }
  const answer = roundHalfUp(n, place);
  return {
    kind: "about",
    mode,
    n,
    place,
    answer,
    story: storyFor(rng, n),
    speech: getLocale() === "hi" ? `। ${roundSpeech(n, place)}` : roundSpeech(n, place),
    skill: `about:${mode}`,
    factKey: `${mode}:${place}:${n}`,
    praise: roundSolved(n, answer),
  };
}

export function makeAboutTask(level: string, rng: Rng, avoid?: string): AboutTask {
  const mode: AboutLevel = isAboutLevel(level) ? level : "ten";
  let task = roll(mode, rng);
  for (let i = 0; i < 12 && avoid && task.factKey === avoid; i += 1) task = roll(mode, rng);
  return task;
}

export function taskBoard(task: AboutTask): AboutBoard {
  return { game: "about", mode: task.mode, n: task.n, place: task.place, answer: task.answer, story: task.story };
}

export function makeAboutQuestion(rng: Rng, level: string): ChoiceQ {
  const task = makeAboutTask(level, rng);
  const down = Math.floor(task.n / task.place) * task.place;
  const up = down + task.place;
  return sceneQuestion(rng, {
    game: "about",
    title: task.speech,
    hint: roundHint(task.place),
    answer: String(task.answer),
    choices: nearChoices(rng, task.answer, 0, 1000, [task.n, down, up, task.answer + task.place, Math.max(0, task.answer - task.place)]),
    skill: task.skill,
    tags: ["about", task.mode, String(task.place)],
    solved: task.praise,
    picture: String(task.n),
    hands: false,
    quietChoices: false,
    labels: {},
    board: taskBoard(task),
    factKey: task.factKey,
  });
}

export function makeAboutSheet(rng: Rng, level: string): SheetItem {
  const task = makeAboutTask(level, rng);
  const spoken = t(
    `Round ${task.n} to the nearest ${task.place}.`,
    `Redondea ${task.n} a la ${task.place === 10 ? "decena" : "centena"} más cercana.`,
    `Arredonde ${task.n} para a ${task.place === 10 ? "dezena" : "centena"} mais próxima.`,
    `Arrondis ${task.n} à la ${task.place === 10 ? "dizaine" : "centaine"} la plus proche.`,
    `把${task.n}四舍五入到最近的${task.place}。`,
    `${task.n} को निकटतम ${task.place} तक पूर्णांक बनाओ।`,
    `قرّب ${task.n} إلى أقرب ${task.place}.`,
  );
  return { prompt: `${task.story} ${spoken}`, answer: String(task.answer) };
}
