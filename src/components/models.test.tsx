import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { activityById } from "@/lib/curriculum";
import { makeQuestion, welcomeFirst } from "@/lib/questions";
import { rngFromSeed } from "@/lib/rng";
import type {
  ChoiceData,
  ClockData,
  CompareData,
  ComputeData,
  DecimalData,
  FluencyData,
  FractionData,
  GraphData,
  JumpsData,
  MeasureData,
  MoneyData,
  PlaceValueData,
  Question,
} from "@/lib/types";
import { moneyFmt } from "@/lib/utils";
import { BEAKER_FACE, Board, beakerMeniscusY, comparePlaceCols, jumpTickLabel, moneyBox, rulerPointerX, scaleNeedleDeg, type BoardProps } from "./models";

const HERE = dirname(fileURLToPath(import.meta.url));

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
      expect(html).toContain(">0<");
      expect(html).toContain(String(Math.floor(d.value)));
      expect(html).toContain(d.unit);
      if (d.attribute === "mass") {
        expect(html).toContain("data-scale-deg");
        expect(html).toMatch(/rotate\(/);
        expect(html).toContain("h-64");
        expect(html).toContain('font-size="18"');
        expect(html).not.toContain("measure/scale");
      } else {
        expect(html).toContain("inset-0");
        expect(html).toContain("measure/");
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

  it("count-with-bills empty tray names dollars and cents", () => {
    let q = makeQuestion(activityById("u11-count")!.activity, rngFromSeed("coins:board"));
    for (let i = 0; i < 80; i++) {
      const next = makeQuestion(activityById("u11-count")!.activity, rngFromSeed(`bill:u11-count:${i}`));
      const d = next.data as MoneyData;
      if (d.coins.dollar || d.coins.five) {
        q = next;
        break;
      }
    }
    const html = renderToStaticMarkup(<Board {...stub(q)} />);
    expect(html).toContain("Tap each bill and coin into the tray, then type dollars and cents.");
    expect(html).not.toContain("type the cents.");
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
    const html = renderToStaticMarkup(<Board {...stub(q)} status="idle" value="5" />);
    expect(html).not.toContain(`n is ${q.answer}`);
    expect(html).toContain("6 + n = 10");
    expect(html).toContain('aria-label="dot"');
    expect(html).toContain("data-known-group");
    expect(html).toContain("known group");
    expect(html).toContain("data-leftover-board");
    expect(html).toContain("known-glow");
    expect(html).not.toContain('aria-label="empty"');
    expect(html).not.toContain("takeable");
    expect(html).toContain("6 + n = 10");
    expect(html).not.toContain(">5<");
    expect((html.match(/aria-label="dot"/g) ?? []).length).toBe(6);
    const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "models.tsx"), "utf8");
    expect(src).toContain("data-known-group");
    expect(src).toContain("pointermove");
    expect(src).toContain("pointerup");
    expect(src).toContain("bindTake");
    expect(src).toContain("missTake");
    expect(src).toMatch(/function missTake[\s\S]*takeGroup\(/);
    expect(src).toContain("data-why-take");
    expect(src).toContain("leftoverRows");
    expect(src).toContain("size-11");
    expect(src).toContain("leftover-dot");
    expect(src).toContain("leftover-eq");
    expect(src).toContain("onClick={takeGroup}");
    expect(src).toContain("grid-cols-5");
  });

  it("18 − n = 10 still has a takeable known group and four leftover rows", () => {
    const q: Question = {
      id: "q-18n10",
      kind: "tenframe",
      input: "keypad",
      prompt: "18 − n = 10",
      hint: "Take the dots you can see. Then name n.",
      answer: "8",
      needsInteract: true,
      data: { total: 18, shown: 10, equation: "18 − n = 10" },
    };
    const html = renderToStaticMarkup(<Board {...stub(q)} status="idle" />);
    expect(html).toContain("18 − n = 10");
    expect(html).toContain("data-leftover-board");
    expect(html).toContain('data-leftover-rows="4"');
    expect(html).toContain("data-why-take");
    expect(html).toContain("data-known-group");
    expect(html).toContain("known-glow");
    expect((html.match(/aria-label="dot"/g) ?? []).length).toBe(10);
    expect(html).not.toContain(`n is ${q.answer}`);
  });

  it("after a correct leftover Check the board isolates n without an n is overlay", () => {
    const q = welcomeFirst(rngFromSeed(1));
    const html = renderToStaticMarkup(<Board {...stub(q)} status="correct" interacted />);
    expect(html).toContain("data-n-isolate");
    expect(html).not.toContain(`n = ${q.answer}`);
    expect(html).toContain('aria-label="leftover"');
    expect(html).not.toContain(`n is ${q.answer}`);
    expect(html).not.toMatch(/<p[^>]*>n<\/p>/);
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
    expect(html).toContain("squishees/");
    for (const item of tray) {
      const id = item.symbol ?? d.symbol;
      expect(html).toContain(`squishees/${id}.png`);
    }
    expect(html).toContain(`squishees/${d.symbol}.png`);
    expect(html).not.toMatch(/src=""/);
    expect(html).not.toMatch(/src="undefined"/);
    const src = readFileSync(join(HERE, "models.tsx"), "utf8");
    expect(src).toContain("placeOnGraph");
    expect(src).toContain("sortWrong");
    expect(src).toContain("playWrong");
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
      if (id === "u8-mass") {
        expect(html, id).toContain("data-scale-deg");
        expect(html, id).not.toContain("measure/scale");
      } else {
        expect(html, id).toContain("measure/");
      }
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

  it("number compare does not leak greater/less with bar height", () => {
    const q = makeQuestion(activityById("u2-compare")!.activity, rngFromSeed("cmp:bars"));
    const d = q.data as CompareData;
    const html = renderToStaticMarkup(<Board {...stub(q)} />);
    const cols = comparePlaceCols(d.a, d.b);
    expect(html).toContain(`${d.a} ○ ${d.b}`);
    expect(html).toContain("left");
    expect(html).toContain("right");
    expect(html).toContain("data-compare-places");
    expect(html).toContain(`data-compare-place="${cols[0]!.placeEn}"`);
    expect(html).toContain("ones");
    expect(html).not.toMatch(/height:\s*\d/);
    expect(html).not.toContain("style=\"height:");
  });

  it("fluency 10 × 2 is ten groups of two, not a ghost 0 × 2 split", () => {
    const q: Question = {
      id: "t10x2",
      kind: "fluency",
      prompt: "10 × 2",
      answer: "20",
      input: "keypad",
      data: { a: 10, b: 2, op: "×" } satisfies FluencyData,
    };
    const html = renderToStaticMarkup(<Board {...stub(q)} />);
    expect(q.needsInteract).toBeFalsy();
    expect(html).toContain("10 × 2");
    expect(html).not.toMatch(/>0 × 2</);
    expect((html.match(/10 × 2/g) ?? []).length).toBe(1);
    expect((html.match(/data-equal-group/g) ?? []).length).toBe(10);
    expect((html.match(/rounded-full bg-teal/g) ?? []).length).toBe(20);
    expect(html).toContain("data-group-tally");
    expect(html).toContain("<button");
  });

  it("fluency 40 ÷ 4 groups are tappable tallies and do not gate Check", () => {
    const q: Question = {
      id: "t40d4",
      kind: "fluency",
      prompt: "40 ÷ 4",
      answer: "10",
      input: "keypad",
      data: { a: 40, b: 4, op: "÷" } satisfies FluencyData,
    };
    const html = renderToStaticMarkup(<Board {...stub(q)} />);
    expect(q.needsInteract).toBeFalsy();
    expect((html.match(/data-equal-group/g) ?? []).length).toBe(10);
    expect((html.match(/data-group-tally="0"/g) ?? []).length).toBe(10);
    expect(html).toContain("<button");
    expect(html).toContain('aria-label="group 1"');
  });

  it("large add/sub boards keep two-sided pieces; only the smaller side is tappable", () => {
    const add = makeQuestion(activityById("u7-exact")!.activity, rngFromSeed("add:why"));
    const sub = makeQuestion(activityById("u13-compute")!.activity, rngFromSeed("sub:why"));
    for (const q of [add, sub]) {
      const d = q.data as ComputeData;
      const html = renderToStaticMarkup(<Board {...stub(q)} />);
      expect(q.needsInteract).toBeFalsy();
      expect(html).toContain("data-compute-piece");
      expect(html).toContain('data-compute-small="1"');
      expect(html).toContain('data-compute-why=');
      const small = d.a >= d.b ? "right" : "left";
      expect(html).toContain(`data-compute-side="${small}"`);
      expect(html).toMatch(new RegExp(`data-compute-side="${small}"[^>]*data-compute-small="1"`));
    }
  });

  it("how-many-more stories still use comparison bars", () => {
    const q = makeQuestion(activityById("u7-compare")!.activity, rngFromSeed("cmp:story"));
    expect(q.input).toBe("keypad");
    const html = renderToStaticMarkup(<Board {...stub(q)} />);
    expect(html).toMatch(/height:\s*\d/);
  });

  it("jump ticks hide the missing factor", () => {
    expect(jumpTickLabel({ size: 4, jumps: 3, hide: "product" }, 3)).toBe("n");
    expect(jumpTickLabel({ size: 4, jumps: 3, hide: "product" }, 2)).toBe("8");
    expect(jumpTickLabel({ size: 4, jumps: 3, hide: "size" }, 1)).toBe("");
    expect(jumpTickLabel({ size: 4, jumps: 3, hide: "size" }, 3)).toBe("12");
    expect(jumpTickLabel({ size: 4, jumps: 3, hide: "jumps" }, 3)).toBe("12");
    for (let i = 0; i < 24; i++) {
      const q = makeQuestion(activityById("u3-jumps")!.activity, rngFromSeed(`jp:leak:${i}`));
      const d = q.data as JumpsData;
      const html = renderToStaticMarkup(<Board {...stub(q)} />);
      const product = d.size * d.jumps;
      if (d.hide === "product") {
        expect(html).not.toContain(`>${product}<`);
        expect(html).toContain(">n<");
      }
      if (d.hide === "size") {
        expect(html).not.toContain(`>${d.size}<`);
      }
    }
  });

  it("fraction number-line name does not caption the answer", () => {
    const q = makeQuestion(activityById("u5-line")!.activity, rngFromSeed("fline:name"));
    const d = q.data as FractionData;
    const html = renderToStaticMarkup(<Board {...stub(q)} />);
    expect(html).not.toMatch(/jumps? of/);
    expect(html).not.toContain(`${d.num}/${d.den}`);
  });

  it("build board does not print the hundreds count", () => {
    const q = makeQuestion(activityById("u2-build")!.activity, rngFromSeed("build:leak"));
    const hundreds = Math.floor((q.data as { target: number }).target / 100) % 10;
    const html = renderToStaticMarkup(<Board {...stub(q)} />);
    expect(html).toContain('data-build-place="hundreds"');
    expect(html).not.toMatch(new RegExp(`data-build-place="hundreds"[^>]*>\\s*<p[^>]*>${hundreds}<`));
    expect((html.match(/data-build-block="hundreds"/g) ?? []).length).toBe(hundreds);
  });

  it("place-mode chart hides place-name labels until correct", () => {
    let q = makeQuestion(activityById("u2-place")!.activity, rngFromSeed("place:label:0"));
    for (let i = 0; i < 40; i++) {
      const next = makeQuestion(activityById("u2-place")!.activity, rngFromSeed(`place:label:${i}`));
      if ((next.data as PlaceValueData).mode === "place") {
        q = next;
        break;
      }
    }
    const d = q.data as PlaceValueData;
    expect(d.mode).toBe("place");
    const idle = renderToStaticMarkup(<Board {...stub(q)} status="idle" />);
    expect(idle).not.toContain(d.place);
    expect(idle).not.toContain("hundreds");
    expect(idle).not.toContain("thousands");
    const ok = renderToStaticMarkup(<Board {...stub(q)} status="correct" />);
    expect(ok).toContain(d.place);
  });

  it("of-a-set board is a group of pieces, not a bar", () => {
    const q = makeQuestion(activityById("u5-set")!.activity, rngFromSeed("set:board"));
    const d = q.data as FractionData;
    const html = renderToStaticMarkup(<Board {...stub(q)} />);
    expect((html.match(/data-set-piece=/g) ?? []).length).toBe(d.den);
    expect((html.match(/data-set-piece="shaded"/g) ?? []).length).toBe(d.num);
    expect(html).not.toContain("h-12 overflow-hidden");
  });
});
