import { afterEach, describe, expect, it } from "vitest";
import { GAMES } from "./games/registry";
import { GRADE_BANDS } from "./grade-map";
import { foldSkillHistory, noteMonthRound, recordRoundHistory, skillTotals } from "./history";
import { skillHistoryReport } from "./history-report";
import { setLocale } from "./i18n";
import { applyRound } from "./rewards";
import { gradeMapStandardCodes, standardForSkill, standardName } from "./standards";
import { parseSave } from "./storage";

afterEach(() => setLocale("en"));

const CALM = /fail|broken|behind|shame|struggle|stupid|weakest|bad at|streak/i;

describe("skill history", () => {
  it("keeps accuracy, rounds, and time for each month", () => {
    const september = recordRoundHistory(
      recordRoundHistory(
        {},
        "2026-09-02",
        [
          { skill: "money:count", tags: [], ok: true },
          { skill: "money:count", tags: [], ok: false },
        ],
        80,
      ),
      "2026-09-18",
      [{ skill: "money:count", tags: [], ok: true }],
      40,
    );
    const october = recordRoundHistory(
      {},
      "2026-10-08",
      [
        { skill: "time:half", tags: ["halfpast"], ok: false },
        { skill: "time:half", tags: ["halfpast"], ok: true },
      ],
      95,
    );
    const history = { ...september, ...october };
    const roundsByMonth = noteMonthRound(noteMonthRound(noteMonthRound({}, "2026-09-02"), "2026-09-18"), "2026-10-08");

    const half = history["2026-10"]?.["time:half"];
    const past = history["2026-10"]?.halfpast;
    expect(half).toEqual({ ok: 1, miss: 1, rounds: 1, seconds: 48 });
    expect(past).toEqual({ ok: 1, miss: 1, rounds: 1, seconds: 47 });
    expect((half?.seconds ?? 0) + (past?.seconds ?? 0)).toBe(95);
    expect(history["2026-09"]?.["money:count"]).toEqual({ ok: 2, miss: 1, rounds: 2, seconds: 120 });

    const report = skillHistoryReport({
      skills: skillTotals(history),
      secondsByDay: { "2026-09-02": 80, "2026-09-18": 40, "2026-10-08": 95 },
      history,
      roundsByMonth,
      foldedMonth: "",
    });
    expect(report.months.map((month) => month.key)).toEqual(["2026-10", "2026-09"]);
    expect(report.foldedNote).toBe("");
    const octoberMonth = report.months[0];
    const halfRow = octoberMonth?.skills.find((row) => row.key === "time:half");
    expect(octoberMonth?.title).toBe("October 2026");
    expect(octoberMonth?.summary).toBe("1.6m · 1 round");
    expect(halfRow).toMatchObject({
      pct: 50,
      attempts: 2,
      rounds: 1,
      seconds: 48,
      standardCode: "1.MD.B.3",
      standardName: "Tell time to the hour and half hour",
    });
    expect(halfRow?.line).toBe("1 round · 0.8m");
    expect(halfRow?.standardLabel).toBe("1.MD.B.3 · Tell time to the hour and half hour");
    const coins = report.months[1]?.skills.find((row) => row.key === "money:count");
    expect(coins).toMatchObject({ pct: 67, rounds: 2, seconds: 120, standardCode: "2.MD.C.8" });
    expect(report.months[1]?.summary).toBe("2m · 2 rounds");
    expect(`${report.months[0]?.summary} ${halfRow?.standardName}`).not.toMatch(CALM);
  });

  it("names a grade-map standard for every level, in Spanish too", () => {
    for (const code of gradeMapStandardCodes()) {
      expect(standardName(code), code).not.toBe("");
    }
    for (const game of GAMES) {
      const codes = new Set(Object.values(GRADE_BANDS[game.id] ?? {}).flatMap((row) => [...row.standards]));
      for (const level of game.levels) {
        const key = game.id === "spelling" ? `spell:${level.id}` : `${game.id}:${level.id}`;
        const named = standardForSkill(key);
        expect(named, key).toBeTruthy();
        expect(codes.has(named!.code), `${key} → ${named!.code}`).toBe(true);
      }
    }
    expect(standardForSkill("add:thousands")?.code).toBe("4.NBT.B.4");
    expect(standardForSkill("fact:7×8")?.code).toBe("3.OA.C.7");
    expect(standardForSkill("table:2")?.code).toBe("2.OA.C.4");
    setLocale("es");
    expect(standardForSkill("time:half")?.name).toBe("Decir la hora en punto y la media");
    expect(standardForSkill("spell:cvc")?.name).toBe("Conocer el sonido de las letras");
    const report = skillHistoryReport({
      skills: { "time:half": { ok: 1, miss: 1 } },
      secondsByDay: { "2026-10-08": 60 },
      history: { "2026-10": { "time:half": { ok: 1, miss: 1, rounds: 1, seconds: 60 } } },
      roundsByMonth: { "2026-10": 1 },
      foldedMonth: "",
    });
    expect(report.months[0]?.title.toLowerCase()).toContain("octubre");
    expect(report.months[0]?.summary).toBe("1m · 1 ronda");
    expect(report.months[0]?.skills[0]?.standardLabel).toContain("Decir la hora en punto y la media");
  });
});

