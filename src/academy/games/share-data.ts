import type { Rng } from "@/lib/rng";
import { t } from "../i18n";
import type { ShareBoard, ShareLevel } from "./boards";
import { nearChoices, sceneQuestion } from "./pick";
import type { ChoiceQ, SheetItem } from "./types";

export const SHARE_LEVELS = ["pairs", "fair", "groups", "facts", "left"] as const;

export interface ShareTask {
  kind: "share";
  mode: ShareLevel;
  total: number;
  plates: number;
  each: number;
  leftover: number;
  speech: string;
  skill: string;
  factKey: string;
  praise: string;
}

export function isShareLevel(value: unknown): value is ShareLevel {
  return typeof value === "string" && (SHARE_LEVELS as readonly string[]).includes(value);
}

export function shareAnswer(board: Pick<ShareBoard, "mode" | "plates" | "each" | "leftover">): number {
  switch (board.mode) {
    case "pairs":
    case "fair":
    case "facts":
      return board.each;
    case "groups":
      return board.plates;
    case "left":
      return board.leftover;
    default: {
      const neverMode: never = board.mode;
      return neverMode;
    }
  }
}

function onto(total: number, plates: number): string {
  return t(
    `Share ${total} cookies onto ${plates} plates.`,
    `Reparte ${total} galletas en ${plates} platos.`,
    `Reparta ${total} biscoitos em ${plates} pratos.`,
    `Partage ${total} biscuits sur ${plates} assiettes.`,
    `把${total}块饼干分到${plates}个盘子里。`,
    `${total} बिस्कुट ${plates} प्लेटों पर बाँटो।`,
    `وزّع ${total} بسكويت على ${plates} أطباق.`,
  );
}

function intoGroups(total: number, each: number): string {
  return t(
    `Share ${total} cookies into groups of ${each}.`,
    `Reparte ${total} galletas en grupos de ${each}.`,
    `Reparta ${total} biscoitos em grupos de ${each}.`,
    `Partage ${total} biscuits en groupes de ${each}.`,
    `把${total}块饼干分成每组${each}块。`,
    `${total} बिस्कुट ${each} के समूहों में बाँटो।`,
    `وزّع ${total} بسكويت في مجموعات من ${each}.`,
  );
}

function leftTitle(total: number, plates: number): string {
  return t(
    `Share ${total} cookies onto ${plates} plates. How many are left over?`,
    `Reparte ${total} galletas en ${plates} platos. ¿Cuántas sobran?`,
    `Reparta ${total} biscoitos em ${plates} pratos. Quantos sobram?`,
    `Partage ${total} biscuits sur ${plates} assiettes. Combien en reste-t-il ?`,
    `把${total}块饼干分到${plates}个盘子里。还剩多少？`,
    `${total} बिस्कुट ${plates} प्लेटों पर बाँटो। कितने बचते हैं?`,
    `وزّع ${total} بسكويت على ${plates} أطباق. كم يبقى؟`,
  );
}

function onEach(n: number): string {
  return t(
    `${n} on each plate`,
    `${n} en cada plato`,
    `${n} em cada prato`,
    `${n} sur chaque assiette`,
    `每个盘子${n}块`,
    `हर प्लेट पर ${n}`,
    `${n} في كل طبق`,
  );
}

function groupWord(n: number): string {
  return t(`${n} groups`, `${n} grupos`, `${n} grupos`, `${n} groupes`, `${n}组`, `${n} समूह`, `${n} مجموعات`);
}

function leftWord(n: number): string {
  return t(`${n} left over`, `sobran ${n}`, `sobram ${n}`, `il en reste ${n}`, `还剩${n}块`, `${n} बचते हैं`, `يبقى ${n}`);
}

export function shareSpeech(board: Pick<ShareBoard, "mode" | "total" | "plates" | "each">): string {
  switch (board.mode) {
    case "pairs":
    case "fair":
    case "facts":
      return onto(board.total, board.plates);
    case "groups":
      return intoGroups(board.total, board.each);
    case "left":
      return leftTitle(board.total, board.plates);
    default: {
      const neverMode: never = board.mode;
      return neverMode;
    }
  }
}

export function shareSolved(board: Pick<ShareBoard, "mode" | "plates" | "each" | "leftover">): string {
  switch (board.mode) {
    case "pairs":
    case "fair":
    case "facts":
      return onEach(board.each);
    case "groups":
      return groupWord(board.plates);
    case "left":
      return leftWord(board.leftover);
    default: {
      const neverMode: never = board.mode;
      return neverMode;
    }
  }
}

