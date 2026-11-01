import { describe, expect, it } from "vitest";
import { langFromLanding } from "./lang";

describe("langFromLanding", () => {
  const origin = "https://squisheeacademy.com";
  it("reads the language of a game landing page", () => {
    expect(langFromLanding(`${origin}/money-game/`, origin)).toBe("en");
    expect(langFromLanding(`${origin}/es/money-game/`, origin)).toBe("es");
    expect(langFromLanding(`${origin}/pt-br/shapes-geometry-game/`, origin)).toBe("pt");
    expect(langFromLanding(`${origin}/zh-hans/money-game/?x=1`, origin)).toBe("zh");
  });
  it("ignores other pages and other sites", () => {
    expect(langFromLanding("", origin)).toBeNull();
    expect(langFromLanding(`${origin}/`, origin)).toBeNull();
    expect(langFromLanding(`${origin}/worksheets/money/`, origin)).toBeNull();
    expect(langFromLanding(`${origin}/xx/money-game/`, origin)).toBeNull();
    expect(langFromLanding("https://google.com/money-game/", origin)).toBeNull();
  });
});
