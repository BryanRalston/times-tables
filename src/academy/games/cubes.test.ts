import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { TIERS, bandFor, playWindow, tierKey, tierWindow } from "../grade-map";
import { AR } from "../i18n-ar";
import { ES } from "../i18n-es";
import { FR } from "../i18n-fr";
import { HI } from "../i18n-hi";
import { PT } from "../i18n-pt";
import { ZH } from "../i18n-zh";
import { hasHandsCard } from "../hands-build";
import type { Grade } from "../model";
import { levelStones } from "../stones";
import { blankChild } from "../storage";
import { standardForSkill } from "../standards";
import { subjectKeyOf } from "../subject-games";
import { cubeCaptions } from "./cubes-data";
import {
  BUILD_MAX,
  COUNT_EDGE_MAX,
  COUNT_VOLUME_MAX,
  CUBE_LEVELS,
  boardVolume,
  boxCubes,
  boxDims,
  buildBoxes,
  buildMatches,
  hiddenCubes,
  isSupported,
  makeCubeQuestion,
  makeCubeSheet,
  rollTwo,
  visibleCubes,
  volumeOf,
} from "./cubes-data";
import { GAMES, gameById } from "./registry";
import { GAME_CARDS } from "./cards";
import type { CubeBoard } from "./boards";
import type { ChoiceQ } from "./types";

const SAMPLES = 300;
const LOWER: Grade[] = ["PK", "K", "1", "2", "3", "4"];

function boardOf(q: ChoiceQ): CubeBoard {
  if (q.visual.kind !== "scene" || q.visual.board.game !== "cubes") throw new Error("not a cube board");
  return q.visual.board;
}

describe("Cube Builder volume math", () => {
  it("counts hidden cubes and matches l × w × h", () => {
    expect(volumeOf({ l: 3, w: 2, h: 2 })).toBe(12);
    expect(hiddenCubes({ l: 3, w: 2, h: 2 })).toBe(2);
    expect(visibleCubes({ l: 3, w: 2, h: 2 })).toBe(10);
    expect(hiddenCubes({ l: 4, w: 3, h: 3 })).toBe(12);
    expect(boxCubes({ l: 4, w: 3, h: 3 })).toHaveLength(36);
    for (let l = 1; l <= 6; l += 1)
      for (let w = 1; w <= 4; w += 1)
        for (let h = 1; h <= 5; h += 1) {
          const box = { l, w, h };
          expect(boxCubes(box)).toHaveLength(l * w * h);
          expect(visibleCubes(box) + hiddenCubes(box)).toBe(volumeOf(box));
        }
  });

  it("stacks every cube on the floor or on another cube", () => {
    expect(isSupported(boxCubes({ l: 3, w: 2, h: 4 }, { l: 2, w: 2, h: 1 }))).toBe(true);
    expect(isSupported([{ x: 0, y: 0, z: 1, part: 0 }])).toBe(false);
  });

  it("adds two joined boxes without overlap", () => {
    const board: CubeBoard = { game: "cubes", mode: "two", box: { l: 2, w: 3, h: 4 }, second: { l: 3, w: 3, h: 2 } };
    const cubes = boxCubes(board.box, board.second);
    expect(new Set(cubes.map((c) => `${c.x},${c.y},${c.z}`)).size).toBe(cubes.length);
    expect(boardVolume(board)).toBe(24 + 18);
  });

  it("accepts any box with the target volume, and keeps a fixed floor", () => {
    const free: CubeBoard = { game: "cubes", mode: "build", box: { l: 3, w: 2, h: 2 }, target: 12, floorFixed: false };
    expect(buildMatches(free, { l: 3, w: 2, h: 2 })).toBe(true);
    expect(buildMatches(free, { l: 6, w: 2, h: 1 })).toBe(true);
    expect(buildMatches(free, { l: 3, w: 2, h: 3 })).toBe(false);
    const floor: CubeBoard = { ...free, floorFixed: true };
    expect(buildMatches(floor, { l: 6, w: 2, h: 1 })).toBe(false);
    expect(buildMatches(floor, { l: 3, w: 2, h: 2 })).toBe(true);
    expect(buildBoxes(12, { l: 3, w: 2 })).toEqual([{ l: 3, w: 2, h: 2 }]);
  });
});

