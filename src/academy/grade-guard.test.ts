import { describe, expect, it } from "vitest";
import { installChinese, installFrench, installPortuguese, setLocale, type Locale } from "./i18n";
import { BOSS_FR, FR, PERSONA_FALLBACK_FR, PERSONA_FR, TRAIT_FR } from "./i18n-fr";
import { BOSS_PT, PERSONA_FALLBACK_PT, PERSONA_PT, PT, TRAIT_PT } from "./i18n-pt";
import { BOSS_ZH, PERSONA_FALLBACK_ZH, PERSONA_ZH, TRAIT_ZH, ZH } from "./i18n-zh";

installPortuguese({ PT, PERSONA_PT, PERSONA_FALLBACK_PT, BOSS_PT, TRAIT_PT });
installFrench({ FR, PERSONA_FR, PERSONA_FALLBACK_FR, BOSS_FR, TRAIT_FR });
installChinese({ ZH, PERSONA_ZH, PERSONA_FALLBACK_ZH, BOSS_ZH, TRAIT_ZH });
import { rngFromSeed } from "@/lib/rng";
import { openingIndex, startLadder, stepLadder } from "./adapt";
import { GAMES } from "./games/registry";
import { pileCents } from "./games/money-model";
import { sightWords, type SightList } from "./games/sight-data";
import { spellWords, type SpellLevel } from "./games/spell-data";
import { shareAnswer } from "./games/share-data";
import { signTruth, trueSignCount } from "./games/signs-data";
import { TIME_MINUTES, type TimeLevel } from "./games/time";
import { TIMES_SPEC, type TimesLevel } from "./games/times";
import { FRACTION_DENOMINATORS, GRADE_BANDS, playWindow } from "./grade-map";
import { makeHandsTask, type HandsTask } from "./hands-build";
import { makeClockTask, makePayTask } from "./hands";
import type { Grade } from "./model";
import { nextPlacement } from "./placement";
import { blankChild } from "./storage";
import type { Board } from "./games/boards";
import type { ChoiceQ } from "./games/types";
import { graphAnswer } from "./games/graph-data";
import { variableAnswer } from "./games/variables";

const GRADES: Grade[] = ["PK", "K", "1", "2", "3", "4"];
const SAMPLES = 200;
const FIVES_ONLY = [5, 10, 20, 25, 35, 40, 50, 55];

function skillLevel(question: ChoiceQ): string {
  const cut = question.skill.lastIndexOf(":");
  return cut < 0 ? question.skill : question.skill.slice(cut + 1);
}

