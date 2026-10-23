import { WORKSHEETS, type StaticItem, type StaticSheet } from "./catalog";
import { landingPages, relativeHref, sheetIndexPages, sheetPages, type SeoPage } from "./landings";

export const CANONICAL_ORIGIN = "https://squisheeacademy.com";

export const HOME_TITLE = "Free learning games for kids Pre-K to grade 4 | Squishee Academy";
export const HOME_DESCRIPTION =
  "Free learning games for kids Pre-K to grade 4. Play in 7 languages: English, Español, Português, Français, 中文, हिन्दी, العربية. No ads, no accounts.";

/** One URL serves every language. These tell crawlers which languages that page is for. */
export const HOME_HREFLANGS = ["x-default", "en", "es", "pt-BR", "fr", "zh-Hans", "hi", "ar"] as const;

/** Stable path in the domain build. Crawlers fetch this file directly. */
export const SHARE_IMAGE_PATH = "/og/squishee-academy.png";
export const SHARE_IMAGE_WIDTH = 1200;
export const SHARE_IMAGE_HEIGHT = 630;
export const SHARE_IMAGE_ALT = "Squishee Academy. Free learning games for Pre-K to grade 4.";

export function shareImageUrl(): string {
  return `${CANONICAL_ORIGIN}${SHARE_IMAGE_PATH}`;
}

export interface SeoFile {
  path: string;
  body: string;
}

export function canonicalUrl(path: string): string {
  const clean = path.replace(/^\/+|\/+$/g, "");
  return clean ? `${CANONICAL_ORIGIN}/${clean}/` : `${CANONICAL_ORIGIN}/`;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function iconLinks(): string {
  return `  <link rel="icon" href="/favicon.ico" sizes="any" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />`;
}

export function socialMeta(opts: { title: string; description: string; url: string }): string {
  const title = escapeHtml(opts.title);
  const description = escapeHtml(opts.description);
  const alt = escapeHtml(SHARE_IMAGE_ALT);
  const image = shareImageUrl();
  return `  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${opts.url}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Squishee Academy" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="${SHARE_IMAGE_WIDTH}" />
  <meta property="og:image:height" content="${SHARE_IMAGE_HEIGHT}" />
  <meta property="og:image:alt" content="${alt}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <meta name="twitter:image:alt" content="${alt}" />`;
}

function metaContent(html: string, name: string): string | null {
  const re = new RegExp(
    `<meta[^>]*name="${name}"[^>]*content="([^"]*)"[^>]*>|<meta[^>]*content="([^"]*)"[^>]*name="${name}"[^>]*>`,
    "i",
  );
  const match = html.match(re);
  return match?.[1] ?? match?.[2] ?? null;
}

/** Open Graph and Twitter tags for a domain HTML document that does not have them yet. */
export function withOpenGraph(html: string): string {
  if (html.includes('property="og:title"')) return html;
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? HOME_TITLE;
  const description = metaContent(html, "description") ?? HOME_DESCRIPTION;
  const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1];
  const url = canonical ?? canonicalUrl("");
  const canonicalTag = canonical ? "" : `  <link rel="canonical" href="${url}" />\n`;
  return html.replace("</head>", `${canonicalTag}${socialMeta({ title, description, url })}\n  </head>`);
}

