import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnswerReadout, Keypad } from "./keypad";

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
