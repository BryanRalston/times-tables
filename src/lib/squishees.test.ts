import { describe, expect, it } from "vitest";
import { squisheePokeSrc } from "./squishees";

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
