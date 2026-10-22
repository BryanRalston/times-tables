import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COSMETIC_IDS } from "@/lib/cosmetics";
import { rngFromSeed } from "@/lib/rng";
import { GAMES } from "../games/registry";
import type { ChoiceQ } from "../games/types";
import { makeClockTask } from "../hands";
import { installArabic, installChinese, installFrench, installHindi, installPortuguese, setLocale, yourTurnLine } from "../i18n";
import { BOSS_FR, FR, PERSONA_FALLBACK_FR, PERSONA_FR, TRAIT_FR } from "../i18n-fr";
import { BOSS_PT, PERSONA_FALLBACK_PT, PERSONA_PT, PT, TRAIT_PT } from "../i18n-pt";
import { AR, BOSS_AR, PERSONA_AR, PERSONA_FALLBACK_AR, TRAIT_AR } from "../i18n-ar";
import { BOSS_HI, HI, PERSONA_FALLBACK_HI, PERSONA_HI, TRAIT_HI } from "../i18n-hi";
import { BOSS_ZH, PERSONA_FALLBACK_ZH, PERSONA_ZH, TRAIT_ZH, ZH } from "../i18n-zh";
import { SQUAD_IDS } from "../model";
import { exampleFor } from "../round-flow";
import { artPaths, buildPrecacheList, domainServiceWorker, isPrecacheFile, pokeMediaFiles, referencedPokeNames, referencedUrls, SHARE_IMAGE_PATH, subpathServiceWorker, WARDROBE_FILES } from "../../../scripts/academy-precache.mjs";
import { hintCue, promptSpeech, speakable, workedExample } from "../teach";
import { WARDROBE } from "../wardrobe";
import { SHARE_IMAGE_PATH as htmlShareImage } from "../seo/html";
import { collectSpokenLines } from "../voice/catalog";
import { VOICE_FILES_ES } from "../voice/manifest-es";
import { VOICE_FILES_FR } from "../voice/manifest-fr";
import { VOICE_FILES_PT } from "../voice/manifest-pt";
import { VOICE_FILES_AR } from "../voice/manifest-ar";
import { VOICE_FILES_HI } from "../voice/manifest-hi";
import { VOICE_FILES_ZH } from "../voice/manifest-zh";
import { planSpeech } from "../voice/plan";
import { spanishPrecacheVoiceFiles } from "../voice/precache-es";
import { frenchPrecacheVoiceFiles } from "../voice/precache-fr";
import { arabicPrecacheVoiceFiles } from "../voice/precache-ar";
import { hindiPrecacheVoiceFiles } from "../voice/precache-hi";
import { chinesePrecacheVoiceFiles } from "../voice/precache-zh";
import { portuguesePrecacheVoiceFiles } from "../voice/precache-pt";

installPortuguese({ PT, PERSONA_PT, PERSONA_FALLBACK_PT, BOSS_PT, TRAIT_PT });
installFrench({ FR, PERSONA_FR, PERSONA_FALLBACK_FR, BOSS_FR, TRAIT_FR });
installChinese({ ZH, PERSONA_ZH, PERSONA_FALLBACK_ZH, BOSS_ZH, TRAIT_ZH });
installHindi({ HI, PERSONA_HI, PERSONA_FALLBACK_HI, BOSS_HI, TRAIT_HI });
installArabic({ AR, PERSONA_AR, PERSONA_FALLBACK_AR, BOSS_AR, TRAIT_AR });

