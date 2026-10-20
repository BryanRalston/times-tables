import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { freshSave } from "../storage";
import { HelloScreen } from "./extra";

describe("hello screen", () => {
  it("shows English and Español before the browser language is known", () => {
    const html = renderToStaticMarkup(createElement(HelloScreen, { save: freshSave(), onSave: () => {}, sound: false }));
    expect(html).toContain("English");
    expect(html).toContain("Español");
    expect(html).toContain('aria-pressed="true"');
  });
});