describe("Cube Builder questions", () => {
  it("stay inside 5.MD.C with whole cubes, in range, with four distinct tiles", () => {
    for (const level of CUBE_LEVELS) {
      for (const prefer of [[], ["ease:gentle"], ["ease:firm"]]) {
        const rng = rngFromSeed(`cubes-${level}-${prefer.join()}`);
        for (let i = 0; i < SAMPLES; i += 1) {
          const q = makeCubeQuestion(rng, level, prefer);
          const board = boardOf(q);
          expect(board.mode).toBe(level);
          expect(q.skill).toBe(`cubes:${level}`);
          expect(q.choices).toHaveLength(4);
          expect(new Set(q.choices).size).toBe(4);
          expect(q.choices).toContain(q.answer);
          for (const c of q.choices) expect(c).toMatch(/^[1-9]\d*$/);
          expect(Number(q.answer)).toBe(boardVolume(board));
          for (const n of [board.box.l, board.box.w, board.box.h]) expect(Number.isInteger(n) && n >= 1).toBe(true);
          if (board.mode === "count") {
            expect(Math.max(board.box.l, board.box.w, board.box.h)).toBeLessThanOrEqual(COUNT_EDGE_MAX);
            expect(volumeOf(board.box)).toBeLessThanOrEqual(COUNT_VOLUME_MAX);
            expect(hiddenCubes(board.box)).toBeGreaterThan(0);
            // The classic slip: counting only the cubes you can see.
            expect(q.choices).toContain(String(visibleCubes(board.box)));
          }
          if (board.mode === "build") {
            expect(buildBoxes(board.target, board.floorFixed ? board.box : undefined).length).toBeGreaterThan(0);
            expect(board.box.l).toBeLessThanOrEqual(BUILD_MAX.l);
            expect(board.box.w).toBeLessThanOrEqual(BUILD_MAX.w);
            expect(board.box.h).toBeLessThanOrEqual(BUILD_MAX.h);
            expect(buildMatches(board, board.box)).toBe(true);
          }
          if (board.mode === "formula") {
            const { l, w, h } = board.box;
            expect(l).toBeLessThanOrEqual(7);
            if (board.ask === "lwh") expect(q.choices).toContain(String(l + w + h));
          }
          if (board.mode === "two") {
            expect(board.second.w).toBe(board.box.w);
            expect(board.second.h).toBeLessThan(board.box.h);
            expect(isSupported(boxCubes(board.box, board.second))).toBe(true);
          }
          const lines = cubeCaptions(board);
          expect(lines.length).toBeGreaterThanOrEqual(2);
          expect(lines[lines.length - 1]).toContain(`= ${q.answer}`);
        }
      }
    }
  });

  it("makes worksheet rows with a picture and a whole-number answer", () => {
    for (const level of CUBE_LEVELS) {
      const rng = rngFromSeed(`cubes-sheet-${level}`);
      for (let i = 0; i < 60; i += 1) {
        const row = makeCubeSheet(rng, level);
        expect(row.cubes?.game).toBe("cubes");
        expect(row.answer).toMatch(/^[1-9]\d*$/);
        if (row.cubes && row.cubes.mode !== "build") expect(Number(row.answer)).toBe(boardVolume(row.cubes));
        if (row.cubes?.mode === "build") expect(row.cubes.box.l * row.cubes.box.w * Number(row.answer)).toBe(row.cubes.target);
      }
    }
  });
});