function assertScene(grade: Grade, board: Board, question: ChoiceQ): void {
  switch (board.game) {
    case "count": {
      if (board.mode === "objects") expect(Number(question.answer)).toBeLessThanOrEqual(10);
      if (board.mode === "to20") expect(Number(question.answer)).toBeGreaterThanOrEqual(8);
      if (board.mode === "compare") expect(board.groups.every((n) => n >= 1 && n <= 6)).toBe(true);
      if (board.mode === "subitize") expect(Number(question.answer)).toBeLessThanOrEqual(6);
      if (board.mode === "build") expect(Number(question.answer)).toBeLessThanOrEqual(10);
      if (grade === "K") expect(["round100", "equivalent"]).not.toContain(board.mode);
      break;
    }
    case "place": {
      if (board.mode === "blocks" || board.mode === "build") {
        expect(board.n).toBeGreaterThanOrEqual(10);
        expect(board.n).toBeLessThanOrEqual(99);
      }
      if (board.mode === "expanded") {
        const sum = question.answer.split(" + ").reduce((total, part) => total + Number(part), 0);
        expect(sum).toBe(board.n);
      }
      if (board.mode === "compare") {
        expect(question.choices).toContain(String(board.left));
        expect(question.choices).toContain(String(board.right));
      }
      if (board.mode === "round10" || board.mode === "round100") {
        const place = board.mode === "round10" ? 10 : 100;
        expect(question.answer).toBe(String(Math.floor(board.n / place + 0.5) * place));
      }
      if (board.mode === "big") {
        expect(board.n).toBeGreaterThanOrEqual(1000);
        expect(board.n).toBeLessThanOrEqual(999999);
        expect(question.answer).toBe(String(board.digit * board.place));
      }
      if (board.mode === "roundBig") {
        expect(question.answer).toBe(String(Math.floor(board.n / board.place + 0.5) * board.place));
      }
      if (grade === "1" || grade === "2") {
        expect(board.mode).not.toBe("round10");
        expect(board.mode).not.toBe("round100");
      }
      break;
    }
    case "shapes":
      if (board.mode === "sides") expect(Number(question.answer)).toBeGreaterThanOrEqual(3);
      if (board.mode === "position") expect(["above", "below", "beside", "behind"]).toContain(question.answer);
      if (board.mode === "rows") {
        expect(board.rows * board.cols).toBe(Number(question.answer));
        expect(board.rows).toBeLessThanOrEqual(3);
        expect(board.cols).toBeLessThanOrEqual(4);
        expect(Number(question.answer)).toBeLessThanOrEqual(12);
      }
      if (board.mode === "cover") {
        expect(board.rows * board.cols).toBe(Number(question.answer));
        expect(Math.max(board.rows, board.cols)).toBeGreaterThanOrEqual(4);
        expect(Number(question.answer)).toBeLessThanOrEqual(25);
      }
      if (board.mode === "share") {
        expect([2, 3, 4]).toContain(board.den);
        expect(question.answer).toBe(`1/${board.den}`);
      }
      if (board.mode === "faces" && board.kind === "net") expect(question.answer).toBe("6");
      if (board.mode === "faces" && board.kind === "name") expect(question.answer).toBe("cube");
      if (board.mode === "fold") expect(board.mirror).toBe(true);
      if (grade === "PK") expect(["color", "match", "pattern", "flat"]).toContain(board.mode);
      if (grade === "K") expect(["pattern", "flat", "solid", "position", "sort"]).toContain(board.mode);
      if (grade === "1") expect(["sort", "traits", "compose", "sides"]).toContain(board.mode);
      if (grade === "2") expect(["sides", "faces", "rows", "symmetry"]).toContain(board.mode);
      if (grade === "3") expect(["symmetry", "quads", "share", "parts", "cover"]).toContain(board.mode);
      if (grade === "4") expect(["cover", "fold", "angles"]).toContain(board.mode);
      break;
    case "fractions": {
      if (board.mode === "decimals") {
        expect(board.tenths).toBeGreaterThanOrEqual(0);
        expect(board.tenths).toBeLessThanOrEqual(9);
        expect(board.hundredths).toBeGreaterThanOrEqual(0);
        expect(board.hundredths).toBeLessThanOrEqual(9);
        break;
      }
      if (board.mode === "addLike") {
        expect([2, 3, 4, 5, 6, 8, 10, 12]).toContain(board.den);
        const result = board.op === "+" ? board.num + board.num2 : board.num - board.num2;
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThanOrEqual(board.den);
        break;
      }
      const dens = board.mode === "compare" || board.mode === "equivalent" ? [board.den, board.den2] : [board.den];
      for (const den of dens) expect(FRACTION_DENOMINATORS).toContain(den);
      if (board.mode === "equivalent") expect(board.num * board.den2).toBe(board.num2 * board.den);
      const choiceDens = question.choices.flatMap((choice) => [...choice.matchAll(/\/(\d+)/g)].map((match) => Number(match[1])));
      for (const den of choiceDens) expect(FRACTION_DENOMINATORS).toContain(den);
      if (grade === "1") {
        expect(board.mode).toBe("parts");
        for (const den of dens) expect([2, 4]).toContain(den);
        for (const den of choiceDens) expect([2, 4]).toContain(den);
      }
      if (grade === "2") {
        expect(board.mode).not.toBe("equivalent");
        for (const den of dens) expect([2, 3, 4]).toContain(den);
        for (const den of choiceDens) expect([2, 3, 4]).toContain(den);
      }
      break;
    }
    case "measure":
      if (board.mode === "ruler") expect(board.inches).toBeLessThanOrEqual(12);
      if (board.mode === "compare") expect(new Set(board.items.map((item) => item.value)).size).toBe(board.items.length);
      if (grade === "K") expect(board.mode === "compare" || board.mode === "size").toBe(true);
      if (grade === "PK") expect(board.mode).toBe("size");
      if (grade === "1") expect(board.mode).not.toBe("ruler");
      break;
    case "phonics":
      if (board.mode === "cvc") expect(question.answer).toMatch(/^[a-z]{3}$/);
      if (board.mode === "rhyme") expect(question.answer.endsWith(board.family)).toBe(true);
      if (grade === "PK" || grade === "K" || grade === "1") {
        expect(question.visual.kind).toBe("scene");
        if (board.mode === "letters") {
          expect(question.answer).toMatch(/^[A-Z]$/);
        } else {
          expect(board.mode === "sounds" || board.mode === "begin").toBe(true);
          if (question.visual.kind === "scene") {
            expect(question.visual.pictures?.[question.answer]).toBeTruthy();
            expect(question.visual.labels[question.answer]).toBe("");
          }
        }
      }
      break;
    case "problems":
      if (board.mode === "add") expect(board.a + board.b).toBeLessThanOrEqual(10);
      if (board.mode === "sub") expect(board.b).toBeLessThanOrEqual(board.a);
      if (board.mode === "mult") expect(board.a * board.b).toBeLessThanOrEqual(25);
      if (board.mode === "div") expect(board.a % board.b).toBe(0);
      if (grade === "K" || grade === "1") {
        expect(board.mode === "add" || board.mode === "sub").toBe(true);
        expect(board.emoji.length).toBeGreaterThan(0);
      }
      break;
    case "variables": {
      expect(question.answer).toBe(String(variableAnswer(board)));
      if (board.mode === "addend") {
        expect(board.op).toBe("+");
        expect(board.a).toBeGreaterThanOrEqual(1);
        expect(board.b).toBeGreaterThanOrEqual(1);
        expect(board.a + board.b).toBeLessThanOrEqual(10);
        expect(board.box === "left" || board.box === "right").toBe(true);
      }
      if (board.mode === "either" && board.op === "+") {
        expect(board.a).toBeGreaterThanOrEqual(1);
        expect(board.b).toBeGreaterThanOrEqual(1);
        expect(board.a + board.b).toBeLessThanOrEqual(20);
      }
      if (board.mode === "either" && board.op === "-") {
        expect(board.a).toBeLessThanOrEqual(20);
        expect(board.b).toBeGreaterThanOrEqual(1);
        expect(board.b).toBeLessThan(board.a);
      }
      if (board.mode === "factor") {
        expect(board.op).toBe("×");
        expect(board.a).toBeGreaterThanOrEqual(1);
        expect(board.b).toBeGreaterThanOrEqual(1);
        expect(board.a).toBeLessThanOrEqual(5);
        expect(board.b).toBeLessThanOrEqual(5);
        expect(board.box === "left" || board.box === "right").toBe(true);
      }
      if (board.mode === "times") {
        expect(board.b).toBeGreaterThanOrEqual(1);
        expect(board.b).toBeLessThanOrEqual(10);
        if (board.op === "×") expect(board.a).toBeLessThanOrEqual(10);
        if (board.op === "÷") {
          expect(board.a % board.b).toBe(0);
          expect(board.a / board.b).toBeLessThanOrEqual(10);
          expect(board.a).toBeLessThanOrEqual(100);
        }
      }
      if (board.mode === "steps") {
        expect(board.op).toBe("×");
        expect(board.c).toBeGreaterThanOrEqual(1);
        const product = board.a * board.b;
        const total = board.extraOp === "+" ? product + board.c : product - board.c;
        expect(total).toBeGreaterThanOrEqual(1);
        expect(total).toBeLessThanOrEqual(30);
      }
      if (grade === "K" || grade === "1") expect(board.mode).toBe("addend");
      if (grade === "2") expect(["addend", "either", "factor"]).toContain(board.mode);
      if (grade === "3") expect(["either", "factor", "times"]).toContain(board.mode);
      break;
    }
    case "graphs": {
      expect(question.answer).toBe(graphAnswer(board));
      if (board.mode === "sort") {
        expect(board.items).toHaveLength(2);
        expect(board.scale).toBe(1);
        expect(["count", "most"]).toContain(board.ask);
        for (const item of board.items) {
          expect(item.value).toBeGreaterThanOrEqual(1);
          expect(item.value).toBeLessThanOrEqual(3);
        }
      }
      if (board.mode === "tally") {
        expect(board.items).toHaveLength(3);
        expect(board.scale).toBe(1);
        expect(["count", "total", "diff", "less"]).toContain(board.ask);
      }
      if (board.mode === "picture" || board.mode === "bar") {
        expect(board.scale).toBe(1);
        expect(["join", "apart", "diff"]).toContain(board.ask);
        expect(board.items).toHaveLength(board.mode === "bar" ? 4 : 3);
      }
      if (board.mode === "scale") {
        expect([2, 5]).toContain(board.scale);
        expect(["count", "diff", "less", "two"]).toContain(board.ask);
        for (const item of board.items) expect(item.value % board.scale).toBe(0);
      }
      if (board.mode === "line") {
        expect([2, 4, 8]).toContain(board.den);
        expect(board.marks).toHaveLength(5);
        for (const mark of board.marks) {
          expect(mark).toBeGreaterThanOrEqual(1);
          expect(mark).toBeLessThanOrEqual(board.den);
        }
        expect(["marks", "span", "sum"]).toContain(board.ask);
      }
      if (grade === "PK" || grade === "K") expect(board.mode).toBe("sort");
      if (grade === "1") expect(["sort", "tally"]).toContain(board.mode);
      if (grade === "2") expect(["tally", "picture", "bar"]).toContain(board.mode);
      if (grade === "3") expect(["bar", "scale"]).toContain(board.mode);
      if (grade === "4") expect(["scale", "line"]).toContain(board.mode);
      break;
    }
    case "share": {
      expect(Number(question.answer)).toBe(shareAnswer(board));
      expect(board.total).toBe(board.plates * board.each + board.leftover);
      expect(board.each).toBeGreaterThanOrEqual(1);
      expect(board.plates).toBeGreaterThanOrEqual(2);
      if (board.mode === "pairs") {
        expect(board.plates).toBe(2);
        expect([2, 4, 6]).toContain(board.total);
        expect(board.leftover).toBe(0);
      }
      if (board.mode === "fair" || board.mode === "facts") expect(board.leftover).toBe(0);
      if (board.mode === "left") {
        expect(board.leftover).toBeGreaterThanOrEqual(1);
        expect(board.leftover).toBeLessThan(board.plates);
      }
      if (board.mode === "groups") expect([2, 5, 10]).toContain(board.each);
      if (grade === "PK" || grade === "K" || grade === "1") expect(board.mode).toBe("pairs");
      if (grade === "2") expect(["pairs", "fair"]).toContain(board.mode);
      if (grade === "3") expect(["fair", "groups", "facts"]).toContain(board.mode);
      if (grade === "4") expect(["groups", "facts", "left"]).toContain(board.mode);
      expect(board.total).toBeLessThanOrEqual(board.mode === "groups" ? 20 : 18);
      break;
    }
    case "grid": {
      if (board.mode === "tiles" || board.mode === "fence") {
        expect(board.cells.length).toBeGreaterThanOrEqual(3);
        expect(board.cells.length).toBeLessThanOrEqual(6);
        expect(board.cells.length).not.toBe(board.rows * board.cols);
        if (board.mode === "tiles") expect(Number(question.answer)).toBe(board.cells.length);
        if (board.mode === "fence") expect(Number(question.answer)).toBe(board.edges);
      }
      if (board.mode === "side") {
        expect(board.missing).toBeGreaterThanOrEqual(2);
        expect(board.known).toBeGreaterThanOrEqual(2);
        expect(Number(question.answer)).toBe(board.missing);
        const total = board.useArea ? board.known * board.missing : 2 * (board.known + board.missing);
        expect(question.title).toContain(String(total));
      }
      if (grade === "2") expect(board.mode).toBe("tiles");
      if (grade === "3") expect(["tiles", "fence"]).toContain(board.mode);
      if (grade === "4") expect(["tiles", "fence", "side"]).toContain(board.mode);
      break;
    }
    case "patterns": {
      expect(board.step).toBeGreaterThan(0);
      if (board.mode === "grow") {
        expect(board.terms).toHaveLength(4);
        expect(Number(question.answer) || question.answer).toBeTruthy();
        expect(board.answer).toBe(board.step);
      } else {
        expect(board.terms).toHaveLength(3);
        expect(question.answer).toBe(String(board.answer));
        expect(board.answer).toBe((board.terms[2] ?? 0) + board.step);
      }
      if (board.mode === "tens") expect(board.step).toBe(10);
      if (board.mode === "fives") expect(board.step).toBe(5);
      if (board.mode === "twos") expect(board.step).toBe(2);
      if (board.mode === "hundreds") expect(board.step).toBe(100);
      if (grade === "K" || grade === "1") expect(board.mode).toBe("tens");
      if (grade === "2") expect(["tens", "fives", "twos", "hundreds"]).toContain(board.mode);
      if (grade === "3") expect(["hundreds", "rule"]).toContain(board.mode);
      if (grade === "4") expect(["rule", "grow"]).toContain(board.mode);
      expect(board.answer).toBeLessThanOrEqual(1000);
      break;
    }
    case "signs": {
      expect(board.left).toBeGreaterThanOrEqual(board.mode === "big" ? 1000 : 1);
      expect(signTruth(board.left, board.right)).toBe(board.mark);
      expect(question.answer).toBe(`${board.left} ${board.mark} ${board.right}`);
      expect(trueSignCount(board.left, board.right, question.choices)).toBe(1);
      if (board.mode === "to10") {
        expect(board.left).toBeLessThanOrEqual(10);
        expect(board.right).toBeLessThanOrEqual(10);
      }
      if (board.mode === "tens") {
        expect(board.left).toBeGreaterThanOrEqual(10);
        expect(board.right).toBeGreaterThanOrEqual(10);
        expect(board.left).toBeLessThan(100);
        expect(board.right).toBeLessThan(100);
      }
      if (board.mode === "hundreds") {
        expect(board.left).toBeGreaterThanOrEqual(100);
        expect(board.right).toBeGreaterThanOrEqual(100);
        expect(board.left).toBeLessThan(1000);
        expect(board.right).toBeLessThan(1000);
      }
      if (board.mode === "big") {
        expect(board.left).toBeLessThanOrEqual(9999);
        expect(board.right).toBeLessThanOrEqual(9999);
      }
      if (grade === "K") expect(board.mode).toBe("to10");
      if (grade === "1") expect(["to10", "tens"]).toContain(board.mode);
      if (grade === "2" || grade === "3") expect(["tens", "hundreds"]).toContain(board.mode);
      if (grade === "4") expect(["hundreds", "big"]).toContain(board.mode);
      break;
    }
    case "jumps": {
      expect(board.answer).toBe(board.dir === "more" ? board.start + board.step : board.start - board.step);
      expect(board.answer % 10).toBe(board.start % 10);
      expect(board.answer).toBeGreaterThanOrEqual(0);
      expect(board.answer).toBeLessThanOrEqual(9999);
      if (board.mode === "ten") {
        expect(board.step).toBe(10);
        expect(board.start).toBeGreaterThanOrEqual(10);
        expect(board.start).toBeLessThan(100);
        expect(board.answer).toBeLessThanOrEqual(100);
      }
      if (board.mode === "hundred") {
        expect(board.step).toBe(100);
        expect(board.answer).toBeLessThanOrEqual(1000);
      }
      if (board.mode === "thousand") {
        expect(board.step).toBe(1000);
        expect(board.start).toBeGreaterThanOrEqual(1000);
      }
      if (grade === "1") expect(board.mode).toBe("ten");
      if (grade === "2") expect(["ten", "hundred"]).toContain(board.mode);
      if (grade === "3") expect(["ten", "hundred"]).toContain(board.mode);
      if (grade === "4") expect(["hundred", "thousand"]).toContain(board.mode);
      break;
    }
    default: {
      const neverBoard: never = board;
      throw new Error(String(neverBoard));
    }
  }
}

