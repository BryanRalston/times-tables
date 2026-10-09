import { describe, expect, it } from "vitest";
import type { Child, RoundResult } from "../model";
import { applyRound } from "../rewards";
import { blankChild, parseSave, SAVE_VERSION } from "../storage";
import { bookEntries, catchphrase, findBlurb } from "./cast";
import { EGG_IDS, hatchPick } from "./egg";
import { hostIdFor } from "./hosts";
import { bubbleText, buddyMotion, buddyReaction } from "./react";
import { storyLine } from "./story";
import { openEgg, palOwned, withBuddy } from "./unlock";

function child(partial: Partial<Child> = {}): Child {
  return { ...blankChild({ id: "kid", name: "Maya", grade: "1" }), ...partial };
}

function round(partial: Partial<RoundResult> = {}): RoundResult {
  return {
    game: "times",
    correct: 10,
    total: 10,
    seconds: 40,
    answers: [],
    ...partial,
  };
}

describe("squishee unlocks", () => {
  it("starts with three buddies and befriends an island host only after a boss win", () => {
    const fresh = child();
    expect(palOwned(fresh, "peach")).toBe(true);
    expect(palOwned(fresh, "frog")).toBe(true);
    expect(palOwned(fresh, "bunny")).toBe(true);
    expect(palOwned(fresh, hostIdFor("times"))).toBe(false);
    expect(withBuddy(fresh, hostIdFor("times")).avatarId).toBe("peach");

    const missed = applyRound(fresh, round({ correct: 1, total: 5, boss: true }), "2026-10-09");
    expect(missed.friends).toEqual([]);
    expect(palOwned(missed, hostIdFor("times"))).toBe(false);

    const won = applyRound(fresh, round({ correct: 4, total: 5, boss: true }), "2026-10-09");
    expect(won.friends).toContain(hostIdFor("times"));
    expect(palOwned(won, "panda")).toBe(true);
    expect(withBuddy(won, "panda").avatarId).toBe("panda");
    expect(findBlurb("panda").kind).toBe("boss");
    expect(findBlurb("peach").text).toContain("start");
  });

  it("hatches one unowned squishee after the daily goal, and not twice", () => {
    const today = "2026-10-09";
    let row = child();
    row = applyRound(row, round(), today);
    row = applyRound(row, round(), today);
    expect(row.egg).toBe("none");
    row = applyRound(row, round(), today);
    expect(row.egg).toBe("closed");
    expect(openEgg(row, "2026-10-08")).toBe(row);

    const pick = hatchPick(today, []);
    expect(EGG_IDS).toContain(pick);
    expect(hatchPick(today, [])).toBe(pick);

    const opened = openEgg(row, today);
    expect(opened.egg).toBe("open");
    expect(opened.hatched).toEqual([pick]);
    expect(palOwned(opened, pick!)).toBe(true);
    expect(openEgg(opened, today)).toBe(opened);

    const tomorrow = applyRound(opened, round(), "2026-10-10");
    expect(tomorrow.egg).toBe("none");
    expect(tomorrow.hatched).toEqual(opened.hatched);
  });

  it("tells a short story with named squishees and keeps lines kid-sized", () => {
    const line = storyLine({ kind: "times", a: 3, b: 4, hidden: 12, solved: "3 × 4 = 12" }, "peach", "panda");
    expect(line).toContain("3 groups of 4 squishees");
    expect(line).toContain("Panda");
    const book = bookEntries();
    expect(book.length).toBeGreaterThan(24);
    for (const entry of book) {
      expect(entry.line.length).toBeGreaterThan(3);
      expect(entry.line.length).toBeLessThan(42);
      expect(entry.find.length).toBeGreaterThan(8);
    }
    expect(catchphrase("crystal-axolotl").length).toBeLessThan(42);
    expect(findBlurb("crystal-axolotl").kind).toBe("egg");
  });
});

describe("buddy reactions", () => {
  it("cheers a correct answer, points at a miss, and dances for 3 stars", () => {
    expect(buddyReaction({ phase: "ask", ok: false, stars: 1, hintOn: false })).toEqual({
      mood: "idle",
      point: null,
      line: "ready",
    });
    expect(buddyReaction({ phase: "ask", ok: false, stars: 1, hintOn: true })).toEqual({
      mood: "hint",
      point: "hint",
      line: "hint",
    });
    expect(buddyReaction({ phase: "feedback", ok: true, stars: 2, hintOn: false })).toEqual({
      mood: "cheer",
      point: null,
      line: "cheer",
    });
    expect(buddyReaction({ phase: "teach", ok: false, stars: 1, hintOn: false })).toEqual({
      mood: "oops",
      point: "example",
      line: "miss",
    });
    expect(buddyReaction({ phase: "done", ok: true, stars: 3, hintOn: false })).toEqual({
      mood: "dance",
      point: null,
      line: "dance",
    });
    expect(buddyReaction({ phase: "done", ok: true, stars: 2, hintOn: false }).mood).toBe("cheer");
    expect(bubbleText("miss", "Hop!")).toBe("Let's look together.");
    expect(bubbleText("cheer", "Hop!")).toBe("Hop!");
    expect(bubbleText("ready", "Hop!")).toBe("");
    expect(buddyMotion(true)).toBe("reduce");
    expect(buddyMotion(false)).toBe("ok");
  });
});

describe("buddy save migration", () => {
  it("bumps a version 4 save and keeps word cards, bosses, and a closed egg", () => {
    const save = parseSave({
      version: 4,
      activeId: "maya",
      sound: true,
      children: [
        {
          id: "maya",
          name: "Maya",
          grade: "2",
          avatarId: "frog",
          stars: 4,
          words: { "sw:the": { box: 1, ok: 2, miss: 0, streak: 2 } },
          journey: { areaId: "add", stop: 1, bosses: ["times"] },
          dailyDate: "2026-10-09",
          dailyRounds: 3,
          dailyGift: "closed",
        },
      ],
    });
    expect(save.version).toBe(SAVE_VERSION);
    expect(SAVE_VERSION).toBe(5);
    const maya = save.children[0];
    expect(maya?.words["sw:the"]).toEqual({ box: 1, ok: 2, miss: 0, streak: 2 });
    expect(maya?.journey.bosses).toEqual(["times"]);
    expect(maya?.friends).toContain("panda");
    expect(maya?.hatched).toEqual([]);
    expect(maya?.egg).toBe("closed");
    expect(maya?.avatarId).toBe("frog");
    expect(palOwned(maya!, "panda")).toBe(true);
  });
});
