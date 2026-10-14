import { afterEach, describe, expect, it } from "vitest";
import { setLocale } from "./i18n";
import { blankChild } from "./storage";
import { weeklyCard } from "./progress-card";

afterEach(() => setLocale("en"));

describe("weekly progress card", () => {
  it("counts the days and minutes in this week", () => {
    const child = blankChild({ id: "maya", name: "Maya" });
    child.streak = 3;
    child.secondsByDay = { "2026-10-05": 60, "2026-10-07": 90, "2026-09-01": 500 };
    child.skills = { "money:count": { ok: 8, miss: 1 } };
    const card = weeklyCard(child, "2026-10-09");
    expect(card.days).toBe(2);
    expect(card.minutesLabel).toBe("2.5m");
    expect(card.streak).toBe(3);
    expect(card.mastered).toBe(1);
    expect(card.line).toBe("Maya practiced 2.5m on 2 days this week.");
  });

  it("names wins, stuck skills, and a calm page to print", () => {
    const child = blankChild({ id: "maya", name: "Maya" });
    child.streak = 3;
    child.secondsByDay = { "2026-10-05": 60, "2026-10-07": 90 };
    child.skills = {
      "money:count": { ok: 8, miss: 1 },
      "time:half": { ok: 1, miss: 4 },
      "sight:first": { ok: 1, miss: 3 },
      "spell:cvc": { ok: 1, miss: 4 },
    };
    const card = weeklyCard(child, "2026-10-09");
    expect(card.headline).toBe("What Maya learned");
    expect(card.dayLines).toHaveLength(7);
    expect(card.dayLines.filter((day) => day.played).map((day) => day.label)).toEqual(["1m", "1.5m"]);
    expect(card.wins).toContain("Count coins");
    expect(card.stuck).toEqual(["CVC words", "Time: half hour", "1st grade words"]);
    expect(card.suggestion).toBe(
      'Maya is still learning CVC words. The free "Spelling" worksheet is a calm one for tonight.',
    );
    expect(card.sheetHref).toContain("worksheets/spelling/?level=cvc");
    expect(card.sheetTitle).toBe("Spelling");
    expect(card.streakNote).toBe("Maya played 3 days in a row.");
    expect(`${card.line} ${card.suggestion} ${card.streakNote}`.toLowerCase()).not.toMatch(
      /fail|broken|behind|shame|struggle|stupid/,
    );
  });

  it("stays kind in Spanish and on an empty week", () => {
    const child = blankChild({ id: "maya", name: "Maya" });
    child.skills = { "money:count": { ok: 1, miss: 4 } };
    setLocale("es");
    const card = weeklyCard(child, "2026-10-09");
    expect(card.headline).toBe("Qué aprendió Maya");
    expect(card.line).toBe("Maya todavía no juega esta semana. Un juego cortito es un buen comienzo.");
    expect(card.deviceNote).toBe("Guardado solo en este aparato.");
    expect(card.suggestion).toContain("Contar monedas");
    expect(card.suggestion).toContain("todavía está aprendiendo");
    expect(card.streakNote).toBe("");
  });
});