function assertHandsGrade(grade: Grade, level: string, task: HandsTask): void {
  expect(task.speech.length).toBeGreaterThan(0);
  expect(task.speech).not.toMatch(/[×÷¢]/);
  switch (task.kind) {
    case "clock":
    case "pay":
      break;
    case "array":
      expect(task.rows * task.cols).toBeLessThanOrEqual(level === "count" ? 20 : 100);
      if (grade !== "3" && grade !== "4") {
        expect([6, 7, 8, 9]).not.toContain(task.rows);
        expect([6, 7, 8, 9]).not.toContain(task.cols);
      }
      break;
    case "frame": {
      const max = level === "within5" ? 5 : level === "within10" ? 10 : level === "within20" ? 20 : 99;
      expect(task.target).toBe(task.op === "+" ? task.start + task.change : task.start - task.change);
      expect(task.target).toBeGreaterThanOrEqual(0);
      expect(task.target).toBeLessThanOrEqual(max);
      expect(task.change).toBeGreaterThanOrEqual(1);
      if (grade === "K" || grade === "1") expect(level).not.toBe("within100");
      if (task.model === "blocks") expect(task.start).toBeGreaterThanOrEqual(10);
      break;
    }
    case "count":
      if (task.mode === "pile") expect(task.target).toBeLessThanOrEqual(level === "subitize" ? 6 : 10);
      if (task.mode === "teen") {
        expect(task.target).toBeGreaterThanOrEqual(11);
        expect(task.target).toBeLessThanOrEqual(20);
      }
      if (grade === "K" || grade === "1") expect(task.mode).not.toBe("ten");
      break;
    case "blocks":
      expect(task.hundreds).toBeGreaterThanOrEqual(0);
      expect(task.tens).toBeGreaterThanOrEqual(0);
      expect(task.ones).toBeGreaterThanOrEqual(0);
      if (grade === "1" || grade === "2") expect(task.hundreds).toBe(0);
      if (level === "round100") {
        expect(task.hundreds).toBeGreaterThanOrEqual(1);
        expect(task.tens).toBe(0);
        expect(task.ones).toBe(0);
      }
      break;
    case "shade":
      expect(FRACTION_DENOMINATORS).toContain(task.den);
      expect(task.num).toBeGreaterThanOrEqual(1);
      expect(task.num).toBeLessThanOrEqual(task.den);
      if (grade === "1") expect([2, 4]).toContain(task.den);
      if (grade === "2") expect([2, 3, 4]).toContain(task.den);
      expect(task.speech).not.toContain("/");
      break;
    case "letters":
      expect(task.word.length).toBeGreaterThanOrEqual(3);
      expect(task.word.length).toBeLessThanOrEqual(6);
      if (grade === "K" || grade === "1") expect(task.showSentence).toBe(false);
      break;
    case "sight":
      expect(task.choices).toContain(task.word);
      if (grade === "K" || grade === "1") expect(task.mode).toBe("picture");
      break;
    case "phonics":
      if (grade === "K" || grade === "1") {
        expect(task.mode).toBe("letter");
        const word = task.factKey.split(":")[1] ?? "";
        if (word.length > 2) expect(task.speech.toLowerCase().includes(word.toLowerCase())).toBe(false);
      }
      if (grade === "2") expect(task.mode).not.toBe("end");
      break;
    case "measure":
      if (grade === "K" || grade === "PK") expect(task.mode).toBe("compare");
      if (grade === "1") expect(task.mode).not.toBe("ruler");
      if (task.mode === "ruler") expect(task.speech).not.toMatch(/\d/);
      break;
    case "shapes":
      if (task.mode === "join") {
        expect(task.pieces?.slice().sort().join("+")).toBe(task.answer);
      } else {
        expect(task.options).toContain(task.answer);
      }
      if (task.mode === "grid") {
        expect(Number(task.answer)).toBe((task.rows ?? 0) * (task.cols ?? 0));
        if (level === "rows") expect(Number(task.answer)).toBeLessThanOrEqual(12);
        if (level === "cover") expect(Number(task.answer)).toBeLessThanOrEqual(25);
      }
      if (grade === "K" || grade === "PK") expect(task.mode).not.toBe("parts");
      if (grade === "K") expect(task.mode === "name" || task.mode === "place").toBe(true);
      if (grade === "2" && task.mode === "grid") expect(Number(task.answer)).toBeLessThanOrEqual(12);
      break;
    case "story":
      if (grade === "K") expect(task.mode).toBe("join");
      if (grade === "K" || grade === "1") expect(["join", "take"]).toContain(task.mode);
      if (grade !== "3") expect(task.mode).not.toBe("share");
      if (task.mode === "join") expect(task.a + task.b).toBeLessThanOrEqual(10);
      break;
    case "blank":
      expect(task.tiles).toContain(task.answer);
      expect(new Set(task.tiles).size).toBe(task.tiles.length);
      if (task.mode === "addend") {
        expect(task.op).toBe("+");
        expect(task.a + task.b).toBeLessThanOrEqual(10);
        expect(task.box === "left" || task.box === "right").toBe(true);
      }
      if (task.mode === "factor") {
        expect(task.op).toBe("×");
        expect(task.a).toBeLessThanOrEqual(5);
        expect(task.b).toBeLessThanOrEqual(5);
        expect(task.box === "left" || task.box === "right").toBe(true);
      }
      if (grade === "PK" || grade === "K" || grade === "1") expect(task.mode).toBe("addend");
      break;
    case "trace":
      expect(task.glyph.length).toBe(1);
      if (task.form === "numeral") {
        expect(level).toBe("objects");
        expect(Number(task.glyph)).toBeGreaterThanOrEqual(0);
        expect(Number(task.glyph)).toBeLessThanOrEqual(9);
      } else {
        expect(["letters", "sounds", "begin"]).toContain(level);
        expect(task.glyph).toMatch(/^[A-Za-z]$/);
      }
      break;
    case "graphs": {
      if (grade === "PK" || grade === "K") {
        expect(task.mode).toBe("sort");
        expect(task.cats).toHaveLength(2);
      }
      if (grade === "1") expect(["sort", "tally"]).toContain(task.mode);
      if (task.mode === "scale") expect([2, 5]).toContain(task.scale);
      if (task.mode === "line") expect([2, 4, 8]).toContain(task.den);
      const icons =
        task.mode === "line"
          ? task.stacks.reduce((sum, count) => sum + count, 0)
          : task.cats.reduce((sum, cat) => sum + cat.icons, 0);
      expect(icons).toBeGreaterThan(0);
      expect(icons).toBeLessThanOrEqual(grade === "PK" || grade === "K" ? 6 : 8);
      break;
    }
    case "share":
      expect(task.total).toBe(task.plates * task.each + task.leftover);
      expect(task.total).toBeLessThanOrEqual(task.mode === "groups" ? 20 : 18);
      if (grade === "PK" || grade === "K" || grade === "1") expect(task.mode).toBe("pairs");
      if (grade === "2") expect(["pairs", "fair"]).toContain(task.mode);
      if (grade === "4") expect(["groups", "facts", "left"]).toContain(task.mode);
      break;
    case "grid":
      if (task.mode !== "side") {
        expect(task.cells.length).toBeGreaterThanOrEqual(3);
        expect(task.cells.length).toBeLessThanOrEqual(6);
      }
      if (grade === "2") expect(task.mode).toBe("tiles");
      if (grade === "4") expect(["tiles", "fence", "side"]).toContain(task.mode);
      break;
    case "pattern":
      expect(task.answer).toBeLessThanOrEqual(1000);
      if (grade === "K" || grade === "1") expect(task.mode).toBe("tens");
      if (grade === "2") expect(["tens", "fives", "twos", "hundreds"]).toContain(task.mode);
      if (grade === "4") expect(["rule", "grow"]).toContain(task.mode);
      break;
    case "signs":
      expect(signTruth(task.left, task.right)).toBe(task.mark);
      if (grade === "K") expect(task.mode).toBe("to10");
      if (grade === "1") expect(["to10", "tens"]).toContain(task.mode);
      if (grade === "4") expect(["hundreds", "big"]).toContain(task.mode);
      break;
    case "jumps":
      expect(task.answer).toBe(task.dir === "more" ? task.start + task.step : task.start - task.step);
      expect(task.answer % 10).toBe(task.start % 10);
      if (grade === "1") expect(task.mode).toBe("ten");
      if (grade === "2" || grade === "3") expect(["ten", "hundred"]).toContain(task.mode);
      if (grade === "4") expect(["hundred", "thousand"]).toContain(task.mode);
      break;
    default: {
      const neverTask: never = task;
      throw new Error(String(neverTask));
    }
  }
}

