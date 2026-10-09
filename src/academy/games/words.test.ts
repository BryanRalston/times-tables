import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { blankChild } from "../storage";
import { applyRound } from "../rewards";
import { needsSpeechFallback } from "./speech";
import {
  buildTiles,
  dueWordIds,
  freshBoard,
  hintLetter,
  insertReplay,
  liftTile,
  nextWordCard,
  orderForReview,
  pickFromPrefer,
  placeTile,
  placedWord,
} from "./words";

describe("spaced repetition", () => {
  it("brings a missed word back before new words and mastered words", () => {
    expect(nextWordCard(undefined, false, false)).toEqual({ box: 0, ok: 0, miss: 1, streak: 0 });
    const learned = nextWordCard(nextWordCard(nextWordCard(undefined, true, false), true, false), true, false);
    expect(learned.box).toBe(3);
    expect(learned.streak).toBe(3);
    const hinted = nextWordCard(learned, true, true);
    expect(hinted.box).toBe(0);
    expect(hinted.streak).toBe(0);
    expect(hinted.miss).toBe(learned.miss + 1);

    const cards = {
      "sw:the": nextWordCard(undefined, false, false),
      "sw:and": learned,
    };
    expect(orderForReview([{ id: "sw:and" }, { id: "sw:cat" }, { id: "sw:the" }], cards).map((item) => item.id)).toEqual([
      "sw:the",
      "sw:cat",
      "sw:and",
    ]);
    expect(dueWordIds(cards, ["sw:and", "sw:the", "sw:cat"])).toEqual(["sw:the"]);
  });

  it("asks due words much more often than the rest of the list", () => {
    const items = Array.from({ length: 40 }, (_, index) => ({ id: `sw:${index}` }));
    let hits = 0;
    for (let i = 0; i < 200; i++) {
      if (pickFromPrefer(rngFromSeed(`due-${i}`), items, ["sw:7"]).id === "sw:7") hits += 1;
    }
    expect(hits).toBeGreaterThan(120);
  });

  it("inserts one replay soon after a miss and does not chain replays", () => {
    const queue = [
      { id: "a", factKey: "sw:the", replay: true },
      { id: "b", factKey: "sw:and", replay: true },
      { id: "c", factKey: "sw:see", replay: true },
    ];
    const next = insertReplay(queue, 0, queue[0]!);
    expect(next.map((item) => item.id)).toEqual(["a", "b", "a-r", "c"]);
    expect(insertReplay(next, 2, next[2]!).map((item) => item.id)).toEqual(["a", "b", "a-r", "c"]);
    const already = [
      { id: "a", factKey: "sw:the", replay: true },
      { id: "b", factKey: "sw:the", replay: true },
    ];
    expect(insertReplay(already, 0, already[0]!)).toBe(already);
  });

  it("stores sight-word and spelling memory on the child", () => {
    const child = blankChild({ id: "kid", name: "Mia", grade: "K" });
    const next = applyRound(
      child,
      {
        game: "sight",
        correct: 1,
        total: 2,
        seconds: 30,
        answers: [
          { skill: "sight:preprimer", tags: ["hear"], factKey: "sw:the", ok: false },
          { skill: "spell:cvc", tags: ["cvc"], factKey: "sp:cat", ok: true, hint: true },
          { skill: "times:toTen", tags: ["table:2"], factKey: "2×5", ok: true },
        ],
      },
      "2026-10-09",
    );
    expect(next.words["sw:the"]).toEqual({ box: 0, ok: 0, miss: 1, streak: 0 });
    expect(next.words["sp:cat"]).toMatchObject({ box: 0, streak: 0, miss: 1, ok: 1 });
    expect(next.words["2×5"]).toBeUndefined();
    expect(next.coins).toBeGreaterThan(0);
    expect(next.skills["sight:preprimer"]).toEqual({ ok: 0, miss: 1 });
    expect(dueWordIds(next.words, ["sw:the", "sp:cat"])).toEqual(["sp:cat", "sw:the"]);
  });

  it("keeps a word due when the child needed the worked example", () => {
    const child = blankChild({ name: "Mia" });
    const next = applyRound(
      child,
      {
        game: "sight",
        correct: 1,
        total: 1,
        seconds: 10,
        answers: [{ skill: "sight:preprimer", tags: ["hear"], factKey: "sw:the", ok: true, taught: true }],
      },
      "2026-10-09",
    );
    expect(next.words["sw:the"]).toMatchObject({ box: 0, streak: 0, miss: 1, ok: 1 });
  });
});

describe("letter tiles", () => {
  it("places a tile, puts it back, and will not lift a hinted letter", () => {
    const tiles = buildTiles("cat", ["b", "d", "m"], rngFromSeed("cat-tiles"));
    const start = freshBoard("cat", tiles);
    expect(start.pool).toHaveLength(6);
    const first = start.pool[0]!;
    const placed = placeTile(start, first.id);
    expect(placedWord(placed)).toBe(first.letter);
    expect(placed.pool).toHaveLength(5);
    const lifted = liftTile(placed, first.id);
    expect(placedWord(lifted)).toBe("");
    expect(lifted.pool).toHaveLength(6);

    let board = freshBoard("moon", buildTiles("moon", ["a", "e", "s"], rngFromSeed("moon")));
    board = hintLetter(board);
    expect(placedWord(board)).toBe("m");
    expect(board.locked).toBe(1);
    expect(liftTile(board, board.placed[0]!.id)).toBe(board);
    board = hintLetter(board);
    expect(placedWord(board)).toBe("mo");
    board = hintLetter(board);
    expect(placedWord(board)).toBe("moo");
    expect(board.placed[1]!.letter).toBe("o");
    expect(board.placed[2]!.letter).toBe("o");
    expect(board.placed[1]!.id).not.toBe(board.placed[2]!.id);
  });
});

describe("speech fallback", () => {
  it("shows text when no voice can speak and keeps trying while voices are still loading", () => {
    expect(needsSpeechFallback({ synthesis: false, voices: 0, settled: true })).toBe(true);
    expect(needsSpeechFallback({ synthesis: true, voices: 0, settled: true })).toBe(true);
    expect(needsSpeechFallback({ synthesis: true, voices: 0, settled: false })).toBe(false);
    expect(needsSpeechFallback({ synthesis: true, voices: 3, settled: true })).toBe(false);
  });
});