describe("Cube Builder grade guard", () => {
  const game = gameById("cubes")!;
  const ids = game.levels.map((row) => row.id);

  it("is appended last, is a math game, and has a real worksheet", () => {
    expect(GAMES[GAMES.length - 1]?.id).toBe("cubes");
    expect(GAME_CARDS[GAME_CARDS.length - 1]?.id).toBe("cubes");
    expect(subjectKeyOf("cubes")).toBe("math");
    expect(game.sheetSlug).toBe("volume-with-cubes");
    expect(game.sheetScreen).toBe("sheet-cubes");
    expect(game.audience).toBe("Grade 5");
    expect(game.blurb).not.toMatch(/K[–-]4/);
  });

  it("serves nothing below grade 5 at any difficulty", () => {
    for (const grade of LOWER) {
      expect(bandFor("cubes", grade)?.offer).toBe("later");
      expect(playWindow(ids, "cubes", grade, false).ids).toEqual([]);
      for (const tier of TIERS) {
        expect(tierWindow(ids, "cubes", grade, false, tier).ids).toEqual([]);
        const child = { ...blankChild({ name: "A", grade }), tiers: { [tierKey(grade, "cubes")]: tier } };
        expect(levelStones(child, "cubes")).toEqual([]);
      }
    }
  });

  it("opens every level in order for grade 5, and remembers Easy, Medium, and Hard per grade", () => {
    expect(playWindow(ids, "cubes", "5", false).ids).toEqual(["count", "build", "formula", "two"]);
    expect(game.defaultLevel("5")).toBe("count");
    const easy = tierWindow(ids, "cubes", "5", false, "easy");
    const hard = tierWindow(ids, "cubes", "5", false, "hard");
    expect(easy.ids[0]).toBe("count");
    expect(hard.ids).toContain("two");
    for (const tier of TIERS) {
      const child = { ...blankChild({ name: "A", grade: "5" }), tiers: { [tierKey("5", "cubes")]: tier } };
      const stones = levelStones(child, "cubes");
      expect(stones.length).toBeGreaterThan(0);
      expect(stones.map((s) => s.num)).toEqual([...stones.map((s) => s.num)].sort((a, b) => a - b));
    }
    expect(tierKey("5", "cubes")).not.toBe(tierKey("4", "cubes"));
  });

  it("keeps 5.MD.C codes and no hands cards", () => {
    for (const level of CUBE_LEVELS) {
      expect(standardForSkill(`cubes:${level}`)?.code).toMatch(/^5\.MD\.C\./);
      expect(hasHandsCard("cubes", level)).toBe(false);
    }
  });
});

describe("Cube Builder copy", () => {
  it("has every new string in all six languages", () => {
    const keys = [
      "Cube Builder",
      "Cubes",
      "Grade 5",
      "Count the cubes",
      "Build a box",
      "Use the formula",
      "Two boxes",
      game().blurb,
    ];
    const statics = [
      "How many unit cubes build this box?",
      "Some cubes are hidden in the back. How many cubes in all?",
      "Use the formula. What is the volume?",
      "Count one layer, then count the layers. Hidden cubes count too.",
      "Long × wide × tall is the number of cubes.",
      "Volume = base × height",
      "Volume = length × width × height",
      "Find each box's volume. Then add them.",
      "Two boxes are joined. What is the total volume?",
      "Volume =",
      "Hidden cubes count too.",
      "Multiply long × wide × tall, then fix your box.",
      "long",
      "wide",
      "tall",
    ];
    for (const key of keys) expect(ES[key], key).toBeTruthy();
    for (const dict of [PT, FR, ZH, HI, AR]) {
      for (const key of [...keys, ...statics]) expect(dict[key], key).toBeTruthy();
    }
  });
});

function game() {
  return gameById("cubes")!;
}

describe("two boxes key", () => {
  it("names each box l × w × h, matching the drawn cubes and the answer", () => {
    const rng = rngFromSeed(77);
    for (let i = 0; i < 300; i += 1) {
      const board = rollTwo(rng);
      const cubes = boxCubes(board.box, board.second);
      const pink = cubes.filter((c) => c.part === 0);
      const teal = cubes.filter((c) => c.part === 1);
      expect(pink.length).toBe(volumeOf(board.box));
      expect(teal.length).toBe(volumeOf(board.second));
      // Drawn extents equal the stated edges.
      const span = (vs: typeof cubes, k: "x" | "y" | "z") => Math.max(...vs.map((c) => c[k])) - Math.min(...vs.map((c) => c[k])) + 1;
      expect([span(pink, "x"), span(pink, "y"), span(pink, "z")]).toEqual([board.box.l, board.box.w, board.box.h]);
      expect([span(teal, "x"), span(teal, "y"), span(teal, "z")]).toEqual([board.second.l, board.second.w, board.second.h]);
      expect(boxDims(board.box)).toBe(`${board.box.l} × ${board.box.w} × ${board.box.h}`);
      expect(boxDims(board.second)).toBe(`${board.second.l} × ${board.second.w} × ${board.second.h}`);
      expect(boardVolume(board)).toBe(volumeOf(board.box) + volumeOf(board.second));
    }
  });
});
