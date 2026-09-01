import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GrownupPage } from "./grownup";

const HERE = dirname(fileURLToPath(import.meta.url));

describe("grown-up lock", () => {
  it("asks a grown-up for a PIN and does not print the PIN or Reset", () => {
    const html = renderToStaticMarkup(<GrownupPage />);
    expect(html).toContain("data-grownup-lock");
    expect(html).toMatch(/Ask a grown-up/i);
    expect(html).not.toContain("2026");
    expect(html).not.toContain("Reset this device");
    expect(html).not.toContain("Advanced (Grade 4)");
    expect(html).not.toContain('value="4"');
  });

  it("does not offer Grade 4 from the grown-up page", () => {
    const src = readFileSync(join(HERE, "grownup.tsx"), "utf8");
    expect(src).not.toContain("pathGrade4");
    expect(src).not.toContain("parsePathGrade");
    expect(src).toContain("unitsFor(3)");
  });

  it("keeps export, import, and reset behind the PIN wall", () => {
    const html = renderToStaticMarkup(<GrownupPage />);
    expect(html).not.toContain("Download a save file");
    expect(html).not.toContain("data-export-save");
    expect(html).not.toContain("data-import-save");
    const src = readFileSync(join(HERE, "grownup.tsx"), "utf8");
    expect(src).toContain("exportSaveJson");
    expect(src).toContain("importSaveJson");
    expect(src).toContain("resetAll");
    expect(src).toContain('GROWNUP_PIN = "2026"');
  });
});
