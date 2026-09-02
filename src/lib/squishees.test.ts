import { describe, expect, it } from "vitest";
import { RARE_PRICE, squisheePrice } from "./coins";
import { squisheeById, squisheePokeSrc, SQUISHEE_IDS } from "./squishees";

describe("poke clips", () => {
  it("is only frog and cat", () => {
    expect(squisheePokeSrc("frog")).toMatch(/squishees\/frog-poke\.mp4$/);
    expect(squisheePokeSrc("cat")).toMatch(/squishees\/cat-poke\.mp4$/);
    expect(squisheePokeSrc("panda")).toBeNull();
    expect(squisheePokeSrc("peach")).toBeNull();
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
