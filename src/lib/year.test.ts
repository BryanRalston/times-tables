import { describe, expect, it } from "vitest";
import { SCHOOL_DAYS, isSchoolDay, prevSchoolDay, weekdayName } from "./calendar";
import { GRADE3_SOLS, UNITS, WELCOME_ACTIVITY, activityById, coversSol, fluencyFactorsForUnit, suggestedUnitId, unitById } from "./curriculum";
import { makeDailyWalk } from "./daily";
import { parseHash } from "./nav";
import { isUnitOpen, unitStatus } from "./path";
import { UI } from "./i18n";
import { makeActivityRound, makeQuestion, makeWelcomeRound, placeOnGraph, welcomeFirst, wordForm } from "./questions";
import type { GraphData, MeasureData, MoneyData, PlaceValueData } from "./types";
import { moneyFmt } from "./utils";
import { rngFromSeed } from "./rng";
import { schoolStreak } from "./streak";
import { answersMatch } from "./utils";

describe("calendar", () => {
  it("has 180 school days", () => {
    expect(SCHOOL_DAYS).toHaveLength(180);
    expect(SCHOOL_DAYS[0]).toBe("2026-08-17");
    expect(SCHOOL_DAYS[179]).toBe("2027-06-11");
  });

  it("skips weekends and holidays", () => {
    expect(isSchoolDay("2026-09-05")).toBe(false);
    expect(isSchoolDay("2026-09-07")).toBe(false);
    expect(isSchoolDay("2026-09-08")).toBe(true);
  });

  it("walks school days backward", () => {
    expect(prevSchoolDay(SCHOOL_DAYS[0]!)).toBeNull();
    expect(prevSchoolDay(SCHOOL_DAYS[1]!)).toBe(SCHOOL_DAYS[0]);
  });
});

describe("curriculum", () => {
  it("opens unit 1 before the year and follows the calendar", () => {
    expect(suggestedUnitId("2026-08-01")).toBe("u1");
    expect(suggestedUnitId("2026-08-17")).toBe("u1");
    expect(unitById(suggestedUnitId("2026-12-01"))?.quarter).toBe(2);
  });

  it("does not jump to the last unit on a Saturday", () => {
    expect(suggestedUnitId("2026-09-19")).toBe(suggestedUnitId("2026-09-18"));
  });

  it("class unit wins", () => {
    expect(suggestedUnitId("2026-08-17", "u9")).toBe("u9");
  });

  it("matches the LCPS yearly overview units", () => {
    expect(UNITS[0]?.title).toMatch(/Data Cycle/i);
    expect(UNITS[1]?.title).toMatch(/Place Value/i);
    expect(UNITS[2]?.title).toMatch(/Making Meaning with Models/i);
    expect(UNITS[3]?.title).toMatch(/Geometry/i);
    expect(UNITS[4]?.title).toMatch(/Fraction Understanding Part 1/i);
    expect(UNITS[5]?.title).toMatch(/Foundational Facts/i);
    expect(UNITS[6]?.title).toMatch(/Analyzing My World/i);
    expect(UNITS[7]?.title).toMatch(/Measurement, Perimeter, and Area/i);
    expect(UNITS[8]?.title).toMatch(/Building on Foundational Facts/i);
    expect(UNITS[9]?.title).toMatch(/Fractions Part 2/i);
    expect(UNITS[10]?.title).toMatch(/Time and Money/i);
    expect(UNITS[11]?.title).toMatch(/Develop Fluency/i);
    expect(UNITS[12]?.title).toMatch(/Digging Deeper/i);
  });

  it("covers every Grade 3 SOL in the overview", () => {
    for (const code of GRADE3_SOLS) {
      expect(coversSol(code), code).toBe(true);
    }
  });

  it("tags measurement 3.MG.1 on Unit 8 and time 3.MG.3 on Unit 11", () => {
    expect(UNITS[7]?.sol).toEqual(expect.arrayContaining(["3.MG.1", "3.MG.2"]));
    expect(UNITS[10]?.sol).toEqual(expect.arrayContaining(["3.MG.3", "3.NS.4"]));
    expect(UNITS[10]?.sol.join()).not.toMatch(/3\.MG\.1/);
    expect(UNITS[6]?.sol).toEqual(expect.arrayContaining(["3.PFA.1"]));
  });

  it("includes 6s and 7s in Unit 12 fluency", () => {
    const factors = fluencyFactorsForUnit("u12");
    expect(factors).toEqual(expect.arrayContaining([6, 7]));
    const six = UNITS[11]?.activities.find((a) => a.id === "u12-six");
    expect(six?.params?.factors).toEqual(expect.arrayContaining([6, 7]));
  });
});

