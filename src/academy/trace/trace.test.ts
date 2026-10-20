import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { makeBuildTask } from "../hands-build";
import { allGlyphs, glyphFor } from "./glyphs";
import { guideInk, scoreTrace, strokeCue, TRACE_TOLERANCE, traceMatches } from "./score";

describe("finger tracing", () => {
  it("has a guided path for numerals 0-9 and both letter cases", () => {
    for (const id of "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz") {
      const glyph = glyphFor(id);
      expect(glyph, id).toBeTruthy();
      expect(glyph!.strokes.length).toBeGreaterThan(0);
      for (const stroke of glyph!.strokes) {
        expect(stroke.points.length).toBeGreaterThan(1);
        const cue = strokeCue(stroke);
        expect(cue.start.x).toBeGreaterThan(0);
        expect(cue.start.y).toBeGreaterThan(0);
        expect(Number.isFinite(cue.angle)).toBe(true);
      }
    }
    expect(allGlyphs()).toHaveLength(62);
  });

  it("accepts the guide and a wobbly finger, and never treats a dab as finished", () => {
    for (const glyph of allGlyphs()) {
      expect(traceMatches(glyph.id, guideInk(glyph.id)), glyph.id).toBe(true);
      const wobble = guideInk(glyph.id).map((stroke) => stroke.map((point) => ({ x: point.x + 7, y: point.y - 5 })));
      expect(scoreTrace(glyph, wobble, TRACE_TOLERANCE).done, glyph.id).toBe(true);
      const start = glyph.strokes[0]?.points[0] ?? { x: 50, y: 50 };
      expect(scoreTrace(glyph, [[start]]).done).toBe(false);
      const miss = guideInk(glyph.id).map((stroke) => stroke.map((point) => ({ x: point.x + 42, y: point.y + 42 })));
      expect(scoreTrace(glyph, miss).done, glyph.id).toBe(false);
    }
  });

  it("puts numeral cards in counting to 10 and letter cards in early phonics", () => {
    let numerals = 0;
    let piles = 0;
    let upper = 0;
    let lower = 0;
    let sounds = 0;
    for (let i = 0; i < 48; i += 1) {
      const count = makeBuildTask("count", "objects", rngFromSeed(`trace-count-${i}`));
      if (count.kind === "trace") {
        numerals += 1;
        expect(count.form).toBe("numeral");
        expect(count.glyph).toMatch(/^[0-9]$/);
        expect(count.speech.toLowerCase()).toContain("trace");
        expect(count.praise.length).toBeGreaterThan(0);
      }
      if (count.kind === "count") piles += 1;
      const letters = makeBuildTask("phonics", "letters", rngFromSeed(`trace-letter-${i}`));
      if (letters.kind === "trace") {
        expect(letters.form === "upper" || letters.form === "lower").toBe(true);
        if (letters.form === "upper") upper += 1;
        if (letters.form === "lower") lower += 1;
      }
      const begin = makeBuildTask("phonics", "begin", rngFromSeed(`trace-begin-${i}`));
      if (begin.kind === "trace") sounds += 1;
    }
    expect(numerals).toBeGreaterThan(0);
    expect(piles).toBeGreaterThan(0);
    expect(upper).toBeGreaterThan(0);
    expect(lower).toBeGreaterThan(0);
    expect(sounds).toBeGreaterThan(0);
    for (const level of ["rhyme", "cvc", "end", "to20", "neighbor"]) {
      for (let i = 0; i < 16; i += 1) {
        const game = level === "to20" || level === "neighbor" ? "count" : "phonics";
        expect(makeBuildTask(game, level, rngFromSeed(`trace-off-${level}-${i}`)).kind).not.toBe("trace");
      }
    }
  });
});
