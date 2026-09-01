import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { activityById } from "@/lib/curriculum";
import { makeQuestion, welcomeFirst } from "@/lib/questions";
import { rngFromSeed } from "@/lib/rng";
import type { ChoiceData, ClockData, DecimalData, GraphData, MeasureData, MoneyData, Question } from "@/lib/types";
import { moneyFmt } from "@/lib/utils";
import { BEAKER_FACE, Board, beakerMeniscusY, moneyBox, rulerPointerX, scaleNeedleDeg, type BoardProps } from "./models";

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
    expect(html).toMatch(/<img|<svg/);
  });

  it("unit pick always shows an object, not a blank card", () => {
    for (let i = 0; i < 24; i++) {
      const q = makeQuestion(activityById("u8-unit")!.activity, rngFromSeed(`unit:${i}`));
      const html = renderToStaticMarkup(<Board {...stub(q)} />);
      expect(html).toMatch(/<img|<svg/);
      expect(html.replace(/&#x27;/g, "'")).toContain(q.prompt);
    }
  });

  it("order board uses i18n, not hardcoded English, and can undo", () => {
    const q = makeQuestion(activityById("u2-order")!.activity, rngFromSeed(3));
    const html = renderToStaticMarkup(<Board {...stub(q)} />);
    expect(html).not.toContain("Tap in order");
    expect(html).toMatch(/tap the numbers in order/i);
    const withPick = renderToStaticMarkup(
      <Board {...stub(q)} value={(q.choices ?? [])[0] ?? "1"} />,
    );
    expect(withPick).toMatch(/Undo|Deshacer|Desfazer/);
  });

  it("count money img count matches the coin bag", () => {
    const q = makeQuestion(activityById("u1-coins")!.activity, rngFromSeed("coins:board"));
    const d = q.data as MoneyData;
    const n = Object.values(d.coins).reduce((s, c) => s + (c ?? 0), 0);
    const html = renderToStaticMarkup(<Board {...stub(q)} />);
    expect((html.match(/<img/g) ?? []).length).toBe(n);
  });

  it("count coins stay in the tree after tap and Clear restores them", () => {
    const q = makeQuestion(activityById("u1-coins")!.activity, rngFromSeed("coins:stay"));
    const d = q.data as MoneyData;
    const n = Object.values(d.coins).reduce((s, c) => s + (c ?? 0), 0);
    const html = renderToStaticMarkup(<Board {...stub(q)} />);
    expect((html.match(/data-count-coin=/g) ?? []).length).toBe(n);
    expect((html.match(/<img/g) ?? []).length).toBe(n);
    expect(html).toContain("Clear");
    expect(html).toContain('data-count-row="rest"');
    expect(html).toContain('data-count-row="pile"');
    expect(html).not.toContain("opacity-0");
    expect(html).not.toContain("scale-50");
    expect(html).toContain('data-counted="0"');
  });

  it("quarter is the largest coin and bills are larger than coins", () => {
    expect(moneyBox("quarter").width).toBeGreaterThan(moneyBox("nickel").width);
    expect(moneyBox("nickel").width).toBeGreaterThan(moneyBox("penny").width);
    expect(moneyBox("penny").width).toBeGreaterThan(moneyBox("dime").width);
    expect(moneyBox("dollar").width).toBeGreaterThan(moneyBox("quarter").width);
    expect(moneyBox("five").width).toBeGreaterThan(moneyBox("quarter").width);
    const q = makeQuestion(activityById("u1-coins")!.activity, rngFromSeed("coins:size"));
    const d = q.data as MoneyData;
    const html = renderToStaticMarkup(<Board {...stub(q)} />);
    const any = (["quarter", "nickel", "penny", "dime"] as const).find((id) => (d.coins[id] ?? 0) > 0);
    if (any) expect(html).toContain(`width:${moneyBox(any).width}px`);
  });

  it("leftover HTML does not leak n is answer while idle", () => {
    const q = welcomeFirst(rngFromSeed(1));
    const html = renderToStaticMarkup(<Board {...stub(q)} status="idle" />);
    expect(html).not.toContain(`n is ${q.answer}`);
    expect(html).toContain("6 + n = 10");
    expect(html).toContain('aria-label="dot"');
    expect(html).not.toContain('aria-label="empty"');
    expect(html).not.toContain("takeable");
    expect((html.match(/<button/g) ?? []).length).toBe(6);
  });

  it("after a correct leftover Check the board isolates n without an n is overlay", () => {
    const q = welcomeFirst(rngFromSeed(1));
    const html = renderToStaticMarkup(<Board {...stub(q)} status="correct" interacted />);
    expect(html).toContain("data-n-isolate");
    expect(html).not.toContain(`n is ${q.answer}`);
    expect(html).toContain('aria-label="leftover"');
  });

  it("place-value idle HTML does not underline or box the asked place", () => {
    const q = makeQuestion(activityById("u2-place")!.activity, rngFromSeed("place:idle"));
    const idle = renderToStaticMarkup(<Board {...stub(q)} status="idle" />);
    expect(idle).not.toContain("underline");
    expect(idle).not.toContain("border-teal");
    const ok = renderToStaticMarkup(<Board {...stub(q)} status="correct" />);
    expect(ok).toContain("underline");
    expect(ok).toContain("border-teal");
  });

  it("tally tray pictures have explicit size on first paint", () => {
    const q = makeQuestion(activityById("u1-tally")!.activity, rngFromSeed("tally:paint"));
    const d = q.data as GraphData;
    const tray = d.tray ?? [];
    expect(tray.length).toBeGreaterThan(0);
    const html = renderToStaticMarkup(<Board {...stub(q)} />);
    expect((html.match(/<img/g) ?? []).length).toBeGreaterThanOrEqual(tray.length);
    expect(html).toMatch(/width="28"/);
    expect(html).toMatch(/height="28"/);
    expect(html).not.toMatch(/>\?<\/span>/);
  });

  it("pictograph img count equals sum of count(value)", () => {
    const q = makeQuestion(activityById("u1-graph")!.activity, rngFromSeed("picto:icons"));
    const d = q.data as GraphData;
    expect(d.collect).toBeFalsy();
    const html = renderToStaticMarkup(<Board {...stub(q)} />);
    const want = d.rows.reduce((n, r) => n + Math.max(0, Math.round(r.value / Math.max(1, d.key))), 0);
    expect((html.match(/data-picto-icon/g) ?? []).length).toBe(want);
    expect(html).toContain("flex-wrap");
    expect(html).toContain("overflow-visible");
  });

  it("combine drawing is two parts plus ? not the named result polygon", () => {
    const q = makeQuestion(activityById("u4-combine")!.activity, rngFromSeed("join:board"));
    const d = q.data as ChoiceData;
    const html = renderToStaticMarkup(<Board {...stub(q)} />);
    expect(html).toContain("?");
    expect((html.match(/<polygon/g) ?? []).length).toBe(2);
    expect(html).not.toContain(d.result);
  });

  it("read-clock board draws hour and minute hands", () => {
    const q = makeQuestion(activityById("u11-clock")!.activity, rngFromSeed(3));
    expect((q.data as ClockData).mode).toBe("read");
    const html = renderToStaticMarkup(<Board {...stub(q)} />);
    expect((html.match(/<line/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(html).toContain("stroke-linecap");
  });

  it("measure read mode has a pointer on the tool", () => {
    for (const id of ["u8-length", "u8-mass", "u8-volume"]) {
      const q = makeQuestion(activityById(id)!.activity, rngFromSeed("ptr:5"));
      const html = renderToStaticMarkup(<Board {...stub(q)} />);
      expect(html, id).toContain("polygon");
      expect(html, id).toContain("measure/");
    }
  });

  it("beaker fill meniscus maps to value/max on the inner wall", () => {
    const q = makeQuestion(activityById("u8-volume")!.activity, rngFromSeed("beaker:fill"));
    const d = q.data as MeasureData;
    expect(d.attribute).toBe("volume");
    const html = renderToStaticMarkup(<Board {...stub(q)} />);
    const yAttr = html.match(/data-fill-y="([^"]+)"/);
    const vAttr = html.match(/data-value="([^"]+)"/);
    const mAttr = html.match(/data-max="([^"]+)"/);
    expect(yAttr, "fill y").toBeTruthy();
    expect(Number(vAttr?.[1])).toBe(d.value);
    expect(Number(mAttr?.[1])).toBe(d.max);
    const expected = beakerMeniscusY(d.value, d.max);
    expect(Number(yAttr![1])).toBe(expected);
    expect(expected).toBeLessThan(BEAKER_FACE.yBot);
    expect(expected).toBeGreaterThanOrEqual(BEAKER_FACE.yTop);
    const ratio = d.value / d.max;
    const t = (BEAKER_FACE.yBot - expected) / (BEAKER_FACE.yBot - BEAKER_FACE.yTop);
    expect(t).toBeCloseTo(ratio, 5);
    expect(html).toMatch(/clip-?path/i);
    expect(html).toContain("measure/beaker");
  });

  it("scale needle rotation maps to value/max", () => {
    const q = makeQuestion(activityById("u8-mass")!.activity, rngFromSeed("scale:deg"));
    const d = q.data as MeasureData;
    expect(d.attribute).toBe("mass");
    const html = renderToStaticMarkup(<Board {...stub(q)} />);
    const deg = scaleNeedleDeg(d.value, d.max);
    expect(html).toContain(`data-scale-deg="${deg}"`);
    expect(Number(html.match(/data-scale-deg="([^"]+)"/)?.[1])).toBe(deg);
    expect(deg).toBe(225 + (d.value / d.max) * 270);
  });

  it("ruler pointer x maps to value/max", () => {
    const q = makeQuestion(activityById("u8-length")!.activity, rngFromSeed("ruler:x"));
    const d = q.data as MeasureData;
    expect(d.attribute).toBe("length");
    const html = renderToStaticMarkup(<Board {...stub(q)} />);
    const x = rulerPointerX(d.value, d.max);
    expect(html).toContain(`data-ruler-x="${x}"`);
    expect(Number(html.match(/data-ruler-x="([^"]+)"/)?.[1])).toBe(x);
  });
});
