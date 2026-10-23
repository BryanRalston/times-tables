import { brotliDecompressSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { decimalSpeech } from "./games/span";
import { groupedNumber, installChinese, installHindi, setLocale } from "./i18n";
import { AR } from "./i18n-ar";
import { FR } from "./i18n-fr";
import { BOSS_HI, HI, PERSONA_FALLBACK_HI, PERSONA_HI, TRAIT_HI } from "./i18n-hi";
import { PT } from "./i18n-pt";
import { BOSS_ZH, PERSONA_FALLBACK_ZH, PERSONA_ZH, TRAIT_ZH, ZH } from "./i18n-zh";
import { blankChild, freshSave, parseSave, STORAGE_KEY, loadSave, writeSave } from "./storage";
import { HomeScreen } from "./ui/home";
import { MapScreen } from "./ui/map";
import { WorksheetPage } from "./ui/worksheet";

installChinese({ ZH, PERSONA_ZH, PERSONA_FALLBACK_ZH, BOSS_ZH, TRAIT_ZH });
installHindi({ HI, PERSONA_HI, PERSONA_FALLBACK_HI, BOSS_HI, TRAIT_HI });

const KNOWN_TAGS = [
  "cmap", "head", "hhea", "hmtx", "maxp", "name", "OS/2", "post", "cvt ", "fpgm",
  "glyf", "loca", "prep", "CFF ", "VORG", "EBDT", "EBLC", "gasp", "hdmx", "kern",
  "LTSH", "PCLT", "VDMX", "vhea", "vmtx", "BASE", "GDEF", "GPOS", "GSUB", "EBSC",
  "JSTF", "MATH", "CBDT", "CBLC", "COLR", "CPAL", "SVG ", "sbix", "acnt", "avar",
  "bdat", "bloc", "bsln", "cvar", "fdsc", "feat", "fmtx", "fvar", "gvar", "hsty",
  "just", "lcar", "mort", "morx", "opbd", "prop", "trak", "Zapf", "Silf", "Glat",
  "Gloc", "Feat", "Sill",
];

function readBase128(buf: Buffer, pos: number): { value: number; pos: number } {
  let value = 0;
  for (let i = 0; i < 5; i += 1) {
    const byte = buf[pos];
    if (byte === undefined) throw new Error("base128");
    pos += 1;
    if (value > 0x1ffffff) throw new Error("base128 overflow");
    value = (value << 7) | (byte & 0x7f);
    if ((byte & 0x80) === 0) return { value, pos };
  }
  throw new Error("base128 length");
}

function u16(buf: Buffer, pos: number): number {
  return buf.readUInt16BE(pos);
}

/** Code points with a real glyph in a woff2 cmap. Enough to catch a dropped character. */
function cmapCodes(file: string): Set<number> {
  const buf = readFileSync(file);
  if (buf.toString("ascii", 0, 4) !== "wOF2") throw new Error("not woff2");
  const numTables = buf.readUInt16BE(12);
  const totalCompressed = buf.readUInt32BE(20);
  let pos = 48;
  const tables: { tag: string; stored: number }[] = [];
  for (let i = 0; i < numTables; i += 1) {
    const flags = buf[pos];
    if (flags === undefined) throw new Error("flags");
    pos += 1;
    const index = flags & 0x3f;
    let tag: string;
    if (index === 0x3f) {
      tag = buf.toString("ascii", pos, pos + 4);
      pos += 4;
    } else {
      tag = KNOWN_TAGS[index] ?? "";
    }
    const orig = readBase128(buf, pos);
    pos = orig.pos;
    const transformed = tag === "glyf" || tag === "loca" || (flags & 0xc0) !== 0;
    let stored = orig.value;
    if (transformed) {
      const next = readBase128(buf, pos);
      stored = next.value;
      pos = next.pos;
    }
    tables.push({ tag, stored });
  }
  const decoded = brotliDecompressSync(buf.subarray(pos, pos + totalCompressed));
  let offset = 0;
  let cmap: Buffer | null = null;
  for (const table of tables) {
    if (table.tag === "cmap") cmap = decoded.subarray(offset, offset + table.stored);
    offset += table.stored;
  }
  if (!cmap) throw new Error("cmap");
  const codes = new Set<number>();
  const subtables = u16(cmap, 2);
  for (let i = 0; i < subtables; i += 1) {
    const start = cmap.readUInt32BE(4 + i * 8 + 4);
    const format = u16(cmap, start);
    if (format === 4) readFormat4(cmap, start, codes);
    else if (format === 12) readFormat12(cmap, start, codes);
  }
  return codes;
}

function readFormat4(cmap: Buffer, start: number, codes: Set<number>): void {
  const segCount = u16(cmap, start + 6) / 2;
  const endPos = start + 14;
  const startPos = endPos + segCount * 2 + 2;
  const deltaPos = startPos + segCount * 2;
  const offsetPos = deltaPos + segCount * 2;
  for (let i = 0; i < segCount; i += 1) {
    const end = u16(cmap, endPos + i * 2);
    const begin = u16(cmap, startPos + i * 2);
    const delta = u16(cmap, deltaPos + i * 2);
    const range = u16(cmap, offsetPos + i * 2);
    if (end === 0xffff && begin === 0xffff) continue;
    for (let code = begin; code <= end; code += 1) {
      let glyph = 0;
      if (range === 0) glyph = (code + delta) & 0xffff;
      else {
        const glyphPos = offsetPos + i * 2 + range + (code - begin) * 2;
        glyph = u16(cmap, glyphPos);
        if (glyph !== 0) glyph = (glyph + delta) & 0xffff;
      }
      if (glyph !== 0) codes.add(code);
    }
  }
}

function readFormat12(cmap: Buffer, start: number, codes: Set<number>): void {
  const groups = cmap.readUInt32BE(start + 12);
  for (let i = 0; i < groups; i += 1) {
    const at = start + 16 + i * 12;
    const begin = cmap.readUInt32BE(at);
    const end = cmap.readUInt32BE(at + 4);
    const glyph = cmap.readUInt32BE(at + 8);
    if (glyph === 0 && begin === end) continue;
    for (let code = begin; code <= end; code += 1) codes.add(code);
  }
}

function cjkIn(file: string): string[] {
  const text = readFileSync(file, "utf8");
  return [...new Set([...text].filter((ch) => ch >= "\u4e00" && ch <= "\u9fff"))];
}

describe("locale number grouping", () => {
  afterEach(() => setLocale("en"));

  it("groups a large number the way each language writes it, with Western digits", () => {
    const cases: [Parameters<typeof setLocale>[0], string, string][] = [
      ["en", "454,520", "1,000,000"],
      ["es", "454,520", "1,000,000"],
      ["pt", "454.520", "1.000.000"],
      ["fr", "454\u202f520", "1\u202f000\u202f000"],
      ["zh", "454,520", "1,000,000"],
      ["hi", "4,54,520", "10,00,000"],
      ["ar", "454,520", "1,000,000"],
    ];
    for (const [lang, mid, million] of cases) {
      setLocale(lang);
      expect(groupedNumber(454520), lang).toBe(mid);
      expect(groupedNumber(1000000), lang).toBe(million);
      expect(groupedNumber(454520), lang).not.toMatch(/[٠-٩]/);
    }
  });
});

describe("one tenth", () => {
  afterEach(() => setLocale("en"));

  it("uses the singular word when there is exactly one tenth", () => {
    setLocale("en");
    expect(decimalSpeech("0.10")).toBe("1 tenth");
    expect(decimalSpeech("1.10")).toBe("1 and 1 tenth");
    expect(decimalSpeech("0.20")).toBe("2 tenths");
    setLocale("es");
    expect(decimalSpeech("0.10")).toBe("1 décimo");
    setLocale("pt");
    expect(decimalSpeech("0.10")).toBe("1 décimo");
    expect(decimalSpeech("2.10")).toBe("2 e 1 décimo");
    setLocale("fr");
    expect(decimalSpeech("0.10")).toBe("1 dixième");
    expect(decimalSpeech("3.10")).toBe("3 et 1 dixième");
    expect(decimalSpeech("0.01")).toBe("1 centièmes");
    setLocale("ar");
    expect(decimalSpeech("0.10")).toBe("عُشر واحد");
    setLocale("zh");
    expect(decimalSpeech("0.10")).toBe("1个十分之一");
    setLocale("hi");
    expect(decimalSpeech("0.10")).toBe("1 दशांश");
  });
});

describe("playtest leaks", () => {
  afterEach(() => setLocale("en"));

  it("translates the Chinese island lock instead of leaving the English game name", () => {
    setLocale("zh");
    const html = renderToStaticMarkup(createElement(MapScreen, { child: blankChild({ name: "Lin", grade: "2" }), onOpenEgg: () => {} }));
    expect(html).toContain("打败乘法表的大魔王。");
    expect(html).not.toMatch(/打败[A-Za-z]/);
  });

  it("says face the boss in Hindi instead of the geometry word", () => {
    setLocale("hi");
    const child = blankChild({ name: "Asha", grade: "4" });
    child.journey = { areaId: "times", stop: 3, bosses: [] };
    const html = renderToStaticMarkup(
      createElement(HomeScreen, { child, lang: "hi", sound: false, onClaim: () => {}, onLang: () => {}, onPlay: () => {} }),
    );
    expect(html).toContain("Professor Spellbottom का सामना");
    expect(html).not.toContain("फलक");
  });

  it("translates the Hindi worksheet title and the table menu", () => {
    const save = freshSave();
    save.lang = "hi";
    save.langChosen = true;
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => (key === STORAGE_KEY ? JSON.stringify(save) : null),
      setItem: () => {},
      removeItem: () => {},
    });
    vi.stubGlobal("window", { location: { href: "http://localhost/", search: "" }, history: { replaceState: () => {} } });
    const html = renderToStaticMarkup(createElement(WorksheetPage, { game: "times" }));
    expect(html).toContain("पहाड़े अभ्यास पत्र");
    expect(html).toContain("पहाड़ा");
    expect(html).toContain("सभी");
    expect(html).not.toContain("Times Tables अभ्यास");
    vi.unstubAllGlobals();
  });
});

