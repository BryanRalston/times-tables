import { GAME_CARDS } from "../games/cards";
import { GRADE_BANDS } from "../grade-map";
import { contentGrades, gradeSpan, levelHomeGrade } from "../grade-range";
import type { Grade } from "../model";
import { WORKSHEETS, type StaticSheet } from "./catalog";
import {
  ageRange,
  GAME_COPY,
  gradePhrase,
  joinCodes,
  pageH1,
  pageTitle,
  type Phrase,
  say,
  type SeoLang,
  type SeoLocale,
  SEO_LOCALES,
  sheetDescription,
  sheetGradeLabel,
  sheetH1,
  sheetIndexDescription,
  sheetIndexH1,
  sheetIndexLede,
  sheetIndexTitle,
  sheetTitle,
  skillPhrase,
  type UiCopy,
  uiCopy,
} from "./copy";

export interface SeoLink {
  href: string;
  label: string;
}

export interface SeoAlternate {
  hreflang: string;
  path: string;
}

export interface SeoPage {
  kind: "game" | "skill" | "sheet" | "sheet-index";
  path: string;
  file: string;
  locale: SeoLocale;
  title: string;
  description: string;
  h1: string;
  lede: string;
  gradesLabel: string;
  codes: string[];
  ageRange: string;
  shot: string;
  shotAlt: string;
  gameId: string;
  playHref: string;
  privacyHref: string;
  worksheetsHref: string;
  alternates: SeoAlternate[];
  related: SeoLink[];
  ui: UiCopy;
  sheet?: StaticSheet;
}

interface Topic {
  kind: "game" | "skill";
  slug: string;
  gameId: string;
  grades: Grade[];
  codes: string[];
  name: Phrase;
  blurb: Phrase;
  gameName: Phrase;
  related: { slug: string; label: Phrase }[];
}

export function withLocale(prefix: string, slug: string): string {
  return [prefix, slug].filter(Boolean).join("/");
}

export function relativeHref(from: string, to: string): string {
  const fromParts = from.split("/").filter(Boolean);
  const toParts = to.split("/").filter(Boolean);
  let shared = 0;
  while (shared < fromParts.length && shared < toParts.length && fromParts[shared] === toParts[shared]) shared += 1;
  const ups = fromParts.length - shared;
  const down = toParts.slice(shared);
  if (ups === 0 && down.length === 0) return "./";
  return `${"../".repeat(ups)}${down.join("/")}/`;
}

function playHref(path: string, gameId: string): string {
  const depth = path.split("/").filter(Boolean).length;
  return `${"../".repeat(depth)}#/play/${gameId}`;
}

function alternatesFor(slug: string): SeoAlternate[] {
  return [
    ...SEO_LOCALES.map((locale) => ({ hreflang: locale.hreflang, path: withLocale(locale.prefix, slug) })),
    { hreflang: "x-default", path: slug },
  ];
}

function codesFor(gameId: string, grades: readonly Grade[]): string[] {
  const codes: string[] = [];
  for (const grade of grades) {
    const band = GRADE_BANDS[gameId]?.[grade];
    if (!band || band.offer === "later") continue;
    for (const code of band.standards) {
      if (!codes.includes(code)) codes.push(code);
    }
  }
  return codes;
}

/** A skill page names the grade that first teaches the level. Later grades only review it. */
function gradesForLevel(gameId: string, levelId: string): Grade[] {
  const home = levelHomeGrade(gameId, levelId);
  return home ? [home] : [];
}

function skillSlug(english: string, levelId: string): string {
  const slug = english
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || levelId;
}

/** A ready-made sheet's grades come from the levels its items practice. */
function sheetGrades(sheet: StaticSheet): Grade[] {
  const grades = gradeSpan(contentGrades(sheet.game, sheet.levels));
  if (grades.length === 0) throw new Error(`worksheet grades ${sheet.slug}`);
  return grades;
}

function skillBlurb(lang: SeoLang, skill: string, game: string): string {
  switch (lang) {
    case "en":
      return `Kids practice ${skill} in the ${game} game.`;
    case "es":
      return `Los niños practican ${skill} en el juego de ${game}.`;
    case "pt-BR":
      return `As crianças praticam ${skill} no jogo de ${game}.`;
    case "fr":
      return `Les enfants s'exercent à ${skill} dans le jeu ${game}.`;
    case "zh-Hans":
      return `孩子在${game}游戏里练习${skill}。`;
    case "hi":
      return `बच्चे ${game} खेल में ${skill} का अभ्यास करते हैं।`;
    case "ar":
      return `يتدرّب الأطفال على ${skill} في لعبة ${game}.`;
    default: {
      const neverLang: never = lang;
      return neverLang;
    }
  }
}