const PAGE_STYLE = `
:root { color-scheme: light; }
* { box-sizing: border-box; }
body {
  margin: 0;
  color: #3c2448;
  background: linear-gradient(180deg, #fff1f7, #f3fbf8 280px);
  font: 700 18px/1.45 Nunito, "Trebuchet MS", sans-serif;
}
main { width: min(760px, calc(100% - 32px)); margin: 0 auto; padding: 22px 0 48px; }
a { color: #12988a; }
h1, h2 { font-family: Fredoka, Nunito, "Trebuchet MS", sans-serif; letter-spacing: -0.02em; line-height: 1.15; }
h1 { font-size: 34px; margin: 8px 0; }
.brand { font-family: Fredoka, Nunito, "Trebuchet MS", sans-serif; font-size: 22px; text-decoration: none; }
.brand b { color: #ff4b93; }
.brand i { color: #12988a; font-style: normal; }
.lede, .fine { color: #5c4566; }
.name { margin: 16px 0; }
ol.problems { padding-left: 1.4em; }
ol.problems li { margin: 14px 0; break-inside: avoid; }
.blank { display: inline-block; min-width: 7em; border-bottom: 2px solid #3c2448; }
.clock { width: 160px; height: 160px; display: block; }
.clock text { font: 700 16px Nunito, sans-serif; fill: #3c2448; }
.key { margin-top: 28px; }
.key ol { columns: 2; }
.play { margin-top: 22px; }
.play a, .links a {
  display: inline-flex;
  align-items: center;
  min-height: 48px;
  margin: 6px 10px 0 0;
  background: #e21870;
  color: white;
  text-decoration: none;
  border-radius: 999px;
  padding: 12px 18px;
  box-shadow: 0 4px 0 #b01058;
}
.play a.quiet, .links a.quiet { background: white; color: #12988a; box-shadow: 0 4px 0 #f3d4e4; }
.cards { display: grid; gap: 12px; }
.cards a.card {
  display: block;
  background: white;
  color: inherit;
  text-decoration: none;
  border-radius: 22px;
  padding: 16px;
  box-shadow: 0 10px 24px -18px rgb(60 36 72 / 0.55);
}
.cards small { display: block; color: #5c4566; font-size: 15px; margin-top: 4px; }
.prose p { margin: 0 0 14px; }
.prose .kicker {
  margin: 12px 0 0;
  font-family: Fredoka, Nunito, "Trebuchet MS", sans-serif;
  font-size: 15px;
  color: #e21870;
}
.prose h1 { font-size: 44px; }
.shot { width: min(100%, 480px); height: auto; border-radius: 22px; display: block; margin: 12px 0; background: #fff; }
.note, .standards { color: #5c4566; }
.langs { display: flex; flex-wrap: wrap; gap: 8px 12px; margin-top: 16px; }
html[dir="rtl"] body { text-align: right; }
html[dir="rtl"] .play a, html[dir="rtl"] .links a { margin: 6px 0 0 10px; }
.promise { display: grid; gap: 10px; margin: 8px 0 18px; }
.promise p {
  margin: 0;
  padding: 16px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 4px 0 #f3d4e4;
}
.contact { background: #fff; border-radius: 22px; padding: 14px 16px; box-shadow: 0 4px 0 #f3d4e4; }
@media print {
  body { background: white; }
  .noprint { display: none !important; }
  .key { break-before: page; }
  a { color: inherit; }
  .promise p { box-shadow: none; background: white; }
}
`;

function clockSvg(hours: number, minutes: number): string {
  const minuteDeg = minutes * 6;
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;
  const point = (deg: number, len: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: (100 + Math.sin(rad) * len).toFixed(1), y: (100 - Math.cos(rad) * len).toFixed(1) };
  };
  const hour = point(hourDeg, 46);
  const minute = point(minuteDeg, 68);
  const numerals = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    const spot = point(n * 30, 78);
    return `<text x="${spot.x}" y="${spot.y}" text-anchor="middle" dominant-baseline="central">${n}</text>`;
  }).join("");
  return `<svg class="clock" viewBox="0 0 200 200" role="img" aria-label="Analog clock"><circle cx="100" cy="100" r="92" fill="#fffdfb" stroke="#f7b7d2" stroke-width="8"/>${numerals}<line x1="100" y1="100" x2="${hour.x}" y2="${hour.y}" stroke="#3c2448" stroke-width="8" stroke-linecap="round"/><line x1="100" y1="100" x2="${minute.x}" y2="${minute.y}" stroke="#ff4b93" stroke-width="6" stroke-linecap="round"/><circle cx="100" cy="100" r="6" fill="#3c2448"/></svg>`;
}

function problemHtml(item: StaticItem): string {
  const clock = item.clock ? clockSvg(item.clock.hours, item.clock.minutes) : "";
  return `<li>${clock}<p>${escapeHtml(item.prompt)} <span class="blank"></span></p></li>`;
}

