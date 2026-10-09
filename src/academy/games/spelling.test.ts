import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { makeBossRound } from "./round";
import { GAMES } from "./registry";
import { makeSpellingQuestion } from "./spelling";
import { ALL_SPELL, spellWords } from "./spell-data";
import { blankOut, countWord, decoyWords } from "./words";

describe("spelling lists", () => {
  it("groups phonics patterns and keeps each word inside its sentence", () => {
    const ids = ALL_SPELL.map((word) => word.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const word of spellWords("cvc")) {
      expect(word.word).toMatch(/^[b-df-hj-np-tv-z][aeiou][b-df-hj-np-tv-z]$/);
      expect(word.patternLabel.startsWith("short ")).toBe(true);
    }
    for (const word of spellWords("digraphs")) {
      expect(word.word).toMatch(/sh|ch|th|ck|ng|wh/);
      expect(word.word).toContain(word.patternLabel);
    }
    for (const word of spellWords("blends")) {
      expect(word.word).toMatch(/^(bl|cl|cr|dr|fl|fr|gl|gr|pl|sl|sn|sp|st|sw|tw)/);
    }
    for (const word of spellWords("long")) {
      expect(word.word).toMatch(/a[a-z]e$|i[a-z]e$|o[a-z]e$|u[a-z]e$|ai|ay|ee|oa|igh|oo/);
    }
    expect(spellWords("patterns").map((word) => word.word)).toEqual(
      expect.arrayContaining(["night", "friend", "because", "people", "thought"]),
    );
    for (const word of ALL_SPELL) {
      expect(countWord(word.sentence, word.word)).toBe(1);
      expect(blankOut(word.sentence, word.word)).not.toContain(word.word);
    }
  });

  it("builds a spoken word from letter tiles and reveals the next letter after a miss", () => {
    const game = GAMES.find((item) => item.id === "spelling");
    expect(game?.defaultLevel("K")).toBe("cvc");
    expect(game?.defaultLevel("1")).toBe("digraphs");
    expect(game?.defaultLevel("2")).toBe("long");
    expect(game?.defaultLevel("3")).toBe("patterns");

    for (const level of ["cvc", "digraphs", "blends", "long", "patterns"] as const) {
      const q = makeSpellingQuestion(rngFromSeed(`spell-${level}`), level);
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.choices).toContain(q.answer);
      expect(q.replay).toBe(true);
      expect(q.visual.kind).toBe("spell");
      if (q.visual.kind !== "spell") continue;
      expect(q.visual.spoken.startsWith(`${q.answer}.`)).toBe(true);
      expect(q.visual.sentence).toContain("___");
      expect(q.visual.sentence.includes(q.answer)).toBe(false);
      const letters = q.visual.tiles.map((tile) => tile.letter);
      for (const letter of q.answer) {
        expect(letters.filter((item) => item === letter).length).toBeGreaterThanOrEqual(
          q.answer.split("").filter((item) => item === letter).length,
        );
      }
      expect(decoyWords(q.answer)).toHaveLength(3);
      expect(decoyWords(q.answer)).not.toContain(q.answer);
    }

    const boss = makeBossRound("spelling", "cvc", rngFromSeed("spell-boss"));
    expect(boss.some((q) => q.skill === "spell:digraphs")).toBe(true);
    expect(boss.some((q) => q.skill === "spell:cvc")).toBe(true);
    const row = game!.makeSheetItem(rngFromSeed("spell-sheet"), "blends");
    expect(spellWords("blends").some((word) => word.word === row.answer)).toBe(true);
    expect(readFileSync("academy/worksheets/spelling/index.html", "utf8")).toContain('data-screen="sheet-spelling"');
    expect(readFileSync("vite.academy.config.ts", "utf8")).toContain("worksheets/spelling/index.html");
  });
});
