import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PokeToy } from "./poke-toy";

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

  it("keeps the PNG in the tree before a poke clip paints", () => {
    const html = renderToStaticMarkup(<PokeToy id="frog" />);
    expect(html).toContain("frog.png");
    expect(html).not.toContain("<video");
    expect(html).not.toContain("<canvas");
  });
});
