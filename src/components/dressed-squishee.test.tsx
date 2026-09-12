import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CandyPath } from "@/components/candy-path";
import { DressedSquishee } from "@/components/dressed-squishee";
import { Mascot } from "@/components/mascot";
import { ShelfPage } from "@/pages/shelf";
import { resetProgressMemory, useProgress } from "@/lib/progress";

describe("DressedSquishee Imagine portraits", () => {
  beforeEach(() => {
    resetProgressMemory();
  });

  afterEach(() => {
    resetProgressMemory();
  });

  it("uses the capybara party-hat Imagine file, not a generic sticker", () => {
    const html = renderToStaticMarkup(<DressedSquishee id="capybara" cosmetic="party-hat" />);
    expect(html).toContain('data-dressed="capybara"');
    expect(html).toContain('data-cosmetic-hat="party-hat"');
    expect(html).toContain("cosmetics/capybara-party-hat.png");
    expect(html).not.toContain("hat-party.png");
    expect(html).not.toContain("art/cosmetics/");
    expect(html).not.toContain("cosmetic-overlay");
  });

  it("uses a rare scarf Imagine file", () => {
    const html = renderToStaticMarkup(<DressedSquishee id="galaxy-narwhal" cosmetic="scarf" />);
    expect(html).toContain("cosmetics/galaxy-narwhal-scarf.png");
    expect(html).toContain('data-cosmetic-neck="scarf"');
    expect(html).not.toContain("art/cosmetics/scarf.png");
  });

  it("shows one Imagine portrait when hat and scarf are both listed", () => {
    const html = renderToStaticMarkup(<DressedSquishee id="peach" cosmetic={["party-hat", "scarf"]} />);
    expect(html).toContain("peach-party-hat.png");
    expect(html).toContain('data-cosmetic-hat="party-hat"');
    expect(html).not.toContain("art/cosmetics/scarf.png");
    expect(html).not.toContain("cosmetic-overlay");
  });

  function dressCapybara() {
    useProgress.getState().unlockSquishee("capybara");
    useProgress.getState().setHopperId("capybara");
    useProgress.getState().awardCoins(6);
    expect(useProgress.getState().buyCosmetic("party-hat")).toEqual({ ok: true, reason: "ok" });
    expect(useProgress.getState().equipCosmetic("party-hat")).toBe(true);
  }

  it("puts the capybara Imagine hat on the Lessons hopper", () => {
    dressCapybara();
    const hopper = renderToStaticMarkup(
      <CandyPath suggestedId="u2" standFrom={1} standTo={1} onStart={() => {}} onOpenUnit={() => {}} />,
    );
    expect(hopper).toContain('data-path-hopper="capybara"');
    expect(hopper).toContain('data-cosmetic-hat="party-hat"');
    expect(hopper).toContain("cosmetics/capybara-party-hat.png");
    expect(hopper).not.toContain("hat-party.png");
  });

  it("puts the capybara Imagine hat on the play mascot", () => {
    dressCapybara();
    expect(useProgress.getState().hopperId).toBe("capybara");
    const mascot = renderToStaticMarkup(<Mascot />);
    expect(mascot).toContain('data-dressed="capybara"');
    expect(mascot).toContain('data-cosmetic-hat="party-hat"');
    expect(mascot).toContain("cosmetics/capybara-party-hat.png");
  });

  it("puts the capybara Imagine hat on the Shelf picker", () => {
    dressCapybara();
    const html = renderToStaticMarkup(<ShelfPage />);
    expect(html).toContain('data-avatar-hero="capybara"');
    expect(html).toContain("cosmetics/capybara-party-hat.png");
    expect(html).toContain('data-avatar-pick="capybara"');
  });
});
