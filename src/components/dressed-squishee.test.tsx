import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CandyPath } from "@/components/candy-path";
import { DressedSquishee } from "@/components/dressed-squishee";
import { Mascot } from "@/components/mascot";
import { resetProgressMemory, useProgress } from "@/lib/progress";

describe("DressedSquishee overlays", () => {
  beforeEach(() => {
    resetProgressMemory();
  });

  afterEach(() => {
    resetProgressMemory();
  });

  it("stacks a hat overlay on a non-composite face", () => {
    const html = renderToStaticMarkup(<DressedSquishee id="capybara" cosmetic="party-hat" />);
    expect(html).toContain('data-dressed="capybara"');
    expect(html).toContain('data-cosmetic-hat="party-hat"');
    expect(html).toContain("hat-party.png");
    expect(html).toContain("capybara.png");
    expect(html).not.toContain("capybara-party-hat.png");
  });

  it("keeps a peach composite and still overlays a scarf", () => {
    const html = renderToStaticMarkup(<DressedSquishee id="peach" cosmetic={["party-hat", "scarf"]} />);
    expect(html).toContain("peach-party-hat.png");
    expect(html).toContain('data-cosmetic-hat="party-hat"');
    expect(html).toContain('data-cosmetic-neck="scarf"');
    expect(html).toContain("art/cosmetics/scarf.png");
  });

  function dressCapybara() {
    useProgress.getState().unlockSquishee("capybara");
    useProgress.getState().setHopperId("capybara");
    useProgress.getState().awardCoins(6);
    expect(useProgress.getState().buyCosmetic("party-hat")).toEqual({ ok: true, reason: "ok" });
    expect(useProgress.getState().equipCosmetic("party-hat")).toBe(true);
  }

  it("puts the hat on the Lessons hopper for capybara", () => {
    dressCapybara();
    const hopper = renderToStaticMarkup(
      <CandyPath suggestedId="u2" standFrom={1} standTo={1} onStart={() => {}} onOpenUnit={() => {}} />,
    );
    expect(hopper).toContain('data-path-hopper="capybara"');
    expect(hopper).toContain('data-cosmetic-hat="party-hat"');
    expect(hopper).toContain("hat-party.png");
    expect(hopper).toContain("capybara.png");
  });

  it("puts the hat on the play mascot for capybara", () => {
    dressCapybara();
    expect(useProgress.getState().hopperId).toBe("capybara");
    expect(useProgress.getState().squishees).toContain("capybara");
    const mascot = renderToStaticMarkup(<Mascot />);
    expect(mascot).toContain('data-dressed="capybara"');
    expect(mascot).toContain('data-cosmetic-hat="party-hat"');
    expect(mascot).toContain("hat-party.png");
  });
});
