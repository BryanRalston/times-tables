import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { privacyCopy, type PrivacyCopy } from "./privacy-copy";
import {
  countGameStart,
  countRoundComplete,
  countStoryFinish,
  noteLocale,
  resetVisitCountsForTests,
} from "./events";

type CountCall = { path: string; event: true };

function installCounter() {
  const count = vi.fn();
  vi.stubGlobal("navigator", { doNotTrack: null, globalPrivacyControl: false });
  vi.stubGlobal("window", { goatcounter: { count } });
  return count;
}

afterEach(() => {
  resetVisitCountsForTests();
  vi.unstubAllGlobals();
});

describe("anonymous visit events", () => {
  it("sends only after GoatCounter has loaded, and waits when the script is on the page", () => {
    vi.stubGlobal("navigator", { doNotTrack: null, globalPrivacyControl: false });
    vi.stubGlobal("window", {});
    countGameStart("times");
    const count = vi.fn();
    (window as Window & { goatcounter?: { count: typeof count } }).goatcounter = { count };
    countGameStart("add");
    expect(count.mock.calls.map((call) => call[0])).toEqual([{ path: "event/game-start/add", event: true }]);
    expect(Object.keys(count.mock.calls[0]?.[0] as CountCall)).toEqual(["path", "event"]);

    resetVisitCountsForTests();
    count.mockClear();
    delete (window as Window & { goatcounter?: unknown }).goatcounter;
    const listeners: Array<() => void> = [];
    vi.stubGlobal("document", {
      querySelector: () => ({
        tagName: "SCRIPT",
        addEventListener: (_type: string, fn: () => void) => listeners.push(fn),
      }),
    });
    countGameStart("money");
    expect(count).not.toHaveBeenCalled();
    (window as Window & { goatcounter?: { count: typeof count } }).goatcounter = { count };
    listeners[0]?.();
    expect(count.mock.calls.map((call) => call[0])).toEqual([{ path: "event/game-start/money", event: true }]);
  });

  it("counts a finished round and a finished book, and ignores unknown ids", () => {
    const count = installCounter();
    countRoundComplete("money");
    countRoundComplete("not-a-game");
    countStoryFinish("pk-peach-cat");
    countStoryFinish("sam-secret");
    expect(count.mock.calls.map((call) => call[0])).toEqual([
      { path: "event/round-complete/money", event: true },
      { path: "event/storybook-finish/pk-peach-cat", event: true },
    ]);
  });

  it("notes each language once per page load", () => {
    const count = installCounter();
    noteLocale("en");
    noteLocale("en");
    noteLocale("es");
    noteLocale("pt-BR");
    noteLocale("child");
    expect(count.mock.calls.map((call) => call[0])).toEqual([
      { path: "event/lang/en", event: true },
      { path: "event/lang/es", event: true },
    ]);
  });

  it("skips every event when Do Not Track or Global Privacy Control is on", () => {
    const count = vi.fn();
    vi.stubGlobal("window", { goatcounter: { count } });
    vi.stubGlobal("navigator", { doNotTrack: "1", globalPrivacyControl: false });
    countGameStart("times");
    noteLocale("en");
    vi.stubGlobal("navigator", { doNotTrack: "0", globalPrivacyControl: true });
    countRoundComplete("times");
    countStoryFinish("pk-peach-cat");
    expect(count).not.toHaveBeenCalled();
  });

  it("does not keep a queue of names, scores, or storage", () => {
    const source = readFileSync("src/academy/seo/events.ts", "utf8");
    expect(source).not.toContain("localStorage");
    expect(source).not.toContain("sessionStorage");
    expect(source).not.toContain("document.cookie");
    expect(source).toContain('nav.doNotTrack === "1"');
    expect(source).toContain("nav.globalPrivacyControl === true");
    expect(source).toContain("event: true");
  });
});

describe("privacy copy names the anonymous counts", () => {
  const lines: Record<string, string> = {
    en: "anonymous game starts and finishes",
    es: "inicios y los finales de los juegos de forma anónima",
    "pt-BR": "de forma anônima, quando um jogo começa e quando termina",
    fr: "de façon anonyme le début et la fin d'un jeu",
    "zh-Hans": "我们也数游戏的开始和完成",
    hi: "खेल की गिनती भी करते हैं",
    ar: "بدء الألعاب واكتمالها من غير اسم",
  };

  it.each(Object.entries(lines))("%s says starts and finishes are anonymous", (lang, line) => {
    const copy: PrivacyCopy = privacyCopy(lang as keyof typeof lines);
    expect(copy.paragraphs.join("\n")).toContain(line);
    expect(copy.description.length).toBeGreaterThan(20);
  });

  it("puts the same fact in the English description", () => {
    expect(privacyCopy("en").description).toContain("Anonymous game starts and finishes");
    expect(privacyCopy("en").paragraphs[2]).toContain("It honors Do Not Track.");
    expect(privacyCopy("en").paragraphs[2]).toContain("It does not store IP addresses.");
  });
});
