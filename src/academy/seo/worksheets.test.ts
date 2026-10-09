import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { rewriteDomainSource } from "../../../scripts/academy-domain-rewrite.mjs";
import { coinCents, formatMoney, WORKSHEETS, type StaticItem } from "./catalog";
import {
  academySeoFiles,
  canonicalUrl,
  HOME_DESCRIPTION,
  privacyHtml,
  SHARE_IMAGE_ALT,
  shareImageUrl,
  sitemapXml,
  withOpenGraph,
  worksheetHtml,
  worksheetIndexHtml,
} from "./html";

function expectShareCard(html: string, title: string, description: string, url: string) {
  const image = shareImageUrl();
  expect(image).toBe("https://squisheeacademy.com/og/squishee-academy.png");
  expect(html).toContain(`property="og:title" content="${title}"`);
  expect(html).toContain(`property="og:description" content="${description}"`);
  expect(html).toContain(`property="og:url" content="${url}"`);
  expect(html).toContain('property="og:type" content="website"');
  expect(html).toContain('property="og:site_name" content="Squishee Academy"');
  expect(html).toContain(`property="og:image" content="${image}"`);
  expect(html).toContain('property="og:image:width" content="1200"');
  expect(html).toContain('property="og:image:height" content="630"');
  expect(html).toContain(`property="og:image:alt" content="${SHARE_IMAGE_ALT}"`);
  expect(html).toContain('name="twitter:card" content="summary_large_image"');
  expect(html).toContain(`name="twitter:title" content="${title}"`);
  expect(html).toContain(`name="twitter:description" content="${description}"`);
  expect(html).toContain(`name="twitter:image" content="${image}"`);
  expect(html).toContain(`name="twitter:image:alt" content="${SHARE_IMAGE_ALT}"`);
  expect(html).not.toContain('property="og:image" content="/');
}

function moneyCents(answer: string): number {
  if (answer.endsWith("¢")) return Number(answer.slice(0, -1));
  if (answer.startsWith("$")) return Math.round(Number(answer.slice(1)) * 100);
  throw new Error(answer);
}

function expectItem(item: StaticItem) {
  const times = item.prompt.match(/^(\d+) × (\d+) =$/);
  if (times) {
    expect(item.answer).toBe(String(Number(times[1]) * Number(times[2])));
    return;
  }
  const add = item.prompt.match(/^(\d+) \+ (\d+) =$/);
  if (add) {
    expect(item.answer).toBe(String(Number(add[1]) + Number(add[2])));
    return;
  }
  const sub = item.prompt.match(/^(\d+) − (\d+) =$/);
  if (sub) {
    const a = Number(sub[1]);
    const b = Number(sub[2]);
    expect(a).toBeGreaterThanOrEqual(b);
    expect(item.answer).toBe(String(a - b));
    return;
  }
  if (item.clock) {
    const { hours, minutes } = item.clock;
    expect(item.answer).toBe(`${hours}:${String(minutes).padStart(2, "0")}`);
    return;
  }
  if (item.pile) {
    expect(moneyCents(item.answer)).toBe(coinCents(item.pile));
    expect(item.answer).toBe(formatMoney(coinCents(item.pile)));
    return;
  }
  if (item.changeFromDollar != null) {
    expect(item.prompt).toContain(`${item.changeFromDollar}¢`);
    expect(moneyCents(item.answer)).toBe(100 - item.changeFromDollar);
    return;
  }
  expectFresh(item);
}

function roundHalfUp(n: number, place: 10 | 100): number {
  return Math.floor(n / place + 0.5) * place;
}

