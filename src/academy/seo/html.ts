import { WORKSHEETS, type StaticItem, type StaticSheet } from "./catalog";

export const CANONICAL_ORIGIN = "https://squisheeacademy.com";

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

const PAGE_STYLE = `
:root { color-scheme: light; }
* { box-sizing: border-box; }
body {
  margin: 0;
  color: #3c2448;
  background: #fff7fb;
  font: 700 18px/1.45 Nunito, "Trebuchet MS", sans-serif;
}
main { width: min(760px, calc(100% - 28px)); margin: 0 auto; padding: 22px 0 48px; }
a { color: #12988a; }
h1, h2 { font-family: Fredoka, Nunito, sans-serif; letter-spacing: -0.02em; line-height: 1.15; }
h1 { font-size: 34px; margin: 8px 0; }
.brand { font-family: Fredoka, Nunito, sans-serif; font-size: 22px; text-decoration: none; }
.brand b { color: #ff4b93; }
.brand i { color: #12988a; font-style: normal; }
.lede, .fine { color: #8b7386; }
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
  display: inline-block;
  margin: 6px 10px 0 0;
  background: #ff4b93;
  color: white;
  text-decoration: none;
  border-radius: 999px;
  padding: 10px 16px;
}
.play a.quiet, .links a.quiet { background: white; color: #12988a; box-shadow: 0 3px 0 #f6d0e2; }
.cards { display: grid; gap: 12px; }
.cards a.card {
  display: block;
  background: white;
  color: inherit;
  text-decoration: none;
  border-radius: 16px;
  padding: 14px 16px;
  box-shadow: 0 4px 0 #f6d0e2;
}
.cards small { display: block; color: #8b7386; font-size: 14px; margin-top: 4px; }
.prose p { margin: 0 0 12px; }
.contact { background: #fff; border-radius: 16px; padding: 12px 14px; box-shadow: 0 4px 0 #f6d0e2; }
@media print {
  body { background: white; }
  .noprint { display: none !important; }
  .key { break-before: page; }
  a { color: inherit; }
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

function documentPage(opts: {
  title: string;
  description: string;
  path: string;
  depth: number;
  body: string;
}): string {
  const canonical = canonicalUrl(opts.path);
  const home = `${"../".repeat(opts.depth)}#/`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(opts.title)}</title>
  <meta name="description" content="${escapeHtml(opts.description)}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:title" content="${escapeHtml(opts.title)}" />
  <meta property="og:description" content="${escapeHtml(opts.description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Squishee Academy" />
  <meta property="og:image" content="${CANONICAL_ORIGIN}/squishees/frog.png" />
  <meta name="theme-color" content="#fff1f7" />
  <link rel="icon" href="/favicon.svg" />
  <style>${PAGE_STYLE}</style>
</head>
<body>
  <main>
    <p class="noprint"><a class="brand" href="${home}"><b>Squishee</b> <i>Academy</i></a></p>
    ${opts.body}
  </main>
</body>
</html>
`;
}

export function worksheetHtml(sheet: StaticSheet): string {
  const problems = sheet.items.map(problemHtml).join("");
  const answers = sheet.items.map(answerHtml).join("");
  const play = `../../#/play/${sheet.game}`;
  return documentPage({
    title: sheet.title,
    description: sheet.description,
    path: `worksheets/${sheet.slug}`,
    depth: 2,
    body: `<article>
      <h1>${escapeHtml(sheet.h1)}</h1>
      <p class="lede">${escapeHtml(sheet.description)}</p>
      <p class="name">Name _______________________ &nbsp;&nbsp; Date ____________</p>
      <ol class="problems">${problems}</ol>
      <section class="key">
        <h2>Answer key</h2>
        <ol>${answers}</ol>
      </section>
      <p class="play noprint"><a href="${play}">Play the game</a> <a class="quiet" href="../">All worksheets</a></p>
    </article>`,
  });
}

export function worksheetIndexHtml(): string {
  const cards = WORKSHEETS.map(
    (sheet) =>
      `<a class="card" href="${sheet.slug}/"><strong>${escapeHtml(sheet.h1)}</strong><small>${escapeHtml(sheet.description)}</small></a>`,
  ).join("");
  const practice = [
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
  ]
    .map((slug) => `<a href="${slug}/">${slug}</a>`)
    .join(" · ");
  return documentPage({
    title: "Free K–3 Math Worksheets | Squishee Academy",
    description:
      "Free printable math worksheets for grades K–3. Times tables, addition, subtraction, telling time, and counting coins. Answer keys included. No signup.",
    path: "worksheets",
    depth: 1,
    body: `<h1>Free worksheets</h1>
      <p class="lede">Print a page. Every sheet has an answer key. Nothing to sign up for.</p>
      <div class="cards">${cards}</div>
      <p class="fine">Shuffle a new set in the app: ${practice}.</p>
      <p class="play noprint"><a href="../#/">Play the games</a> <a class="quiet" href="../privacy/">Privacy</a></p>`,
  });
}

export function privacyHtml(): string {
  return documentPage({
    title: "Privacy | Squishee Academy",
    description:
      "Squishee Academy collects no personal information. Progress stays on this device. No ads, no accounts, and no analytics.",
    path: "privacy",
    depth: 1,
    body: `<article class="prose">
      <h1>Privacy</h1>
      <p>Squishee Academy is free forever. There are no ads, no accounts, and no analytics.</p>
      <p>We do not collect personal information. A name typed into the app stays on this device. Progress stays on this device. We do not send it to a server. We do not know who is playing.</p>
      <p>This is a COPPA-friendly kids' site. We do not ask children for an email, a photo, a location, or any contact information. We do not let third parties collect data from these pages.</p>
      <p>A backup code is made on this device so a grown-up can move progress to another device. The code is not uploaded. If you copy it, you are the one holding it.</p>
      <p>The games, pictures, and worksheets can be saved on the device the first time you visit, so they still open with the internet off. That copy stays in this browser.</p>
      <p class="contact"><strong>Contact:</strong> <a href="mailto:hello@squisheeacademy.com">hello@squisheeacademy.com</a></p>
      <p class="play noprint"><a href="../#/">Back to games</a> <a class="quiet" href="../worksheets/">Worksheets</a></p>
    </article>`,
  });
}

export function sitemapXml(): string {
  const paths = [
    "",
    "privacy",
    "worksheets",
    ...WORKSHEETS.map((sheet) => `worksheets/${sheet.slug}`),
    "worksheets/times-tables",
    "worksheets/add-subtract",
    "worksheets/telling-time",
    "worksheets/money",
    "worksheets/sight-words",
    "worksheets/spelling",
    "worksheets/counting",
    "worksheets/place-value",
    "worksheets/shapes",
    "worksheets/fractions",
    "worksheets/measurement",
    "worksheets/phonics",
    "worksheets/word-problems",
  ];
  const urls = paths
    .map((path) => `  <url><loc>${canonicalUrl(path)}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function robotsTxt(): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${CANONICAL_ORIGIN}/sitemap.xml\n`;
}

export function academySeoFiles(): SeoFile[] {
  return [
    { path: "robots.txt", body: robotsTxt() },
    { path: "sitemap.xml", body: sitemapXml() },
    { path: "privacy/index.html", body: privacyHtml() },
    { path: "worksheets/index.html", body: worksheetIndexHtml() },
    ...WORKSHEETS.map((sheet) => ({
      path: `worksheets/${sheet.slug}/index.html`,
      body: worksheetHtml(sheet),
    })),
  ];
}
