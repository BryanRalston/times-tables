import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnswerReadout, ClockKeys, Keypad } from "./keypad";

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
  });
});