describe("profile migration", () => {
  it("keeps an old profile and files its totals in the latest month", () => {
    const save = parseSave({
      version: 10,
      activeId: "maya",
      lang: "es",
      langChosen: true,
      sound: false,
      children: [
        {
          id: "maya",
          name: "Maya",
          grade: "2",
          stars: 14,
          coins: 9,
          rounds: 6,
          lastPlayed: "2026-10-08",
          words: { "sw:the": { box: 2, ok: 3, miss: 1, streak: 2 } },
          skills: {
            "time:half": { ok: 1, miss: 4 },
            "money:count": { ok: 8, miss: 1 },
            "sight:primer": { ok: 3, miss: 1 },
          },
          secondsByDay: { "2026-09-02": 80, "2026-09-18": 40, "2026-10-08": 100 },
        },
        {
          id: "leo",
          name: "Leo",
          grade: "K",
          stars: 2,
          rounds: 1,
          lastPlayed: "2026-10-01",
          skills: { "count:objects": { ok: 4, miss: 0 } },
          secondsByDay: { "2026-10-01": 30 },
        },
      ],
    });

    expect(save.version).toBe(11);
    expect(save.lang).toBe("es");
    expect(save.sound).toBe(false);
    expect(save.children.map((child) => child.name)).toEqual(["Maya", "Leo"]);

    const maya = save.children[0]!;
    expect(maya.stars).toBe(14);
    expect(maya.coins).toBe(9);
    expect(maya.grade).toBe("2");
    expect(maya.words["sw:the"]).toEqual({ box: 2, ok: 3, miss: 1, streak: 2 });
    expect(maya.skills).toEqual({
      "time:half": { ok: 1, miss: 4 },
      "money:count": { ok: 8, miss: 1 },
      "sight:primer": { ok: 3, miss: 1 },
    });
    expect(maya.secondsByDay).toEqual({ "2026-09-02": 80, "2026-09-18": 40, "2026-10-08": 100 });
    expect(maya.history["2026-10"]).toMatchObject({
      "time:half": { ok: 1, miss: 4, rounds: 0, seconds: 0 },
      "money:count": { ok: 8, miss: 1 },
      "sight:primer": { ok: 3, miss: 1 },
    });
    expect(skillTotals(maya.history)).toEqual(maya.skills);
    expect(maya.roundsByMonth).toEqual({ "2026-10": 6 });
    expect(maya.foldedMonth).toBe("2026-10");

    const report = skillHistoryReport(maya);
    expect(report.months.map((month) => month.key)).toEqual(["2026-10", "2026-09"]);
    expect(report.foldedNote).toContain("October 2026");
    expect(report.foldedNote).not.toMatch(CALM);
    expect(report.months[1]).toMatchObject({ seconds: 120, skills: [], emptyNote: "This month has practice time." });
    const half = report.months[0]?.skills.find((row) => row.key === "time:half");
    expect(half).toMatchObject({ pct: 20, attempts: 5, line: "5 tries", standardCode: "1.MD.B.3" });
    expect(report.months[0]?.summary).toBe("1.7m · 6 rounds");

    const leo = save.children[1]!;
    expect(leo.stars).toBe(2);
    expect(leo.skills["count:objects"]).toEqual({ ok: 4, miss: 0 });
    expect(leo.history["2026-10"]?.["count:objects"]).toMatchObject({ ok: 4, miss: 0 });
    expect(leo.foldedMonth).toBe("");
    expect(skillHistoryReport(leo).foldedNote).toBe("");
    expect(skillHistoryReport(leo).months[0]?.skills[0]).toMatchObject({
      pct: 100,
      standardCode: "K.CC.A.1",
    });

    const next = applyRound(
      maya,
      {
        game: "time",
        correct: 1,
        total: 1,
        seconds: 30,
        answers: [{ skill: "time:half", tags: [], ok: true }],
      },
      "2026-10-21",
    );
    expect(next.skills["time:half"]).toEqual({ ok: 2, miss: 4 });
    expect(next.skills["money:count"]).toEqual({ ok: 8, miss: 1 });
    expect(next.history["2026-10"]?.["time:half"]).toEqual({ ok: 2, miss: 4, rounds: 1, seconds: 30 });
    expect(next.history["2026-10"]?.["money:count"]).toEqual({ ok: 8, miss: 1, rounds: 0, seconds: 0 });
    expect(next.secondsByDay["2026-09-02"]).toBe(80);
    expect(next.secondsByDay["2026-10-21"]).toBe(30);
    expect(next.roundsByMonth["2026-10"]).toBe(7);
    expect(next.stars).toBe(17);
  });

  it("leaves a child with no dated practice on the saved list", () => {
    const folded = foldSkillHistory({
      skills: { "phonics:begin": { ok: 2, miss: 2 } },
      secondsByDay: {},
      lastPlayed: null,
      rounds: 3,
    });
    expect(folded.history).toEqual({});
    expect(folded.foldedMonth).toBe("");
    const report = skillHistoryReport({
      skills: { "phonics:begin": { ok: 2, miss: 2 } },
      secondsByDay: {},
      history: {},
      roundsByMonth: {},
      foldedMonth: "",
    });
    expect(report.months).toHaveLength(1);
    expect(report.months[0]).toMatchObject({
      key: "saved",
      title: "Saved practice",
    });
    expect(report.months[0]?.skills[0]).toMatchObject({
      key: "phonics:begin",
      pct: 50,
      attempts: 4,
      standardCode: "RF.K.3.A",
    });
  });
});