function ledeFor(lang: SeoLang, blurb: string, grades: string, codes: readonly string[]): string {
  const made = uiCopy(lang, grades, "").madeFor;
  const standards = uiCopy(lang, grades, "").standards;
  const line = codes.length > 0 ? `${standards} ${joinCodes(lang, codes)}.` : "";
  return `${blurb} ${made} ${line}`.replace(/\s+/g, " ").trim();
}

function topics(): Topic[] {
  const games = GAME_COPY.map((game) => {
    const card = GAME_CARDS.find((row) => row.id === game.id);
    if (!card) throw new Error(game.id);
    return { game, card };
  });
  const built: Topic[] = [];
  for (const { game, card } of games) {
    const used = new Set<string>();
    const skills = card.levels.map((level) => {
      const name = skillPhrase(game.id, level.id);
      let leaf = skillSlug(name.en, level.id);
      if (used.has(leaf)) leaf = `${leaf}-${level.id}`;
      used.add(leaf);
      const grades = gradesForLevel(game.id, level.id);
      const span = grades.length > 0 ? grades : game.grades;
      return {
        kind: "skill" as const,
        slug: `${game.slug}/${leaf}`,
        gameId: game.id,
        grades: span,
        codes: codesFor(game.id, span),
        name,
        blurb: name,
        gameName: game.name,
        related: [],
      };
    });
    built.push({
      kind: "game",
      slug: game.slug,
      gameId: game.id,
      grades: game.grades,
      codes: codesFor(game.id, game.grades),
      name: game.name,
      blurb: game.blurb,
      gameName: game.name,
      related: [],
    });
    built.push(...skills);
  }
  const byGame = new Map<string, Topic[]>();
  for (const topic of built) {
    const list = byGame.get(topic.gameId) ?? [];
    list.push(topic);
    byGame.set(topic.gameId, list);
  }
  const gameTopics = built.filter((topic) => topic.kind === "game");
  for (const topic of built) {
    const family = byGame.get(topic.gameId) ?? [];
    const siblings = family.filter((row) => row.slug !== topic.slug);
    const others = gameTopics.filter((row) => row.gameId !== topic.gameId).slice(0, 4);
    const sheets = WORKSHEETS.filter((sheet) => sheet.game === topic.gameId).slice(0, 4);
    topic.related = [
      ...siblings.map((row) => ({ slug: row.slug, label: row.name })),
      ...others.map((row) => ({ slug: row.slug, label: row.name })),
      ...sheets.map((sheet) => ({ slug: `worksheets/${sheet.slug}`, label: phraseForSheet(sheet) })),
    ];
  }
  return built;
}

function phraseForSheet(sheet: StaticSheet): Phrase {
  return {
    en: sheet.h1,
    es: sheetH1(sheet.h1, "es"),
    "pt-BR": sheetH1(sheet.h1, "pt-BR"),
    fr: sheetH1(sheet.h1, "fr"),
    "zh-Hans": sheetH1(sheet.h1, "zh-Hans"),
    hi: sheetH1(sheet.h1, "hi"),
    ar: sheetH1(sheet.h1, "ar"),
  };
}

let cachedTopics: Topic[] | null = null;

function allTopics(): Topic[] {
  cachedTopics ??= topics();
  return cachedTopics;
}

function pageFromTopic(topic: Topic, locale: SeoLocale): SeoPage {
  const lang = locale.id;
  const grades = gradePhrase(lang, topic.grades);
  const name = say(topic.name, lang);
  const gameName = say(topic.gameName, lang);
  const blurb = topic.kind === "game" ? say(topic.blurb, lang) : skillBlurb(lang, name, gameName);
  const path = withLocale(locale.prefix, topic.slug);
  const ui = uiCopy(lang, grades, topic.kind === "game" ? name : gameName);
  const title = pageTitle(lang, name, grades);
  return {
    kind: topic.kind,
    path,
    file: `${path}/index.html`,
    locale,
    title,
    description: ledeFor(lang, blurb, grades, topic.codes),
    h1: pageH1(lang, name),
    lede: ledeFor(lang, blurb, grades, topic.codes),
    gradesLabel: grades,
    codes: topic.codes,
    ageRange: ageRange(topic.grades),
    shot: `/shots/${topic.gameId}.png`,
    shotAlt: ui.shot,
    gameId: topic.gameId,
    playHref: playHref(path, topic.gameId),
    privacyHref: relativeHref(path, withLocale(locale.prefix, "privacy")),
    worksheetsHref: relativeHref(path, withLocale(locale.prefix, "worksheets")),
    alternates: alternatesFor(topic.slug),
    related: topic.related.map((link) => ({
      href: relativeHref(path, withLocale(locale.prefix, link.slug)),
      label: say(link.label, lang),
    })),
    ui,
  };
}

