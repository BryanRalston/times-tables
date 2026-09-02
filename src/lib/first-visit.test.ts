import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { saveShowsWelcome, shouldOpenLeftover, WELCOME_HASH } from "./first-visit";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

describe("first-visit leftover hash", () => {
  it("treats empty and unseen saves as leftover, and seenWelcome as Home", () => {
    expect(saveShowsWelcome(null)).toBe(false);
    expect(saveShowsWelcome({})).toBe(false);
    expect(saveShowsWelcome({ seenWelcome: false })).toBe(false);
    expect(saveShowsWelcome({ state: { seenWelcome: true } })).toBe(true);
    expect(saveShowsWelcome({ learnerId: "kid-1", learners: { "kid-1": { seenWelcome: true } } })).toBe(true);
    expect(shouldOpenLeftover("#/", false)).toBe(true);
    expect(shouldOpenLeftover("", false)).toBe(true);
    expect(shouldOpenLeftover("#/lessons", false)).toBe(true);
    expect(shouldOpenLeftover("#/play/welcome", false)).toBe(false);
    expect(shouldOpenLeftover("#/grownup", false)).toBe(false);
    expect(shouldOpenLeftover("#/", true)).toBe(false);
  });

  it("index.html boot script sets leftover hash before the React module", () => {
    const html = readFileSync(join(ROOT, "index.html"), "utf8");
    const boot = html.indexOf("#/play/welcome");
    const module = html.indexOf('src="/src/main.tsx"');
    expect(boot).toBeGreaterThan(0);
    expect(module).toBeGreaterThan(boot);
    expect(html).toContain("g3-path-v2");
    expect(html).toContain("seenWelcome");
    expect(html).toContain("history.replaceState");
    expect(html).toContain(WELCOME_HASH);
    expect(html.indexOf("<script>")).toBeLessThan(html.indexOf('type="module"'));
  });
});
