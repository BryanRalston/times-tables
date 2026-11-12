import { afterEach, describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { setLocale, type Locale } from "../i18n";
import { storyLine } from "../buddy/story";
import { tierWindow } from "../grade-map";
import { ADD_PLAIN_OPENING, handsMinimum, handsOnSlots, holdStepUp, openingPrefer, similarChoice } from "../round-flow";
import { PLACEMENT_LENGTH } from "../model";
import { ADD_LEVELS, ADD_PLAIN_TAG, addCountLine, addHideOf, isMissingNumber, makeAddQuestion, type AddLevel } from "./add";
import type { ChoiceQ } from "./types";

type AddVisual = Extract<ChoiceQ["visual"], { kind: "add" }>;

function visualOf(q: ChoiceQ): AddVisual {
  if (q.visual.kind !== "add") throw new Error("not an add card");
  return q.visual;
}

/** What a kid gets by counting the picture group the buddy names. */
function solve(v: AddVisual): number {
  if (v.op === "+") return v.left == null ? v.result! - v.right! : v.right == null ? v.result! - v.left : v.left + v.right;
  return v.left == null ? v.result! + v.right! : v.right == null ? v.left - v.result! : v.left - v.right;
}

afterEach(() => setLocale("en"));

describe("first Addition round for a new visitor", () => {
  it("opens with plain sums and differences, never a missing number", () => {
    for (let seed = 0; seed < 300; seed++) {
      const rng = rngFromSeed(`open-${seed}`);
      for (let card = 0; card < ADD_PLAIN_OPENING; card++) {
        const prefer = openingPrefer("add", true, "medium", card);
        expect(prefer).toContain(ADD_PLAIN_TAG);
        for (const level of ["within5", "within10", "within20", "tens"] as AddLevel[]) {
          const v = visualOf(makeAddQuestion(rng, level, prefer));
          expect(isMissingNumber(v)).toBe(false);
          expect(v.result).toBeNull();
          expect(solve({ ...v, result: v.hidden })).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it("covers the first 3 to 4 cards, then lets missing-number cards in later", () => {
    expect(ADD_PLAIN_OPENING).toBeGreaterThanOrEqual(3);
    expect(ADD_PLAIN_OPENING).toBeLessThan(PLACEMENT_LENGTH);
    expect(openingPrefer("add", true, "medium", ADD_PLAIN_OPENING)).toEqual([]);
    const rng = rngFromSeed("later");
    let missing = 0;
    for (let i = 0; i < 400; i++) if (isMissingNumber(visualOf(makeAddQuestion(rng, "within10", [])))) missing++;
    expect(missing).toBeGreaterThan(100);
  });

  it("only changes a first Addition round, and Hard keeps its mix", () => {
    expect(openingPrefer("add", false, "medium", 0)).toEqual([]);
    expect(openingPrefer("add", true, "hard", 0)).toEqual([]);
    expect(openingPrefer("times", true, "medium", 0)).toEqual([]);
    expect(openingPrefer("add", true, "easy", 0)).toEqual([ADD_PLAIN_TAG]);
  });

  it("has one drag-the-counters card in a first Addition round, three elsewhere", () => {
    expect(handsOnSlots(PLACEMENT_LENGTH, handsMinimum("add", true))).toHaveLength(1);
    expect(handsOnSlots(PLACEMENT_LENGTH, handsMinimum("add", true))[0]).toBeGreaterThanOrEqual(ADD_PLAIN_OPENING - 1);
    expect(handsOnSlots(PLACEMENT_LENGTH, handsMinimum("add", false))).toEqual([1, 3, 4]);
    expect(handsOnSlots(PLACEMENT_LENGTH, handsMinimum("count", true))).toEqual([1, 3, 4]);
  });

  it("does not step up right before the last placement card", () => {
    expect(holdStepUp("add", true, PLACEMENT_LENGTH - 2, PLACEMENT_LENGTH)).toBe(true);
    expect(holdStepUp("add", true, PLACEMENT_LENGTH - 1, PLACEMENT_LENGTH)).toBe(false);
    expect(holdStepUp("add", false, 8, 10)).toBe(false);
    expect(holdStepUp("times", true, PLACEMENT_LENGTH - 2, PLACEMENT_LENGTH)).toBe(false);
  });
});

describe("try one like it", () => {
  it("keeps the same kind of card as the one missed", () => {
    for (const level of ["within5", "within10", "within20", "tens"] as AddLevel[]) {
      for (let seed = 0; seed < 200; seed++) {
        const rng = rngFromSeed(`like-${level}-${seed}`);
        const missed = makeAddQuestion(rng, level, []);
        const next = similarChoice("add", missed, rng);
        const a = visualOf(missed);
        const b = visualOf(next);
        expect(b.op).toBe(a.op);
        expect(addHideOf(b)).toBe(addHideOf(a));
        expect(next.skill).toBe(missed.skill);
      }
    }
  });

  it("keeps a plain 3 + 1 = ? plain", () => {
    const rng = rngFromSeed("plain-like");
    for (let i = 0; i < 200; i++) {
      const plain = makeAddQuestion(rng, "within10", [ADD_PLAIN_TAG]);
      expect(isMissingNumber(visualOf(similarChoice("add", plain, rng)))).toBe(false);
    }
  });
});

describe("Addition buddy line", () => {
  it("never tells a kid to count the part they already know", () => {
    const rng = rngFromSeed("hint");
    for (let i = 0; i < 600; i++) {
      const v = visualOf(makeAddQuestion(rng, i % 2 ? "within10" : "within20", []));
      const line = addCountLine(v);
      expect(line).not.toMatch(/sweet/i);
      const hide = addHideOf(v);
      if (hide === "result") {
        expect(line).toBe(v.op === "+" ? "Count all of them." : "Count the ones left.");
      } else if (v.op === "+" || hide === "right") {
        const known = v.op === "+" ? (hide === "right" ? v.pink : v.teal) : v.pink;
        const total = v.pink + v.teal;
        expect(line).toBe(`Start at ${known}. Count up to ${total}.`);
        // Counting on from the known part lands on the answer.
        expect(total - known).toBe(v.hidden);
      } else {
        expect(line).toBe("Count all of them.");
        expect(v.pink + v.teal).toBe(v.hidden);
      }
    }
  });

  it("8 + ? = 10 counts on from 8, and 1 + 1 = ? counts all of them", () => {
    const missing: AddVisual = { kind: "add", op: "+", left: 8, right: null, result: 10, pink: 8, teal: 2, max: 10, hidden: 2, solved: "8 + 2 = 10" };
    expect(addCountLine(missing)).toBe("Start at 8. Count up to 10.");
    const plain: AddVisual = { kind: "add", op: "+", left: 1, right: 1, result: null, pink: 1, teal: 1, max: 10, hidden: 2, solved: "1 + 1 = 2" };
    expect(addCountLine(plain)).toBe("Count all of them.");
    const take: AddVisual = { kind: "add", op: "-", left: 5, right: null, result: 3, pink: 3, teal: 2, max: 10, hidden: 2, solved: "5 − 2 = 3" };
    expect(addCountLine(take)).toBe("Start at 3. Count up to 5.");
  });

  it("is translated in every academy language", () => {
    const missing: AddVisual = { kind: "add", op: "+", left: 8, right: null, result: 10, pink: 8, teal: 2, max: 10, hidden: 2, solved: "8 + 2 = 10" };
    const plain: AddVisual = { ...missing, right: 2, result: null, hidden: 10 };
    const left: AddVisual = { kind: "add", op: "-", left: 5, right: 2, result: null, pink: 3, teal: 2, max: 10, hidden: 3, solved: "5 − 2 = 3" };
    const english = [addCountLine(missing), addCountLine(plain), addCountLine(left)];
    for (const locale of ["es", "pt", "fr", "zh", "hi", "ar"] as Locale[]) {
      setLocale(locale);
      const lines = [addCountLine(missing), addCountLine(plain), addCountLine(left)];
      lines.forEach((line, i) => {
        expect(line.length).toBeGreaterThan(3);
        expect(line).not.toBe(english[i]);
      });
      expect(lines[0]).toContain("8");
      expect(lines[0]).toContain("10");
    }
  });

  it("stays quiet on big-number cards with no picture", () => {
    const rng = rngFromSeed("big");
    expect(addCountLine(visualOf(makeAddQuestion(rng, "within1000", [])))).toBe("");
  });
});

describe("Addition stories", () => {
  it("read naturally in English", () => {
    const took: AddVisual = { kind: "add", op: "-", left: 5, right: null, result: 3, pink: 3, teal: 2, max: 10, hidden: 2, solved: "5 − 2 = 3" };
    const line = storyLine(took, "peach", "bear");
    expect(line).toBe("Sweet Peach had 5 squishees and gave some to Bear. Now Peach has 3. How many did Peach give?");
    expect(line).not.toContain("the sweet");
    const joined: AddVisual = { kind: "add", op: "+", left: 8, right: null, result: 10, pink: 8, teal: 2, max: 10, hidden: 2, solved: "8 + 2 = 10" };
    expect(storyLine(joined, "peach", "bear")).not.toContain("2");
  });

  it("keep English names and squishees isolated inside Arabic", () => {
    setLocale("ar");
    const plain: AddVisual = { kind: "add", op: "+", left: 1, right: 3, result: null, pink: 1, teal: 3, max: 10, hidden: 4, solved: "1 + 3 = 4" };
    const line = storyLine(plain, "peach", "bear");
    expect(line.startsWith("مع")).toBe(true);
    expect(line).toContain("\u2068Peach\u2069");
    expect(line).toContain("\u2068Bear\u2069");
    expect(line).toContain("3 \u2068squishees\u2069");
    expect(line).not.toMatch(/squishees?\. ?[A-Z]/);
  });
});

describe("Addition grade guardrails", () => {
  const ids = [...ADD_LEVELS];
  it("grade 1 never reaches grade 5 decimal operations", () => {
    for (const tier of ["easy", "medium", "hard"] as const) {
      const w = tierWindow(ids, "add", "1", false, tier);
      expect(w.ids).not.toContain("decimalOps");
      expect(w.ids).not.toContain("thousands");
    }
  });
  it("grade 5 serves decimal operations as a scene card, untouched by the opening tags", () => {
    const rng = rngFromSeed("g5");
    const q = makeAddQuestion(rng, "decimalOps", [ADD_PLAIN_TAG]);
    expect(q.visual.kind).toBe("scene");
    expect(q.choices).toHaveLength(4);
  });
});
