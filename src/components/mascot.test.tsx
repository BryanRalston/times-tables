import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Mascot } from "./mascot";

describe("Mascot", () => {
  it("grown-up think pose stays a generic cat", () => {
    const html = renderToStaticMarkup(<Mascot pose="think" />);
    expect(html).toContain("cat.png");
    expect(html).not.toContain("hat-party.png");
  });

  it("play mascot uses the chosen squishee and wears a hat", () => {
    const html = renderToStaticMarkup(
      <Mascot id="frog" equipped={{ hat: "hat-party" }} pose="think" />,
    );
    expect(html).toContain('data-avatar="frog"');
    expect(html).toContain("frog.png");
    expect(html).not.toContain("cat.png");
    expect(html).toContain('data-cosmetic-hat="hat-party"');
    expect(html).toContain("hat-party.png");
  });
});
