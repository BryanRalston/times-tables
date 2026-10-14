import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { gameAccuracy, practiceTip } from "./family-report";
import { GAMES } from "./games/registry";
import { setLocale } from "./i18n";
import { ES } from "./i18n-es";
import { familyBrief } from "./progress-card";
import { WORKSHEETS } from "./seo/catalog";
import { sheetForSkill } from "./sheet-match";
import { blankChild } from "./storage";

afterEach(() => setLocale("en"));

const CALM = /fail|broken|behind|shame|struggle|stupid|weakest|bad at/i;

describe("grown-ups report", () => {
  it("keeps the kid gate, backup, and install tip", () => {
    const ui = readFileSync(new URL("./ui/grownups.tsx", import.meta.url), "utf8");
    expect(ui).toContain("GROWNUP_HOLD_MS");
    expect(ui).toContain("gateAnswerMatches");
    expect(ui).toContain("Press and hold");
    expect(ui).toContain("BackupPanel");
    expect(ui).toContain("InstallTip");
    expect(ui).toContain("Print this week");
  });

  it("covers math and reading games with a worksheet that exists", () => {
    const slugs = new Set(WORKSHEETS.map((sheet) => sheet.slug));
    for (const game of GAMES) {
      for (const row of [...game.bars, ...game.chips]) {
        const match = sheetForSkill(row.key);
        expect(match, row.key).toBeTruthy();
        const known = slugs.has(match!.slug) || match!.slug === game.sheetSlug;
        expect(known, `${row.key} -> ${match!.slug}`).toBe(true);
        if (match!.query.startsWith("?level=")) {
          expect(game.isLevel(match!.query.slice("?level=".length)), row.key).toBe(true);
        }
      }
    }
  });

  it("picks the weakest skill across clocks, coins, words, spelling, and adding", () => {
    expect(practiceTip("Maya", { "time:half": { ok: 0, miss: 4 } })).toMatchObject({
      text: 'Maya is still learning Time: half hour. The free "Telling time to the half hour" worksheet is a calm one for tonight.',
      sheetSlug: "telling-time-half-hour",
      factor: null,
    });
    expect(practiceTip("Luis", { "money:count": { ok: 1, miss: 4 } }).sheetSlug).toBe("counting-coins");
    expect(practiceTip("Ana", { "sight:preprimer": { ok: 0, miss: 3 } })).toMatchObject({
      sheetSlug: "sight-words",
      sheetQuery: "?level=preprimer",
    });
    expect(practiceTip("Noah", { "spell:blends": { ok: 1, miss: 3 } })).toMatchObject({
      sheetSlug: "spelling",
      sheetQuery: "?level=blends",
    });
    expect(practiceTip("Maya", { "add:within20": { ok: 2, miss: 5 } }).sheetSlug).toBe("addition-within-20");
    const clock = practiceTip("Maya", {
      "time:quarter": { ok: 0, miss: 5 },
      "fact:2×5": { ok: 8, miss: 1 },
    });
    expect(clock.sheetSlug).toBe("telling-time-quarter-hour");
    expect(clock.text).not.toMatch(CALM);
    expect(sheetForSkill("phonics:begin")?.slug).toBe("phonics-beginning-sounds");
    expect(sheetForSkill("phonics:rhyme")).toMatchObject({ slug: "phonics", query: "?level=rhyme" });
    expect(sheetForSkill("phonics:cvc")).toMatchObject({ slug: "phonics", query: "?level=cvc" });
    setLocale("es");
    const both = practiceTip("Maya", {
      "fact:7×8": { ok: 0, miss: 3 },
      "fact:6×7": { ok: 1, miss: 2 },
    });
    expect(both.text).toContain("7×8 y 6×7");
    expect(both.text).not.toContain(" and ");
    setLocale("en");
  });

  it("shows accuracy for every played game, including reading", () => {
    const skills: Record<string, { ok: number; miss: number }> = {};
    for (const game of GAMES) {
      const key = game.bars[0]?.key;
      expect(key).toBeTruthy();
      skills[key!] = { ok: 3, miss: 1 };
    }
    const games = gameAccuracy(skills);
    expect(games.map((game) => game.id).sort()).toEqual(GAMES.map((game) => game.id).sort());
    const sight = games.find((game) => game.id === "sight");
    const spelling = games.find((game) => game.id === "spelling");
    expect(sight?.pct).toBe(75);
    expect(spelling?.skills[0]?.key).toBe("spell:cvc");
    expect(spelling?.title).toBe("Spelling");
  });

  it("gives a parent the week, the games, and one Spanish next step", () => {
    const child = blankChild({ id: "maya", name: "Maya", grade: "1" });
    child.secondsByDay = { "2026-10-06": 120 };
    child.skills = {
      "sight:primer": { ok: 1, miss: 4 },
      "phonics:begin": { ok: 4, miss: 1 },
    };
    setLocale("es");
    const report = familyBrief(child, "2026-10-09");
    expect(report.card.dayLines.filter((day) => day.played)).toHaveLength(1);
    expect(report.games.map((game) => game.id).sort()).toEqual(["phonics", "sight"]);
    expect(report.card.suggestion).toContain("Palabras de inicio");
    expect(report.card.suggestion).toContain("Palabras frecuentes");
    expect(report.card.sheetHref).toContain("worksheets/sight-words/?level=primer");
    for (const line of [report.card.line, report.card.suggestion, report.card.deviceNote]) {
      expect(line).not.toMatch(CALM);
    }
    for (const key of ["Going well", "Still learning", "Tonight", "By game", "Print this week", "No practice"]) {
      expect(ES[key]?.length).toBeGreaterThan(0);
    }
  });
});