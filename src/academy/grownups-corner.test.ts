import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { rngFromSeed } from "@/lib/rng";
import { GAME_CARDS } from "./games/catalog";
import { gameOffered } from "./games/offer";
import { tierWindow } from "./grade-map";
import { GROWNUP_HOLD_MS, gateAnswerMatches, grownupGate } from "./grownup-gate";
import { setLocale } from "./i18n";
import type { Save } from "./model";
import { blankChild, freshSave, parseSave, tierFor, withGrade, withTier } from "./storage";
import { Foot } from "./ui/bits";
import { GrownupSettings, withChallengeAhead } from "./ui/grownup-settings";
import { GrownupsScreen } from "./ui/grownups";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const g = globalThis as { sessionStorage?: unknown };

function saveFor(grade: "1" | "3"): Save {
  const kid = blankChild({ id: "noor", name: "Noor", grade });
  return { ...freshSave(), activeId: kid.id, children: [kid] };
}

function withSession(value: string | null) {
  const store = new Map<string, string>();
  if (value) store.set("squishee-academy-gate", value);
  g.sessionStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, next: string) => store.set(key, next),
  };
}

afterEach(() => {
  setLocale("en");
  delete g.sessionStorage;
});

describe("grown-ups gate", () => {
  it("needs a 2-second hold, then the right sum; a wrong answer is not accepted", () => {
    expect(GROWNUP_HOLD_MS).toBe(2000);
    const gate = grownupGate(rngFromSeed(9));
    expect(gateAnswerMatches(gate, String(gate.a + gate.b))).toBe(true);
    expect(gateAnswerMatches(gate, String(gate.a + gate.b - 10))).toBe(false);
    expect(gateAnswerMatches(gate, "abc")).toBe(false);
    const ui = read("./ui/grownups.tsx");
    // The question only shows once armed by the hold, and a miss rolls a new sum.
    expect(ui).toMatch(/armed \? \(/);
    expect(ui).toContain("{gate.a} + {gate.b}?");
    expect(ui).toMatch(/setMiss\(true\);[\s\S]{0,120}setGate\(grownupGate\(rngRandom\(\)\)\)/);
  });

  it("shows the gate, not the settings, until a grown-up passes it", () => {
    withSession(null);
    const html = renderToStaticMarkup(createElement(GrownupsScreen, { save: saveFor("3"), onSave: () => {} }));
    expect(html).toContain("Press and hold for 2 seconds, then add.");
    expect(html).not.toContain("ac-gu-settings");
    expect(html).not.toContain("Challenge ahead");
    expect(html).not.toContain('role="radiogroup"');
  });

  it("opens the corner with grade, Challenge ahead and difficulty per game once passed", () => {
    withSession("ok");
    const html = renderToStaticMarkup(createElement(GrownupsScreen, { save: saveFor("3"), onSave: () => {} }));
    expect(html).toContain("ac-gu-settings");
    expect(html).toContain("Challenge ahead");
    expect(html).toContain('href="#/sheets"');
    expect(html).toMatch(/href="[^"]*privacy/);
    expect(html).not.toContain("Press and hold for 2 seconds");
  });
});

describe("grown-ups settings", () => {
  it("has a difficulty picker for each offered game that is open at this grade", () => {
    const save = saveFor("3");
    const kid = save.children[0]!;
    const html = renderToStaticMarkup(createElement(GrownupSettings, { save, onSave: () => {} }));
    for (const game of GAME_CARDS.filter((row) => gameOffered(row.id))) {
      expect(html, game.id).toContain(`data-game="${game.id}"`);
      const open = tierWindow(game.levels.map((row) => row.id), game.id, "3", false, tierFor(kid, game.id)).ids.length > 0;
      const row = html.slice(html.indexOf(`data-game="${game.id}"`)).split("</li>")[0]!;
      expect(row.includes('role="radiogroup"'), game.id).toBe(open);
    }
  });

  it("translates the new corner copy into all 7 languages", () => {
    const keys = [
      "Press and hold for 2 seconds, then add. This keeps grown-up settings for families.",
      "Easy, Medium or Hard for each game. Saved for this grade.",
    ];
    for (const lang of ["es", "pt", "fr", "zh", "hi", "ar"]) {
      const pack = read(`./i18n-${lang}.ts`);
      for (const key of keys) expect(pack, `${lang}: ${key}`).toContain(JSON.stringify(key));
    }
  });

  it("keeps difficulty per game and per grade, and it survives a reload", () => {
    let kid = blankChild({ id: "noor", name: "Noor", grade: "3" });
    kid = withTier(kid, "add", "hard");
    kid = withGrade(kid, "2");
    expect(tierFor(kid, "add")).toBe("medium");
    kid = withTier(kid, "add", "easy");
    kid = withGrade(kid, "3");
    expect(tierFor(kid, "add")).toBe("hard");
    kid = withChallengeAhead(kid, true);
    const save = parseSave(JSON.parse(JSON.stringify({ ...freshSave(), activeId: kid.id, children: [kid] })));
    const back = save.children[0]!;
    expect(back.grade).toBe("3");
    expect(back.challengeAhead).toBe(true);
    expect(tierFor(back, "add")).toBe("hard");
    expect(tierFor(withGrade(back, "2"), "add")).toBe("easy");
  });

  it("Challenge ahead keeps every level inside the allowed window", () => {
    for (const on of [true, false]) {
      const kid = withChallengeAhead(blankChild({ grade: "1" }), on);
      expect(kid.challengeAhead).toBe(on);
      for (const game of GAME_CARDS) {
        const allowed = tierWindow(game.levels.map((row) => row.id), game.id, "1", on, tierFor(kid, game.id));
        if (allowed.ids.length) expect(allowed.ids, game.id).toContain(kid.levels[game.id]);
      }
    }
  });
});

describe("kids' screens", () => {
  it("show one quiet Grown-ups door plus Privacy, and no grown-up controls", () => {
    setLocale("en");
    const foot = renderToStaticMarkup(createElement(Foot));
    expect(foot).toContain('class="ac-gu-door" href="#/grownups"');
    expect(foot).toMatch(/privacy/);
    expect(foot).not.toContain("#/settings");
    expect(foot).not.toContain("#/sheets");
    for (const file of ["./ui/home.tsx", "./ui/play.tsx"]) {
      const src = read(file);
      expect(src, file).not.toContain("<TierPicker");
      expect(src, file).not.toContain("<GradeChips");
      expect(src, file).not.toContain("challengeAhead: !");
    }
  });

  it("can still play every game with no grown-up step", () => {
    const app = read("./app.tsx");
    expect(app).toContain('route.name === "grownups" || route.name === "settings"');
    const play = app.slice(app.indexOf('route.name === "play"'));
    expect(play.slice(0, 400)).not.toMatch(/Grownups|gate/i);
    expect(read("./ui/play.tsx")).not.toMatch(/grownup|squishee-academy-gate/i);
  });
});
