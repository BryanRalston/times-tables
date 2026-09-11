import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetProgressMemory, useProgress } from "@/lib/progress";
import { GrownupPage } from "./grownup";

const HERE = dirname(fileURLToPath(import.meta.url));

describe("grown-up lock", () => {
  beforeEach(() => {
    resetProgressMemory();
  });

  afterEach(() => {
    resetProgressMemory();
  });

  it("asks a grown-up for a PIN and does not print the PIN or Reset", () => {
    const html = renderToStaticMarkup(<GrownupPage />);
    expect(html).toContain("data-grownup-lock");
    expect(html).toMatch(/Ask a grown-up/i);
    expect(html).not.toContain("2026");
    expect(html).not.toContain("Reset this device");
    expect(html).not.toContain("Advanced (Grade 4)");
    expect(html).not.toContain("Test mode");
    expect(html).not.toContain('value="4"');
  });

  it("holds Grade 4 unless Test mode is on", () => {
    const src = readFileSync(join(HERE, "grownup.tsx"), "utf8");
    expect(src).toContain("data-test-mode-toggle");
    expect(src).toContain("remove before publish");
    expect(src).toContain("data-test-grade4");
    expect(src).toContain("pathGrade4");
    expect(src).toContain("classUnits");
    const html = renderToStaticMarkup(<GrownupPage unlocked />);
    expect(html).toContain("data-test-mode-toggle");
    expect(html).toContain("Test mode");
    expect(html).not.toContain("data-test-grade4");
    expect(html).not.toContain("data-test-add-roll");
  });

  it("keeps export, import, and reset behind the PIN wall", () => {
    const html = renderToStaticMarkup(<GrownupPage />);
    expect(html).not.toContain("Download a save file");
    expect(html).not.toContain("data-export-save");
    expect(html).not.toContain("data-import-save");
    expect(html).not.toContain("data-practice-summary");
    expect(html).not.toContain("Needs practice");
    expect(html).not.toContain("data-test-mode-toggle");
    const src = readFileSync(join(HERE, "grownup.tsx"), "utf8");
    expect(src).toContain("exportSaveJson");
    expect(src).toContain("importSaveJson");
    expect(src).toContain("resetAll");
    expect(src).toContain('GROWNUP_PIN = "2026"');
  });

  it("shows today's practice, needs-practice, and personal bests after the PIN", () => {
    const html = renderToStaticMarkup(<GrownupPage unlocked />);
    expect(html).toContain("data-practice-summary");
    expect(html).toContain("Needs practice");
    expect(html).toContain("Today");
    expect(html).toContain("Personal bests");
    expect(html).toContain("Sounds");
    expect(html).toContain("data-sound-toggle");
    expect(html).toContain("Download a save file");
    expect(html).toContain("data-test-mode-panel");
    expect(html).not.toContain("data-grownup-lock");
    expect(html).not.toContain('value="4"');
    expect(html).not.toContain("pathGrade4");
  });

  it("offers Grade 4 and cheat buttons only while Test mode is on", () => {
    useProgress.getState().setTestMode(true);
    const html = renderToStaticMarkup(<GrownupPage unlocked />);
    expect(html).toContain("data-test-mode-toggle");
    expect(html).toContain("data-test-grade4");
    expect(html).toContain("Advanced (Grade 4) — preview");
    expect(html).toContain("data-test-add-roll");
    expect(html).toContain("data-test-add-coins");
    expect(html).toContain("data-test-clear-steps");
    expect(html).toContain("+1 roll");
    expect(html).toContain("+10 coins");
  });
});
