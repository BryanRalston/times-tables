import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { SQUISHEES } from "@/lib/squishees";
import { bubbleText } from "./buddy/react";
import { COUNT_LINE_GAMES, WORK_LINE_GAMES, palLine, palLineFits, personaOf } from "./buddy/persona";
import { GAMES } from "./games/registry";
import { setLocale } from "./i18n";
import { scrollToShow } from "./ui/answers-in-view";
import { firstStepLine, firstTapSeen, markFirstTap } from "./ui/first-tap";
import { GraphBench } from "./ui/graph-board";
import { ShareBench } from "./ui/share-board";
import { TierChip } from "./ui/tier-picker";

/** Words in a pal line that tie it to a game. A line using one only shows in those games. */
const TOPIC_WORDS: readonly [RegExp, readonly string[]][] = [
  [/\bcoins?\b/i, ["money"]],
  [/\bminutes?\b|long hand|\bclock\b/i, ["time", "minute"]],
  [/\binches\b|\bmarks\b|start at zero|start at the end/i, ["measure"]],
  [/\bsounds?\b|\bword\b|\bspell\b|\bletters\b/i, ["phonics", "spelling", "sight"]],
  [/\btens\b/i, ["place"]],
  [/\bstory\b/i, ["problems"]],
  [/\bgroups?\b|\bbunch\b/i, ["times"]],
  [/\bslices\b|\bparts\b|\bpieces\b|\bshare\b|\bshaded\b/i, ["fractions", "share", "measure"]],
  [/\bsquares\b|\bsides\b/i, ["shapes", "grid"]],
  [/\bin the box\b|\bbites\b/i, ["variables"]],
  [/\bstart, then add\b/i, ["add"]],
];

const PAL_IDS = [...new Set([...SQUISHEES.map((row) => row.id), ...Object.keys(COUNT_LINE_GAMES), ...Object.keys(WORK_LINE_GAMES)])];
const GAME_IDS = GAMES.map((game) => game.id);

afterEach(() => setLocale("en"));

describe("pal hints match the game", () => {
  it("never shows a pal line about another game's topic", () => {
    setLocale("en");
    for (const id of PAL_IDS) {
      for (const game of GAME_IDS) {
        for (const kind of ["count", "work"] as const) {
          const line = palLine(kind, id, game);
          for (const [word, games] of TOPIC_WORDS) {
            if (word.test(line)) expect(games, `${id} ${kind} in ${game}: "${line}"`).toContain(game);
          }
        }
      }
    }
  });

  it("Fox, Lemon, and Pretzel only say 'Count the coins' in Money", () => {
    setLocale("en");
    for (const id of ["fox", "lemon", "pretzel"]) {
      expect(bubbleText("count", id, "money")).toBe("Count the coins.");
      for (const game of GAME_IDS.filter((row) => row !== "money")) {
        expect(bubbleText("count", id, game), `${id} in ${game}`).toBe("Count with me.");
      }
    }
  });

  it("keeps a pal's own line where it fits and uses the neutral line elsewhere", () => {
    setLocale("en");
    expect(bubbleText("count", "frog", "problems")).toBe("Hop as we count.");
    expect(bubbleText("count", "capybara", "place")).toBe("Count the tens.");
    expect(bubbleText("count", "capybara", "count")).toBe("Count with me.");
    expect(bubbleText("count", "peach", "count")).toBe("Count with me.");
    expect(bubbleText("work", "penguin", "time")).toBe("Watch the long hand.");
    expect(bubbleText("work", "penguin", "add")).toBe("Watch how I do it.");
    expect(palLineFits("count", "fox")).toBe(true);
  });

  it("uses the translated neutral line", () => {
    setLocale("es");
    expect(bubbleText("count", "fox", "problems")).toBe(personaOf("").count);
    expect(bubbleText("count", "fox", "problems")).not.toBe("Count with me.");
    expect(bubbleText("count", "fox", "money")).toBe(personaOf("fox").count);
  });

  it("only lists real game ids", () => {
    for (const games of [...Object.values(COUNT_LINE_GAMES), ...Object.values(WORK_LINE_GAMES)]) {
      for (const game of games) expect(GAME_IDS).toContain(game);
    }
  });

  it("play passes the game on screen to the buddy", () => {
    const play = readFileSync("src/academy/ui/play.tsx", "utf8");
    expect(play).toMatch(/game=\{choice\?\.game \?\? view\?\.id \?\? game\}/);
  });
});