describe("offline precache", () => {
  it("lists app files, squad art, outfits, and sounds", () => {
    const paths = artPaths();
    for (const id of SQUAD_IDS) {
      expect(paths).toContain(`squishees/${id}.png`);
      for (const cosmetic of COSMETIC_IDS) expect(paths).toContain(`cosmetics/${id}-${cosmetic}.png`);
    }
    expect(WARDROBE_FILES).toEqual(SQUAD_IDS.flatMap((id) => WARDROBE.map((item) => `wardrobe/fitted/${id}-${item.id}.webp`)));
    for (const file of WARDROBE_FILES) expect(paths).toContain(file);
    expect(isPrecacheFile("assets/app.js")).toBe(true);
    expect(isPrecacheFile("assets/font.woff2")).toBe(true);
    expect(isPrecacheFile("sounds/cheer.wav")).toBe(true);
    expect(isPrecacheFile("voice/core/seven.mp3")).toBe(true);
    expect(isPrecacheFile("voice/lazy/elephant.mp3")).toBe(false);
    expect(isPrecacheFile("voice/es/siete.mp3")).toBe(false);
    expect(isPrecacheFile(`voice/${VOICE_FILES_ES["7"]}`)).toBe(true);
    expect(isPrecacheFile(`voice/${VOICE_FILES_ES["toca la respuesta"]}`)).toBe(true);
    expect(isPrecacheFile(`voice/${VOICE_FILES_ES.elephant}`)).toBe(false);
    expect(isPrecacheFile(`voice/${VOICE_FILES_PT["7"]}`)).toBe(true);
    expect(isPrecacheFile(`voice/${VOICE_FILES_PT["toque a resposta"]}`)).toBe(true);
    expect(isPrecacheFile(`voice/${VOICE_FILES_PT.elephant}`)).toBe(false);
    expect(isPrecacheFile("voice/pt/not-listed.mp3")).toBe(false);
    expect(isPrecacheFile(`voice/${VOICE_FILES_FR["7"]}`)).toBe(true);
    expect(isPrecacheFile(`voice/${VOICE_FILES_FR["touche la réponse"]}`)).toBe(true);
    expect(isPrecacheFile(`voice/${VOICE_FILES_FR.elephant}`)).toBe(false);
    expect(isPrecacheFile("voice/fr/not-listed.mp3")).toBe(false);
    expect(isPrecacheFile(`voice/${VOICE_FILES_ZH["7"]}`)).toBe(true);
    expect(isPrecacheFile("voice/zh/not-listed.mp3")).toBe(false);
    expect(isPrecacheFile(`voice/${VOICE_FILES_HI["7"]}`)).toBe(true);
    expect(isPrecacheFile("voice/hi/not-listed.mp3")).toBe(false);
    expect(isPrecacheFile("fonts/NotoSansSC-subset.woff2")).toBe(false);
    expect(isPrecacheFile("squishees/frog.png")).toBe(false);
    expect(isPrecacheFile("precache-manifest.json")).toBe(false);

    const list = buildPrecacheList({
      appPrefix: "/times-tables/academy",
      artPrefix: "/times-tables",
      files: ["index.html", "assets/app.js", "assets/app.css", "worksheets/multiplication-7s/index.html", "sounds/cheer.wav", "privacy/index.html"],
      texts: ['const clip = "/sounds/cheer.wav"; const face = "/times-tables/squishees/frog.png";'],
    });
    expect(list).toContain("/times-tables/academy/");
    expect(list).toContain("/times-tables/academy/index.html");
    expect(list).toContain("/times-tables/academy/assets/app.js");
    expect(list).toContain("/times-tables/academy/assets/app.css");
    expect(list).toContain("/times-tables/academy/worksheets/multiplication-7s/");
    expect(list).toContain("/times-tables/academy/worksheets/multiplication-7s/index.html");
    expect(list).toContain("/times-tables/academy/privacy/");
    expect(list).toContain("/times-tables/academy/sounds/cheer.wav");
    expect(list).toContain("/times-tables/squishees/frog.png");
    expect(list).toContain("/sounds/cheer.wav");
    expect(referencedUrls('src="/assets/index-abc123.js"')).toContain("/assets/index-abc123.js");

    const poke = pokeMediaFiles();
    expect(poke).toEqual([
      "squishees/bunny-poke-strip.png",
      "squishees/bunny-poke.mp4",
      "squishees/cat-poke-strip.png",
      "squishees/cat-poke.mp4",
      "squishees/frog-poke-strip.png",
      "squishees/frog-poke.mp4",
    ]);
    expect(poke.some((rel) => rel.includes("cheer"))).toBe(false);
    const withMedia = buildPrecacheList({
      appPrefix: "/times-tables/academy",
      artPrefix: "/times-tables",
      mediaPrefix: "/times-tables/academy",
      files: ["index.html"],
      texts: [],
    });
    expect(withMedia).toContain("/times-tables/academy/squishees/frog-poke.mp4");
    expect(withMedia).toContain("/times-tables/academy/squishees/frog-poke-strip.png");
    expect(withMedia).not.toContain("/times-tables/squishees/frog-poke.mp4");
    const domainList = buildPrecacheList({
      appPrefix: "",
      artPrefix: "",
      mediaPrefix: "",
      files: ["index.html"],
      texts: ['clip:"/squishees/frog-poke.mp4"'],
    });
    expect(domainList).toContain("/squishees/frog-poke.mp4");
    expect(domainList).toContain("/squishees/cat-poke-strip.png");
    expect(domainList).toContain("/squishees/bunny-poke.mp4");
    expect(referencedPokeNames('poke:"frog-poke.mp4",strip:"frog-poke-strip.png",cheer:"frog-cheer.mp4"')).toEqual([
      "frog-poke-strip.png",
      "frog-poke.mp4",
    ]);

    const sound = readFileSync("src/academy/sound.ts", "utf8");
    expect(sound).not.toMatch(/\.(mp3|wav|ogg|m4a)/);
    expect(readFileSync("public/academy-sw.js", "utf8")).toBe(subpathServiceWorker());
    expect(htmlShareImage).toBe(SHARE_IMAGE_PATH);
    expect(isPrecacheFile(SHARE_IMAGE_PATH.slice(1))).toBe(false);
    const domainSw = domainServiceWorker();
    expect(domainSw).toContain(`const SHARE_IMAGE = ${JSON.stringify(SHARE_IMAGE_PATH)}`);
    expect(domainSw).toContain("if (url.pathname === SHARE_IMAGE) return;");
    expect(domainSw).toContain('caches.match("/index.html")');
    expect(domainSw).toContain('const CACHE = "squishee-academy-root-v15"');
  });

  it("precaches Spanish clips for an Add, Times, and Telling Time round", () => {
    setLocale("es");
    try {
      const listed = JSON.parse(readFileSync("src/academy/voice/es-precache.json", "utf8")) as string[];
      const live = spanishPrecacheVoiceFiles();
      expect(listed).toEqual(live);
      expect(live.length).toBeGreaterThan(1000);
      expect(live.length).toBeLessThan(Object.keys(VOICE_FILES_ES).length / 2);
      for (const file of live) expect(isPrecacheFile(`voice/${file}`)).toBe(true);
      expect(live).toContain(VOICE_FILES_ES["7"]);
      expect(live).toContain(VOICE_FILES_ES["en punto"]);
      expect(live).toContain(VOICE_FILES_ES["y media"]);
      expect(live).toContain(VOICE_FILES_ES.casi);
      expect(live).not.toContain(VOICE_FILES_ES.elephant);

      const allowed = new Set(live);
      const hasPrecache = (key: string) => {
        const file = VOICE_FILES_ES[key];
        return typeof file === "string" && allowed.has(file);
      };
      const hasClip = (key: string) => Object.prototype.hasOwnProperty.call(VOICE_FILES_ES, key);
      const gaps: string[] = [];
      const seen = new Set<string>();
      const check = (line: string) => {
        const text = line.trim();
        if (!text || seen.has(text)) return;
        seen.add(text);
        if (!planSpeech(text, hasClip)) return;
        if (!planSpeech(text, hasPrecache)) gaps.push(text);
      };
      const addChoice = (question: ChoiceQ) => {
        const prompt = promptSpeech(question);
        check(prompt);
        check(yourTurnLine(prompt));
        check(hintCue(question).speech);
        check(workedExample(question).speech);
        check(speakable(question.praise));
        check(speakable(question.almost));
      };

      for (const row of collectSpokenLines()) {
        if (row.game === "add" || row.game === "times" || row.game === "time" || row.game === "ui" || row.game === "buddy" || row.game === "boss") {
          check(row.line);
        }
      }
      const add = GAMES.find((game) => game.id === "add");
      const times = GAMES.find((game) => game.id === "times");
      const time = GAMES.find((game) => game.id === "time");
      for (const game of [add, times]) {
        if (!game) continue;
        for (const level of game.levels) {
          for (let i = 0; i < 24; i += 1) {
            addChoice(game.makeQuestion(rngFromSeed(`es-offline:${game.id}:${level.id}:${i}`), level.id, []));
          }
        }
      }
      if (time) {
        for (const level of time.levels) {
          for (let i = 0; i < 16; i += 1) {
            const task = makeClockTask(level.id, rngFromSeed(`es-offline:hands:${level.id}:${i}`));
            check(task.speech);
            check(yourTurnLine(task.speech));
            check(exampleFor(task).speech);
          }
        }
      }

      const domain = buildPrecacheList({
        appPrefix: "",
        artPrefix: "",
        files: live.map((file) => `voice/${file}`).concat([`voice/${VOICE_FILES_ES.elephant}`, "voice/lazy/elephant.mp3"]),
        texts: [],
      });
      expect(domain).toContain(`/voice/${VOICE_FILES_ES["7"]}`);
      expect(domain).toContain(`/voice/${VOICE_FILES_ES["toca la respuesta"]}`);
      expect(domain).not.toContain(`/voice/${VOICE_FILES_ES.elephant}`);
      expect(domain).not.toContain("/voice/lazy/elephant.mp3");
      expect(gaps.slice(0, 12)).toEqual([]);
      expect(gaps).toHaveLength(0);
    } finally {
      setLocale("en");
    }
  });

  it("precaches Portuguese clips for an Add, Times, and Telling Time round", () => {
    setLocale("pt");
    try {
      const listed = JSON.parse(readFileSync("src/academy/voice/pt-precache.json", "utf8")) as string[];
      const live = portuguesePrecacheVoiceFiles();
      expect(listed).toEqual(live);
      expect(live.length).toBeGreaterThan(1000);
      expect(live.length).toBeLessThan(Object.keys(VOICE_FILES_PT).length / 2);
      for (const file of live) expect(isPrecacheFile(`voice/${file}`)).toBe(true);
      expect(live).toContain(VOICE_FILES_PT["7"]);
      expect(live).toContain(VOICE_FILES_PT["em ponto"]);
      expect(live).toContain(VOICE_FILES_PT["e meia"]);
      expect(live).toContain(VOICE_FILES_PT.quase);
      expect(live).not.toContain(VOICE_FILES_PT.elephant);

      const allowed = new Set(live);
      const hasPrecache = (key: string) => {
        const file = VOICE_FILES_PT[key];
        return typeof file === "string" && allowed.has(file);
      };
      const hasClip = (key: string) => Object.prototype.hasOwnProperty.call(VOICE_FILES_PT, key);
      const gaps: string[] = [];
      const seen = new Set<string>();
      const check = (line: string) => {
        const text = line.trim();
        if (!text || seen.has(text)) return;
        seen.add(text);
        if (!planSpeech(text, hasClip)) return;
        if (!planSpeech(text, hasPrecache)) gaps.push(text);
      };
      const addChoice = (question: ChoiceQ) => {
        const prompt = promptSpeech(question);
        check(prompt);
        check(yourTurnLine(prompt));
        check(hintCue(question).speech);
        check(workedExample(question).speech);
        check(speakable(question.praise));
        check(speakable(question.almost));
      };

      for (const row of collectSpokenLines()) {
        if (row.game === "add" || row.game === "times" || row.game === "time" || row.game === "ui" || row.game === "buddy" || row.game === "boss") {
          check(row.line);
        }
      }
      const add = GAMES.find((game) => game.id === "add");
      const times = GAMES.find((game) => game.id === "times");
      const time = GAMES.find((game) => game.id === "time");
      for (const game of [add, times]) {
        if (!game) continue;
        for (const level of game.levels) {
          for (let i = 0; i < 24; i += 1) {
            addChoice(game.makeQuestion(rngFromSeed(`pt-offline:${game.id}:${level.id}:${i}`), level.id, []));
          }
        }
      }
      if (time) {
        for (const level of time.levels) {
          for (let i = 0; i < 16; i += 1) {
            const task = makeClockTask(level.id, rngFromSeed(`pt-offline:hands:${level.id}:${i}`));
            check(task.speech);
            check(yourTurnLine(task.speech));
            check(exampleFor(task).speech);
          }
        }
      }

      const domain = buildPrecacheList({
        appPrefix: "",
        artPrefix: "",
        files: live.map((file) => `voice/${file}`).concat([`voice/${VOICE_FILES_PT.elephant}`, "voice/lazy/elephant.mp3"]),
        texts: [],
      });
      expect(domain).toContain(`/voice/${VOICE_FILES_PT["7"]}`);
      expect(domain).toContain(`/voice/${VOICE_FILES_PT["toque a resposta"]}`);
      expect(domain).not.toContain(`/voice/${VOICE_FILES_PT.elephant}`);
      expect(domain).not.toContain("/voice/lazy/elephant.mp3");
      expect(gaps.slice(0, 12)).toEqual([]);
      expect(gaps).toHaveLength(0);
    } finally {
      setLocale("en");
    }
  });

  it("precaches French clips for an Add, Times, and Telling Time round", () => {
    setLocale("fr");
    try {
      const listed = JSON.parse(readFileSync("src/academy/voice/fr-precache.json", "utf8")) as string[];
      const live = frenchPrecacheVoiceFiles();
      expect(listed).toEqual(live);
      expect(live.length).toBeGreaterThan(1000);
      expect(live.length).toBeLessThan(Object.keys(VOICE_FILES_FR).length / 2);
      for (const file of live) expect(isPrecacheFile(`voice/${file}`)).toBe(true);
      expect(live).toContain(VOICE_FILES_FR["7"]);
      expect(live).toContain(VOICE_FILES_FR.pile);
      expect(live).toContain(VOICE_FILES_FR.demie);
      expect(live).toContain(VOICE_FILES_FR.presque);
      expect(live).not.toContain(VOICE_FILES_FR.elephant);

      const allowed = new Set(live);
      const hasPrecache = (key: string) => {
        const file = VOICE_FILES_FR[key];
        return typeof file === "string" && allowed.has(file);
      };
      const hasClip = (key: string) => Object.prototype.hasOwnProperty.call(VOICE_FILES_FR, key);
      const gaps: string[] = [];
      const seen = new Set<string>();
      const check = (line: string) => {
        const text = line.trim();
        if (!text || seen.has(text)) return;
        seen.add(text);
        if (!planSpeech(text, hasClip)) return;
        if (!planSpeech(text, hasPrecache)) gaps.push(text);
      };
      const addChoice = (question: ChoiceQ) => {
        const prompt = promptSpeech(question);
        check(prompt);
        check(yourTurnLine(prompt));
        check(hintCue(question).speech);
        check(workedExample(question).speech);
        check(speakable(question.praise));
        check(speakable(question.almost));
      };

      for (const row of collectSpokenLines()) {
        if (row.game === "add" || row.game === "times" || row.game === "time" || row.game === "ui" || row.game === "buddy" || row.game === "boss") {
          check(row.line);
        }
      }
      const add = GAMES.find((game) => game.id === "add");
      const times = GAMES.find((game) => game.id === "times");
      const time = GAMES.find((game) => game.id === "time");
      for (const game of [add, times]) {
        if (!game) continue;
        for (const level of game.levels) {
          for (let i = 0; i < 24; i += 1) {
            addChoice(game.makeQuestion(rngFromSeed(`fr-offline:${game.id}:${level.id}:${i}`), level.id, []));
          }
        }
      }
      if (time) {
        for (const level of time.levels) {
          for (let i = 0; i < 16; i += 1) {
            const task = makeClockTask(level.id, rngFromSeed(`fr-offline:hands:${level.id}:${i}`));
            check(task.speech);
            check(yourTurnLine(task.speech));
            check(exampleFor(task).speech);
          }
        }
      }

      const domain = buildPrecacheList({
        appPrefix: "",
        artPrefix: "",
        files: live.map((file) => `voice/${file}`).concat([`voice/${VOICE_FILES_FR.elephant}`, "voice/lazy/elephant.mp3"]),
        texts: [],
      });
      expect(domain).toContain(`/voice/${VOICE_FILES_FR["7"]}`);
      expect(domain).toContain(`/voice/${VOICE_FILES_FR["touche la réponse"]}`);
      expect(domain).not.toContain(`/voice/${VOICE_FILES_FR.elephant}`);
      expect(domain).not.toContain("/voice/lazy/elephant.mp3");
      expect(gaps.slice(0, 12)).toEqual([]);
      expect(gaps).toHaveLength(0);
    } finally {
      setLocale("en");
    }
  });

  it("precaches Chinese clips for core games without the whole voice folder", () => {
    setLocale("zh");
    try {
      const listed = JSON.parse(readFileSync("src/academy/voice/zh-precache.json", "utf8")) as string[];
      const live = chinesePrecacheVoiceFiles();
      expect(listed).toEqual(live);
      expect(live.length).toBeGreaterThan(100);
      expect(live.length).toBeLessThan(Object.keys(VOICE_FILES_ZH).length);
      for (const file of live) expect(isPrecacheFile(`voice/${file}`)).toBe(true);
      expect(live).toContain(VOICE_FILES_ZH["7"]);
      const extra = Object.values(VOICE_FILES_ZH).find((file) => !live.includes(file));
      expect(extra).toBeTruthy();
      expect(isPrecacheFile(`voice/${extra}`)).toBe(false);
    } finally {
      setLocale("en");
    }
  });

  it("precaches Hindi clips for core games without the whole voice folder", () => {
    setLocale("hi");
    try {
      const listed = JSON.parse(readFileSync("src/academy/voice/hi-precache.json", "utf8")) as string[];
      const live = hindiPrecacheVoiceFiles();
      expect(listed).toEqual(live);
      expect(live.length).toBeGreaterThan(100);
      expect(live.length).toBeLessThan(Object.keys(VOICE_FILES_HI).length);
      for (const file of live) expect(isPrecacheFile(`voice/${file}`)).toBe(true);
      expect(live).toContain(VOICE_FILES_HI["7"]);
      const extra = Object.values(VOICE_FILES_HI).find((file) => !live.includes(file));
      expect(extra).toBeTruthy();
      expect(isPrecacheFile(`voice/${extra}`)).toBe(false);
    } finally {
      setLocale("en");
    }
  });

  it("precaches Arabic clips for core games without the whole voice folder", () => {
    setLocale("ar");
    try {
      const listed = JSON.parse(readFileSync("src/academy/voice/ar-precache.json", "utf8")) as string[];
      const live = arabicPrecacheVoiceFiles();
      expect(listed).toEqual(live);
      expect(live.length).toBeGreaterThan(100);
      expect(live.length).toBeLessThan(Object.keys(VOICE_FILES_AR).length);
      for (const file of live) expect(isPrecacheFile(`voice/${file}`)).toBe(true);
      expect(live).toContain(VOICE_FILES_AR["7"]);
      expect(isPrecacheFile("voice/ar/not-listed.mp3")).toBe(false);
      const extra = Object.values(VOICE_FILES_AR).find((file) => !live.includes(file));
      expect(extra).toBeTruthy();
      expect(isPrecacheFile(`voice/${extra}`)).toBe(false);
    } finally {
      setLocale("en");
    }
  });
});
