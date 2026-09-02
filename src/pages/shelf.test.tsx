import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { COMMON_PRICE, RARE_PRICE, squisheePrice } from "@/lib/coins";
import { squisheeById } from "@/lib/squishees";
import { ShelfPage, ShopCard } from "./shelf";

describe("shop prices", () => {
  it("commons cost 10 and rares cost 50", () => {
    expect(squisheePrice("frog")).toBe(COMMON_PRICE);
    expect(squisheePrice("panda")).toBe(COMMON_PRICE);
    expect(squisheePrice("aurora-jelly")).toBe(RARE_PRICE);
    expect(squisheePrice("crystal-axolotl")).toBe(RARE_PRICE);
  });
});

describe("shop tiles", () => {
  it("shows real squishee art on locked tiles, not a brightness-0 silhouette", () => {
    const html = renderToStaticMarkup(<ShelfPage />);
    expect(html).toContain("squishees/");
    expect(html).toContain("frog.png");
    expect(html).not.toContain("brightness-0");
    expect(html).not.toContain("???");
  });

  it("owned avocado tile is a poke button with squash machinery", () => {
    const avocado = squisheeById("avocado")!;
    const html = renderToStaticMarkup(<ShopCard s={avocado} got coins={0} onBuy={() => {}} />);
    expect(html).toContain("Poke Avocado");
    expect(html).toContain("<button");
    expect(html).toContain("overflow-visible");
    expect(html).toContain("data-squash");
    expect(html).not.toContain("pointer-events-none");
  });

  it("locked avocado is buy-only, not a poke button", () => {
    const avocado = squisheeById("avocado")!;
    const html = renderToStaticMarkup(<ShopCard s={avocado} got={false} coins={0} onBuy={() => {}} />);
    expect(html).not.toContain("Poke Avocado");
    expect(html).toContain("avocado.png");
    expect(html).toContain("pointer-events-none");
  });
});
