import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { applyFirstVisitHash, saveShowsWelcome, shouldOpenLeftover } from "./first-visit";
import { isPhoneViewport, PHONE_MAX_PX } from "./viewport";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

describe("first-visit Home door", () => {
  it("treats 390 as phone and 768+ as desk", () => {
    expect(PHONE_MAX_PX).toBe(767);
    expect(isPhoneViewport(390)).toBe(true);
    expect(isPhoneViewport(767)).toBe(true);
    expect(isPhoneViewport(768)).toBe(false);
    expect(isPhoneViewport(1280)).toBe(false);
  });

  it("never opens leftover as the first-visit door", () => {
    expect(saveShowsWelcome(null)).toBe(false);
    expect(saveShowsWelcome({ seenWelcome: false })).toBe(false);
    expect(saveShowsWelcome({ state: { seenWelcome: true } })).toBe(true);
    expect(shouldOpenLeftover("#/", false)).toBe(false);
    expect(shouldOpenLeftover("", false)).toBe(false);
    expect(shouldOpenLeftover("#/lessons", false)).toBe(false);
    expect(shouldOpenLeftover("#/play/welcome", false)).toBe(false);
    expect(shouldOpenLeftover("#/", true)).toBe(false);
    expect(shouldOpenLeftover("#/", false, false)).toBe(false);
    expect(shouldOpenLeftover("#/", false, true)).toBe(false);
    expect(applyFirstVisitHash()).toBe(false);
  });

  it("index.html does not rewrite first visit onto leftover", () => {
    const html = readFileSync(join(ROOT, "index.html"), "utf8");
    expect(html).not.toContain("history.replaceState");
    expect(html).not.toContain("#/play/welcome");
    expect(html).toContain("Fredoka");
    expect(html).toContain("Nunito");
  });
});
