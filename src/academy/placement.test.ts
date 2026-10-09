import { describe, expect, it } from "vitest";
import { blankChild } from "./storage";
import { nextPlacement } from "./placement";

describe("next play", () => {
  it("starts a new grade 1 child one step easier, on add", () => {
    const child = blankChild({ name: "Pal", grade: "1" });
    expect(nextPlacement(child)).toEqual({ game: "add", level: "within5", reason: "start" });
  });

  it("comes back to the weakest skill", () => {
    const child = blankChild({ name: "Pal", grade: "2" });
    child.rounds = 4;
    child.skills = {
      "add:within10": { ok: 2, miss: 6 },
      "time:hour": { ok: 8, miss: 1 },
    };
    const next = nextPlacement(child);
    expect(next).toEqual({ game: "add", level: "within10", reason: "weak" });
  });

  it("steps up when the saved skill is mastered", () => {
    const child = blankChild({ name: "Pal", grade: "1" });
    child.rounds = 3;
    child.levels.times = "twos";
    child.skills = { "times:twos": { ok: 8, miss: 0 } };
    expect(nextPlacement(child)).toEqual({ game: "times", level: "mix", reason: "stretch" });
  });

  it("reviews a mastered skill when there is nowhere higher to go", () => {
    const child = blankChild({ name: "Pal", grade: "3" });
    child.rounds = 6;
    child.levels.times = "toTen";
    child.skills = { "times:toTen": { ok: 10, miss: 1 } };
    expect(nextPlacement(child)).toEqual({ game: "times", level: "toTen", reason: "review" });
  });
});
