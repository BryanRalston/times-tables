import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PRESENT_BOX_FILE } from "@/lib/presents";
import { MysteryPresent } from "./mystery-present";

describe("MysteryPresent", () => {
  it("paints an anonymous vinyl box with no loot leak", () => {
    const html = renderToStaticMarkup(<MysteryPresent />);
    expect(html).toContain('data-mystery-present="1"');
    expect(html).toContain('data-present-art="vinyl"');
    expect(html).toContain(PRESENT_BOX_FILE);
    expect(html).toContain("mystery-present-glow");
    expect(html).not.toContain("present-open.png");
    expect(html).not.toContain("crystal-axolotl");
    expect(html).not.toContain("galaxy-narwhal");
    expect(html).not.toContain("golden-dragon");
    expect(html).not.toContain("rainbow-cupcake");
    expect(html).not.toContain("capybara");
    expect(html).not.toContain("boba");
    expect(html).not.toContain("axolotl");
    expect(html).not.toContain("Crystal");
    expect(html).not.toContain("Rare");
    expect(html).not.toContain("coin-pile");
    expect(html).not.toContain("data-present-squishee");
  });

  it("skips the map glow on shelf tiles", () => {
    const html = renderToStaticMarkup(<MysteryPresent size="shelf" />);
    expect(html).toContain(PRESENT_BOX_FILE);
    expect(html).toContain("mystery-present-shelf");
    expect(html).not.toContain("mystery-present-glow");
  });

  it("uses the open vinyl box only while unwrapping", () => {
    const html = renderToStaticMarkup(<MysteryPresent opening size="shelf" />);
    expect(html).toContain("present-open.png");
    expect(html).not.toContain("present-closed.png");
  });
});
