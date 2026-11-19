import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { GAME_CARDS } from "./games/catalog";
import { tierWindow } from "./grade-map";
import { setLocale } from "./i18n";
import { normalizeJourney, subjectSpot } from "./journey";
import { STOPS_PER_AREA, type Child, type Grade } from "./model";
import { levelStones } from "./stones";
import { blankChild, withGrade } from "./storage";
import { SUBJECTS, nextFor, subjectTrail, type SubjectId } from "./subjects";
import { HomeScreen } from "./ui/home";
import { MapScreen } from "./ui/map";
import { stepLine } from "./ui/next-copy";

const GRADES: Grade[] = ["PK", "K", "1", "2", "3", "4", "5"];

/** A first-time visitor: Hello sets name, buddy and grade on the blank (Kindergarten) child. */
function newVisitor(grade: Grade): Child {
  return withGrade(blankChild({ name: "Noor" }), grade);
}

function home(child: Child): string {
  return renderToStaticMarkup(createElement(HomeScreen, { child, lang: "en", sound: false, onClaim() {}, onLang() {}, onSubject() {}, onPlay() {} }));
}

afterEach(() => setLocale("en"));

describe("grade guardrail: Continue respects the chosen grade", () => {
  it("a new visitor of every grade starts on their subject path, at a level open for that grade", () => {
    for (const grade of GRADES) {
      const child = newVisitor(grade);
      for (const subject of SUBJECTS) {
        const step = nextFor(child, subject.id);
        const trail = subjectTrail(child, subject.id);
        if (trail.length === 0) {
          expect(step.reason, `${grade} ${subject.id}`).toBe("stories");
          continue;
        }
        const spot = subjectSpot(normalizeJourney(child.journey, grade), subject.id, grade);
        expect(step.game, `${grade} ${subject.id}`).toBe(trail.includes(spot.areaId) ? spot.areaId : trail[0]);
        const card = GAME_CARDS.find((row) => row.id === step.game)!;
        const window = tierWindow(card.levels.map((row) => row.id), card.id, grade, false, "medium");
        expect(window.ids, `${grade} ${subject.id} ${step.level}`).toContain(step.level);
        // Never a level below the grade's own starting stone.
        expect(step.level, `${grade} ${subject.id}`).toBe(window.start);
        expect(step.reason).toBe("start");
        expect(step.num).toBeGreaterThan(0);
      }
    }
  });

  it("does not drop every new visitor into Add & Subtract", () => {
    expect(nextFor(newVisitor("3"), "math")).toMatchObject({ game: "times", level: "toTen", reason: "start" });
    expect(nextFor(newVisitor("4"), "math").game).toBe("times");
    expect(nextFor(newVisitor("PK"), "math").game).toBe("count");
    const levels = new Set(GRADES.map((grade) => `${nextFor(newVisitor(grade), "math").game}:${nextFor(newVisitor(grade), "math").level}`));
    expect(levels.size).toBeGreaterThan(3);
  });

  it("each subject has its own Continue: Spelling and Reading follow their own paths", () => {
    expect(nextFor(newVisitor("3"), "spelling").game).toBe("spelling");
    expect(nextFor(newVisitor("3"), "reading").game).toBe("sight");
    expect(nextFor(newVisitor("PK"), "spelling").reason).toBe("stories");
  });
});

