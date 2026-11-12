import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const clipSpeech = vi.fn((_text: string, _rate: number, _onFail: () => void, onReady?: () => void) => {
  onReady?.();
  return true;
});

vi.mock("./voice/clips", () => ({ ensureVoice: () => Promise.resolve() }));
vi.mock("./offline/later", () => ({ holdPrecache: () => () => {} }));
vi.mock("./voice/player", async (importOriginal) => {
  const real = await importOriginal<typeof import("./voice/player")>();
  return {
    ...real,
    startClipSpeech: (text: string, rate: number, onFail: () => void, onReady?: () => void) => clipSpeech(text, rate, onFail, onReady),
    stopClipSpeech: () => {},
  };
});

import { installArabic, installChinese, installFrench, installHindi, installPortuguese, setLocale, type Locale } from "./i18n";
import * as portuguese from "./i18n-pt";
import * as french from "./i18n-fr";
import * as chinese from "./i18n-zh";
import * as hindi from "./i18n-hi";
import * as arabic from "./i18n-ar";
import { autoSpeakGrade, calmGrade, storyAutoReadGrade, type Grade } from "./model";
import { speak } from "./voice";
import { storyById } from "./stories/catalog";
import { StoryReader } from "./ui/stories";

const ALL: Grade[] = ["PK", "K", "1", "2", "3", "4", "5"];
const flush = () => new Promise((done) => setTimeout(done, 0));
const src = (path: string) => readFileSync(resolve(__dirname, path), "utf8");

beforeEach(() => clipSpeech.mockClear());
afterEach(() => setLocale("en"));

describe("default read-aloud is off for game questions", () => {
  it("never auto-speaks a question or worked example, at any grade", () => {
    for (const grade of ALL) expect(autoSpeakGrade(grade)).toBe(false);
  });

  it("keeps the calm round for Pre-K, kindergarten, and grade 1 only", () => {
    expect(ALL.filter(calmGrade)).toEqual(["PK", "K", "1"]);
  });

  it("still speaks when the child taps Hear it again with sound on", async () => {
    speak("What is 1 + 1?", true);
    await flush();
    expect(clipSpeech).toHaveBeenCalledTimes(1);
    expect(clipSpeech.mock.calls[0]?.[0]).toBe("What is 1 + 1?");
  });

  it("stays silent when sound is off", async () => {
    speak("What is 1 + 1?", false);
    await flush();
    expect(clipSpeech).not.toHaveBeenCalled();
  });

  it("wires the speaker button to speak and leaves auto-speak behind the grade gate", () => {
    const play = src("ui/play.tsx");
    expect(play).toContain('aria-label={show("Hear it again")}');
    expect(play).toContain("onClick={() => speak(speech, sound)}");
    expect(play.match(/if \(autoSpeakGrade\(child\.grade\)\) speak\(/g)?.length).toBe(2);
    expect(play).toContain("const calm = calmGrade(child.grade);");
  });
});

describe("storybooks auto-read only through grade 2", () => {
  it("auto-reads for Pre-K to grade 2 and waits for a tap from grade 3", () => {
    expect(ALL.filter(storyAutoReadGrade)).toEqual(["PK", "K", "1", "2"]);
    for (const grade of ["3", "4", "5"] as Grade[]) expect(storyAutoReadGrade(grade)).toBe(false);
  });

  it("marks the reader and always shows a Read to me speaker button", () => {
    const story = storyById("pk-peach-cat")!;
    for (const grade of ALL) {
      const html = renderToStaticMarkup(<StoryReader story={story} grade={grade} sound onFinish={() => {}} />);
      expect(html).toContain(`data-story-auto="${storyAutoReadGrade(grade) ? "yes" : "no"}"`);
      expect(html).toContain("data-story-read");
      expect(html).toContain('data-reading="no"');
      expect(html).toContain("<svg");
      expect(html).toContain("Read to me");
    }
  });

  it("gates the open-page read on grade and keeps sound as the audio gate", () => {
    const stories = src("ui/stories.tsx");
    expect(stories).toMatch(/if \(!autoRead\) return;\s*playText\(text\);/);
    expect(stories).toContain("if (!follow || !autoRead) return;");
    expect(stories).toMatch(/function playText\(text: string\) \{\s*if \(!sound\) return;/);
    expect(stories).toContain("onRead={() => playText(page.text)}");
    expect(stories).toContain("onRead={() => playText(check.prompt)}");
  });

  it("translates the Read to me button in every academy language", () => {
    const install: Record<Exclude<Locale, "en" | "es">, () => void> = {
      pt: () => installPortuguese(portuguese),
      fr: () => installFrench(french),
      zh: () => installChinese(chinese),
      hi: () => installHindi(hindi),
      ar: () => installArabic(arabic),
    };
    const want: Record<Exclude<Locale, "en">, string> = {
      es: "Léemelo",
      pt: "Leia para mim",
      fr: "Lis pour moi",
      zh: "读给我听",
      hi: "मुझे पढ़कर सुनाओ",
      ar: "اقرأ لي",
    };
    for (const [lang, label] of Object.entries(want) as [Exclude<Locale, "en">, string][]) {
      if (lang !== "es") install[lang]();
      setLocale(lang);
      const html = renderToStaticMarkup(<StoryReader story={storyById("pk-peach-cat")!} grade="3" sound onFinish={() => {}} />);
      expect(html).toContain(label);
    }
  });
});
