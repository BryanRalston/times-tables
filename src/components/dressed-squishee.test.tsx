import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DressedSquishee } from "@/components/dressed-squishee";

const HERE = dirname(fileURLToPath(import.meta.url));

describe("fitted dress-up surfaces", () => {
  it("renders otter and capybara hat composites, and leftover/hopper/peek stay on DressedSquishee", () => {
    const leftover = renderToStaticMarkup(<DressedSquishee id="otter" cosmetic="party-hat" />);
    expect(leftover).toContain('data-dressed="otter"');
    expect(leftover).toContain('data-cosmetic="party-hat"');
    expect(leftover).toMatch(/cosmetics\/otter-party-hat\.png/);
    expect(leftover).not.toMatch(/squishees\/otter\.png/);

    const peek = renderToStaticMarkup(<DressedSquishee id="capybara" cosmetic="party-hat" />);
    expect(peek).toContain("capybara-party-hat.png");
    expect(peek).not.toContain("peach-party-hat.png");

    const mascot = readFileSync(join(HERE, "mascot.tsx"), "utf8");
    expect(mascot).toContain("DressedSquishee");
    expect(mascot).toContain("equippedCosmetic");
    const hopper = readFileSync(join(HERE, "candy-path.tsx"), "utf8");
    expect(hopper).toContain("DressedSquishee");
    expect(hopper).toContain("equippedCosmetic");
    const home = readFileSync(join(HERE, "chrome.tsx"), "utf8");
    expect(home).toContain("DressedSquishee");
    expect(home).toContain("equippedCosmetic");
    const shelf = readFileSync(join(HERE, "../pages/shelf.tsx"), "utf8");
    expect(shelf).toContain("isCosmeticFace(hopperId)");
    expect(shelf).toContain("canDressFace");
    expect(shelf).toContain("PokeToy");
    expect(shelf).toContain("cosmetic={equipped}");
    expect(shelf).toContain("cosmetic={dress}");
    const poke = readFileSync(join(HERE, "poke-toy.tsx"), "utf8");
    expect(poke).toContain("dressedSquisheeSrc");
    expect(poke).toContain("data-owned-poke");
    const mini = readFileSync(join(HERE, "minigame.tsx"), "utf8");
    expect(mini).toContain("dressedSquisheeSrc");
    expect(mini).toContain("wearForFace");
  });
});
