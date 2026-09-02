import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { activityById } from "@/lib/curriculum";
import { makeQuestion, welcomeFirst } from "@/lib/questions";
import { rngFromSeed } from "@/lib/rng";
import { AnswerPanel } from "./answer-panel";
import { AnswerReadout, ClockKeys, Keypad, applyKeypadKey } from "./keypad";

describe("answer readout", () => {
  it("shows typed digits in a Your answer box", () => {
    const html = renderToStaticMarkup(<AnswerReadout value="4" />);
    expect(html).toContain("Your answer");
    expect(html).toContain("4");
  });

  it("empty keypad still shows a box with a question mark", () => {
    const html = renderToStaticMarkup(<AnswerReadout value="" />);
    expect(html).toContain("Your answer");
    expect(html).toContain("?");
  });

  it("keypad includes the live value", () => {
    const html = renderToStaticMarkup(
      <Keypad value="12" onChange={() => undefined} onCheck={() => undefined} />,
    );
    expect(html).toContain("Your answer");
    expect(html).toContain("12");
    expect(html).toContain("Check");
  });
});

describe("leftover keypad", () => {
  it("replaces the current digit instead of concatenating", () => {
    expect(applyKeypadKey("5", "4", { replace: true })).toBe("4");
    expect(applyKeypadKey("", "3", { replace: true })).toBe("3");
    expect(applyKeypadKey("3", "back", { replace: true })).toBe("");
  });

  it("still concatenates money and compute totals", () => {
    expect(applyKeypadKey("5", "4")).toBe("54");
    expect(applyKeypadKey("12", ".", { allowDot: true })).toBe("12.");
    expect(applyKeypadKey("12.5", "0")).toBe("12.50");
  });

  it("omits the decimal on leftover replace-mode keys", () => {
    const html = renderToStaticMarkup(
      <Keypad value="" onChange={() => undefined} onCheck={() => undefined} replace allowDot={false} quiet />,
    );
    expect(html).not.toContain('aria-label="."');
    expect(html).toContain("Check");
    expect(html).not.toContain("Your answer");
    const full = renderToStaticMarkup(
      <Keypad value="12" onChange={() => undefined} onCheck={() => undefined} />,
    );
    expect(full).toContain('aria-label="."');
  });
});

describe("clock keys", () => {
  it("answer clock is an analog face with tiny hour and minute nudges", () => {
    const html = renderToStaticMarkup(
      <ClockKeys value="" onChange={() => undefined} onCheck={() => undefined} avoid="3:15" />,
    );
    expect(html).toContain("viewBox=\"0 0 100 100\"");
    expect(html).toContain("clock hands");
    expect(html).toContain("12:00");
    expect(html).toContain("Hour +");
    expect(html).toContain("+1 min");
    expect(html).not.toContain("+5 min");
    expect(html).toContain("Check");
    expect(html).not.toMatch(/ disabled(=""|>)/);
  });
});

describe("answer panel keypad", () => {
  it("omits the decimal on leftover and fluency, and shows it on money change and count", () => {
    const leftover = welcomeFirst(rngFromSeed("dot:left"));
    const leftHtml = renderToStaticMarkup(
      <AnswerPanel question={leftover} value="" setValue={() => undefined} onCheck={() => undefined} />,
    );
    expect(leftHtml).not.toContain('aria-label="."');
    expect(leftHtml).not.toContain("Your answer");

    const fluency = makeQuestion(activityById("u9-mix")!.activity, rngFromSeed("dot:flu"));
    const fluHtml = renderToStaticMarkup(
      <AnswerPanel question={fluency} value="" setValue={() => undefined} onCheck={() => undefined} />,
    );
    expect(fluHtml).not.toContain('aria-label="."');

    const change = makeQuestion(activityById("u11-change")!.activity, rngFromSeed("dot:chg"));
    const chgHtml = renderToStaticMarkup(
      <AnswerPanel question={change} value="" setValue={() => undefined} onCheck={() => undefined} />,
    );
    expect(chgHtml).toContain('aria-label="."');

    const count = makeQuestion(activityById("u11-count")!.activity, rngFromSeed("dot:cnt"));
    const cntHtml = renderToStaticMarkup(
      <AnswerPanel question={count} value="" setValue={() => undefined} onCheck={() => undefined} />,
    );
    expect(cntHtml).toContain('aria-label="."');
  });
});
