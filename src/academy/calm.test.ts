import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { cardStepLabel, cardsRoundLabel, setLocale } from "./i18n";
import { roundLength, speedRoundGrade, speedRoundOffer, type Grade } from "./model";

const GRADES: Grade[] = ["PK", "K", "1", "2", "3", "4"];

afterEach(() => setLocale("en"));

describe("calm rounds", () => {
  it("keeps Pre-K, kindergarten, and grade 1 off the clock", () => {
    for (const grade of ["PK", "K", "1"] as const) {
      expect(speedRoundGrade(grade)).toBe(false);
      expect(speedRoundOffer(grade, "times", "toTen")).toBe(false);
      expect(speedRoundOffer(grade, "times", "count")).toBe(false);
      expect(speedRoundOffer(grade, "add", "within20")).toBe(false);
    }
    expect(roundLength("PK")).toBe(6);
    expect(roundLength("K")).toBe(10);
    expect(roundLength("1")).toBe(10);
    expect(cardsRoundLabel(6)).toBe("6 cards");
    expect(cardsRoundLabel(10)).toBe("10 cards");
    expect(cardStepLabel(0, 10)).toBe("Card 1 of 10");
    setLocale("es");
    expect(cardsRoundLabel(6)).toBe("6 tarjetas");
    expect(cardStepLabel(2, 10)).toBe("Tarjeta 3 de 10");
    setLocale("en");
  });

  it("offers a speed round only for grade 2–3 times fluency, and never on a boss", () => {
    expect(speedRoundOffer("2", "times", "twos")).toBe(true);
    expect(speedRoundOffer("2", "times", "mix")).toBe(true);
    expect(speedRoundOffer("3", "times", "mix")).toBe(true);
    expect(speedRoundOffer("3", "times", "toTen")).toBe(true);
    expect(speedRoundOffer("2", "times", "count")).toBe(false);
    expect(speedRoundOffer("3", "times", "count")).toBe(false);
    expect(speedRoundOffer("3", "times", "factors")).toBe(false);
    expect(speedRoundOffer("4", "times", "toTen")).toBe(false);
    expect(speedRoundOffer("4", "times", "factors")).toBe(false);
    expect(speedRoundOffer("2", "add", "within20")).toBe(false);
    expect(speedRoundOffer("3", "add", "within100")).toBe(false);
    expect(speedRoundOffer("3", "times", "toTen", true)).toBe(false);
    for (const grade of GRADES) {
      expect(speedRoundOffer(grade, "phonics", "cvc")).toBe(false);
      expect(speedRoundOffer(grade, "sight", "primer")).toBe(false);
    }
  });

  it("does not put a timer or streak words on the kid home and play screens", () => {
    const home = readFileSync(new URL("./ui/home.tsx", import.meta.url), "utf8");
    const play = readFileSync(new URL("./ui/play.tsx", import.meta.url), "utf8");
    const stickers = readFileSync(new URL("./ui/stickers.tsx", import.meta.url), "utf8");
    const kid = `${home}\n${stickers}`;
    expect(kid.toLowerCase()).not.toMatch(/streak|broken|🔥|flame/);
    expect(home).toContain("WeekStickers");
    expect(home).not.toContain("2-minute");
    expect(play).not.toMatch(/nice streak|Flame|broken streak|🔥|racha/i);
    expect(play).toContain('useState(false)');
    expect(play).toContain("Speed round");
    expect(play).toContain("cardsRoundLabel");
    expect(play).toContain("showSpeed");
  });
});
