import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CandyPath } from "./candy-path";

describe("CandyPath", () => {
  it("maps all 13 Grade 3 units on one tall map and locks later nodes", () => {
    const html = renderToStaticMarkup(
      <CandyPath suggestedId="u5" onStart={() => {}} onOpenUnit={() => {}} />,
    );
    expect(html).toContain("data-grade-path");
    expect(html).toContain("data-candy-world");
    expect(html).toContain("Ten-Frame Meadow");
    expect(html).toContain("Coin Cove");
    expect(html).toContain("Fraction Forest");
    expect(html).toContain('data-path-unit="u1"');
    expect(html).toContain('data-path-unit="u13"');
    expect(html).toContain('data-path-status="now"');
    expect(html).toContain('data-path-status="open"');
    expect(html).toContain('data-path-status="locked"');
    expect(html).toMatch(/data-path-unit="u5"[^>]*data-path-status="now"/);
    expect(html).toMatch(/data-path-unit="u4"[^>]*data-path-status="open"/);
    expect(html).toMatch(/data-path-unit="u13"[^>]*data-path-status="locked"/);
    expect(html).toContain('data-path-hopper="peach"');
    expect(html).toContain("peach.png");
    expect(html).toContain("data-candy-fog");
    expect(html).toContain("data-candy-mist");
    expect(html).toContain("data-candy-tall-map");
    expect(html).toContain("candy-zones/tall-map.png");
    expect(html).toContain('data-path-fog="1"');
    expect(html).toContain("data-path-tall");
    expect((html.match(/data-path-pad="1"/g) ?? []).length).toBe(13);
    expect((html.match(/data-path-unit="/g) ?? []).length).toBe(13);
    expect(html).not.toContain("data-candy-plates-blend");
    expect(html).not.toContain("data-candy-plate");
    expect(html).not.toContain("candy-zones/meadow.png");
    expect(html).not.toContain("candy-zones/cove.png");
    expect(html).not.toContain("candy-zones/forest.png");
    expect(html).not.toContain("candy-fog-cloud");
    expect(html).not.toContain("tf-bed");
    expect(html).not.toContain("pie-tree");
    expect(html).not.toContain("sailboat");
    expect(html).not.toContain("candy-sprinkle");
    expect(html).not.toContain("g4-");
  });

  it("keeps nearby nodes clear and fogs the far forest on unit 1", () => {
    const html = renderToStaticMarkup(
      <CandyPath suggestedId="u1" onStart={() => {}} onOpenUnit={() => {}} />,
    );
    expect(html).toMatch(/data-path-unit="u1"[^>]*data-path-fog="0"/);
    expect(html).toMatch(/data-path-unit="u3"[^>]*data-path-fog="0"/);
    expect(html).toMatch(/data-path-unit="u4"[^>]*data-path-fog="1"/);
    expect(html).toMatch(/data-path-unit="u13"[^>]*data-path-fog="1"/);
    expect(html).toContain("Mist hides the path ahead");
  });
});
