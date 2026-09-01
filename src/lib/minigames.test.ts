import { describe, expect, it } from "vitest";
import { applyWhoHidPick, dealMatch, dealPoke, dealWhoHid, pickMiniKind } from "./minigames";
import { rngFromSeed } from "./rng";

describe("minigame picker", () => {
  it("cycles all 3 kinds across seeds", () => {
    const kinds = new Set<string>();
    for (let i = 0; i < 60; i++) kinds.add(pickMiniKind(`minigame:kid:u1-tally:${i}`));
    expect(kinds).toEqual(new Set(["match", "who-hid", "poke"]));
  });
});

describe("match", () => {
  it("always deals two different toy ids", () => {
    for (const owned of [[], ["frog"], ["panda"], ["frog", "cat"]]) {
      for (let i = 0; i < 20; i++) {
        const d = dealMatch(owned, rngFromSeed(`match:${owned.join(",")}:${i}`));
        const toys = [...new Set(d.cards.map((c) => c.toy))];
        expect(toys, `owned ${owned.join(",")}`).toHaveLength(2);
        expect(d.cards).toHaveLength(4);
      }
    }
  });
});

describe("who-hid and poke-this", () => {
  it("keeps the missing toy in who-hid choices and the poke target in poke choices", () => {
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

  it("miss does not call onDone", () => {
    let done = 0;
    let miss = 0;
    applyWhoHidPick("frog", "cat", () => {
      done += 1;
    }, () => {
      miss += 1;
    });
    expect(done).toBe(0);
    expect(miss).toBe(1);
    applyWhoHidPick("frog", "frog", () => {
      done += 1;
    }, () => {
      miss += 1;
    });
    expect(done).toBe(1);
    expect(miss).toBe(1);
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
