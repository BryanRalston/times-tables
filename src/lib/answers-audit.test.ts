import { describe, expect, it } from "vitest";
import { GRADE4_UNITS, UNITS, activityById } from "./curriculum";
import { makeQuestion, wordForm } from "./questions";
import { rngFromSeed } from "./rng";
import type {
  AreaData,
  ArrayData,
  ClockData,
  ComputeData,
  FractionData,
  GraphData,
  GroupsData,
  JumpsData,
  MeasureData,
  MoneyData,
  PerimeterData,
  PlaceValueData,
  TenFrameData,
} from "./types";
import { answersMatch, moneyFmt } from "./utils";

const COIN: Record<string, number> = {
  penny: 1,
  nickel: 5,
  dime: 10,
  quarter: 25,
  dollar: 100,
  five: 500,
};

describe("answer audit", () => {
  it("every activity's choices include the scored answer", () => {
    for (const unit of [...UNITS, ...GRADE4_UNITS]) {
      for (const activity of unit.activities) {
        for (let i = 0; i < 25; i++) {
          const q = makeQuestion(activity, rngFromSeed(`${activity.id}:${i}`));
          if (q.input === "choice") {
            expect(q.choices?.includes(q.answer), `${activity.id} missing ${q.answer}`).toBe(true);
            expect((q.choices ?? []).length).toBeGreaterThanOrEqual(2);
          }
          expect(q.answer.length, activity.id).toBeGreaterThan(0);
        }
      }
    }
  });

  it("ten-frame n is total minus shown", () => {
    for (const id of ["u1-leftover", "u1-friends"]) {
      for (let i = 0; i < 20; i++) {
        const q = makeQuestion(activityById(id)!.activity, rngFromSeed(`tf:${id}:${i}`));
        const d = q.data as TenFrameData;
        expect(Number(q.answer)).toBe(d.total - d.shown);
        expect(d.shown).toBeGreaterThan(0);
        expect(d.shown).toBeLessThan(d.total);
      }
    }
  });

  it("groups and arrays match the product", () => {
    for (const id of ["u3-groups", "u3-jumps", "u3-array", "u3-factor", "u3-share", "u6-facts", "u9-groups", "u12-six"]) {
      for (let i = 0; i < 20; i++) {
        const q = makeQuestion(activityById(id)!.activity, rngFromSeed(`g:${id}:${i}`));
        if (q.kind === "groups") {
          const d = q.data as GroupsData;
          const p = d.groups * d.size;
          if (d.hide === "product") expect(Number(q.answer)).toBe(p);
          if (d.hide === "groups") {
            expect(d.size).toBeGreaterThan(0);
            expect(Number(q.answer)).toBe(d.groups);
            expect(d.size * Number(q.answer)).toBe(p);
          }
          if (d.hide === "size") expect(Number(q.answer)).toBe(d.size);
        }
        if (q.kind === "jumps") {
          const d = q.data as JumpsData;
          const p = d.jumps * d.size;
          if (d.hide === "product") expect(Number(q.answer)).toBe(p);
          if (d.hide === "jumps") expect(Number(q.answer)).toBe(d.jumps);
          if (d.hide === "size") expect(Number(q.answer)).toBe(d.size);
        }
        if (q.kind === "array") {
          const d = q.data as ArrayData;
          const p = d.rows * d.cols;
          if (d.hide === "product") expect(Number(q.answer)).toBe(p);
          if (d.hide === "rows") expect(Number(q.answer)).toBe(d.rows);
          if (d.hide === "cols") expect(Number(q.answer)).toBe(d.cols);
        }
      }
    }
  });

  it("place-value digit is unique and value matches the place", () => {
    const found = activityById("u2-place")!;
    for (let i = 0; i < 40; i++) {
      const q = makeQuestion(found.activity, rngFromSeed(`pv:${i}`));
      const d = q.data as PlaceValueData;
      const s = String(d.number);
      const fromRight = ["ones", "tens", "hundreds", "thousands", "ten thousands", "hundred thousands"].indexOf(d.place);
      expect(fromRight).toBeGreaterThanOrEqual(0);
      const idx = s.length - 1 - fromRight;
      expect(s[idx]).toBe(String(d.digit));
      if (q.data && (q.data as PlaceValueData).mode === "place") {
        expect(s.split(String(d.digit)).length - 1).toBe(1);
      }
      if ((q.data as PlaceValueData).mode === "value") {
        expect(Number(q.answer)).toBe(d.digit * 10 ** fromRight);
      }
    }
  });

  it("word form round-trips six-digit numbers", () => {
    expect(wordForm(165724)).toBe("one hundred sixty-five thousand seven hundred twenty-four");
    expect(wordForm(100000)).toBe("one hundred thousand");
    expect(wordForm(101)).toBe("one hundred one");
    const found = activityById("u2-word")!;
    for (let i = 0; i < 20; i++) {
      const q = makeQuestion(found.activity, rngFromSeed(`w:${i}`));
      expect(q.choices).toContain(q.answer);
      const n = (q.data as PlaceValueData).number;
      const words = wordForm(n);
      expect(answersMatch(q.answer, q.answer, q.alts)).toBe(true);
      expect(words.length).toBeGreaterThan(0);
      expect(n).toBeGreaterThanOrEqual(100000);
    }
  });

  it("coins sum to the scored cents", () => {
    for (const id of ["u1-coins", "u11-count", "u11-change", "u11-compare"]) {
      for (let i = 0; i < 20; i++) {
        const q = makeQuestion(activityById(id)!.activity, rngFromSeed(`m:${id}:${i}`));
        const d = q.data as MoneyData;
        if (d.mode === "count") {
          const cents = Object.entries(d.coins).reduce((n, [id, c]) => n + (COIN[id] ?? 0) * (c ?? 0), 0);
          expect(Number(q.answer)).toBe(cents);
          expect(q.prompt).not.toContain(String(cents));
          expect(q.prompt).not.toContain(moneyFmt(cents));
        }
        if (d.mode === "change") {
          expect(Number(q.answer)).toBe((d.pay ?? 0) - (d.cost ?? 0));
        }
        if (d.mode === "compare") {
          const left = Object.entries(d.coins).reduce((n, [id, c]) => n + (COIN[id] ?? 0) * (c ?? 0), 0);
          const right = Object.entries(d.otherCoins ?? {}).reduce((n, [id, c]) => n + (COIN[id] ?? 0) * (c ?? 0), 0);
          const expected = left < right ? "<" : left > right ? ">" : "=";
          expect(q.answer).toBe(expected);
          expect(q.prompt).not.toContain(moneyFmt(left));
          expect(q.prompt).not.toContain(moneyFmt(right));
        }
      }
    }
  });

  it("combine and subdivide answers match the parts", () => {
    for (let i = 0; i < 40; i++) {
      const c = makeQuestion(activityById("u4-combine")!.activity, rngFromSeed(`comb:${i}`));
      const d = c.data as { parts?: string[]; result?: string; sides?: number };
      expect(c.choices).toContain(c.answer);
      if (d.parts?.join() === "triangle,triangle") {
        expect(d.result).toBe("quadrilateral");
        expect(d.sides).toBe(4);
      }
      if (d.parts?.join() === "triangle,quadrilateral") expect(d.result).toBe("pentagon");
      if (d.parts?.join() === "quadrilateral,quadrilateral") expect(d.result).toBe("hexagon");
      if (d.parts?.join() === "triangle,pentagon") expect(d.result).toBe("hexagon");
      const s = makeQuestion(activityById("u4-subdivide")!.activity, rngFromSeed(`sub:${i}`));
      const sd = s.data as { shape?: string; sides?: number };
      if (sd.shape === "quadrilateral") expect(s.answer).toBe("2");
      if (sd.shape === "pentagon") expect(s.answer).toBe("3");
      if (sd.shape === "hexagon") expect(s.answer).toBe("4");
      expect(s.choices).toContain(s.answer);
    }
  });

  it("length read uses inches or centimeters on the tick set", () => {
    for (let i = 0; i < 40; i++) {
      const q = makeQuestion(activityById("u8-length")!.activity, rngFromSeed(`len:${i}`));
      const d = q.data as MeasureData;
      expect(["in", "cm"]).toContain(d.unit);
      expect(d.value).toBeGreaterThan(0);
      expect(d.value).toBeLessThanOrEqual(d.max);
      expect(Number.isInteger(d.value * 2)).toBe(true);
      expect(String(q.answer)).toBe(String(d.value));
    }
  });

  it("mass and volume readings sit on whole ticks", () => {
    for (const id of ["u8-mass", "u8-volume"]) {
      for (let i = 0; i < 30; i++) {
        const q = makeQuestion(activityById(id)!.activity, rngFromSeed(`mv:${id}:${i}`));
        const d = q.data as MeasureData;
        expect(Number.isInteger(d.value)).toBe(true);
        expect(d.value).toBeGreaterThanOrEqual(1);
        expect(d.value).toBeLessThanOrEqual(d.max);
        expect(d.max).toBeGreaterThanOrEqual(8);
        expect(d.max).toBeLessThanOrEqual(12);
      }
    }
  });

  it("year-end measure rotates length mass and volume", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const q = makeQuestion(activityById("u13-measure")!.activity, rngFromSeed(`rot:${i}`));
      seen.add((q.data as MeasureData).attribute);
    }
    expect(seen).toEqual(new Set(["length", "mass", "volume"]));
  });

  it("jumps answer matches the hidden factor", () => {
    for (let i = 0; i < 30; i++) {
      const q = makeQuestion(activityById("u3-jumps")!.activity, rngFromSeed(`jp:${i}`));
      const d = q.data as JumpsData;
      const p = d.jumps * d.size;
      if (d.hide === "product") expect(Number(q.answer)).toBe(p);
      if (d.hide === "jumps") expect(Number(q.answer)).toBe(d.jumps);
      if (d.hide === "size") expect(Number(q.answer)).toBe(d.size);
    }
  });

  it("fractions: shaded pieces match the named fraction", () => {
    for (const id of ["u5-name", "u5-unit", "u5-leftover", "u5-mixed", "u10-equiv", "u10-bench"]) {
      for (let i = 0; i < 15; i++) {
        const q = makeQuestion(activityById(id)!.activity, rngFromSeed(`f:${id}:${i}`));
        const d = q.data as FractionData;
        if (id === "u5-name") expect(q.answer).toBe(`${d.num}/${d.den}`);
        if (id === "u5-unit") expect(q.answer).toBe(`1/${d.den}`);
        if (id === "u5-leftover") expect(q.answer).toBe(`${d.den - d.num}/${d.den}`);
        if (id === "u5-mixed") {
          const shaded = d.shaded ?? d.num;
          const whole = Math.floor(shaded / d.den);
          const rem = shaded % d.den;
          expect(q.answer).toBe(`${whole} ${rem}/${d.den}`);
        }
        if (id === "u10-equiv") expect(Number(q.answer)).toBe(d.num * ((d.den2 ?? d.den) / d.den));
        if (id === "u10-bench") {
          expect(["0", "1/2", "1"]).toContain(q.answer);
          expect(q.choices).toContain(q.answer);
        }
      }
    }
  });

  it("clocks, compute, perimeter, area, and patterns are internally consistent", () => {
    for (let i = 0; i < 20; i++) {
      const clock = makeQuestion(activityById("u11-clock")!.activity, rngFromSeed(`c:${i}`));
      const cd = clock.data as ClockData;
      expect(clock.answer).toBe(`${cd.hours}:${String(cd.minutes).padStart(2, "0")}`);

      const elapsed = makeQuestion(activityById("u11-elapsed")!.activity, rngFromSeed(`e:${i}`));
      expect(Number(elapsed.answer)).toBeGreaterThanOrEqual(1);
      expect(Number(elapsed.answer)).toBeLessThanOrEqual(3);

      const exact = makeQuestion(activityById("u7-exact")!.activity, rngFromSeed(`x:${i}`));
      const xd = exact.data as ComputeData;
      expect(Number(exact.answer)).toBe(xd.op === "+" ? xd.a + xd.b : xd.a - xd.b);

      const peri = makeQuestion(activityById("u8-peri")!.activity, rngFromSeed(`p:${i}`));
      const pd = peri.data as PerimeterData;
      expect(Number(peri.answer)).toBe(pd.sides.reduce((a, b) => a + b, 0));

      const miss = makeQuestion(activityById("u8-missing")!.activity, rngFromSeed(`pm:${i}`));
      const md = miss.data as PerimeterData;
      expect(Number(miss.answer)).toBe(md.sides[md.hideIndex ?? 0]);

      const area = makeQuestion(activityById("u8-area")!.activity, rngFromSeed(`a:${i}`));
      const ad = area.data as AreaData;
      expect(Number(area.answer)).toBe(ad.cells.flat().filter(Boolean).length);

      const pat = makeQuestion(activityById("u6-skip")!.activity, rngFromSeed(`pat:${i}`));
      const seq = (pat.data as { seq: (number | null)[]; step: number }).seq;
      const step = (pat.data as { step: number }).step;
      const filled = seq.map((n) => (n == null ? Number(pat.answer) : n));
      for (let k = 1; k < filled.length; k++) expect(filled[k]! - filled[k - 1]!).toBe(step);
      expect(filled.every((n) => n >= 0)).toBe(true);
    }
  });

  it("graph ties accept every winner", () => {
    const found = activityById("u1-graph")!;
    for (let i = 0; i < 40; i++) {
      const q = makeQuestion(found.activity, rngFromSeed(`gr:${i}`));
      const d = q.data as GraphData;
      if (d.ask === "greatest" || d.ask === "least") {
        const m = d.ask === "greatest" ? Math.max(...d.rows.map((r) => r.value)) : Math.min(...d.rows.map((r) => r.value));
        const winners = d.rows.filter((r) => r.value === m).map((r) => r.label);
        expect(winners).toHaveLength(1);
        expect(winners).toContain(q.answer);
        for (const w of winners) expect(answersMatch(w, q.answer, q.alts)).toBe(true);
        expect(q.choices).toContain(q.answer);
      }
    }
  });

  it("how-many-more names the larger group first", () => {
    const found = activityById("u1-graph")!;
    let seen = 0;
    for (const locale of ["en", "es", "pt-BR"] as const) {
      for (let i = 0; i < 80; i++) {
        const q = makeQuestion(found.activity, rngFromSeed(`more:${locale}:${i}`), locale);
        const d = q.data as GraphData;
        if (d.ask !== "more") continue;
        seen += 1;
        const byLabel = Object.fromEntries(d.rows.map((r) => [r.label, r.value]));
        const larger = byLabel[d.focus!]!;
        const smaller = byLabel[d.focusB!]!;
        expect(larger, q.prompt).toBeGreaterThan(smaller);
        expect(Number(q.answer)).toBe(larger - smaller);
        const prompt = q.prompt.toLowerCase();
        expect(prompt.indexOf(d.focus!.toLowerCase())).toBeGreaterThanOrEqual(0);
        expect(prompt.indexOf(d.focus!.toLowerCase())).toBeLessThan(prompt.indexOf(d.focusB!.toLowerCase()));
      }
    }
    expect(seen).toBeGreaterThan(20);
  });

  it("collect graphs show every category and a countable focus", () => {
    for (const id of ["u1-tally", "u6-picto", "u7-bar"]) {
      for (let i = 0; i < 40; i++) {
        const q = makeQuestion(activityById(id)!.activity, rngFromSeed(`collect:${id}:${i}`));
        const d = q.data as GraphData;
        expect(d.collect).toBe(true);
        const tray = d.tray ?? [];
        const counts: Record<string, number> = {};
        for (const t of tray) counts[t.label] = (counts[t.label] ?? 0) + 1;
        const sum = Object.values(counts).reduce((n, c) => n + c, 0);
        expect(tray.length).toBe(sum);
        expect(tray.length).toBeGreaterThanOrEqual(6);
        expect(tray.length).toBeLessThanOrEqual(8);
        for (const row of d.rows) {
          expect(counts[row.label] ?? 0, `${id} missing ${row.label}`).toBeGreaterThanOrEqual(1);
        }
        expect(counts[d.focus!] ?? 0).toBeGreaterThanOrEqual(2);
        expect(q.needsInteract).toBe(true);
        expect(d.readPrompt?.length).toBeGreaterThan(0);
        if (d.ask === "value") expect(Number(q.answer)).toBe(counts[d.focus!]);
        if (d.ask === "greatest") {
          const m = Math.max(...Object.values(counts));
          expect(counts[q.answer]).toBe(m);
        }
        if (d.ask === "least") {
          const m = Math.min(...Object.values(counts));
          expect(counts[q.answer]).toBe(m);
        }
      }
    }
  });

  it("related-fact distractors are actually false", () => {
    const found = activityById("u3-family")!;
    for (let i = 0; i < 30; i++) {
      const q = makeQuestion(found.activity, rngFromSeed(`fam:${i}`));
      expect(q.choices).toContain(q.answer);
      for (const c of q.choices ?? []) {
        const m = c.match(/(\d+)\s*([×÷+\u2212-])\s*(\d+)\s*=\s*(\d+)/);
        expect(m).toBeTruthy();
        const a = Number(m![1]);
        const op = m![2];
        const b = Number(m![3]);
        const r = Number(m![4]);
        const trueVal = op === "×" ? a * b : op === "÷" ? a / b : op === "+" ? a + b : a - b;
        if (c === q.answer) expect(trueVal).toBe(r);
        else expect(trueVal).not.toBe(r);
      }
    }
  });
});
