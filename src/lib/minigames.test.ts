import { describe, expect, it } from "vitest";
import {
  applyWhoHidPick,
  dealHop,
  dealMatch,
  dealMini,
  dealPeek,
  dealPoke,
  dealTwin,
  dealWhoHid,
  MINI_KINDS,
  parseMiniKind,
  pickMiniKind,
  whoHidShowsFace,
} from "./minigames";
import { rngFromSeed } from "./rng";

describe("minigame picker", () => {
  it("cycles every end-walk kind across seeds and honors a force", () => {
    const kinds = new Set<string>();
    for (let i = 0; i < 120; i++) kinds.add(pickMiniKind(`minigame:kid:u1-tally:${i}`));
    expect(kinds).toEqual(new Set(MINI_KINDS));
    expect(pickMiniKind("anything", "who-hid")).toBe("who-hid");
    expect(pickMiniKind("anything", "peek")).toBe("peek");
    expect(parseMiniKind("nope")).toBeUndefined();
    expect(parseMiniKind("hop")).toBe("hop");
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
      expect(hid.choices).toEqual(hid.shown);

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

  it("never opens unfound faces after a guess", () => {
    expect(whoHidShowsFace("remember", "frog", null)).toBe(true);
    expect(whoHidShowsFace("choose", "frog", null)).toBe(false);
    expect(whoHidShowsFace("choose", "cat", null)).toBe(false);
    expect(whoHidShowsFace("choose", "frog", "frog")).toBe(true);
    expect(whoHidShowsFace("choose", "cat", "frog")).toBe(false);
    expect(whoHidShowsFace("choose", "panda", "frog")).toBe(false);
  });
});

describe("peek twin hop", () => {
  it("deals one peeker, two hopper twins, and one glowing pad", () => {
    for (let i = 0; i < 30; i++) {
      const peek = dealPeek(["peach"], rngFromSeed(`peek:${i}`));
      expect(peek.peeker).toBe("peach");
      expect(peek.spots).toBe(4);
      expect(peek.peekIndex).toBeGreaterThanOrEqual(0);
      expect(peek.peekIndex).toBeLessThan(4);

      const twin = dealTwin(["peach"], rngFromSeed(`twin:${i}`), "peach");
      expect(twin.hopper).toBe("peach");
      expect(twin.cards).toHaveLength(3);
      expect(twin.cards.filter((c) => c.toy === "peach")).toHaveLength(2);
      expect(twin.cards.filter((c) => c.toy !== "peach")).toHaveLength(1);

      const hop = dealHop(["frog"], rngFromSeed(`hop:${i}`), "frog");
      expect(hop.hopper).toBe("frog");
      expect(hop.pads).toBe(3);
      expect(hop.target).toBeGreaterThanOrEqual(0);
      expect(hop.target).toBeLessThan(3);
    }
  });

  it("dealMini stays exhaustive for every kind", () => {
    for (const kind of MINI_KINDS) {
      const deal = dealMini(kind, ["frog"], rngFromSeed(`deal:${kind}`), "frog");
      expect(deal.kind).toBe(kind);
    }
  });
});