describe("Continue walks the path in level order and ends at the boss stone", () => {
  const mid = (patch: Partial<Child> = {}): Child => ({
    ...newVisitor("3"),
    rounds: 12,
    journey: { areaId: "add", stop: 1, bosses: ["times"], trails: { math: { areaId: "add", stop: 1 } } },
    levels: { ...newVisitor("3").levels, add: "within100" },
    ...patch,
  });

  it("a returning kid continues on the island they stand on, at their stone", () => {
    expect(nextFor(mid(), "math")).toMatchObject({ game: "add", level: "within100" });
  });

  it("a mastered stone steps to the next stone, never skipping one", () => {
    const step = nextFor(mid({ skills: { "add:within100": { ok: 9, miss: 1 } } as Child["skills"] }), "math");
    expect(step).toMatchObject({ game: "add", level: "within1000", reason: "stretch" });
    const stones = levelStones(mid(), "add").map((row) => row.level);
    expect(stones.indexOf(step.level)).toBe(stones.indexOf("within100") + 1);
  });

  it("all stones mastered keeps the last stone until the boss is ready", () => {
    const skills = { "add:within100": { ok: 9, miss: 1 }, "add:within1000": { ok: 9, miss: 1 } } as Child["skills"];
    const stones = levelStones(mid(), "add").map((row) => row.level);
    expect(nextFor(mid({ skills }), "math").level).toBe(stones[stones.length - 1]);
  });

  it("then the boss stone", () => {
    const ready = mid({ journey: { areaId: "add", stop: STOPS_PER_AREA - 1, bosses: ["times"], trails: { math: { areaId: "add", stop: STOPS_PER_AREA - 1 } } } });
    const step = nextFor(ready, "math");
    expect(step).toMatchObject({ game: "add", reason: "boss" });
    expect(stepLine(step)).toBe("Add & Subtract · Boss");
  });

  it("other subjects keep their own spot", () => {
    expect(nextFor(mid(), "spelling").game).toBe("spelling");
  });
});

describe("home: buddy plus ONE giant Continue, chips, the trail, More games", () => {
  it("shows one Continue with the subject icon and the game and level, then the trail", () => {
    const html = home(newVisitor("3"));
    expect(html.match(/ac-play-main/g)).toHaveLength(1);
    expect(html).toContain('data-continue="math"');
    expect(html).toContain('data-play-game="times"');
    expect(html).toContain("Times Tables · Level");
    expect(html).toContain("ac-subjects is-chips");
    expect(html).toContain('data-trail="math"');
    expect(html).toContain('data-island="times"');
    expect(html).toContain('class="ac-lvstones"');
    const continueAt = html.indexOf("data-continue=");
    expect(continueAt).toBeLessThan(html.indexOf('data-trail="math"'));
    expect(html.indexOf('data-trail="math"')).toBeLessThan(html.indexOf('<details class="ac-more"'));
  });

  it("puts the game list and For you today under a More games fold", () => {
    const html = home(newVisitor("3"));
    const fold = html.slice(html.indexOf('<details class="ac-more"'), html.indexOf("</details>"));
    expect(fold).toContain("More games");
    expect(fold).toContain("For you today");
    expect(fold).toContain("ac-more-grid");
    expect(fold.match(/class="ac-card /g)?.length ?? 0).toBeGreaterThan(10);
    expect(html.indexOf("For you today")).toBeGreaterThan(html.indexOf('data-trail="math"'));
  });

  it("the subject switch changes Continue to that subject's own path", () => {
    const html = home({ ...newVisitor("3"), subject: "spelling" });
    expect(html).toContain('data-continue="spelling"');
    expect(html).toContain('data-play-game="spelling"');
  });

  it("the map's Continue matches Home's for that subject", () => {
    const child = newVisitor("3");
    for (const subject of ["math", "spelling", "reading"] as SubjectId[]) {
      const map = renderToStaticMarkup(createElement(MapScreen, { child, subject, onOpenEgg() {} }));
      expect(map).toContain(`data-continue="${subject}"`);
      expect(map).toContain(`data-play-game="${nextFor(child, subject).game}"`);
    }
  });

  it("the round-end Next uses the same path rule and names the stone", () => {
    const play = readFileSync(resolve(__dirname, "ui/play.tsx"), "utf8");
    expect(play).toContain("nextFor(child, subjectOf(game))");
    expect(play).toContain("stepLine(nextStep)");
    expect(play).not.toContain("sameNext");
  });
});
