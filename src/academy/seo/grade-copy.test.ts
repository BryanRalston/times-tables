import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GAMES } from "../games/registry";
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
    expect(place?.blurb).toContain("thousands");
    expect(money?.blurb).toContain("money problems");
    expect(measure?.blurb).toContain("area");
    for (const dir of readdirSync("academy/worksheets")) {
      const html = readFileSync(`academy/worksheets/${dir}/index.html`, "utf8");
      expect(html, dir).not.toContain("K–3");
      expect(html, dir).not.toContain("grades 1–3");
      expect(html, dir).not.toContain("kindergarten through grade 3");
    }
  });
});