function expectFresh(item: StaticItem) {
  const stars = item.prompt.match(/^Count the stars: (★*)$/);
  if (stars) {
    expect(item.answer).toBe(String(stars[1]!.length));
    return;
  }
  const after = item.prompt.match(/^What number comes after (\d+)\?$/);
  if (after) {
    expect(item.answer).toBe(String(Number(after[1]) + 1));
    return;
  }
  const before = item.prompt.match(/^What number comes before (\d+)\?$/);
  if (before) {
    expect(item.answer).toBe(String(Number(before[1]) - 1));
    return;
  }
  const more = item.prompt.match(/^Which is (more|less), (\d+) or (\d+)\?$/);
  if (more) {
    const a = Number(more[2]);
    const b = Number(more[3]);
    expect(item.answer).toBe(String(more[1] === "more" ? Math.max(a, b) : Math.min(a, b)));
    return;
  }
  const blocks = item.prompt.match(/^(\d+) tens and (\d+) ones =$/);
  if (blocks) {
    expect(item.answer).toBe(String(Number(blocks[1]) * 10 + Number(blocks[2])));
    return;
  }
  const expanded = item.prompt.match(/^Write (\d+) in expanded form\.$/);
  if (expanded) {
    const sum = item.answer.split(" + ").reduce((total, part) => total + Number(part), 0);
    expect(sum).toBe(Number(expanded[1]));
    return;
  }
  const compared = item.prompt.match(/^Which is (greater|less), (\d+) or (\d+)\?$/);
  if (compared && !item.prompt.includes("/")) {
    const a = Number(compared[2]);
    const b = Number(compared[3]);
    expect(item.answer).toBe(String(compared[1] === "greater" ? Math.max(a, b) : Math.min(a, b)));
    return;
  }
  const rounded = item.prompt.match(/^Round (\d+) to the nearest (10|100)\.$/);
  if (rounded) {
    const place = rounded[2] === "100" ? 100 : 10;
    expect(item.answer).toBe(String(roundHalfUp(Number(rounded[1]), place)));
    return;
  }
  const shapeNames: Record<string, string> = {
    "Name the flat shape with 3 sides.": "triangle",
    "Name the flat shape with 4 equal sides.": "square",
    "Name the flat shape with no corners.": "circle",
    "Name the flat shape with 4 sides that is longer than it is tall.": "rectangle",
    "Name the solid that rolls every way.": "sphere",
    "Name the solid with a point and a round base.": "cone",
    "Name the solid with 6 square faces.": "cube",
  };
  if (item.prompt in shapeNames) {
    expect(item.answer).toBe(shapeNames[item.prompt]);
    return;
  }
  const sides = item.prompt.match(/^How many sides does a (\w+) have\?$/);
  if (sides) {
    const count: Record<string, string> = { pentagon: "5", hexagon: "6", triangle: "3", square: "4" };
    expect(item.answer).toBe(count[sides[1] ?? ""]);
    return;
  }
  const lines = item.prompt.match(/^How many lines of symmetry does a (\w+) have\?$/);
  if (lines) {
    const count: Record<string, string> = { square: "4", rectangle: "2", triangle: "3", circle: "more than 4" };
    expect(item.answer).toBe(count[lines[1] ?? ""]);
    return;
  }
  const parts = item.prompt.match(/^(\d+) of (\d+) equal parts are shaded\. What fraction\?$/);
  if (parts) {
    expect(item.answer).toBe(`${parts[1]}/${parts[2]}`);
    return;
  }
  const unit = item.prompt.match(/^1 of (\d+) equal parts is shaded\. What unit fraction\?$/);
  if (unit) {
    expect(item.answer).toBe(`1/${unit[1]}`);
    return;
  }
  const greater = item.prompt.match(/^Which is greater, (\d+)\/(\d+) or (\d+)\/(\d+)\?$/);
  if (greater) {
    const left = Number(greater[1]) * Number(greater[4]);
    const right = Number(greater[3]) * Number(greater[2]);
    expect(item.answer).toBe(left >= right ? `${greater[1]}/${greater[2]}` : `${greater[3]}/${greater[4]}`);
    return;
  }
  const match = item.prompt.match(/^Which fraction matches (\d+)\/(\d+)\?$/);
  if (match) {
    const [num, den] = item.answer.split("/").map(Number);
    expect(num! * Number(match[2])).toBe(den! * Number(match[1]));
    return;
  }
  const length = item.prompt.match(/^Which is (longer|shorter), (\d+) units or (\d+) units\?$/);
  if (length) {
    const a = Number(length[2]);
    const b = Number(length[3]);
    expect(item.answer).toBe(String(length[1] === "longer" ? Math.max(a, b) : Math.min(a, b)));
    return;
  }
  const inches = item.prompt.match(/^The ribbon goes from 0 to (\d+) on the ruler\. How many inches\?$/);
  if (inches) {
    expect(item.answer).toBe(inches[1]);
    return;
  }
  const graph = item.prompt.match(/^The graph shows (.+) apples\. How many apples\?$/);
  if (graph) {
    const icon = graph[1]!.includes("▮") ? "▮" : "🍎";
    expect(item.answer).toBe(String(graph[1]!.length / icon.length));
    return;
  }
  const cats = item.prompt.match(/^There are (\d+) cats and (\d+) dogs\. How many more cats\?$/);
  if (cats) {
    expect(item.answer).toBe(String(Number(cats[1]) - Number(cats[2])));
    return;
  }
  const sound = item.prompt.match(/^Which word starts with the (\S+) sound: (.+)\?$/);
  if (sound) {
    const words = sound[2]!.split(", ");
    expect(words).toContain(item.answer);
    const phoneme: Record<string, string> = { moon: "mmm", sun: "sss", pig: "puh", dog: "duh", apple: "aaa", egg: "eh", igloo: "ih", octopus: "ah" };
    expect(phoneme[item.answer]).toBe(sound[1]);
    return;
  }
  const rhyme = item.prompt.match(/^Which word rhymes with ([a-z]+): (.+)\?$/);
  if (rhyme) {
    expect(rhyme[2]!.split(", ")).toContain(item.answer);
    expect(item.answer.slice(-2)).toBe(rhyme[1]!.slice(-2));
    return;
  }
  const blend = item.prompt.match(/^Blend ([a-z])-([a-z])-([a-z])\.$/);
  if (blend) {
    expect(item.answer).toBe(`${blend[1]}${blend[2]}${blend[3]}`);
    return;
  }
  const add = item.prompt.match(/^Peach has (\d+) apples\. Frog brings (\d+) more\. How many apples\?$/);
  if (add) {
    expect(Number(add[1]) + Number(add[2])).toBeLessThanOrEqual(10);
    expect(item.answer).toBe(String(Number(add[1]) + Number(add[2])));
    return;
  }
  const sub = item.prompt.match(/^Bear has (\d+) fish and gives (\d+) to Panda\. How many fish are left\?$/);
  if (sub) {
    expect(item.answer).toBe(String(Number(sub[1]) - Number(sub[2])));
    return;
  }
  const bags = item.prompt.match(/^Panda has (\d+) bags with (\d+) stars in each bag\. How many stars\?$/);
  if (bags) {
    expect(item.answer).toBe(String(Number(bags[1]) * Number(bags[2])));
    return;
  }
  const boxes = item.prompt.match(/^Fox has (\d+) cookies shared with (\d+) friends\. How many cookies does each friend get\?$/);
  if (boxes) {
    expect(Number(boxes[1]) % Number(boxes[2])).toBe(0);
    expect(item.answer).toBe(String(Number(boxes[1]) / Number(boxes[2])));
    return;
  }
  throw new Error(`unchecked worksheet prompt: ${item.prompt}`);
}

