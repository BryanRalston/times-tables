import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { todayIso } from "@/lib/calendar";
import { pickTrailPeekSpot, trailPeekHash } from "@/lib/grade-path";
import { resetProgressMemory } from "@/lib/progress";
import { CandyPath } from "./candy-path";

describe("CandyPath", () => {
  beforeEach(() => {
    resetProgressMemory();
  });

  afterEach(() => {
    resetProgressMemory();
  });

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
    expect(html).toContain('data-path-hop-to="5"');
    expect(html).toContain('data-path-travel="0"');
    expect(html).toContain('data-path-land="0"');
    expect(html).toContain("candy-hopper-shadow");
    expect(html).toContain('data-path-shadow="0"');
    expect(html).toContain("peach.png");
    expect(html).toContain("data-candy-fog");
    expect(html).toContain("data-candy-mist");
    expect(html).toContain("data-candy-tall-map");
    expect(html).toContain("candy-zones/tall-map.png");
    expect(html).toContain('data-path-fog="1"');
    expect(html).toContain("data-path-tall");
    expect(html).toContain('data-candy-sign="meadow"');
    expect(html).toContain('data-candy-sign="cove"');
    expect(html).toContain('data-candy-sign="forest"');
    expect(html).not.toContain("candy-star-on");
    expect(html).toContain('data-path-unit="u12"');
    expect(html).toContain('data-candy-prop-seat="shore"');
    expect(html).toContain('data-candy-prop-seat="land"');
    expect(html).toContain('data-candy-prop-seat="water"');
    expect(html).toContain("translate(-50%, -108%)");
    expect(html).toContain('data-path-obstacle="cove-boulder"');
    expect(html).toContain("candy-zones/overlays/cove-boulder.png");
    expect(html).toContain("candy-prop-obstacle");
    expect(html).toContain("width:24%");
    expect(html).not.toMatch(/<button[^>]*data-path-obstacle/);
    expect(html).toContain('data-candy-prop="waterfall"');
    expect(html).toContain('data-candy-prop="tenframe-a"');
    expect(html).toContain('data-candy-prop="tenframe-b"');
    expect(html).toContain('data-candy-prop="tenframe-e"');
    expect(html).toContain('data-candy-prop="flowers"');
    expect(html).toContain('data-candy-prop="daisies"');
    expect(html).toContain('data-candy-prop="palm"');
    expect(html).toContain('data-candy-prop="dock"');
    expect(html).toContain('data-candy-prop="sailboat"');
    expect(html).toContain('data-candy-prop="sailboat-b"');
    expect(html).toContain('data-candy-prop="coins"');
    expect(html).toContain('data-candy-prop="coins-c"');
    expect(html).not.toContain('data-candy-prop="coins-f"');
    expect(html).not.toContain('data-candy-prop="coin-spin"');
    expect(html).toContain('data-candy-prop="fraction-tree"');
    expect(html).toContain('data-candy-prop="fraction-tree-e"');
    expect(html).not.toContain('data-candy-prop="fraction-tree-j"');
    expect(html).not.toContain('data-candy-prop="candy-cane"');
    expect(html).not.toContain("candy-cane.png");
    expect(html).not.toContain("lollipop.png");
    expect(html).not.toContain("peppermint.png");
    expect(html).toContain("candy-zones/overlays/waterfall.png");
    expect(html).toContain("data-candy-water");
    expect(html).toContain("candy-zones/overlays/cove-water-mask.png");
    expect(html).toContain("candy-zones/overlays/tenframe-mound.png");
    expect(html).toContain("candy-zones/overlays/meadow-flowers.png");
    expect(html).toContain("candy-zones/overlays/dock.png");
    expect(html).toContain("candy-zones/overlays/sailboat.png");
    expect(html).toContain("candy-zones/overlays/fraction-tree.png");
    expect(html).toContain("candy-zones/overlays/coin-stack.png");
    expect(html).not.toContain("candy-prop-spin");
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
    expect(html).not.toContain("candy-sprinkle");
    expect(html).not.toContain("g4-");
    const peek = pickTrailPeekSpot(5, trailPeekHash(todayIso(), 5));
    expect(peek).toBeDefined();
    expect(html).toContain(`data-trail-peek="${peek!.id}"`);
    expect((html.match(/data-trail-peek="/g) ?? []).length).toBe(1);
    expect(html).toContain('data-peek-armed="0"');
    expect(html).toContain('data-peek-exited="0"');
    expect(html).toMatch(/data-peek-side="(left|right)"/);
    expect(html).not.toContain("data-squishee-shop");
    expect(html).not.toContain("data-trail-collect");
    expect(html).not.toContain("data-continue-peek");
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
    const peek = pickTrailPeekSpot(1, trailPeekHash(todayIso(), 1));
    expect(peek?.zone).toBe("meadow");
    expect(html).toContain(`data-trail-peek="${peek!.id}"`);
    expect((html.match(/data-trail-peek="/g) ?? []).length).toBe(1);
  });

  it("starts a return-to-map hop from the finished pad to the new now pad", () => {
    const html = renderToStaticMarkup(
      <CandyPath suggestedId="u2" standFrom={1} onStart={() => {}} onOpenUnit={() => {}} />,
    );
    expect(html).toContain('data-path-hop-from="1"');
    expect(html).toContain('data-path-hop-to="2"');
    expect(html).toContain('data-path-travel="1"');
    expect(html).toMatch(/data-path-unit="u2"[^>]*data-path-status="now"/);
    expect(html).toMatch(/data-path-unit="u1"[^>]*data-path-status="open"/);
  });

  it("stays on a replayed pad instead of auto-hopping to the frontier", () => {
    const html = renderToStaticMarkup(
      <CandyPath suggestedId="u8" standFrom={3} standTo={3} onStart={() => {}} onOpenUnit={() => {}} />,
    );
    expect(html).toContain('data-path-hop-from="3"');
    expect(html).toContain('data-path-hop-to="3"');
    expect(html).toContain('data-path-travel="0"');
    expect(html).toMatch(/data-path-unit="u8"[^>]*data-path-status="now"/);
    expect((html.match(/data-path-pad="1"/g) ?? []).length).toBe(13);
  });

  it("marks the 8 to 9 hop as a boulder vault", () => {
    const html = renderToStaticMarkup(
      <CandyPath suggestedId="u9" standFrom={8} standTo={9} onStart={() => {}} onOpenUnit={() => {}} />,
    );
    expect(html).toContain('data-path-travel="1"');
    expect(html).toContain('data-path-hop-from="8"');
    expect(html).toContain('data-path-hop-to="9"');
    expect(html).toContain('data-path-clear-obstacle="1"');
    expect(html).toContain('data-path-obstacle="cove-boulder"');
  });
});