describe("language choice on disk", () => {
  it("keeps each chosen language after a reload", () => {
    for (const lang of ["es", "pt", "fr", "zh", "hi", "ar"] as const) {
      const save = freshSave();
      save.lang = lang;
      save.langChosen = true;
      const parsed = parseSave(JSON.parse(JSON.stringify(save)) as unknown);
      expect(parsed.lang).toBe(lang);
      expect(parsed.langChosen).toBe(true);
    }
    const dropped = freshSave();
    const raw = JSON.parse(JSON.stringify(dropped)) as { lang: string; langChosen: boolean };
    raw.lang = "de";
    raw.langChosen = false;
    const parsed = parseSave(raw);
    expect(parsed.lang).toBe("en");
    expect(parsed.langChosen).toBe(false);
  });

  it("writes the choice back to the academy save", () => {
    const mem = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => mem.get(key) ?? null,
      setItem: (key: string, value: string) => {
        mem.set(key, value);
      },
      removeItem: (key: string) => {
        mem.delete(key);
      },
    });
    const save = loadSave();
    writeSave({ ...save, lang: "pt", langChosen: true });
    const again = loadSave();
    expect(again.lang).toBe("pt");
    expect(again.langChosen).toBe(true);
    vi.unstubAllGlobals();
  });
});