describe("printable worksheets", () => {
  it("publishes 15 to 40 static sheets search engines can read", () => {
    expect(WORKSHEETS.length).toBeGreaterThanOrEqual(15);
    expect(WORKSHEETS.length).toBeLessThanOrEqual(40);
    const slugs = WORKSHEETS.map((sheet) => sheet.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toEqual(expect.arrayContaining(["telling-time-quarter-hour", "counting-coins", "multiplication-7s"]));

    for (const sheet of WORKSHEETS) {
      expect(sheet.title.length).toBeGreaterThan(10);
      expect(sheet.description.length).toBeGreaterThan(20);
      expect(sheet.h1.length).toBeGreaterThan(3);
      expect(sheet.items.length).toBeGreaterThanOrEqual(8);
      for (const item of sheet.items) expectItem(item);
      const html = worksheetHtml(sheet);
      expect(html).toContain(`<title>${sheet.title}</title>`);
      expect(html).toContain(`content="${sheet.description}"`);
      expect(html).toContain(`<h1>${sheet.h1}</h1>`);
      expect(html).toContain("Answer key");
      expect(html).toContain(`href="../../#/play/${sheet.game}">Play the game</a>`);
      expect(html).toContain(`<link rel="canonical" href="${canonicalUrl(`worksheets/${sheet.slug}`)}" />`);
      expect(html).toContain('property="og:title"');
      expect(html).toContain('property="og:description"');
      expect(html).toContain(sheet.items[0]!.prompt);
      expect(html).toContain(sheet.items[0]!.answer);
      expect(html).not.toContain("<script");
    }
  });

  it("lists every sheet in the sitemap and writes the files", () => {
    const xml = sitemapXml();
    expect(xml).toContain("<loc>https://squisheeacademy.com/worksheets/multiplication-7s/</loc>");
    expect(xml).toContain("<loc>https://squisheeacademy.com/privacy/</loc>");
    const files = academySeoFiles();
    expect(files.find((file) => file.path === "robots.txt")?.body).toContain(
      "Sitemap: https://squisheeacademy.com/sitemap.xml",
    );
    expect(files.find((file) => file.path === "worksheets/index.html")?.body).toContain("telling-time-quarter-hour/");
    expect(files.find((file) => file.path === "privacy/index.html")?.body).toContain("COPPA");
    const privacy = files.find((file) => file.path === "privacy/index.html")?.body ?? "";
    expect(privacy).toContain('<a href="mailto:hello@squisheeacademy.com">hello@squisheeacademy.com</a>');
    expect(privacy).not.toContain("[Bryan — add the email families should use]");
    expect(files.some((file) => file.path === "worksheets/counting-coins/index.html")).toBe(true);
  });

  it("puts absolute share cards on the home page, worksheets, and privacy", () => {
    const sheet = WORKSHEETS.find((item) => item.slug === "multiplication-7s");
    expect(sheet).toBeTruthy();
    expectShareCard(
      worksheetHtml(sheet!),
      sheet!.title,
      sheet!.description,
      "https://squisheeacademy.com/worksheets/multiplication-7s/",
    );
    const index = worksheetIndexHtml();
    expectShareCard(
      index,
      "Free K–3 Math Worksheets | Squishee Academy",
      "Free printable math worksheets for grades K–3. Times tables, addition, subtraction, telling time, and counting coins. Answer keys included. No signup.",
      "https://squisheeacademy.com/worksheets/",
    );
    const privacy = privacyHtml();
    expectShareCard(
      privacy,
      "Privacy | Squishee Academy",
      "Squishee Academy collects no personal information. Progress stays on this device. No ads, no accounts, and no analytics.",
      "https://squisheeacademy.com/privacy/",
    );
    expect(privacy).toContain('rel="apple-touch-icon" href="/apple-touch-icon.png"');
    expect(index).toContain('rel="icon" href="/favicon.ico"');

    const home = withOpenGraph(readFileSync("academy/index.html", "utf8"));
    expectShareCard(home, "Squishee Academy", HOME_DESCRIPTION, "https://squisheeacademy.com/");
    expect(home).toContain('rel="apple-touch-icon" href="%BASE_URL%apple-touch-icon.png"');

    const practice = withOpenGraph(rewriteDomainSource(readFileSync("academy/worksheets/times-tables/index.html", "utf8")));
    expectShareCard(
      practice,
      "Free Times Tables Worksheet (K–3) | Squishee Academy",
      "Print a free times tables worksheet for grades K–3. Random multiplication problems and an answer key. No signup.",
      "https://squisheeacademy.com/worksheets/times-tables/",
    );
  });
});
