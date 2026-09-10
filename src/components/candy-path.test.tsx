import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetProgressMemory } from "@/lib/progress";
import { HOP_SNAP_PX, RADIAL_PAD_COUNT, RADIAL_PADS, START_PAD, adjacentPadIds } from "@/lib/radial-web";
import { CandyPath } from "./candy-path";

const HERE = dirname(fileURLToPath(import.meta.url));

describe("CandyPath", () => {
  beforeEach(() => {
    resetProgressMemory();
  });

  afterEach(() => {
    resetProgressMemory();
  });

  it("paints the radial-web map with hop pads and a Grade 3 unit rail", () => {
    const html = renderToStaticMarkup(
      <CandyPath suggestedId="u5" onStart={() => {}} onOpenUnit={() => {}} />,
    );
    expect(html).toContain("data-grade-path");
    expect(html).toContain("data-radial-web");
    expect(html).toContain("data-candy-world");
    expect(html).toContain("data-candy-radial-map");
    expect(html).toContain("candy-zones/radial-web-locked.jpg");
    expect(html).toContain('data-path-unit="u1"');
    expect(html).toContain('data-path-unit="u13"');
    expect(html).toContain('data-path-status="now"');
    expect(html).toContain('data-path-status="open"');
    expect(html).toMatch(/data-path-unit="u5"[^>]*data-path-status="now"/);
    expect(html).toContain('data-path-hopper="peach"');
    expect(html).toContain(`data-path-hop-to="${START_PAD}"`);
    expect(html).toContain('data-path-travel="0"');
    expect(html).toContain("candy-hopper-shadow");
    expect(html).toContain("peach.png");
    expect(html).toContain("translate(-50%, -108%)");
    expect(html).toContain('data-hop-credits="0"');
    expect(html).toContain('data-path-clear-obstacle="0"');
    expect((html.match(/data-path-pad="1"/g) ?? []).length).toBe(RADIAL_PAD_COUNT);
    expect((html.match(/data-path-unit="/g) ?? []).length).toBe(13);
    expect((html.match(/data-pad-portal="1"/g) ?? []).length).toBe(12);
    expect(html).not.toContain("data-candy-tall-map");
    expect(html).not.toContain("candy-zones/tall-map.png");
    expect(html).not.toContain("data-candy-fog");
    expect(html).not.toContain("data-path-obstacle");
    expect(html).not.toContain("data-candy-water");
    expect(html).not.toContain("Ten-Frame Meadow");
    expect(html).not.toContain("g4-");
    expect(html).not.toContain("data-portal-pair");
    expect(html).not.toContain("data-portal-to");
    expect(html).not.toContain("data-trail-peek");
  });

  it("offers adjacent one-space choices after a small lesson, without auto-hopping", () => {
    const next = adjacentPadIds(START_PAD);
    const html = renderToStaticMarkup(
      <CandyPath suggestedId="u2" standFrom={1} standTo={1} hopCredits={1} onStart={() => {}} onOpenUnit={() => {}} />,
    );
    expect(html).toContain('data-path-hop-from="1"');
    expect(html).toContain('data-path-hop-to="1"');
    expect(html).toContain('data-path-travel="0"');
    expect(html).toContain('data-hop-credits="1"');
    expect(html).toContain('data-hop-board="1"');
    expect(html).toContain('data-hop-pick="1"');
    expect(html).toContain(`data-hop-snap="${HOP_SNAP_PX}"`);
    expect((html.match(/data-pad-choice="1"/g) ?? []).length).toBe(next.length);
    expect((html.match(/data-pad-quiet="1"/g) ?? []).length).toBe(RADIAL_PAD_COUNT - next.length - 1);
    expect((html.match(/data-pad-here="1"/g) ?? []).length).toBe(1);
    expect(html).toContain("candy-hopper-here");
    expect(html).toContain("candy-node-quiet");
    expect(html).not.toContain('data-pad-enterable="1"');
    expect(html).not.toContain('data-path-hop-to="2"');
  });

  it("clears hop targets when credits are gone and still marks the current pad", () => {
    const html = renderToStaticMarkup(
      <CandyPath suggestedId="u2" standFrom={1} standTo={1} hopCredits={0} onStart={() => {}} onOpenUnit={() => {}} />,
    );
    expect(html).toContain('data-hop-credits="0"');
    expect(html).toContain('data-hop-board="1"');
    expect(html).toContain('data-hop-pick="0"');
    expect(html).not.toContain('data-pad-choice="1"');
    expect(html).not.toContain('data-pad-quiet="1"');
    expect(html).not.toContain('data-pad-enterable="1"');
    expect((html.match(/data-pad-here="1"/g) ?? []).length).toBe(1);
    expect(html).toContain("candy-hopper-here");
  });

  it("stays on a replayed pad instead of auto-hopping to the frontier", () => {
    const html = renderToStaticMarkup(
      <CandyPath suggestedId="u8" standFrom={3} standTo={3} onStart={() => {}} onOpenUnit={() => {}} />,
    );
    expect(html).toContain('data-path-hop-from="3"');
    expect(html).toContain('data-path-hop-to="3"');
    expect(html).toContain('data-path-travel="0"');
    expect(html).toMatch(/data-path-unit="u8"[^>]*data-path-status="now"/);
    expect((html.match(/data-path-pad="1"/g) ?? []).length).toBe(RADIAL_PAD_COUNT);
  });

  it("marks an adjacent portal hop as enterable without naming the exit", () => {
    const portal = RADIAL_PADS.find((p) => p.portal)!;
    const neighbor = adjacentPadIds(portal.id)[0]!;
    const html = renderToStaticMarkup(
      <CandyPath
        suggestedId="u2"
        standFrom={neighbor}
        standTo={neighbor}
        hopCredits={1}
        onStart={() => {}}
        onOpenUnit={() => {}}
      />,
    );
    expect(html).toContain('data-pad-enterable="1"');
    expect(html).toContain("candy-node-enterable");
    expect(html).toContain(`data-pad-id="${portal.id}"`);
    expect((html.match(/data-pad-enterable="1"/g) ?? []).length).toBe(1);
    expect(html).toContain("candy-node-quiet");
    expect(html).not.toContain("data-portal-pair");
    expect(html).not.toContain("data-portal-to");
    expect(html).toContain('data-path-warp="0"');
    expect(html).not.toContain("data-path-warp-fx");
  });

  it("never starts a multi-pad travel even if standTo is far away", () => {
    const html = renderToStaticMarkup(
      <CandyPath suggestedId="u13" standFrom={1} standTo={13} onStart={() => {}} onOpenUnit={() => {}} />,
    );
    expect(html).toContain('data-path-travel="0"');
    expect(html).toContain('data-path-hop-to="1"');
    expect((html.match(/data-path-pad="1"/g) ?? []).length).toBe(RADIAL_PAD_COUNT);
  });

  it("resolves phone taps on the board to the nearest glowing pad", () => {
    const src = readFileSync(join(HERE, "candy-path.tsx"), "utf8");
    expect(src).toContain("nearestHopTarget");
    expect(src).toContain("onPointerUp={onBoardPointerUp}");
    expect(src).toContain("board.getBoundingClientRect()");
  });
});