export function shareHint(mode: ShareLevel): string {
  switch (mode) {
    case "pairs":
    case "fair":
    case "facts":
    case "left":
      return t(
        "Give one to each plate.",
        "Da una a cada plato.",
        "Dê um para cada prato.",
        "Donne-en un à chaque assiette.",
        "每个盘子放一块。",
        "हर प्लेट पर एक रखो।",
        "ضع واحدة في كل طبق.",
      );
    case "groups":
      return t(
        "Fill a group, then start the next one.",
        "Llena un grupo y empieza el siguiente.",
        "Encha um grupo e comece o próximo.",
        "Remplis un groupe, puis commence le suivant.",
        "先放满一组，再开始下一组。",
        "एक समूह भरो, फिर अगला शुरू करो।",
        "املأ مجموعة، ثم ابدأ التي تليها.",
      );
    default: {
      const neverMode: never = mode;
      return neverMode;
    }
  }
}

function roll(level: ShareLevel, rng: Rng): ShareBoard {
  switch (level) {
    case "pairs": {
      const each = rng.int(1, 3);
      return { game: "share", mode: "pairs", plates: 2, each, leftover: 0, total: each * 2 };
    }
    case "fair": {
      const plates = rng.int(2, 4);
      const each = rng.int(1, 3);
      return { game: "share", mode: "fair", plates, each, leftover: 0, total: plates * each };
    }
    case "groups": {
      const each = rng.pick([2, 5, 10] as const);
      const plates = rng.int(2, Math.min(6, Math.floor(20 / each)));
      return { game: "share", mode: "groups", plates, each, leftover: 0, total: plates * each };
    }
    case "facts": {
      let plates = 2;
      let each = 2;
      for (let guard = 0; guard < 12; guard += 1) {
        plates = rng.int(2, 6);
        each = rng.int(2, 6);
        if (plates * each <= 18) break;
      }
      if (plates * each > 18) {
        plates = 3;
        each = 4;
      }
      return { game: "share", mode: "facts", plates, each, leftover: 0, total: plates * each };
    }
    case "left": {
      const plates = rng.int(2, 4);
      const each = rng.int(1, 3);
      const leftover = rng.int(1, plates - 1);
      return { game: "share", mode: "left", plates, each, leftover, total: plates * each + leftover };
    }
    default: {
      const neverLevel: never = level;
      return neverLevel;
    }
  }
}

function factKey(board: ShareBoard): string {
  return `${board.mode}:${board.total}:${board.plates}:${board.each}:${board.leftover}`;
}

export function makeShareTask(level: string, rng: Rng, avoid?: string): ShareTask {
  const safe: ShareLevel = isShareLevel(level) ? level : "pairs";
  let board = roll(safe, rng);
  for (let i = 0; i < 12 && avoid && factKey(board) === avoid; i += 1) board = roll(safe, rng);
  return {
    kind: "share",
    mode: board.mode,
    total: board.total,
    plates: board.plates,
    each: board.each,
    leftover: board.leftover,
    speech: shareSpeech(board),
    skill: `share:${safe}`,
    factKey: factKey(board),
    praise: shareSolved(board),
  };
}

export function shareMatches(task: ShareTask, counts: readonly number[], bank: number): boolean {
  if (bank !== task.leftover || counts.length !== task.plates) return false;
  return counts.every((count) => count === task.each);
}

export function makeShareQuestion(rng: Rng, level: string): ChoiceQ {
  const task = makeShareTask(level, rng);
  const answer = shareAnswer(task);
  const hi = task.mode === "facts" ? 12 : task.mode === "groups" ? 8 : 6;
  return sceneQuestion(rng, {
    game: "share",
    title: task.speech,
    hint: shareHint(task.mode),
    answer: String(answer),
    choices: nearChoices(rng, answer, 0, hi, [answer + task.each, Math.max(0, answer - 1)]),
    skill: task.skill,
    tags: ["share", task.mode],
    solved: task.praise,
    picture: "cookies",
    hands: true,
    quietChoices: false,
    labels: {},
    board: {
      game: "share",
      mode: task.mode,
      total: task.total,
      plates: task.plates,
      each: task.each,
      leftover: task.leftover,
    },
    factKey: task.factKey,
  });
}

export function makeShareSheet(rng: Rng, level: string): SheetItem {
  const task = makeShareTask(level, rng);
  return { prompt: task.speech, answer: String(shareAnswer(task)) };
}
