import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GAMES } from "../games/registry";
import { WORKSHEETS } from "./catalog";
import { worksheetIndexHtml } from "./html";

describe("Pre-K to grade 4 public copy", () => {
  it("names the full range and the grade 4 skills on the worksheet index", () => {
    const index = worksheetIndexHtml();
    expect(index).toContain("Free Pre-K to Grade 4 Math Worksheets");
    expect(index).toContain("elapsed time");
    expect(index).toContain("money problems");
    expect(index).toContain("thousands");
    expect(index).toContain("area");
    expect(index).not.toContain("K–3");
    expect(index).not.toContain("grades 1–3");
  });

  it("keeps game blurbs and practice pages off the old K–3 range", () => {
    for (const game of GAMES) {
      expect(game.blurb, game.id).not.toContain("K–3");
      expect(game.blurb, game.id).not.toContain("grades 1–3");
      expect(game.blurb, game.id).not.toContain("kindergarten through grade 3");
    }
    const time = GAMES.find((game) => game.id === "time");
    const place = GAMES.find((game) => game.id === "place");
    const money = GAMES.find((game) => game.id === "money");
    const measure = GAMES.find((game) => game.id === "measure");
    expect(time?.blurb).toContain("elapsed time");
    expect(time?.blurb).toContain("grades 1–4");
    expect(place?.blurb).toContain("thousands");
    expect(place?.blurb).toContain("grades 1–4");
    expect(money?.blurb).toContain("money problems");
    expect(measure?.blurb).toContain("area");
    const times = GAMES.find((game) => game.id === "times");
    const add = GAMES.find((game) => game.id === "add");
    const fractions = GAMES.find((game) => game.id === "fractions");
    expect(times?.blurb).toContain("grades 2–4");
    expect(times?.blurb).not.toContain("Pre-K");
    expect(add?.blurb).toContain("kindergarten through grade 4");
    expect(fractions?.blurb).toContain("grades 1–4");
    const bySlug = (slug: string) => WORKSHEETS.find((sheet) => sheet.slug === slug);
    expect(bySlug("multiplication-7s")?.title).toContain("(Grades 2–4)");
    expect(bySlug("addition-within-10")?.title).toContain("(K–1)");
    expect(bySlug("telling-time-to-the-hour")?.title).toContain("(Grade 1)");
    expect(bySlug("telling-time-five-minutes")?.title).toContain("(Grades 2–3)");
    expect(bySlug("counting-coins")?.title).toContain("(Grades 1–4)");
    expect(bySlug("making-change")?.title).toContain("(Grades 2–3)");
    expect(bySlug("dollars-and-cents")?.title).toContain("(Grades 2–4)");
    expect(bySlug("addition-word-problems")?.title).toContain("(K–4)");
    const timesPage = readFileSync("academy/worksheets/times-tables/index.html", "utf8");
    expect(timesPage).toContain("Grades 2–4");
    expect(timesPage).not.toContain("Pre-K");
    const addPage = readFileSync("academy/worksheets/add-subtract/index.html", "utf8");
    expect(addPage).toContain("kindergarten through grade 4");
    const timePage = readFileSync("academy/worksheets/telling-time/index.html", "utf8");
    expect(timePage).toContain("Grades 1–4");
    for (const dir of readdirSync("academy/worksheets")) {
      const html = readFileSync(`academy/worksheets/${dir}/index.html`, "utf8");
      expect(html, dir).not.toContain("K–3");
      expect(html, dir).not.toContain("grades 1–3");
      expect(html, dir).not.toContain("kindergarten through grade 3");
    }
  });
});
