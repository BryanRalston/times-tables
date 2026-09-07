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
  it("locked tiles are mystery silhouettes, not full-color spoilers", () => {
    const html = renderToStaticMarkup(<ShelfPage />);
    expect(html).toContain("data-silhouette");
    expect(html).toContain("squishee-silhouette");
    expect(html).toContain("???");
    expect(html).toContain("frog.png");
    expect(html).not.toContain("Poke Bear");
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
});