describe("welcome leftover", () => {
  it("starts on 6 + n = 10", () => {
    const q = welcomeFirst(rngFromSeed(1));
    expect(q.prompt).toBe("6 + n = 10");
    expect(q.answer).toBe("4");
    expect(q.kind).toBe("tenframe");
    expect(q.needsInteract).toBe(true);
  });

  it("is a short leftover run", () => {
    const round = makeWelcomeRound(rngFromSeed(7));
    expect(round).toHaveLength(4);
    expect(round[0]?.prompt).toBe("6 + n = 10");
    expect(WELCOME_ACTIVITY.rounds).toBe(4);
  });
});

describe("daily walk", () => {
  it("weekday is 8–12 current plus 3–5 review", () => {
    const w = makeDailyWalk({ date: "2026-09-15" });
    expect(weekdayName("2026-09-15")).toBe("Tuesday");
    expect(w.isSchoolDay).toBe(true);
    expect(w.isFriday).toBe(false);
    const fresh = w.items.filter((q) => q.source === "fresh").length;
    const review = w.items.filter((q) => q.source === "review").length;
    const fluency = w.items.filter((q) => q.source === "fluency").length;
    expect(fresh + fluency).toBeGreaterThanOrEqual(8);
    expect(fresh + fluency).toBeLessThanOrEqual(12);
    expect(review).toBeGreaterThanOrEqual(3);
    expect(review).toBeLessThanOrEqual(5);
    expect(fluency).toBe(2);
    expect(w.fresh).toBe(fresh);
    expect(w.review).toBe(review);
  });

  it("every activity can mint a question", () => {
    const rng = rngFromSeed(42);
    for (const unit of UNITS) {
      for (const activity of unit.activities) {
        const q = makeQuestion(activity, rng);
        expect(q.answer.length).toBeGreaterThan(0);
        expect(q.prompt.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("answers", () => {
  it("matches leftover, money, and time", () => {
    expect(answersMatch("4", "4")).toBe(true);
    expect(answersMatch("4/8", "4/8", ["4"])).toBe(true);
    expect(answersMatch("4", "4/8", ["4"])).toBe(true);
    expect(answersMatch("5", "4")).toBe(false);
    expect(answersMatch("$1.00", "100", ["$1.00"])).toBe(true);
    expect(answersMatch("3:05", "3:5")).toBe(true);
  });
});

describe("streak", () => {
  it("counts consecutive completed school days and ignores an unfinished today", () => {
    const sessions = {
      "2026-09-14": {
        date: "2026-09-14",
        unitId: "u1",
        schoolDay: 1,
        correct: 8,
        total: 12,
        fresh: 8,
        review: 4,
        completed: true,
      },
    };
    expect(schoolStreak(sessions, "2026-09-15")).toBe(1);
    expect(schoolStreak({}, "2026-09-15")).toBe(0);
  });
});

describe("nav", () => {
  it("parses hash routes", () => {
    expect(parseHash("")).toEqual({ id: "home" });
    expect(parseHash("#/play/welcome")).toEqual({ id: "play", kind: "welcome" });
    expect(parseHash("#/play/daily")).toEqual({ id: "play", kind: "daily" });
    expect(parseHash("#/play/activity/u3-groups")).toEqual({ id: "play", kind: "activity", activityId: "u3-groups" });
    expect(parseHash("#/unit/u2")).toEqual({ id: "unit", unitId: "u2" });
    expect(parseHash("#/grownup")).toEqual({ id: "grownup" });
    expect(parseHash("#/lessons")).toEqual({ id: "lessons" });
    expect(parseHash("#/shelf")).toEqual({ id: "shelf" });
    expect(parseHash("#/play/activity/u1-pictograph")).toEqual({
      id: "play",
      kind: "activity",
      activityId: "u1-graph",
    });
  });
});

describe("principal holes", () => {
  it("word form uses six-digit numbers ≥ 100,000", () => {
    expect(wordForm(165724)).toBe("one hundred sixty-five thousand seven hundred twenty-four");
    const found = activityById("u2-word")!;
    for (let i = 0; i < 8; i++) {
      const q = makeQuestion(found.activity, rngFromSeed(20 + i));
      const n = (q.data as PlaceValueData).number;
      expect(n).toBeGreaterThanOrEqual(100000);
    }
  });

  it("money make-mode exists", () => {
    const found = activityById("u11-make")!;
    const q = makeQuestion(found.activity, rngFromSeed(3));
    expect((q.data as MoneyData).mode).toBe("make");
    expect(Number(q.answer)).toBeGreaterThan(0);
    expect((q.data as MoneyData).target).toBe(Number(q.answer));
  });

  it("measure items have a numeric reading", () => {
    for (const id of ["u8-length", "u8-mass", "u8-volume", "u13-measure"]) {
      const q = makeQuestion(activityById(id)!.activity, rngFromSeed(5));
      const d = q.data as MeasureData;
      expect(d.value).toBeGreaterThan(0);
      expect(d.unit.length).toBeGreaterThan(0);
      expect(Number(q.answer)).toBeGreaterThan(0);
    }
  });

  it("data cycle mutates a graph", () => {
    const q = makeQuestion(activityById("u1-tally")!.activity, rngFromSeed(2));
    const d = q.data as GraphData;
    expect(d.collect).toBe(true);
    expect(d.tray?.length).toBeGreaterThan(0);
    expect(d.rows.every((r) => r.value === 0)).toBe(true);
    const first = d.tray![0]!;
    const counts = Object.fromEntries(d.rows.map((r) => [r.label, 0]));
    const next = placeOnGraph(d.tray!, counts, first.id, first.label);
    expect(next.tray.length).toBe(d.tray!.length - 1);
    expect(next.counts[first.label]).toBe(1);
    expect(q.needsInteract).toBe(true);
    expect(d.readPrompt?.length).toBeGreaterThan(0);
  });

  it("collect graphs require sorting before the read", () => {
    for (const id of ["u1-tally", "u6-picto", "u7-bar"]) {
      for (let i = 0; i < 12; i++) {
        const q = makeQuestion(activityById(id)!.activity, rngFromSeed(`col:${id}:${i}`));
        const d = q.data as GraphData;
        expect(q.needsInteract, id).toBe(true);
        expect(d.collect).toBe(true);
        expect(d.tray?.length).toBeGreaterThan(0);
        expect(d.readPrompt?.length).toBeGreaterThan(0);
        expect(q.prompt).not.toMatch(/how many|cu[aá]ntos|quantos/i);
        if (d.ask === "greatest" || d.ask === "least") {
          expect(q.choices ?? []).toContain(q.answer);
        }
      }
    }
  });

  it("count money does not spoil the total", () => {
    const found = activityById("u1-coins")!;
    for (let i = 0; i < 6; i++) {
      const q = makeQuestion(found.activity, rngFromSeed(11 + i));
      const d = q.data as MoneyData;
      expect(d.mode).toBe("count");
      const cents = Object.entries(d.coins).reduce((n, [id, c]) => {
        const v = id === "penny" ? 1 : id === "nickel" ? 5 : id === "dime" ? 10 : id === "quarter" ? 25 : id === "dollar" ? 100 : 500;
        return n + v * (c ?? 0);
      }, 0);
      expect(q.prompt).toBe("How many cents?");
      expect(d.coins.dollar).toBeFalsy();
      expect(d.coins.five).toBeFalsy();
      expect(q.prompt).not.toContain(String(cents));
      expect(q.prompt).not.toContain(moneyFmt(cents));
    }
  });

  it("howManyCents is never used when a bill is in the bag", () => {
    for (const id of ["u1-coins", "u11-count"]) {
      for (let i = 0; i < 40; i++) {
        const q = makeQuestion(activityById(id)!.activity, rngFromSeed(`bill:${id}:${i}`));
        const d = q.data as MoneyData;
        const hasBill = Boolean(d.coins.dollar || d.coins.five);
        if (id === "u1-coins") expect(hasBill).toBe(false);
        if (hasBill) expect(q.prompt).toBe("How much money?");
        else expect(q.prompt).toBe("How many cents?");
        expect(q.prompt).not.toMatch(/\$\d+\.\d{2}/);
      }
    }
  });
});

describe("locale", () => {
  it("chrome strings cover English, Spanish, and Portuguese", () => {
    expect(UI.en.home).toBe("Home");
    expect(UI.es.home).toBe("Inicio");
    expect(UI["pt-BR"].home).toBe("Início");
    expect(UI.es.lessons).toBe("Lecciones");
    expect(UI["pt-BR"].lessons).toBe("Lições");
    expect(UI.es.shelf).toBe("Estante");
    expect(UI.es.check).toBe("Comprobar");
    expect(UI["pt-BR"].check).toBe("Conferir");
    expect(UI.es.yourAnswer).toBe("Tu respuesta");
    expect(UI["pt-BR"].yourAnswer).toBe("Sua resposta");
    expect(UI.en.undo).toBe("Undo");
    expect(UI.es.undo).toBe("Deshacer");
    expect(UI.en.grownupPoints.length).toBeGreaterThanOrEqual(5);
    expect(UI.en.grownupBlurb).toMatch(/Grade 4/);
    expect(UI.en.grownupBlurb).toMatch(/Nothing leaves/i);
    expect(UI.en.pathGrade4).toBe("Advanced (Grade 4) — preview");
    expect(UI.es.pathGrade4).toBe("Avanzado (4.º) — vista previa");
    expect(UI["pt-BR"].pathGrade4).toBe("Avançado (4.º) — prévia");
    expect(UI.en.preview).toBe("Preview");
    expect(UI.en.grownupPoints.some((p) => /VDOE Grade 4 strands/.test(p))).toBe(true);
    expect(UI.en.grownupPoints.some((p) => /LCPS 2026–27 year map/.test(p))).toBe(true);
  });

  it("spanish word story is actually Spanish", () => {
    const q = makeQuestion(activityById("u7-add")!.activity, rngFromSeed(4), "es");
    expect(q.prompt).toMatch(/tiene|cuántos|bolsas|paquetes|ve /i);
    expect(q.prompt).not.toMatch(/\bhas \d+ (apples|stickers|marbles)\b/i);
    expect(q.prompt).not.toMatch(/Take the dots/);
    expect(q.hint ?? "").not.toMatch(/Take the dots/);
  });
});

describe("geometry", () => {
  it("name-the-shape always offers the true name and matches the pictured sides", () => {
    const found = activityById("u4-name")!;
    for (let i = 0; i < 40; i++) {
      const q = makeQuestion(found.activity, rngFromSeed(`shape:${i}`));
      const d = q.data as { shape?: string; sides?: number };
      expect(q.choices ?? []).toContain(q.answer);
      expect(q.choices).toHaveLength(4);
      const sides = d.sides ?? 0;
      const names: Record<number, string> = {
        3: "triangle",
        4: "quadrilateral",
        5: "pentagon",
        6: "hexagon",
        8: "octagon",
      };
      expect(d.shape).toBe(names[sides]);
      expect(q.answer).toBe(names[sides]);
    }
  });

  it("combine pictures match the named result", () => {
    const found = activityById("u4-combine")!;
    for (let i = 0; i < 20; i++) {
      const q = makeQuestion(found.activity, rngFromSeed(`join:${i}`));
      const d = q.data as { parts?: string[]; result?: string; sides?: number };
      expect(q.choices ?? []).toContain(q.answer);
      expect(d.parts).toHaveLength(2);
      expect(q.answer).toBe(d.result);
      if (d.result === "quadrilateral") expect(d.parts).toEqual(["triangle", "triangle"]);
      if (d.result === "pentagon") expect(d.parts).toEqual(["triangle", "quadrilateral"]);
      if (d.result === "hexagon") {
        expect([
          ["quadrilateral", "quadrilateral"],
          ["triangle", "pentagon"],
        ]).toContainEqual(d.parts);
      }
    }
  });
});

describe("shuffle", () => {
  it("two attempts of the same activity yield different prompts", () => {
    const found = activityById("u2-place");
    expect(found).toBeTruthy();
    const r1 = makeActivityRound(found!.activity, rngFromSeed("kid-a:u2-place:1"));
    const r2 = makeActivityRound(found!.activity, rngFromSeed("kid-a:u2-place:2"));
    expect(r1.map((q) => q.prompt).join("|")).not.toBe(r2.map((q) => q.prompt).join("|"));
    for (const q of [...r1, ...r2]) {
      expect(answersMatch(q.answer, q.answer, q.alts)).toBe(true);
      expect(q.answer.length).toBeGreaterThan(0);
    }
  });

  it("two learners get different daily walks on the same date", () => {
    const a = makeDailyWalk({ date: "2026-09-15", learnerId: "maya", attempt: 1 });
    const b = makeDailyWalk({ date: "2026-09-15", learnerId: "leo", attempt: 1 });
    expect(a.items.map((q) => q.prompt).join("|")).not.toBe(b.items.map((q) => q.prompt).join("|"));
  });
});

describe("path", () => {
  it("never locks a unit — calendar only marks now", () => {
    const later = UNITS.find((u) => u.id === "u11")!;
    expect(unitStatus(later, "u1")).toBe("open");
    expect(unitStatus(UNITS[0]!, "u1")).toBe("now");
    expect(isUnitOpen(later, "u1")).toBe(true);
  });
});
