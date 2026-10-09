import { describe, expect, it } from "vitest";
import { coinCents, formatMoney, WORKSHEETS, type StaticItem } from "./catalog";
import { academySeoFiles, canonicalUrl, sitemapXml, worksheetHtml } from "./html";

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
  }
}

describe("printable worksheets", () => {
  it("publishes 15 to 25 static sheets search engines can read", () => {
    expect(WORKSHEETS.length).toBeGreaterThanOrEqual(15);
    expect(WORKSHEETS.length).toBeLessThanOrEqual(25);
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
    expect(files.find((file) => file.path === "privacy/index.html")?.body).toContain(
      "[Bryan — add the email families should use]",
    );
    expect(files.some((file) => file.path === "worksheets/counting-coins/index.html")).toBe(true);
  });
});
