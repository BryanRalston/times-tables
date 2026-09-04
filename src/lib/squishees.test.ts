import { describe, expect, it } from "vitest";
import { RARE_PRICE, squisheePrice } from "./coins";
import {
  cheerFile,
  cheerStripFile,
  cheerStripJsonFile,
  parsePokeStripJson,
  pokeStripFile,
  pokeStripJsonFile,
  pokeStripSrc,
  squisheeById,
  squisheeCheerSrc,
  squisheeCheerStrip,
  squisheePokeSrc,
  squisheePokeStrip,
  SQUISHEE_IDS,
} from "./squishees";

describe("poke clips", () => {
  it("is frog, cat, and bunny", () => {
    expect(squisheePokeSrc("frog")).toMatch(/squishees\/frog-poke\.mp4$/);
    expect(squisheePokeSrc("cat")).toMatch(/squishees\/cat-poke\.mp4$/);
    expect(squisheePokeSrc("bunny")).toMatch(/squishees\/bunny-poke\.mp4$/);
    expect(squisheePokeSrc("panda")).toBeNull();
    expect(squisheePokeSrc("peach")).toBeNull();
  });
});

describe("poke strips", () => {
  it("parses kitchen strip json", () => {
    expect(parsePokeStripJson({ frames: 16, fps: 12, cell: 384, src: "cat-poke-strip.png" })).toEqual({
      frames: 16,
      fps: 12,
      cell: 384,
      src: "cat-poke-strip.png",
    });
    expect(parsePokeStripJson({ frames: 16, fps: 12, cell: 384, src: "squishees/frog-poke-strip.png" })?.src).toBe(
      "frog-poke-strip.png",
    );
    expect(parsePokeStripJson({ frames: 1, fps: 12, cell: 384, src: "cat-poke-strip.png" })).toBeNull();
    expect(parsePokeStripJson({ frames: 16, fps: 12, cell: 384, src: "../x.png" })).toBeNull();
    expect(parsePokeStripJson(null)).toBeNull();
  });

  it("uses <id>-poke-strip convention and ships cat, frog, bunny", () => {
    expect(pokeStripFile("cat")).toBe("cat-poke-strip.png");
    expect(pokeStripJsonFile("cat")).toBe("cat-poke-strip.json");
    expect(pokeStripSrc({ frames: 16, fps: 12, cell: 384, src: "cat-poke-strip.png" })).toBe(
      "/times-tables/squishees/cat-poke-strip.png",
    );
    expect(squisheePokeStrip("cat")).toEqual({
      frames: 16,
      fps: 12,
      cell: 384,
      src: "/times-tables/squishees/cat-poke-strip.png",
    });
    expect(squisheePokeStrip("frog")?.src).toMatch(/squishees\/frog-poke-strip\.png$/);
    expect(squisheePokeStrip("bunny")?.src).toMatch(/squishees\/bunny-poke-strip\.png$/);
    expect(squisheePokeStrip("panda")).toBeNull();
  });
});

describe("cheer clips", () => {
  it("every squishee ships <id>-cheer hop, not poke", () => {
    expect(cheerFile("panda")).toBe("panda-cheer.mp4");
    expect(cheerStripFile("panda")).toBe("panda-cheer-strip.png");
    expect(cheerStripJsonFile("bunny")).toBe("bunny-cheer-strip.json");
    for (const id of SQUISHEE_IDS) {
      const s = squisheeById(id)!;
      expect(s.cheer).toBe(`${id}-cheer.mp4`);
      expect(s.cheerStrip).toEqual({
        frames: 36,
        fps: 24,
        cell: 384,
        src: `${id}-cheer-strip.png`,
      });
      expect(squisheeCheerSrc(id)).toMatch(new RegExp(`squishees/${id}-cheer\\.mp4$`));
      expect(squisheeCheerSrc(id)).not.toMatch(/poke/);
      expect(squisheeCheerStrip(id)?.src).toMatch(new RegExp(`squishees/${id}-cheer-strip\\.png$`));
      expect(squisheeCheerStrip(id)?.src).not.toMatch(/poke/);
    }
    expect(squisheeCheerSrc("avocado")).toMatch(/squishees\/avocado-cheer\.mp4$/);
    expect(squisheeCheerSrc("avocado")).not.toMatch(/poke/);
    expect(squisheeCheerSrc("panda")).toMatch(/squishees\/panda-cheer\.mp4$/);
    expect(squisheeCheerSrc("bunny")).toMatch(/squishees\/bunny-cheer\.mp4$/);
    expect(squisheeCheerStrip("panda")).toEqual({
      frames: 36,
      fps: 24,
      cell: 384,
      src: "/times-tables/squishees/panda-cheer-strip.png",
    });
  });
});

describe("auto-rare", () => {
  it("does not export pickPrize", async () => {
    const mod = await import("./squishees");
    expect("pickPrize" in mod).toBe(false);
    expect("eligibleRares" in mod).toBe(false);
  });
});

describe("new shop toys", () => {
  it("registers the twelve new squishees", () => {
    expect(SQUISHEE_IDS).toEqual(
      expect.arrayContaining([
        "capybara",
        "axolotl",
        "red-panda",
        "boba",
        "toast",
        "cactus",
        "sleepy-moon",
        "blush-cloud",
        "mushroom",
        "dumpling",
        "matcha",
        "sloth",
      ]),
    );
    expect(squisheeById("axolotl")?.id).toBe("axolotl");
    expect(squisheeById("crystal-axolotl")?.id).toBe("crystal-axolotl");
    expect(squisheeById("sleepy-moon")?.rarity).toBe("rare");
    expect(squisheeById("blush-cloud")?.rarity).toBe("rare");
    expect(squisheePrice("sleepy-moon")).toBe(RARE_PRICE);
    expect(squisheeById("capybara")?.rarity).toBe("common");
    expect(squisheeById("red-panda")?.rarity).toBe("common");
  });
});
