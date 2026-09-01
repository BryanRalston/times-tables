import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { activityById } from "@/lib/curriculum";
import { makeQuestion } from "@/lib/questions";
import { rngFromSeed } from "@/lib/rng";
import type { MeasureData, MoneyData, Question } from "@/lib/types";
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
    expect(html).not.toContain(moneyFmt(cents));
    expect(html).not.toMatch(/if you count them all/i);
  });

  it("measure board has numbered ticks and a pointer", () => {
    for (const id of ["u8-length", "u8-mass", "u8-volume"]) {
      const q = makeQuestion(activityById(id)!.activity, rngFromSeed(5));
      const d = q.data as MeasureData;
      const html = renderToStaticMarkup(<Board {...stub(q)} />);
      expect(html).toContain("polygon");
      expect(html).toContain(">0<");
      expect(html).toContain(String(Math.floor(d.value)));
      expect(html).toContain(d.unit);
    }
  });
});
