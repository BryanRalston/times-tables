import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { makeBossRound } from "./round";
import { GAMES } from "./registry";
import { makeSightQuestion, pickSightMode } from "./sight";
import { ALL_SIGHT, SIGHT_LEVELS, sightWords, type SightList } from "./sight-data";
import { blankOut, countWord } from "./words";

const DOLCH: Record<Exclude<SightList, "second" | "third">, number> = {
  preprimer: 40,
  primer: 52,
  first: 41,
};

describe("sight word lists", () => {
  it("covers Dolch lists by grade and adds Fry words that are not already there", () => {
    const ids = ALL_SIGHT.map((word) => word.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(sightWords("preprimer")).toHaveLength(DOLCH.preprimer);
    expect(sightWords("primer")).toHaveLength(DOLCH.primer);
    expect(sightWords("first")).toHaveLength(DOLCH.first);
    expect(sightWords("preprimer").some((word) => word.word === "the")).toBe(true);
    expect(sightWords("primer").some((word) => word.word === "please")).toBe(true);
    expect(sightWords("first").some((word) => word.word === "because")).toBe(false);
    expect(sightWords("second").map((word) => word.word)).toEqual(
      expect.arrayContaining(["because", "don't", "boy", "school", "water"]),
    );
    expect(sightWords("third").map((word) => word.word)).toEqual(
      expect.arrayContaining(["about", "people", "mountain", "important"]),
    );
    expect(sightWords("second").length).toBeGreaterThan(46);
    expect(sightWords("third").length).toBeGreaterThan(41);

    for (const word of ALL_SIGHT) {
      expect(countWord(word.sentence, word.word)).toBe(1);
      expect(blankOut(word.sentence, word.word)).toContain("___");
      expect(countWord(blankOut(word.sentence, word.word), word.word)).toBe(0);
    }
    expect(blankOut("Please don't run.", "don't")).toBe("Please ___ run.");

    for (const level of SIGHT_LEVELS) {
      const pictures = new Set<string>();
      for (const word of sightWords(level)) {
        if (!word.emoji) continue;
        expect(pictures.has(word.emoji)).toBe(false);
        pictures.add(word.emoji);
      }
      expect(pictures.size).toBeGreaterThanOrEqual(4);
    }
  });

  it("starts each grade on a Dolch list and can hear, match, or fill", () => {
    const game = GAMES.find((item) => item.id === "sight");
    expect(game?.defaultLevel("K")).toBe("preprimer");
    expect(game?.defaultLevel("1")).toBe("primer");
    expect(game?.defaultLevel("2")).toBe("second");
    expect(game?.defaultLevel("3")).toBe("third");
    const ids = GAMES.map((item) => item.id);
    expect(ids.indexOf("spelling")).toBe(ids.indexOf("sight") + 1);

    let hear = 0;
    const modes = new Set<string>();
    for (let i = 0; i < 200; i++) {
      if (pickSightMode(rngFromSeed(`mode-${i}`), "preprimer") === "hear") hear += 1;
      const q = makeSightQuestion(rngFromSeed(`q-${i}`), "preprimer");
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.choices).toContain(q.answer);
      expect(q.replay).toBe(true);
      expect(q.factKey?.startsWith("sw:")).toBe(true);
      if (q.visual.kind === "sight") {
        modes.add(q.visual.mode);
        if (q.visual.mode === "hear") expect(q.visual.spoken).toBe(q.visual.word);
        if (q.visual.mode === "fill") {
          expect(q.visual.sentence).toContain("___");
          expect(countWord(q.visual.spoken, q.visual.word)).toBe(0);
        }
        if (q.visual.mode === "match" && q.visual.pictures) {
          expect(q.visual.pictures[q.answer]).toBeTruthy();
        }
      }
    }
    expect(hear).toBeGreaterThan(90);
    expect(modes.has("fill")).toBe(false);
    expect(modes).toEqual(new Set(["hear", "match"]));

    const boss = makeBossRound("sight", "preprimer", rngFromSeed("sight-boss"));
    expect(boss.some((q) => q.skill === "sight:primer")).toBe(true);
    expect(boss.some((q) => q.skill === "sight:preprimer")).toBe(true);

    const row = game!.makeSheetItem(rngFromSeed("sight-sheet"), "primer");
    expect(row.answer.length).toBeGreaterThan(0);
    expect(sightWords("primer").some((word) => word.word === row.answer)).toBe(true);
    expect(readFileSync("academy/worksheets/sight-words/index.html", "utf8")).toContain('data-screen="sheet-sight"');
  });
});
