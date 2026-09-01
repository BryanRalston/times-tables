import { describe, expect, it } from "vitest";
import { dealPoke, dealWhoHid, pickMiniKind } from "./minigames";
import { rngFromSeed } from "./rng";

describe("minigame picker", () => {
  it("cycles all 3 kinds across seeds", () => {
    const kinds = new Set<string>();
    for (let i = 0; i < 60; i++) kinds.add(pickMiniKind(`minigame:kid:u1-tally:${i}`));
    expect(kinds).toEqual(new Set(["match", "who-hid", "poke"]));
  });
});

describe("who-hid and poke-this", () => {
  it("keeps the target in the offered set", () => {
    for (let i = 0; i < 40; i++) {
      const hid = dealWhoHid(["panda"], rngFromSeed(`wh:${i}`));
      expect(hid.shown).toContain(hid.missing);
      expect(hid.choices).toContain(hid.missing);
      expect(hid.missing).toBe("panda");
      expect(hid.shown).toHaveLength(3);
      expect(new Set(hid.shown).size).toBe(3);

      const poke = dealPoke(["otter"], rngFromSeed(`pk:${i}`));
      expect(poke.choices).toContain(poke.target);
      expect(poke.target).toBe("otter");
      expect(poke.choices).toHaveLength(3);
      expect(new Set(poke.choices).size).toBe(3);
    }
  });

  it("uses frog as a house stand-in when the shelf is empty", () => {
    const hid = dealWhoHid([], rngFromSeed("empty-hid"));
    expect(hid.missing).toBe("frog");
    expect(hid.choices).toContain("frog");
    const poke = dealPoke([], rngFromSeed("empty-poke"));
    expect(poke.target).toBe("frog");
    expect(poke.choices).toContain("frog");
  });
});
