import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { freshSave } from "../storage";
import { HelloScreen } from "./extra";

describe("hello screen", () => {
  it("lists each language in its own script before the browser language is known", () => {
    const html = renderToStaticMarkup(createElement(HelloScreen, { save: freshSave(), onSave: () => {}, sound: false }));
    expect(html).toContain("English");
    expect(html).toContain("Español");
    expect(html).toContain("Português");
    expect(html).toContain("Français");
    expect(html).toContain("中文");
    expect(html).toContain("हिन्दी");
    expect(html).toContain('aria-pressed="true"');
  });
});