function answerHtml(item: StaticItem): string {
  const text = item.clock ? item.answer : `${item.prompt} ${item.answer}`;
  return `<li>${escapeHtml(text)}</li>`;
}

function hreflangLinks(alternates: { hreflang: string; path: string }[]): string {
  return alternates
    .map((row) => `  <link rel="alternate" hreflang="${row.hreflang}" href="${canonicalUrl(row.path)}" />`)
    .join("\n");
}

function jsonLdScript(data: unknown): string {
  const json = JSON.stringify(data).replaceAll("<", "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
}

function learningJsonLd(page: SeoPage): string {
  const url = canonicalUrl(page.path);
  const learning: Record<string, unknown> = {
    "@type": ["LearningResource", "EducationalApplication"],
    name: page.h1,
    description: page.description,
    url,
    inLanguage: page.locale.hreflang,
    isAccessibleForFree: true,
    learningResourceType: page.kind === "sheet" || page.kind === "sheet-index" ? "Worksheet" : "Game",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    provider: { "@type": "Organization", name: "Squishee Academy", url: `${CANONICAL_ORIGIN}/` },
  };
  if (page.gradesLabel) learning.educationalLevel = page.gradesLabel;
  if (page.ageRange) learning.typicalAgeRange = page.ageRange;
  if (page.codes.length > 0) learning.teaches = page.codes;
  return jsonLdScript({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "Squishee Academy",
        url: `${CANONICAL_ORIGIN}/`,
        description: HOME_DESCRIPTION,
        inLanguage: ["en", "es", "pt-BR", "fr", "zh-Hans", "hi", "ar"],
      },
      learning,
    ],
  });
}

function documentPage(opts: {
  title: string;
  description: string;
  path: string;
  depth: number;
  body: string;
  lang?: string;
  dir?: "ltr" | "rtl";
  alternates?: { hreflang: string; path: string }[];
  jsonLd?: string;
}): string {
  const canonical = canonicalUrl(opts.path);
  const home = `${"../".repeat(opts.depth)}#/`;
  const lang = opts.lang ?? "en";
  const dir = opts.dir === "rtl" ? ' dir="rtl"' : "";
  const alternates = opts.alternates?.length ? `${hreflangLinks(opts.alternates)}\n` : "";
  const jsonLd = opts.jsonLd ? `${opts.jsonLd}\n` : "";
  return `<!DOCTYPE html>
<html lang="${lang}"${dir}>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(opts.title)}</title>
  <meta name="description" content="${escapeHtml(opts.description)}" />
  <link rel="canonical" href="${canonical}" />
${alternates}${socialMeta({ title: opts.title, description: opts.description, url: canonical })}
  <meta name="theme-color" content="#fff1f7" />
${iconLinks()}
  <style>${PAGE_STYLE}</style>
${jsonLd}</head>
<body>
  <main>
    <p class="noprint"><a class="brand" href="${home}"><b>Squishee</b> <i>Academy</i></a></p>
    ${opts.body}
  </main>
</body>
</html>
`;
}

function crawlableExtras(page: SeoPage): string {
  const codes = page.codes.length
    ? `<p class="standards">${escapeHtml(page.ui.standards)}: ${escapeHtml(page.codes.join(", "))}</p>`
    : "";
  const related = page.related
    .map((link) => `<a href="${link.href}">${escapeHtml(link.label)}</a>`)
    .join(" ");
  const langs = page.alternates
    .filter((row) => row.hreflang !== "x-default")
    .map((row) => `<a href="${relativeHref(page.path, row.path)}" hreflang="${row.hreflang}" lang="${row.hreflang}">${row.hreflang}</a>`)
    .join(" ");
  return `${codes}
      <p class="note">${escapeHtml(page.ui.note)}</p>
      <p class="play noprint"><a href="${page.playHref}">${escapeHtml(page.ui.play)}</a></p>
      <img class="shot" src="${page.shot}" width="480" height="720" alt="${escapeHtml(page.shotAlt)}" />
      <nav class="links" aria-label="${escapeHtml(page.ui.related)}">${related}</nav>
      <nav class="langs" aria-label="${escapeHtml(page.ui.languages)}">${langs}</nav>
      <p class="play noprint"><a class="quiet" href="${page.worksheetsHref}">${escapeHtml(page.ui.allSheets)}</a> <a class="quiet" href="${page.privacyHref}">${escapeHtml(page.ui.privacy)}</a></p>`;
}