function disambiguate(pages: SeoPage[]): SeoPage[] {
  const counts = new Map<string, number>();
  for (const page of pages) counts.set(page.title, (counts.get(page.title) ?? 0) + 1);
  return pages.map((page) => {
    if ((counts.get(page.title) ?? 0) < 2) return page;
    const game = say(GAME_COPY.find((row) => row.id === page.gameId)?.name ?? { en: page.gameId, es: page.gameId, "pt-BR": page.gameId, fr: page.gameId, "zh-Hans": page.gameId, hi: page.gameId, ar: page.gameId }, page.locale.id);
    return { ...page, title: page.title.replace(" | Squishee Academy", ` — ${game} | Squishee Academy`) };
  });
}

/** Search results cut titles near 60 characters and descriptions near 160. */
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 160;
const BRAND = " | Squishee Academy";

function charLength(text: string): number {
  return [...text].length;
}

/** Cut at a word (or, for Chinese, any character) so the text ends cleanly with an ellipsis. */
function clip(text: string, max: number): string {
  if (charLength(text) <= max) return text;
  const chars = [...text].slice(0, max - 1).join("");
  const space = chars.lastIndexOf(" ");
  const cut = space > max * 0.6 ? chars.slice(0, space) : chars;
  return `${cut.replace(/[\s,.;:，。、—–-]+$/u, "")}…`;
}

/** Titles drop grade ranges (descriptions carry grades) and keep the brand whenever it fits. */
function titleOptions(title: string): string[] {
  const base = title.endsWith(BRAND) ? title.slice(0, -BRAND.length) : title;
  const plain = base.replace(/\s*[（(][^)）]*[)）]/gu, "").trim();
  const dash = plain.indexOf(" — ");
  const short = dash > 0 ? plain.slice(0, dash) : plain;
  // Before giving up the brand: drop "for kids" so the skill name stays whole.
  const bare = short.replace(/ (for kids|para niños|para crianças|pour les enfants|للأطفال)(?=\s|$)/u, "").replace(/^बच्चों के लिए /u, "");
  return [`${plain}${BRAND}`, `${short}${BRAND}`, `${bare}${BRAND}`, plain, short, bare, clip(bare, TITLE_MAX)];
}

function descriptionOptions(page: SeoPage): string[] {
  if (page.kind !== "game" && page.kind !== "skill") return [page.description, clip(page.description, DESCRIPTION_MAX)];
  // Lead with the search phrase (the page's H1), then the blurb, then grades and standards as room allows.
  const sep = page.locale.id === "zh-Hans" ? "。" : page.locale.id === "hi" ? "। " : ". ";
  const lede = page.lede;
  const standards = page.ui.standards;
  const cut = standards ? lede.indexOf(standards) : -1;
  const noCodes = (cut > 0 ? lede.slice(0, cut) : lede).trim();
  const madeFor = page.ui.madeFor;
  const at = madeFor ? noCodes.indexOf(madeFor) : -1;
  const blurb = (at > 0 ? noCodes.slice(0, at) : noCodes).trim();
  const lead = `${page.h1}${sep}`;
  return [
    `${lead}${lede}`,
    `${lead}${noCodes}`,
    `${lead}${blurb}`,
    clip(`${lead}${blurb}`, DESCRIPTION_MAX),
  ].map((row) => row.replace(/\s+/g, " ").trim());
}

/** Keep every title and description inside search-result limits, and titles unique per language. */
function fitMeta(pages: SeoPage[]): SeoPage[] {
  const used = new Set<string>();
  return pages.map((page) => {
    const options = titleOptions(page.title);
    const title =
      options.find((row) => charLength(row) <= TITLE_MAX && !used.has(row)) ??
      clip(`${options[3]} ${page.path.split("/").pop() ?? ""}`, TITLE_MAX);
    used.add(title);
    const description =
      descriptionOptions(page).find((row) => charLength(row) <= DESCRIPTION_MAX) ?? clip(page.description, DESCRIPTION_MAX);
    return { ...page, title, description };
  });
}

let cachedLandings: SeoPage[] | null = null;
let cachedSheets: SeoPage[] | null = null;

