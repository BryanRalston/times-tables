import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { activityById } from "@/lib/curriculum";
import { makeQuestion } from "@/lib/questions";
import { rngFromSeed } from "@/lib/rng";
import type { DecimalData, MeasureData, MoneyData, Question } from "@/lib/types";
import { moneyFmt } from "@/lib/utils";
import { Board, type BoardProps } from "./models";

function stub(q: Question): BoardProps {
  return {
    question: q,
    value: "",
    setValue: () => undefined,
    interacted: false,
    onInteract: () => undefined,
    status: "idle",
    shake: 0,
  };
}

describe("boards", () => {
  it("count money board does not print the dollar total", () => {
    const q = makeQuestion(activityById("u1-coins")!.activity, rngFromSeed(9));
    const d = q.data as MoneyData;
    const cents = Object.entries(d.coins).reduce((n, [id, c]) => {
      const v = id === "penny" ? 1 : id === "nickel" ? 5 : id === "dime" ? 10 : id === "quarter" ? 25 : id === "dollar" ? 100 : 500;
      return n + v * (c ?? 0);
    }, 0);
    const html = renderToStaticMarkup(<Board {...stub(q)} />);
    expect(html).toContain("Count the coins");
    expect(html).toContain("money/");
    expect(html).toContain("<img");
    expect(html).not.toContain("25¢");
    expect(html).not.toContain(moneyFmt(cents));
    expect(html).not.toMatch(/if you count them all/i);
  });

  it("pictograph icon row can wrap instead of clipping", () => {
    const q = makeQuestion(activityById("u1-graph")!.activity, rngFromSeed("wrap:1"));
    const html = renderToStaticMarkup(<Board {...stub(q)} />);
    expect(html).toContain("min-w-0");
    expect(html).toContain("flex-wrap");
    expect(html).toContain("flex-1");
  });

  it("measure board has numbered ticks and a pointer", () => {
    for (const id of ["u8-length", "u8-mass", "u8-volume"]) {
      const q = makeQuestion(activityById(id)!.activity, rngFromSeed(5));
      const d = q.data as MeasureData;
      const html = renderToStaticMarkup(<Board {...stub(q)} />);
      expect(html).toContain("polygon");
      expect(html).toContain("inset-0");
      expect(html).toContain(">0<");
      expect(html).toContain(String(Math.floor(d.value)));
      expect(html).toContain(d.unit);
      expect(html).toContain("measure/");
      if (d.attribute === "mass") {
        expect(html).toContain("measure/scale");
        expect(html).toMatch(/rotate\(/);
      }
      if (d.attribute === "volume") {
        expect(html).toContain("measure/beaker");
        expect(html).toContain("<rect");
      }
    }
  });

  it("grade 4 fraction pieces, decimal tenths, and line choices render", () => {
    const add = makeQuestion(activityById("g4-u6-add")!.activity, rngFromSeed(3));
    const d = add.data as { a: number; b: number; den: number };
    const addHtml = renderToStaticMarkup(<Board {...stub(add)} />);
    expect(addHtml).toContain(`${d.a}/${d.den}`);
    expect(addHtml).toContain(`${d.b}/${d.den}`);

    const tenths = makeQuestion(activityById("g4-u7-tenths")!.activity, rngFromSeed(3));
    const td = tenths.data as DecimalData;
    const tHtml = renderToStaticMarkup(<Board {...stub(tenths)} />);
    expect(tHtml).toContain("flex-1");
    expect(String(tenths.answer)).toBe(`0.${td.tenths}`);

    const line = makeQuestion(activityById("g4-u12-lines")!.activity, rngFromSeed(3));
    const lHtml = renderToStaticMarkup(<Board {...stub(line)} />);
    expect(lHtml).toContain("<svg");
    expect(line.choices ?? []).toContain(line.answer);
    expect(td).toBeTruthy();
  });

  it("unit pick shows the prompt, not an empty pointer card", () => {
    const q = makeQuestion(activityById("u8-unit")!.activity, rngFromSeed("pencil"));
    const html = renderToStaticMarkup(<Board {...stub(q)} />);
    expect(html).toContain(q.prompt);
    expect(html).not.toMatch(/read the pointer/i);
  });
});
