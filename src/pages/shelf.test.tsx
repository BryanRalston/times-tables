import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { COMMON_PRICE, RARE_PRICE, squisheePrice } from "@/lib/coins";
import { resetProgressMemory, useProgress } from "@/lib/progress";
import { squisheeById } from "@/lib/squishees";
import { ShelfPage, ShopCard } from "./shelf";

afterEach(() => {
  resetProgressMemory();
});

describe("shop prices", () => {
  it("commons cost 10; rares keep a catalog price but are not sold", () => {
    expect(squisheePrice("frog")).toBe(COMMON_PRICE);
    expect(squisheePrice("panda")).toBe(COMMON_PRICE);
    expect(squisheePrice("aurora-jelly")).toBe(RARE_PRICE);
    expect(squisheePrice("crystal-axolotl")).toBe(RARE_PRICE);
  });
});

describe("shop tiles", () => {
  it("locked tiles are mystery silhouettes, not full-color spoilers", () => {
    const html = renderToStaticMarkup(<ShelfPage />);
    expect(html).toContain("data-silhouette");
    expect(html).toContain("squishee-silhouette");
    expect(html).toContain("???");
    expect(html).toContain("frog.png");
    expect(html).toContain("data-shelf-plank");
    expect(html).toContain("data-shelf-empty");
    expect(html).not.toContain("Poke Bear");
    expect(html).not.toContain("Squishee shop");
    expect(html).not.toMatch(/Buy\s*·/);
    expect(html).not.toContain("Spend coins on a toy");
    expect(html).toContain("Find mystery presents");
    expect(html).toContain("data-rare-find");
    expect(html).not.toContain("crystal-axolotl.png");
    expect(html).not.toContain("Crystal Axolotl");
    expect(html).toContain("data-avatar-picker");
    expect(html).toContain("Your piece");
    expect(html).toContain("data-shelf-dress");
    expect(html).toContain("Dress-up");
    expect(html).toContain("peach-party-hat.png");
    expect(html).toContain("data-buy-cosmetic=\"party-hat\"");
  });

  it("owned frog offers a Guest Use button without a Grown-ups PIN", () => {
    const frog = squisheeById("frog")!;
    const html = renderToStaticMarkup(
      <ShopCard s={frog} got coins={0} hopperId="peach" onBuy={() => {}} onUse={() => {}} />,
    );
    expect(html).toContain('data-use-piece="frog"');
    expect(html).toContain("Use");
    expect(html).not.toContain("enterPin");
    expect(html).not.toContain("Grown-up");
  });

  it("dressed hopper tile stays a poke button on the fitted composite", () => {
    useProgress.setState({
      squishees: ["otter"],
      hopperId: "otter",
      cosmetics: ["party-hat"],
      equippedCosmetic: "party-hat",
    });
    const otter = squisheeById("otter")!;
    const html = renderToStaticMarkup(
      <ShopCard s={otter} got coins={0} hopperId="otter" onBuy={() => {}} onUse={() => {}} />,
    );
    expect(html).toContain("Poke Otter");
    expect(html).toContain("data-owned-poke");
    expect(html).toContain('data-cosmetic="party-hat"');
    expect(html).toContain("otter-party-hat.png");
    expect(html).toContain("<button");
    expect(html).toContain("data-squash");
    expect(html).not.toMatch(/squishees\/otter\.png/);
  });

  it("owned avocado tile is a poke button with squash machinery", () => {
    const avocado = squisheeById("avocado")!;
    const html = renderToStaticMarkup(<ShopCard s={avocado} got coins={0} onBuy={() => {}} />);
    expect(html).toContain("Poke Avocado");
    expect(html).toContain("Avocado");
    expect(html).toContain("<button");
    expect(html).toContain("overflow-visible");
    expect(html).toContain("data-squash");
    expect(html).toContain("data-owned-poke");
    expect(html).not.toContain("data-silhouette");
    expect(html).not.toMatch(/<button[^>]*pointer-events-none/);
  });

  it("locked avocado is buy-only, not a poke button", () => {
    const avocado = squisheeById("avocado")!;
    const html = renderToStaticMarkup(<ShopCard s={avocado} got={false} coins={0} onBuy={() => {}} />);
    expect(html).not.toContain("Poke Avocado");
    expect(html).not.toContain(">Avocado<");
    expect(html).toContain("???");
    expect(html).toContain("data-silhouette");
    expect(html).toContain("squishee-silhouette");
    expect(html).toContain("avocado.png");
    expect(html).toContain("pointer-events-none");
  });

  it("buy cheer does not apply squash and never uses the poke clip", () => {
    const avocado = squisheeById("avocado")!;
    const av = renderToStaticMarkup(<ShopCard s={avocado} got coins={0} onBuy={() => {}} cheer />);
    expect(av).toContain('data-cheer="1"');
    expect(av).toContain("avocado-cheer");
    expect(av).not.toContain("avocado-poke");
    expect(av).not.toContain("unlock-pop");
    expect(av).not.toContain('data-squash="1"');
    expect(av).not.toMatch(/[\s"]squash[\s"]/);

    const panda = squisheeById("panda")!;
    const html = renderToStaticMarkup(<ShopCard s={panda} got coins={0} onBuy={() => {}} cheer />);
    expect(html).toContain('data-cheer="1"');
    expect(html).toContain("panda-cheer");
    expect(html).not.toContain("panda-poke");
    expect(html).not.toContain('data-squash="1"');
    expect(html).not.toMatch(/[\s"]squash[\s"]/);
  });

  it("locked rares are mystery presents, not priced spoilers", () => {
    const jelly = squisheeById("aurora-jelly")!;
    const html = renderToStaticMarkup(<ShopCard s={jelly} got={false} coins={100} onBuy={() => {}} />);
    expect(html).toContain("data-rare-find");
    expect(html).toContain("data-mystery-present");
    expect(html).toContain("???");
    expect(html).toContain("Find on Lessons");
    expect(html).not.toContain("Aurora Jelly");
    expect(html).not.toContain("aurora-jelly.png");
    expect(html).not.toContain("squishee-silhouette");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("Rare");
    expect(html).not.toMatch(/>\s*50\s*</);
  });
});