describe("answers in view on a new card", () => {
  it("leaves the page alone when the answers already fit", () => {
    expect(scrollToShow([{ top: 400, bottom: 600 }], 664, 0)).toBe(0);
  });

  it("scrolls just enough to show the last answer", () => {
    expect(scrollToShow([{ top: 500, bottom: 560 }, { top: 640, bottom: 700 }], 664, 0)).toBe(48);
  });

  it("keeps the first answer on screen when the answers are taller than the screen", () => {
    expect(scrollToShow([{ top: 300, bottom: 360 }, { top: 900, bottom: 1100 }], 640, 0)).toBe(288);
  });

  it("scrolls back up when the answers sit above the screen", () => {
    expect(scrollToShow([{ top: 100, bottom: 200 }], 640, 500)).toBe(0);
  });

  it("every game resets to the top and reveals the answers, not just Addition", () => {
    const play = readFileSync("src/academy/ui/play.tsx", "utf8");
    expect(play).toContain("revealAnswers()");
    expect(play).toContain("focus({ preventScroll: true })");
    expect(play).not.toMatch(/if \(game !== "add" && game !== "cubes"/);
  });
});

describe("first step for Data and Fair Shares", () => {
  function memory() {
    const data = new Map<string, string>();
    return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value) };
  }

  it("remembers the first tap per game", () => {
    const store = memory();
    expect(firstTapSeen("graphs", store)).toBe(false);
    markFirstTap("graphs", store);
    expect(firstTapSeen("graphs", store)).toBe(true);
    expect(firstTapSeen("share", store)).toBe(false);
  });

  it("says the first step plainly in all seven languages", () => {
    setLocale("en");
    expect(firstStepLine("graphs")).toBe("Tap a picture, then tap its group.");
    expect(firstStepLine("share")).toBe("Tap the cookies to put one on a plate.");
    for (const lang of ["es", "pt", "fr", "zh", "hi", "ar"] as const) {
      setLocale(lang);
      expect(firstStepLine("graphs"), lang).not.toBe("Tap a picture, then tap its group.");
      expect(firstStepLine("share"), lang).not.toBe("Tap the cookies to put one on a plate.");
    }
  });

  it("puts the hand on the cookies the first time, and not otherwise", () => {
    setLocale("en");
    const task = { mode: "equal", total: 6, plates: 3, each: 2, leftover: 0 } as unknown as Parameters<typeof ShareBench>[0]["task"];
    const on = renderToStaticMarkup(createElement(ShareBench, { task, locked: false, onChange: () => {}, hand: true }));
    expect(on).toMatch(/class="ac-cookie-bank ac-has-hand"[^>]*>.*data-tap-hand="on"/s);
    expect((on.match(/data-tap-hand/g) ?? []).length).toBe(1);
    const off = renderToStaticMarkup(createElement(ShareBench, { task, locked: false, onChange: () => {} }));
    expect(off).not.toContain("data-tap-hand");
  });

  it("puts the hand on the first picture to sort", () => {
    setLocale("en");
    const spec: Parameters<typeof GraphBench>[0]["spec"] = {
      mode: "sort",
      shape: "bins",
      cats: [
        { name: "apple", emoji: "🍎", icons: 2 },
        { name: "candy", emoji: "🍭", icons: 1 },
      ],
      scale: 1,
      den: 1,
      stacks: [],
    };
    const html = renderToStaticMarkup(createElement(GraphBench, { spec, locked: false, hand: true }));
    expect((html.match(/data-tap-hand/g) ?? []).length).toBe(1);
    expect(html.indexOf("ac-has-hand")).toBeLessThan(html.indexOf("data-tap-hand"));
  });
});

describe("Easy, Medium, Hard on a phone", () => {
  it("is one small chip that opens the choice", () => {
    setLocale("en");
    const html = renderToStaticMarkup(createElement(TierChip, { tier: "medium", onTier: () => {} }));
    expect(html).toContain('class="ac-tier-chip"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("Medium");
    expect(html).not.toContain("Easy");
    expect(html).not.toContain("Hard");
  });

  it("shows the chip on phones and the full bar on wider screens", () => {
    const css = readFileSync("src/academy/academy.css", "utf8");
    expect(css).toMatch(/@media \(max-width: 600px\) \{\s*\.ac-tier-chip-wrap \{ display: block; \}\s*\.ac-play-tiers \{ display: none; \}/);
    const play = readFileSync("src/academy/ui/play.tsx", "utf8");
    expect(play).toContain("<TierChip");
    expect(play).toContain('className="ac-play-tiers"');
  });
});

describe("phone fit for every game", () => {
  const css = readFileSync("src/academy/academy.css", "utf8");
  const shortBlocks = [...css.matchAll(/@media \(max-height: 900px\) \{([\s\S]*?)\n\}/g)].map((match) => match[1] ?? "");

  it("applies the buddy-beside-its-line fit to every game, not only Addition", () => {
    const all = shortBlocks.join("\n");
    expect(all).toContain(".ac-shell:not(.is-boss) .ac-stage-copy .ac-play-buddy .ac-buddy { flex-direction: row;");
    expect(all).toContain(".ac-shell:not(.is-boss) .ac-stage-copy .ac-choice { min-height: 60px; }");
  });

  it("keeps every tap target at least 44px tall on short screens", () => {
    // Only rules whose last selector part is the tap target itself (not an icon inside it).
    const targets = /\.ac-(choice|tile|slot|check|plate|tier-chip|hear|hint-btn|speaker|slow|cookie-bank|graph-token|pill)(\.[\w-]+|:[\w-]+(\([^)]*\))?)*\s*$/;
    for (const block of shortBlocks) {
      for (const rule of block.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const selector = rule[1] ?? "";
        const body = rule[2] ?? "";
        if (!selector.split(",").some((part) => targets.test(part))) continue;
        for (const decl of body.matchAll(/(?:^|;)\s*(min-height|height)\s*:\s*(\d+)px/g)) {
          expect(Number(decl[2]), `${selector.trim()} ${decl[1]}`).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });
});

describe("one instruction at a time in Data and Fair Shares", () => {
  it("shows the yellow first line without a second green line", () => {
    for (const file of ["src/academy/games/graphs.tsx", "src/academy/games/share.tsx"]) {
      const text = readFileSync(file, "utf8");
      expect(text).toContain("ac-first-step");
      expect(text).not.toContain("then pick an answer");
    }
  });
});