function renderSeoPage(page: SeoPage, body: string): string {
  return documentPage({
    title: page.title,
    description: page.description,
    path: page.path,
    depth: page.path.split("/").filter(Boolean).length,
    body,
    lang: page.locale.htmlLang,
    dir: page.locale.dir,
    alternates: page.alternates,
    jsonLd: learningJsonLd(page),
  });
}

const PRACTICE_SLUGS = [
  "times-tables",
  "add-subtract",
  "telling-time",
  "money",
  "sight-words",
  "spelling",
  "counting",
  "place-value",
  "shapes",
  "fractions",
  "measurement",
  "phonics",
  "word-problems",
  "missing-numbers",
  "data",
] as const;

function sheetBody(page: SeoPage): string {
  const sheet = page.sheet;
  if (!page.sheet) throw new Error(page.path);
  const problems = sheet!.items.map(problemHtml).join("");
  const answers = sheet!.items.map(answerHtml).join("");
  return `<article>
      <h1>${escapeHtml(page.h1)}</h1>
      <p class="lede">${escapeHtml(page.lede)}</p>
      <p class="name">Name _______________________ &nbsp;&nbsp; Date ____________</p>
      <ol class="problems">${problems}</ol>
      <section class="key">
        <h2>${escapeHtml(page.ui.answerKey)}</h2>
        <ol>${answers}</ol>
      </section>
      ${crawlableExtras(page)}
    </article>`;
}

export function worksheetHtml(sheet: StaticSheet): string {
  const page = sheetPages().find((row) => row.locale.id === "en" && row.sheet?.slug === sheet.slug);
  if (!page) throw new Error(sheet.slug);
  return renderSeoPage(page, sheetBody(page));
}

export function worksheetIndexHtml(): string {
  const page = sheetIndexPages().find((row) => row.locale.id === "en");
  if (!page) throw new Error("worksheet index");
  const cards = WORKSHEETS.map(
    (sheet) =>
      `<a class="card" href="${sheet.slug}/"><strong>${escapeHtml(sheet.h1)}</strong><small>${escapeHtml(sheet.description)}</small></a>`,
  ).join("");
  const practice = PRACTICE_SLUGS.map((slug) => `<a href="${slug}/">${slug}</a>`).join(" · ");
  return renderSeoPage(
    page,
    `<h1>${escapeHtml(page.h1)}</h1>
      <p class="lede">${escapeHtml(page.lede)}</p>
      <div class="cards">${cards}</div>
      <p class="fine">Shuffle a new set in the app: ${practice}.</p>
      ${crawlableExtras(page)}`,
  );
}

function landingBody(page: SeoPage): string {
  return `<article>
      <h1>${escapeHtml(page.h1)}</h1>
      <p class="lede">${escapeHtml(page.lede)}</p>
      ${crawlableExtras(page)}
    </article>`;
}

