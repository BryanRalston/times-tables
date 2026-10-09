import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { STORAGE_KEY as MATH_KEY } from "@/lib/progress";
import { defaultLevels } from "./games/registry";
import { MAX_CHILDREN } from "./model";
import { SAVE_VERSION, STORAGE_KEY, addChild, blankChild, freshSave, loadSave, mapActive, parseSave, withGrade, withLevel, writeSave } from "./storage";

describe("academy save", () => {
  it("keeps a separate localStorage key from Squishee Math", () => {
    expect(STORAGE_KEY).toBe("squishee-academy-v1");
    expect(STORAGE_KEY).not.toBe(MATH_KEY);
  });

  it("drops corrupt saves and caps the family at four children", () => {
    const fresh = parseSave("nope");
    expect(fresh.children).toHaveLength(1);
    expect(fresh.children[0]?.name).toBe("");
    expect(fresh.version).toBe(SAVE_VERSION);

    const parsed = parseSave({
      version: 1,
      activeId: "maya",
      sound: false,
      children: [
        {
          id: "maya",
          name: "Maya!!!",
          grade: "3",
          avatarId: "peach",
          stars: 12.8,
          streak: 4,
          lastPlayed: "2026-10-09",
          opened: 3,
          skills: { "table:2": { ok: 3, miss: 1 } },
          secondsByDay: { "2026-10-09": 90, nope: 5 },
          bestStars: { times: 2, add: 0, time: 9 },
          rounds: 4,
          levels: { times: "mix", add: "within20", time: "half" },
        },
      ],
    });
    expect(parsed.sound).toBe(false);
    expect(parsed.children[0]?.name).toBe("Maya");
    expect(parsed.children[0]?.stars).toBe(12);
    expect(parsed.children[0]?.levels.times).toBe("mix");
    expect(parsed.children[0]?.bestStars.time).toBe(3);
    expect(parsed.children[0]?.secondsByDay).toEqual({ "2026-10-09": 90 });

    let save = freshSave();
    save = { ...save, children: [blankChild({ id: "a", name: "Maya", grade: "3" })], activeId: "a" };
    save = addChild(save, "Leo", "K");
    save = addChild(save, "Nia", "1");
    save = addChild(save, "Sam", "2");
    expect(save.children).toHaveLength(MAX_CHILDREN);
    expect(addChild(save, "Jo", "K")).toBe(save);
    expect(save.children[1]?.avatarId).toBe("frog");
    expect(save.children[1]?.levels).toEqual(defaultLevels("K"));
  });

  it("sets levels from the grade and lets a single game change", () => {
    const maya = withGrade(blankChild({ name: "Maya", grade: "K" }), "3");
    expect(maya.levels).toEqual(defaultLevels("3"));
    const tweaked = withLevel(maya, "add", "within20");
    expect(tweaked.levels.add).toBe("within20");
    expect(tweaked.levels.times).toBe(defaultLevels("3").times);
    expect(withLevel(tweaked, "add", "nope").levels.add).toBe("within20");
    const save = mapActive(
      { version: 1, activeId: maya.id, sound: true, children: [maya, blankChild({ id: "leo", name: "Leo" })] },
      (child) => ({ ...child, stars: 4 }),
    );
    expect(save.children[0]?.stars).toBe(4);
    expect(save.children[1]?.stars).toBe(0);
  });

  it("migrates version 1 saves and leaves a newer schema on disk", () => {
    const migrated = parseSave({
      version: 1,
      activeId: "maya",
      children: [
        {
          id: "maya",
          name: "Maya",
          grade: "3",
          levels: { times: "mix", add: "within20" },
          bestStars: { times: 2 },
        },
      ],
    });
    expect(migrated.version).toBe(SAVE_VERSION);
    expect(migrated.children[0]?.levels.times).toBe("mix");
    expect(migrated.children[0]?.levels.time).toBe(defaultLevels("3").time);
    expect(migrated.children[0]?.bestStars).toEqual({
      times: 2,
      add: 0,
      time: 0,
      money: 0,
      sight: 0,
      spelling: 0,
    });
    expect(migrated.children[0]?.words).toEqual({});
    expect(migrated.children[0]?.coins).toBe(0);
    expect(migrated.children[0]?.journey).toEqual({ areaId: "times", stop: 0, bosses: [] });
    expect(migrated.children[0]?.dailyGift).toBe("none");

    const repaired = parseSave({
      version: 1,
      activeId: "ava",
      children: [{ id: "ava", name: "Ava", grade: "1", levels: "nope" }],
    });
    expect(repaired.children[0]?.levels).toEqual(defaultLevels("1"));

    const fromV2 = parseSave({
      version: 2,
      activeId: "maya",
      sound: true,
      children: [
        {
          id: "maya",
          name: "Maya",
          grade: "2",
          stars: 11,
          streak: 3,
          lastPlayed: "2026-10-08",
          levels: { times: "twos", add: "within10", time: "half" },
          bestStars: { times: 2, add: 1, time: 3 },
        },
      ],
    });
    expect(fromV2.version).toBe(SAVE_VERSION);
    expect(fromV2.children[0]?.stars).toBe(11);
    expect(fromV2.children[0]?.streak).toBe(3);
    expect(fromV2.children[0]?.levels.time).toBe("half");
    expect(fromV2.children[0]?.levels.money).toBe(defaultLevels("2").money);
    expect(fromV2.children[0]?.bestStars.money).toBe(0);
    expect(fromV2.children[0]?.coins).toBe(0);
    expect(fromV2.children[0]?.journey.areaId).toBe("times");
    expect(fromV2.children[0]?.words).toEqual({});

    const fromV3 = parseSave({
      version: 3,
      activeId: "maya",
      sound: true,
      children: [
        {
          id: "maya",
          name: "Maya",
          grade: "2",
          stars: 4,
          coins: 7,
          levels: { times: "twos" },
          journey: { areaId: "add", stop: 1, bosses: ["times"] },
        },
      ],
    });
    expect(fromV3.version).toBe(SAVE_VERSION);
    expect(fromV3.children[0]?.coins).toBe(7);
    expect(fromV3.children[0]?.words).toEqual({});
    expect(fromV3.children[0]?.journey).toEqual({ areaId: "add", stop: 1, bosses: ["times"] });
    expect(fromV3.children[0]?.levels.sight).toBe(defaultLevels("2").sight);
    expect(fromV3.children[0]?.levels.spelling).toBe(defaultLevels("2").spelling);

    const mem = new Map<string, string>();
    const disk = {
      version: 9,
      activeId: "maya",
      sound: true,
      children: [{ id: "maya", name: "Maya", grade: "2", stars: 4 }],
    };
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => mem.get(key) ?? null,
      setItem: (key: string, value: string) => {
        mem.set(key, value);
      },
      removeItem: (key: string) => {
        mem.delete(key);
      },
    });
    mem.set(STORAGE_KEY, JSON.stringify(disk));
    const loaded = loadSave();
    expect(loaded.children[0]?.stars).toBe(4);
    writeSave({
      ...loaded,
      children: loaded.children.map((child) => ({ ...child, stars: 99 })),
    });
    const kept = JSON.parse(mem.get(STORAGE_KEY) ?? "{}") as { version: number; children: { stars: number }[] };
    expect(kept.version).toBe(9);
    expect(kept.children[0]?.stars).toBe(4);
    mem.delete(STORAGE_KEY);
    loadSave();
    vi.unstubAllGlobals();
  });

  it("keeps the offline worker on the academy path", () => {
    const sw = readFileSync("public/academy-sw.js", "utf8");
    const main = readFileSync("src/academy/main.tsx", "utf8");
    expect(sw).toContain("/times-tables/academy");
    expect(sw).toContain("/times-tables/index.html");
    expect(sw).toContain("precache-manifest.json");
    expect(main).toContain('scope: "/times-tables/academy/"');
    expect(main).not.toContain('scope: "/times-tables/"');
  });
});