export function landingPages(): SeoPage[] {
  if (cachedLandings) return cachedLandings;
  const pages = SEO_LOCALES.flatMap((locale) => allTopics().map((topic) => pageFromTopic(topic, locale)));
  const byLang = new Map<SeoLang, SeoPage[]>();
  for (const page of pages) {
    const list = byLang.get(page.locale.id) ?? [];
    list.push(page);
    byLang.set(page.locale.id, list);
  }
  cachedLandings = SEO_LOCALES.flatMap((locale) => fitMeta(disambiguate(byLang.get(locale.id) ?? [])));
  return cachedLandings;
}

export function sheetPages(): SeoPage[] {
  cachedSheets ??= SEO_LOCALES.flatMap((locale) => WORKSHEETS.map((sheet) => sheetPage(sheet, locale)));
  return cachedSheets;
}

export function sheetIndexPages(): SeoPage[] {
  return SEO_LOCALES.map((locale) => sheetIndexPage(locale));
}

function sheetPage(sheet: StaticSheet, locale: SeoLocale): SeoPage {
  const lang = locale.id;
  const grades = sheetGrades(sheet);
  const gradeLabel = sheetGradeLabel(sheet.title, lang);
  const h1 = lang === "en" ? sheet.h1 : sheetH1(sheet.h1, lang);
  const title = lang === "en" ? sheet.title : sheetTitle(lang, h1, gradeLabel);
  const description = lang === "en" ? sheet.description : sheetDescription(lang, h1, gradeLabel);
  const codes = codesFor(sheet.game, grades);
  const slug = `worksheets/${sheet.slug}`;
  const path = withLocale(locale.prefix, slug);
  const game = GAME_COPY.find((row) => row.id === sheet.game);
  const ui = uiCopy(lang, gradeLabel, game ? say(game.name, lang) : sheet.game);
  const siblings = WORKSHEETS.filter((row) => row.game === sheet.game && row.slug !== sheet.slug).slice(0, 4);
  const related = [
    ...(game ? [{ href: relativeHref(path, withLocale(locale.prefix, game.slug)), label: say(game.name, lang) }] : []),
    ...siblings.map((row) => ({
      href: relativeHref(path, withLocale(locale.prefix, `worksheets/${row.slug}`)),
      label: lang === "en" ? row.h1 : sheetH1(row.h1, lang),
    })),
  ];
  return {
    kind: "sheet",
    path,
    file: `${path}/index.html`,
    locale,
    title,
    description,
    h1,
    lede: description,
    gradesLabel: gradeLabel,
    codes,
    ageRange: ageRange(grades),
    shot: `/shots/${sheet.game}.png`,
    shotAlt: ui.shot,
    gameId: sheet.game,
    playHref: playHref(path, sheet.game),
    privacyHref: relativeHref(path, withLocale(locale.prefix, "privacy")),
    worksheetsHref: relativeHref(path, withLocale(locale.prefix, "worksheets")),
    alternates: alternatesFor(slug),
    related,
    ui,
    sheet,
  };
}

function sheetIndexPage(locale: SeoLocale): SeoPage {
  const lang = locale.id;
  const path = withLocale(locale.prefix, "worksheets");
  const ui = uiCopy(lang, gradePhrase(lang, ["PK", "K", "1", "2", "3", "4", "5"]), "Squishee Academy");
  const games = GAME_COPY.map((game) => ({
    href: relativeHref(path, withLocale(locale.prefix, game.slug)),
    label: say(game.name, lang),
  }));
  return {
    kind: "sheet-index",
    path,
    file: `${path}/index.html`,
    locale,
    title: sheetIndexTitle(lang),
    description: sheetIndexDescription(lang),
    h1: sheetIndexH1(lang),
    lede: sheetIndexLede(lang),
    gradesLabel: gradePhrase(lang, ["PK", "K", "1", "2", "3", "4", "5"]),
    codes: [],
    ageRange: "4-11",
    shot: "/shots/times.png",
    shotAlt: uiCopy(lang, "", say(GAME_COPY[0]!.name, lang)).shot,
    gameId: "times",
    playHref: playHref(path, "times"),
    privacyHref: relativeHref(path, withLocale(locale.prefix, "privacy")),
    worksheetsHref: "./",
    alternates: alternatesFor("worksheets"),
    related: games,
    ui,
  };
}

export function gameLinksForHome(): SeoLink[] {
  return GAME_COPY.map((game) => ({ href: `${game.slug}/`, label: game.name.en }));
}

export function englishGameSlug(id: string): string {
  return GAME_COPY.find((game) => game.id === id)?.slug ?? id;
}
