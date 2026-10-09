import { describe, expect, it } from "vitest";
import { blankChild } from "./storage";
import { weeklyCard } from "./progress-card";

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
});
