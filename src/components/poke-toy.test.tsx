import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PokeStrip, PokeToy } from "./poke-toy";

describe("PokeToy", () => {
  it("is a poke button, not a pointer-events-none image", () => {
    const html = renderToStaticMarkup(<PokeToy id="frog" size="sm" className="h-14 w-14" />);
    expect(html).toContain("Poke Frog");
    expect(html).toContain("frog.png");
    expect(html).toContain("<button");
    expect(html).not.toContain("pointer-events-none");
  });

  it("renders catalog toys used on home", () => {
    expect(renderToStaticMarkup(<PokeToy id="cat" />)).toContain("Poke Cat");
    expect(renderToStaticMarkup(<PokeToy id="panda" />)).toContain("Poke Panda");
    expect(renderToStaticMarkup(<PokeToy id="peach" />)).toContain("Poke Peach");
  });

  it("owned avocado is a poke button with squash machinery", () => {
    const html = renderToStaticMarkup(<PokeToy id="avocado" />);
    expect(html).toContain("Poke Avocado");
    expect(html).toContain("<button");
    expect(html).toContain("overflow-visible");
    expect(html).toContain("data-squash");
    expect(html).not.toContain("pointer-events-none");
  });

  it("keeps the PNG in the tree before a poke clip paints", () => {
    const html = renderToStaticMarkup(<PokeToy id="frog" />);
    expect(html).toContain("frog.png");
    expect(html).not.toContain("<video");
    expect(html).not.toContain("<canvas");
    expect(html).not.toContain("poke-strip");
    expect(html).not.toContain("frog-poke-strip.png");
  });

  it("PokeStrip is a steps sprite, not a video", () => {
    const html = renderToStaticMarkup(
      <PokeStrip src="/times-tables/squishees/cat-poke-strip.png" frames={16} fps={12} />,
    );
    expect(html).toContain("poke-strip");
    expect(html).toContain("cat-poke-strip.png");
    expect(html).toContain("steps(16, jump-none)");
    expect(html).not.toContain("<video");
    expect(html).not.toContain("<canvas");
  });

  it("cheer autoplay does not squash or use the poke clip", () => {
    const avocado = renderToStaticMarkup(<PokeToy id="avocado" cheer />);
    expect(avocado).toContain('data-cheer="1"');
    expect(avocado).toContain('data-squash="0"');
    expect(avocado).not.toContain('data-squash="1"');
    expect(avocado).toContain("avocado-cheer");
    expect(avocado).not.toContain("avocado-poke");
    expect(avocado).not.toContain("unlock-pop");
    expect(avocado).not.toMatch(/[\s"]squash[\s"]/);

    const panda = renderToStaticMarkup(<PokeToy id="panda" cheer />);
    expect(panda).toContain('data-cheer="1"');
    expect(panda).toContain('data-squash="0"');
    expect(panda).toContain("panda-cheer");
    expect(panda).not.toContain("panda-poke");
    expect(panda).not.toContain("unlock-pop");
    expect(panda).not.toMatch(/[\s"]squash[\s"]/);
  });
});
