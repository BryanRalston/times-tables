import { describe, expect, it } from "vitest";
import { activityById } from "./curriculum";
import { makeQuestion } from "./questions";
import { rngFromSeed } from "./rng";
import type { GraphData } from "./types";
import { cardHeading, leftoverHoldMs, leftoverPanelOpen, leftoverSkipOpen, leftoverWhyMoveMs, splitCounted } from "./leftover";

describe("leftover why-move gates", () => {
  it("hides keypad, Check, and Skip until the known group is taken", () => {
    const waiting = { kind: "tenframe", needsInteract: true, interacted: false, status: "idle" as const };
    expect(leftoverPanelOpen(waiting)).toBe(false);
    expect(leftoverSkipOpen(waiting)).toBe(false);
  });

  it("shows keypad after the why-move, then hides it on a correct Check", () => {
    const ready = { kind: "tenframe", needsInteract: true, interacted: true, status: "idle" as const };
    expect(leftoverPanelOpen(ready)).toBe(true);
    expect(leftoverSkipOpen(ready)).toBe(true);
    const done = { ...ready, status: "correct" as const };
    expect(leftoverPanelOpen(done)).toBe(false);
    expect(leftoverSkipOpen(done)).toBe(false);
  });

  it("holds leftover about two seconds", () => {
    expect(leftoverHoldMs()).toBe(2000);
  });

  it("waits for the take-out why-move before the keypad", () => {
    expect(leftoverWhyMoveMs()).toBeGreaterThanOrEqual(280);
  });

  it("does not hide money or compute keypads", () => {
    const money = { kind: "money", needsInteract: false, interacted: false, status: "idle" as const };
    expect(leftoverPanelOpen(money)).toBe(true);
    expect(leftoverSkipOpen(money)).toBe(true);
  });
});

describe("collect heading", () => {
  it("keeps How many off the card until the tray is sorted", () => {
    const q = makeQuestion(activityById("u1-tally")!.activity, rngFromSeed("tally:head"));
    const d = q.data as GraphData;
    expect(q.prompt).toBe("Sort every picture.");
    expect(q.prompt).not.toMatch(/how many/i);
    expect(cardHeading(q, false)).not.toMatch(/how many|which has/i);
    expect(d.readPrompt?.length).toBeGreaterThan(0);
    expect(cardHeading(q, true)).toBe(d.readPrompt);
  });
});

describe("counted pile", () => {
  it("moves coins to a second row without deleting them, and Clear restores", () => {
    const coins = [{ key: "quarter-0" }, { key: "dime-0" }, { key: "penny-0" }];
    const tapped = splitCounted(coins, { "quarter-0": true });
    expect(tapped.rest.map((c) => c.key)).toEqual(["dime-0", "penny-0"]);
    expect(tapped.pile.map((c) => c.key)).toEqual(["quarter-0"]);
    expect(tapped.rest.length + tapped.pile.length).toBe(coins.length);
    const cleared = splitCounted(coins, {});
    expect(cleared.rest).toEqual(coins);
    expect(cleared.pile).toEqual([]);
  });
});