describe("crawlable english footer", () => {
  it("hides the English link list once a family picks another language", () => {
    const app = readFileSync("src/academy/app.tsx", "utf8");
    expect(app).toContain('document.querySelector(".for-grownups")');
    expect(app).toContain("footer.hidden = save.lang !== \"en\"");
    const home = readFileSync("academy/index.html", "utf8");
    expect(home).toContain("Free, no ads, no accounts, 7 languages.");
  });
});

describe("arabic layout guards", () => {
  it("keeps coins, clocks, fractions, and big numbers left to right, and mirrors only the back arrow", () => {
    const css = readFileSync("src/academy/academy.css", "utf8");
    for (const selector of [".ac-coin-row", ".ac-coin", ".ac-clock", ".ac-frac", ".ac-graph-line", ".ac-big-num", "svg.ac-line"]) {
      expect(css).toContain(`html[lang="ar"] ${selector}`);
    }
    expect(css).toContain('html[lang="ar"] .ac-back-arrow { transform: scaleX(-1); }');
    expect(css).toContain("inset-inline-end: 8px");
    expect(css).not.toContain(".ac-card > .ac-squish { position: absolute; top: 8px; right: 8px;");
  });
});

describe("chinese subset", () => {
  it("covers every CJK character in the Chinese UI and the landing copy", () => {
    const codes = cmapCodes("academy/public/fonts/NotoSansSC-subset.woff2");
    const files = ["src/academy/i18n-zh.ts", "src/academy/seo/copy.ts", "src/academy/seo/privacy-copy.ts"];
    const missing: string[] = [];
    for (const file of files) {
      for (const ch of cjkIn(file)) {
        if (!codes.has(ch.codePointAt(0) ?? 0)) missing.push(`${file}:${ch}`);
      }
    }
    expect(missing).toEqual([]);
    expect(codes.has("择".codePointAt(0) ?? 0)).toBe(true);
  });

  it("covers Devanagari and Arabic on the privacy page", () => {
    const text = readFileSync("src/academy/seo/privacy-copy.ts", "utf8");
    const hindi = cmapCodes("academy/public/fonts/NotoSansDevanagari-subset.woff2");
    const arabic = cmapCodes("academy/public/fonts/NotoSansArabic-subset.woff2");
    const missingHindi = [...text].filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return code >= 0x0900 && code <= 0x097f && !hindi.has(code);
    });
    const missingArabic = [...text].filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      const inArabic = (code >= 0x0600 && code <= 0x06ff) || (code >= 0xfb50 && code <= 0xfdff) || (code >= 0xfe70 && code <= 0xfeff);
      return inArabic && !arabic.has(code);
    });
    expect([...new Set(missingHindi)]).toEqual([]);
    expect([...new Set(missingArabic)]).toEqual([]);
  });
});

describe("static copy is filled in for every shipped language", () => {
  it("has the worksheet words that were missing from some packs", () => {
    expect(PT.Table).toBe("Tabuada");
    expect(PT.Mix).toBe("Todas");
    expect(FR.Mix).toBe("Toutes");
    expect(ZH.Mix).toBe("全部");
    expect(HI.Mix).toBe("सभी");
    expect(AR.Mix).toBe("الكل");
    expect(ZH["Choose your language"]).toBe("选择你的语言");
  });
});
