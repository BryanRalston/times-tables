import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GAME_CARDS } from "./games/catalog";
import { tierWindow } from "./grade-map";
import { installArabic, setLocale } from "./i18n";
import * as arabic from "./i18n-ar";
import { STOPS_PER_AREA, type Child, type Grade } from "./model";
import { blankChild, parseChild } from "./storage";
import {
  activeSubject,
  backHref,
  forYouToday,
  nextFor,
  parseFrom,
  playHref,
  subjectOf,
  subjectTrail,
  SUBJECTS,
  visibleSubjects,
} from "./subjects";
import { HomeScreen } from "./ui/home";

const GRADES: Grade[] = ["PK", "K", "1", "2", "3", "4", "5"];

function kid(grade: Grade, patch: Partial<Child> = {}): Child {
  return { ...blankChild({ name: "Mia", grade }), rounds: 8, ...patch };
}

afterEach(() => setLocale("en"));

describe("subjects", () => {
  it("puts every game in exactly one subject", () => {
    for (const game of GAME_CARDS) {
      const homes = SUBJECTS.filter((row) => row.games.includes(game.id));
      expect(homes.map((row) => row.id), game.id).toHaveLength(1);
    }
    const all = SUBJECTS.flatMap((row) => row.games);
    expect(new Set(all).size).toBe(all.length);
    expect(all.length).toBe(GAME_CARDS.length);
  });

  it("groups letters into Reading and Spelling, numbers into Math", () => {
    expect(subjectOf("spelling")).toBe("spelling");
    expect(subjectOf("sight")).toBe("reading");
    expect(subjectOf("phonics")).toBe("reading");
    for (const id of ["times", "add", "money", "time", "fractions", "graphs"]) expect(subjectOf(id)).toBe("math");
  });

  it("defaults to Math and remembers the last subject", () => {
    expect(activeSubject(kid("3"))).toBe("math");
    expect(activeSubject(kid("3", { subject: "spelling" }))).toBe("spelling");
    expect(activeSubject(kid("3", { subject: "nope" }))).toBe("math");
    const parsed = parseChild({ ...kid("3"), subject: "reading" });
    expect(parsed?.subject).toBe("reading");
    expect(parseChild({ ...kid("3"), subject: "art" })?.subject).toBeUndefined();
  });

  it("hides letter subjects where the alphabet games are hidden, keeping stories", () => {
    installArabic(arabic);
    setLocale("ar");
    const ids = visibleSubjects(kid("3")).map((row) => row.id);
    expect(ids).toEqual(["math", "reading"]);
    expect(nextFor(kid("3"), "reading").href).toBe("#/stories");
    expect(activeSubject(kid("3", { subject: "spelling" }))).toBe("math");
  });
});

describe("back destination", () => {
  it("returns to where the game was opened, with Home as fallback", () => {
    expect(parseFrom(null)).toBe("home");
    expect(parseFrom("evil")).toBe("home");
    expect(backHref("home", "add")).toBe("#/");
    expect(backHref("map", "add")).toBe("#/map/math");
    expect(backHref("map", "spelling")).toBe("#/map/spelling");
    expect(backHref("games", "sight")).toBe("#/games/reading");
    expect(playHref("add", "map")).toBe("#/play/add?from=map");
    expect(playHref("add", "home")).toBe("#/play/add");
    expect(playHref("times", "map", true)).toBe("#/play/times/crown?from=map");
  });

  it("app routes X through backHref and map links carry from=map", () => {
    const app = readFileSync(resolve(__dirname, "app.tsx"), "utf8");
    expect(app).toContain("backHref(route.from, route.game)");
    const map = readFileSync(resolve(__dirname, "ui/map.tsx"), "utf8");
    expect(map).not.toMatch(/href=\{`#\/play\//);
    expect(map).toContain('playHref(game.id, "map")');
  });
});

describe("one next rule", () => {
  const bossKid = (patch: Partial<Child> = {}) => kid("3", { journey: { areaId: "times", stop: STOPS_PER_AREA - 1, bosses: [] }, ...patch });

  it("faces a ready boss in that subject when no skill there is weak", () => {
    const step = nextFor(bossKid(), "math");
    expect(step).toMatchObject({ game: "times", reason: "boss" });
  });

  it("a weak skill in the subject comes before the boss", () => {
    const child = bossKid({ skills: { "add:within1000": { ok: 1, miss: 4 } } as Child["skills"] });
    expect(nextFor(child, "math")).toMatchObject({ game: "add", reason: "weak" });
  });

  it("a weak skill in another subject does not hide this subject's boss", () => {
    const child = bossKid({ skills: { "spelling:patterns": { ok: 1, miss: 4 } } as Child["skills"] });
    expect(nextFor(child, "math")).toMatchObject({ game: "times", reason: "boss" });
    expect(nextFor(child, "spelling")).toMatchObject({ game: "spelling", reason: "weak" });
  });

  it("Home Continue and the round-end Next use the same rule", () => {
    const play = readFileSync(resolve(__dirname, "ui/play.tsx"), "utf8");
    expect(play).toContain("nextFor(child, subjectOf(game))");
    const html = renderToStaticMarkup(
      createElement(HomeScreen, { child: bossKid(), lang: "en", sound: false, onClaim() {}, onLang() {}, onSubject() {}, onPlay() {} }),
    );
    expect(html).toContain('data-play-game="times"');
    expect(html).toContain('data-placement="boss"');
    expect(html).toContain('href="#/map/math"');
    expect(html).toContain('href="#/games/math"');
    expect(html.match(/href="#\/map/g)).toHaveLength(1);
  });
});

describe("For you today", () => {
  it("shows up to 3 different games in the subject, all open for the grade", () => {
    for (const grade of GRADES) {
      for (const subject of SUBJECTS) {
        for (const patch of [{}, { skills: { "add:within10": { ok: 1, miss: 3 }, "spelling:cvc": { ok: 0, miss: 3 } } as Child["skills"] }]) {
          const child = kid(grade, patch);
          const picks = forYouToday(child, subject.id);
          const trail = subjectTrail(child, subject.id);
          expect(picks.length).toBeLessThanOrEqual(3);
          expect(picks.length).toBe(Math.min(3, trail.length));
          expect(new Set(picks.map((row) => row.game)).size).toBe(picks.length);
          for (const pick of picks) {
            expect(trail, `${grade} ${subject.id} ${pick.game}`).toContain(pick.game);
            const card = GAME_CARDS.find((row) => row.id === pick.game)!;
            const window = tierWindow(card.levels.map((row) => row.id), card.id, grade, false, "medium");
            expect(window.ids, `${grade} ${pick.game} ${pick.level}`).toContain(pick.level);
          }
          if (picks[0]) expect(picks[0].game).toBe(nextFor(child, subject.id).game);
        }
      }
    }
  });
});
