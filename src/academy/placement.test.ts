import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { noteMark, skillKeyForLevel } from "./adapt";
import { playWindow } from "./grade-map";
import { gameById } from "./games/registry";
import { makeClockTask } from "./hands";
import { setLocale } from "./i18n";
import { cardsThisRound, type Child, type Grade } from "./model";
import { makeTimeQuestion } from "./questions";
import { practiceTip } from "./family-report";
import { withLevel, blankChild } from "./storage";
import { nextPlacement, todayPlayLine, type Placement } from "./placement";

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
    const child = blankChild({ name: "Pal", grade: "2" });
    child.rounds = 3;
    child.levels.add = "within20";
    child.skills = { "add:within20": { ok: 8, miss: 0 } };
    expect(nextPlacement(child)).toEqual({ game: "add", level: "tens", reason: "stretch" });
  });

  it("reviews a mastered skill when there is nowhere higher to go", () => {
    const child = blankChild({ name: "Pal", grade: "3" });
    child.rounds = 6;
    child.levels.times = "toTen";
    child.skills = { "times:toTen": { ok: 10, miss: 1 } };
    expect(nextPlacement(child)).toEqual({ game: "times", level: "toTen", reason: "review" });
  });

  it("gives a fresh kindergartner and a third grader different first plays", () => {
    const kindergarten = nextPlacement(blankChild({ name: "Ada", grade: "K" }));
    const third = nextPlacement(blankChild({ name: "Bea", grade: "3" }));
    expect(kindergarten).toEqual({ game: "add", level: "within5", reason: "start" });
    expect(third).toEqual({ game: "add", level: "tens", reason: "start" });
    expect(nextPlacement(blankChild({ name: "Cam", grade: "PK" }))).toEqual({
      game: "count",
      level: "objects",
      reason: "start",
    });
  });

  it("walks five Play taps into different grade-appropriate items", () => {
    const kindergarten = playFive("K");
    const third = playFive("3");
    expect(kindergarten.map(stepLabel)).toEqual([
      "add:within5",
      "add:within10",
      "add:within20",
      "add:within5",
      "add:within10",
    ]);
    expect(third.map(stepLabel)).toEqual([
      "add:tens",
      "add:within100",
      "add:within1000",
      "add:tens",
      "add:within100",
    ]);
    for (const grade of ["K", "3"] as const) {
      const steps = grade === "K" ? kindergarten : third;
      for (const step of steps) {
        const game = gameById(step.game);
        expect(game).toBeTruthy();
        const allowed = playWindow(
          game!.levels.map((level) => level.id),
          step.game,
          grade,
          false,
        );
        expect(allowed.ids).toContain(step.level);
      }
    }
  });

  it("brings quarter past back in the next round and the tonight tip", () => {
    const child = blankChild({ name: "Maya", grade: "2" });
    child.rounds = 3;
    child.levels.time = "quarter";
    child.skills = {
      "time:quarter": { ok: 8, miss: 1 },
      quarterpast: { ok: 0, miss: 4 },
    };
    expect(nextPlacement(child)).toEqual({ game: "time", level: "quarter", reason: "weak" });
    const question = makeTimeQuestion(rngFromSeed("quarter-past"), "quarter", ["quarterpast"]);
    expect(question.visual.kind).toBe("time");
    if (question.visual.kind === "time") expect(question.visual.minutes).toBe(15);
    expect(question.tags).toContain("quarterpast");
    const clock = makeClockTask("quarter", rngFromSeed("clock-past"), undefined, ["quarterpast"]);
    expect(clock.minutes).toBe(15);
    const tip = practiceTip("Maya", child.skills);
    expect(tip.text).toContain("Quarter past");
    expect(tip.sheetSlug).toBe("telling-time-quarter-hour");
    expect(tip.text).not.toMatch(/fail|broken|behind|shame|struggle|stupid|weakest|bad at/i);
  });

  it("names today's game on the Play button in English and Spanish", () => {
    expect(todayPlayLine("Telling Time", "2")).toBe("Today: Telling Time · Gr 2");
    setLocale("es");
    expect(todayPlayLine("La hora", "K")).toBe("Hoy: La hora · Kínder");
    setLocale("en");
    const home = readFileSync(new URL("./ui/home.tsx", import.meta.url), "utf8");
    expect(home).toContain("todayPlayLine");
    expect(home).toContain("ac-play-main");
    expect(home).not.toContain("ac-today-note");
    expect(home).not.toMatch(/quiz|placement test/i);
  });

  it("keeps the first round short and later rounds at the grade length", () => {
    expect(cardsThisRound("3", 0, false)).toBe(6);
    expect(cardsThisRound("K", 0, false)).toBe(6);
    expect(cardsThisRound("3", 1, false)).toBe(10);
    expect(cardsThisRound("PK", 4, false)).toBe(6);
    expect(cardsThisRound("K", 0, true)).toBe(5);
  });
});

function stepLabel(step: Placement): string {
  return `${step.game}:${step.level}`;
}

function playFive(grade: Grade): Placement[] {
  let child: Child = blankChild({ name: "Pal", grade });
  const steps: Placement[] = [];
  for (let i = 0; i < 5; i++) {
    const next = nextPlacement(child);
    steps.push(next);
    child = withLevel(child, next.game, next.level);
    const skills = { ...child.skills };
    const key = skillKeyForLevel(next.game, next.level);
    for (let n = 0; n < 8; n++) noteMark(skills, { skill: key, tags: [], ok: true });
    child = { ...child, skills, rounds: child.rounds + 1 };
  }
  return steps;
}