function assertQuestion(grade: Grade, level: string, question: ChoiceQ): void {
  expect(skillLevel(question)).toBe(level);
  const visual = question.visual;
  switch (visual.kind) {
    case "add": {
      const max =
        level === "within5" ? 5 : level === "within10" ? 10 : level === "within20" ? 20 : level === "within1000" ? 1000 : level === "thousands" ? 9999 : 100;
      expect(visual.pink).toBeGreaterThanOrEqual(0);
      expect(visual.teal).toBeGreaterThanOrEqual(0);
      if (visual.op === "+") {
        expect(visual.pink + visual.teal).toBeLessThanOrEqual(max);
      } else {
        expect(visual.pink + visual.teal).toBeLessThanOrEqual(max);
        expect(visual.pink).toBeGreaterThanOrEqual(0);
      }
      if (level === "tens") {
        expect(visual.pink + visual.teal).toBeGreaterThanOrEqual(10);
        if (visual.op === "+") {
          expect(visual.pink < 10 || visual.teal < 10 || visual.pink % 10 === 0 || visual.teal % 10 === 0).toBe(true);
        } else {
          expect(visual.teal < 10 || visual.teal % 10 === 0).toBe(true);
        }
      }
      if (grade === "K" || grade === "1") expect(level).not.toBe("within100");
      break;
    }
    case "times": {
      if (visual.ask === "factor") {
        expect(visual.a % Number(question.answer)).toBe(0);
      } else if (visual.ask === "multiple") {
        expect(Number(question.answer) % visual.a).toBe(0);
      } else if (visual.ask === "divide") {
        const remainder = visual.remainder ?? 0;
        expect(question.answer).toBe(`${visual.hidden} remainder ${remainder}`);
        expect(visual.a).toBe(visual.b * visual.hidden + remainder);
      } else if (level === "multi") {
        expect(visual.a * visual.b).toBe(Number(question.answer));
        expect(visual.a).toBeGreaterThanOrEqual(12);
        expect(visual.b).toBeGreaterThanOrEqual(2);
      } else {
        expect(visual.a * visual.b).toBe(Number(question.answer));
        expect(visual.a * visual.b).toBeLessThanOrEqual(level === "multi" ? 25 * 19 : 100);
        const spec = TIMES_SPEC[level as TimesLevel];
        expect(spec.factors.includes(visual.a) || spec.factors.includes(visual.b)).toBe(true);
        expect(visual.b).toBeLessThanOrEqual(spec.max);
      }
      if (level === "count") expect(visual.a * visual.b).toBeLessThanOrEqual(20);
      if (grade !== "3" && grade !== "4") {
        expect([6, 7, 8, 9]).not.toContain(visual.a);
        expect([6, 7, 8, 9]).not.toContain(visual.b);
      }
      if (grade === "K" || grade === "PK") throw new Error("this grade is not served multiplication");
      break;
    }
    case "time": {
      expect(visual.hours).toBeGreaterThanOrEqual(1);
      expect(visual.hours).toBeLessThanOrEqual(12);
      expect(TIME_MINUTES[level as TimeLevel]).toContain(visual.minutes);
      expect(visual.minutes % 5).toBe(0);
      if (grade === "K") expect(visual.minutes).toBe(0);
      if (grade === "1") expect(FIVES_ONLY).not.toContain(visual.minutes);
      break;
    }
    case "money": {
      expect(visual.coins.dollar).toBeGreaterThanOrEqual(0);
      if (grade === "K") expect(visual.mode).toBe("name");
      if (grade === "1") expect(["name", "count", "make"]).toContain(visual.mode);
      if (grade === "K" || grade === "1") {
        expect(visual.mode).not.toBe("change");
        expect(visual.mode).not.toBe("dollars");
        expect(visual.coins.dollar).toBe(0);
      }
      if (visual.mode === "name") {
        const shown = (["penny", "nickel", "dime", "quarter", "dollar"] as const).filter((kind) => visual.coins[kind] > 0);
        expect(shown).toEqual([shown[0]]);
        expect(visual.coins.dollar).toBe(0);
      }
      if (visual.mode === "count") {
        expect(pileCents(visual.coins)).toBeGreaterThan(0);
        expect(pileCents(visual.coins)).toBeLessThanOrEqual(50);
        expect(visual.coins.quarter).toBeLessThanOrEqual(1);
        expect(visual.coins.dollar).toBe(0);
      }
      if (visual.mode === "change") {
        const paid = pileCents(visual.coins);
        expect(paid).toBeLessThanOrEqual(100);
        expect(visual.priceCents ?? 0).toBeGreaterThan(0);
        expect(visual.priceCents ?? 0).toBeLessThan(paid);
      }
      if (visual.mode === "dollars") {
        expect(visual.coins.dollar).toBeGreaterThan(0);
        expect(visual.coins.dollar).toBeLessThanOrEqual(2);
        expect(pileCents(visual.coins)).toBeLessThanOrEqual(300);
      }
      if (visual.mode === "spend") {
        expect(visual.priceCents ?? 0).toBeGreaterThan(0);
        expect(question.answer.startsWith("$")).toBe(true);
      }
      break;
    }
    case "sight": {
      const list = sightWords(level as SightList);
      expect(list.some((word) => word.word === visual.word)).toBe(true);
      if (grade === "K" || grade === "1") {
        expect(visual.mode).not.toBe("fill");
        expect(question.answer).toBe(visual.word);
        if (visual.mode === "match") expect(visual.pictures?.[question.answer]).toBeTruthy();
      }
      break;
    }
    case "spell": {
      const list = spellWords(level as SpellLevel);
      expect(list.some((word) => word.word === visual.word)).toBe(true);
      expect(question.answer).toBe(visual.word);
      if (level === "patterns" || level === "grade4") expect(visual.showSentence).toBe(true);
      else expect(visual.showSentence).toBe(false);
      if (grade === "K" || grade === "1") expect(visual.showSentence).toBe(false);
      break;
    }
    case "scene": {
      expect(visual.board.game).toBe(question.game);
      expect(visual.board.mode).toBe(level);
      for (const choice of question.choices) expect(choice.startsWith("no ")).toBe(false);
      assertScene(grade, visual.board, question);
      break;
    }
    default: {
      const neverVisual: never = visual;
      throw new Error(`Unhandled question kind: ${String(neverVisual)}`);
    }
  }
}