export function privacyHtml(): string {
  return documentPage({
    title: "Privacy | Squishee Academy",
    description:
      "Squishee Academy collects no personal information. Progress stays on this device. No ads, no accounts, and no analytics.",
    path: "privacy",
    depth: 1,
    alternates: [
      { hreflang: "en", path: "privacy" },
      { hreflang: "x-default", path: "privacy" },
    ],
    body: `<article class="prose">
      <p class="kicker">On this device</p>
      <h1>Privacy</h1>
      <div class="promise">
      <p>Squishee Academy is free forever. There are no ads, no accounts, and no analytics.</p>
      <p>We do not collect personal information. A name typed into the app stays on this device. Progress stays on this device. We do not send it to a server. We do not know who is playing.</p>
      <p>This is a COPPA-friendly kids' site. We do not ask children for an email, a photo, a location, or any contact information. We do not let third parties collect data from these pages.</p>
      <p>A backup code is made on this device so a grown-up can move progress to another device. The code is not uploaded. If you copy it, you are the one holding it.</p>
      <p>The games, pictures, and worksheets can be saved on the device the first time you visit, so they still open with the internet off. That copy stays in this browser.</p>
      </div>
      <p class="contact"><strong>Contact:</strong> <a href="mailto:hello@squisheeacademy.com">hello@squisheeacademy.com</a></p>
      <p class="play noprint"><a href="../#/">Back to games</a> <a class="quiet" href="../worksheets/">Worksheets</a></p>
    </article>`,
  });
}

interface SitemapNode {
  path: string;
  alternates: { hreflang: string; path: string }[];
}

function sitemapNode(path: string, alternates?: { hreflang: string; path: string }[]): SitemapNode {
  return {
    path,
    alternates: alternates ?? [
      { hreflang: "en", path },
      { hreflang: "x-default", path },
    ],
  };
}

export function sitemapNodes(): SitemapNode[] {
  const pages = [...landingPages(), ...sheetPages(), ...sheetIndexPages()];
  const seen = new Set<string>();
  const nodes: SitemapNode[] = [
    sitemapNode(
      "",
      HOME_HREFLANGS.map((hreflang) => ({ hreflang, path: "" })),
    ),
    sitemapNode("privacy"),
    ...PRACTICE_SLUGS.map((slug) => sitemapNode(`worksheets/${slug}`)),
  ];
  for (const page of pages) {
    if (seen.has(page.path)) continue;
    seen.add(page.path);
    nodes.push({ path: page.path, alternates: page.alternates });
  }
  return nodes;
}

export function sitemapXml(): string {
  const urls = sitemapNodes()
    .map((node) => {
      const links = node.alternates
        .map((row) => `    <xhtml:link rel="alternate" hreflang="${row.hreflang}" href="${canonicalUrl(row.path)}" />`)
        .join("\n");
      return `  <url>\n    <loc>${canonicalUrl(node.path)}</loc>\n${links}\n  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
}

export function robotsTxt(): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${CANONICAL_ORIGIN}/sitemap.xml\n`;
}

export function academySeoFiles(): SeoFile[] {
  const sheets = sheetPages();
  const indexes = sheetIndexPages();
  const landings = landingPages();
  return [
    { path: "robots.txt", body: robotsTxt() },
    { path: "sitemap.xml", body: sitemapXml() },
    { path: "privacy/index.html", body: privacyHtml() },
    ...indexes.map((page) => ({ path: page.file, body: worksheetIndexHtmlFor(page) })),
    ...sheets.map((page) => ({ path: page.file, body: renderSeoPage(page, sheetBody(page)) })),
    ...landings.map((page) => ({ path: page.file, body: renderSeoPage(page, landingBody(page)) })),
  ];
}

function worksheetIndexHtmlFor(page: SeoPage): string {
  if (page.locale.id === "en") return worksheetIndexHtml();
  const cards = WORKSHEETS.map((sheet) => {
    const localized = sheetPages().find((row) => row.locale.id === page.locale.id && row.sheet?.slug === sheet.slug);
    const title = localized?.h1 ?? sheet.h1;
    const description = localized?.description ?? sheet.description;
    return `<a class="card" href="${sheet.slug}/"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(description)}</small></a>`;
  }).join("");
  const practice = PRACTICE_SLUGS.map((slug) => `<a href="${relativeHref(page.path, `worksheets/${slug}`)}">${slug}</a>`).join(" · ");
  return renderSeoPage(
    page,
    `<h1>${escapeHtml(page.h1)}</h1>
      <p class="lede">${escapeHtml(page.lede)}</p>
      <div class="cards">${cards}</div>
      <p class="fine">${practice}</p>
      ${crawlableExtras(page)}`,
  );
}
