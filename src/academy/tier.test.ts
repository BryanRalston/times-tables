import { describe, expect, it } from "vitest";
import { GAMES } from "./games/registry";
import { playWindow, tierKey, tierWindow, TIERS } from "./grade-map";
import type { Grade } from "./model";
import { nextPlacement } from "./placement";
import { freshSave, parseSave, SAVE_VERSION, tierFor, withGrade, withTier } from "./storage";

const GRADES: Grade[] = ["PK", "K", "1", "2", "3", "4", "5"];

describe("difficulty tiers", () => {
  it("every tier stays inside the grade window for every game and grade", () => {
    for (const game of GAMES) {
      const ids = game.levels.map((row) => row.id);
      for (const grade of GRADES) {
        for (const challenge of [false, true]) {
          const base = playWindow(ids, game.id, grade, challenge);
          for (const tier of TIERS) {
            const w = tierWindow(ids, game.id, grade, challenge, tier);
            const label = `${game.id} ${grade} ${tier} ${challenge}`;
            expect(w.offer, label).toBe(base.offer);
            for (const id of w.ids) expect(base.ids, label).toContain(id);
            if (base.ids.length === 0) continue;
            expect(w.ids.length, label).toBeGreaterThan(0);
            expect(w.min, label).toBeGreaterThanOrEqual(base.min);
            expect(w.max, label).toBeLessThanOrEqual(base.max);
            expect(w.ids, label).toContain(w.start);
          }
        }
      }
    }
  });

  it("Hard start >= Medium start >= Easy start, and Medium is unchanged", () => {
    for (const game of GAMES) {
      const ids = game.levels.map((row) => row.id);
      for (const grade of GRADES) {
        const base = playWindow(ids, game.id, grade, false);
        if (base.ids.length === 0) continue;
        const at = (tier: "easy" | "medium" | "hard") => ids.indexOf(tierWindow(ids, game.id, grade, false, tier).start);
        expect(tierWindow(ids, game.id, grade, false, "medium")).toEqual(base);
        expect(at("hard"), `${game.id} ${grade}`).toBeGreaterThanOrEqual(at("medium"));
        expect(at("medium"), `${game.id} ${grade}`).toBeGreaterThanOrEqual(at("easy"));
      }
    }
  });

  it("Hard reaches the stretch level; Challenge ahead lets it go further", () => {
    const game = GAMES.find((row) => row.id === "add")!;
    const ids = game.levels.map((row) => row.id);
    const hard = tierWindow(ids, "add", "3", false, "hard");
    expect(hard.max).toBe(playWindow(ids, "add", "3", false).max);
    const ahead = tierWindow(ids, "add", "3", true, "hard");
    expect(ahead.max).toBeGreaterThanOrEqual(hard.max);
  });

  it("migrates a v12 save to Medium and keeps levels", () => {
    const fresh = freshSave();
    const kid = { ...fresh.children[0]!, grade: "3" as Grade };
    const raw = JSON.parse(JSON.stringify({ ...fresh, version: 12, children: [kid] }));
    delete raw.children[0].tiers;
    const out = parseSave(raw);
    expect(out.version).toBe(SAVE_VERSION);
    expect(out.children[0]!.tiers).toEqual({});
    expect(out.children[0]!.levels).toEqual(parseSave({ ...raw }).children[0]!.levels);
    for (const game of GAMES) expect(tierFor(out.children[0]!, game.id)).toBe("medium");
  });

  it("saves per game and per grade, and survives a reload", () => {
    const save = freshSave();
    let kid = withGrade(save.children[0]!, "3");
    kid = withTier(kid, "add", "hard");
    expect(tierFor(kid, "add")).toBe("hard");
    expect(tierFor(kid, "time")).toBe("medium");
    const ids = GAMES.find((g) => g.id === "add")!.levels.map((r) => r.id);
    expect(kid.levels.add).toBe(tierWindow(ids, "add", "3", false, "hard").start);
    const reloaded = parseSave(JSON.parse(JSON.stringify({ ...save, children: [kid] }))).children[0]!;
    expect(reloaded.tiers[tierKey("3", "add")]).toBe("hard");
    const four = withGrade(reloaded, "4");
    expect(tierFor(four, "add")).toBe("medium");
    expect(tierFor(withGrade(four, "3"), "add")).toBe("hard");
    expect(parseSave({ ...save, children: [{ ...kid, tiers: { "3:add": "wild", "x": "hard" } }] }).children[0]!.tiers).toEqual({});
  });

  it("one-tap Play stays in the chosen tier", () => {
    const ids = GAMES.find((g) => g.id === "add")!.levels.map((r) => r.id);
    for (const tier of TIERS) {
      const place = nextPlacement({ grade: "3", rounds: 0, skills: {}, levels: {}, tiers: { "3:add": tier } });
      if (place.game !== "add") continue;
      expect(tierWindow(ids, "add", "3", false, tier).ids).toContain(place.level);
      if (tier === "hard") expect(place.level).toBe(tierWindow(ids, "add", "3", false, "hard").start);
    }
  });
});

import { easeFromRound } from "./adapt";
describe("tier ease inside a level", () => {
  it("Hard leans firm, Easy leans gentle, Medium unchanged", () => {
    expect(easeFromRound({ combo: 0, missed: false, tier: "hard" })).toBe("firm");
    expect(easeFromRound({ combo: 0, missed: true, tier: "hard" })).toBe("steady");
    expect(easeFromRound({ combo: 0, missed: false, tier: "easy" })).toBe("gentle");
    expect(easeFromRound({ combo: 1, missed: false, tier: "medium" })).toBe(easeFromRound({ combo: 1, missed: false }));
  });
});