describe("grade bands", () => {
  it("maps every registered game and keeps the start inside that game", () => {
    for (const game of GAMES) {
      const bands = GRADE_BANDS[game.id];
      expect(bands).toBeTruthy();
      for (const grade of GRADES) {
        const row = bands?.[grade];
        expect(row?.standards.length).toBeGreaterThan(0);
        expect(game.isLevel(row?.start)).toBe(true);
        expect(game.defaultLevel(grade)).toBe(row?.start);
        for (const level of row?.levels ?? []) expect(game.isLevel(level)).toBe(true);
        const allowed = playWindow(game.levels.map((level) => level.id), game.id, grade, false);
        if (row?.offer === "later") expect(allowed.ids).toEqual([]);
        else expect(allowed.ids).toContain(row?.start);
      }
    }
    expect(FRACTION_DENOMINATORS).toEqual([2, 3, 4, 6, 8]);
  });

  it("lets adaptive play drift one level and stops there unless challenge ahead is on", () => {
    const add = GAMES.find((game) => game.id === "add");
    expect(add).toBeTruthy();
    const ids = add!.levels.map((level) => level.id);
    const band = playWindow(ids, "add", "K", false);
    expect(band.ids).toEqual(["within5", "within10", "within20"]);
    expect(playWindow(ids, "add", "K", true).ids.at(-1)).toBe("thousands");
    let ladder = startLadder(openingIndex(ids.indexOf(band.start), 0, false, { min: band.min, max: band.max }));
    for (let i = 0; i < 12; i++) {
      ladder = stepLadder(ladder, ids.length, true, { min: band.min, max: band.max });
      expect(ladder.index).toBeGreaterThanOrEqual(band.min);
      expect(ladder.index).toBeLessThanOrEqual(band.max);
    }
    expect(ids[ladder.index]).not.toBe("within100");
    expect(ids[ladder.index]).not.toBe("tens");
  });

  it("does not place a kindergartner into times tables", () => {
    const child = blankChild({ name: "Ada", grade: "K" });
    expect(nextPlacement(child).game).not.toBe("times");
    expect(child.journey.areaId).not.toBe("times");
  });

  it("keeps 200 questions inside each grade", () => {
    const locales: Locale[] = ["en", "es", "pt", "fr", "zh"];
    try {
    for (const locale of locales) {
      setLocale(locale);
    for (const game of GAMES) {
      for (const grade of GRADES) {
        const allowed = playWindow(game.levels.map((level) => level.id), game.id, grade, false);
        if (allowed.offer === "later") {
          expect(allowed.ids).toEqual([]);
          continue;
        }
        for (let i = 0; i < SAMPLES; i++) {
          const level = allowed.ids[i % allowed.ids.length]!;
          const question = game.makeQuestion(rngFromSeed(`${game.id}-${grade}-${level}-${i}`), level);
          expect(question.game).toBe(game.id);
          expect(question.choices).toHaveLength(4);
          expect(question.choices).toContain(question.answer);
          assertQuestion(grade, level, question);
          if (game.id === "time") {
            const clock = makeClockTask(level, rngFromSeed(`clock-${grade}-${level}-${i}`));
            expect(TIME_MINUTES[level as TimeLevel]).toContain(clock.minutes);
            if (grade === "K") expect(clock.minutes).toBe(0);
            if (grade === "1") expect(FIVES_ONLY).not.toContain(clock.minutes);
          }
          if (game.id === "money") {
            const pay = makePayTask(level, rngFromSeed(`pay-${grade}-${level}-${i}`));
            expect(pay.cents).toBeGreaterThan(0);
            expect(pay.cents).toBeLessThanOrEqual(grade === "4" ? 400 : grade === "3" || grade === "2" ? 200 : 75);
            if (level === "name") expect(pay.bank).toHaveLength(1);
            if (grade === "K" || grade === "1") expect(pay.cents).toBeLessThanOrEqual(75);
          }
          const hands = makeHandsTask(game.id, level, rngFromSeed(`hands-${game.id}-${grade}-${level}-${i}`));
          expect(hands.skill).toBe(`${game.id}:${level}`);
          assertHandsGrade(grade, level, hands);
        }
      }
    }
    }
    } finally {
      setLocale("en");
    }
  }, 120_000);
});
