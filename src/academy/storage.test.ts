import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { STORAGE_KEY as MATH_KEY } from "@/lib/progress";
import { MAX_CHILDREN, defaultLevels } from "./model";
import { STORAGE_KEY, addChild, blankChild, freshSave, mapActive, parseSave, withGrade, withLevel } from "./storage";

describe("academy save", () => {
  it("keeps a separate localStorage key from Squishee Math", () => {
    expect(STORAGE_KEY).toBe("squishee-academy-v1");
    expect(STORAGE_KEY).not.toBe(MATH_KEY);
  });

  it("drops corrupt saves and caps the family at four children", () => {
    const fresh = parseSave("nope");
    expect(fresh.children).toHaveLength(1);
    expect(fresh.children[0]?.name).toBe("");
    expect(fresh.version).toBe(1);

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

  it("keeps the offline worker on the academy path", () => {
    const sw = readFileSync("public/academy-sw.js", "utf8");
    const main = readFileSync("src/academy/main.tsx", "utf8");
    expect(sw).toContain("/times-tables/academy");
    expect(sw).toContain("/times-tables/index.html");
    expect(main).toContain('scope: "/times-tables/academy/"');
    expect(main).not.toContain('scope: "/times-tables/"');
  });
});
