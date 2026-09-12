import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Mascot } from "@/components/mascot";
import { DressedSquishee } from "@/components/dressed-squishee";
import { useProgress } from "@/lib/progress";
import { ShopCard } from "@/pages/shelf";
import { squisheeById } from "@/lib/squishees";

describe("fitted dress-up surfaces", () => {
  it("shows an otter hat composite on leftover mascot, hopper tile, and leftover-style peek", () => {
    useProgress.setState({
      squishees: ["otter"],
      hopperId: "otter",
      cosmetics: ["party-hat"],
      equippedCosmetic: "party-hat",
    });
    const leftover = renderToStaticMarkup(<Mascot pose="think" size="sm" />);
    expect(leftover).toContain('data-dressed="otter"');
    expect(leftover).toContain('data-cosmetic="party-hat"');
    expect(leftover).toMatch(/cosmetics\/otter-party-hat\.png/);
    expect(leftover).not.toMatch(/squishees\/otter\.png/);

    const otter = squisheeById("otter")!;
    const tile = renderToStaticMarkup(
      <ShopCard s={otter} got coins={0} hopperId="otter" onBuy={() => {}} onUse={() => {}} />,
    );
    expect(tile).toContain("otter-party-hat.png");
    expect(tile).toContain('data-cosmetic="party-hat"');

    const peek = renderToStaticMarkup(<DressedSquishee id="capybara" cosmetic="party-hat" />);
    expect(peek).toContain("capybara-party-hat.png");
    expect(peek).not.toContain("peach-party-hat.png");
  });
});
