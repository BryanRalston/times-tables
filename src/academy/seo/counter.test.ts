import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildPrecacheList, domainServiceWorker, referencedUrls } from "../../../scripts/academy-precache.mjs";
import { setLocale } from "../i18n";
import { privacyPathForLocale } from "../privacy-path";
import { Foot } from "../ui/bits";
import { GOATCOUNTER_ENDPOINT, GOATCOUNTER_SRC, visitorCounterScript, withVisitorCounter } from "./counter";

describe("visitor counter", () => {
  it("loads GoatCounter only when Do Not Track and Global Privacy Control are off", () => {
    const script = visitorCounterScript();
    expect(script).toContain('nav.doNotTrack === "1"');
    expect(script).toContain("nav.globalPrivacyControl === true");
    expect(script).toContain("el.async = true");
    expect(script).toContain(`el.src = ${JSON.stringify(GOATCOUNTER_SRC)}`);
    expect(script).toContain(`el.setAttribute("data-goatcounter", ${JSON.stringify(GOATCOUNTER_ENDPOINT)})`);
    expect(script.match(/<script\b/g)?.length).toBe(1);
    expect(script).not.toContain("localStorage");
    expect(script).not.toContain("cookie");
  });

  it("adds the loader once and leaves non-documents alone", () => {
    const page = withVisitorCounter("<html><body><p>Hi</p></body></html>");
    expect(page.split(GOATCOUNTER_SRC).length - 1).toBe(1);
    expect(withVisitorCounter(page)).toBe(page);
    const verify = "google-site-verification: google2c987beeafe3d9b2.html";
    expect(withVisitorCounter(verify)).toBe(verify);
  });

  it("is not a precache URL and stays off the service worker", () => {
    const html = withVisitorCounter("<html><body></body></html>");
    expect(referencedUrls(html).some((url) => String(url).includes("zgo.at") || String(url).includes("goatcounter"))).toBe(false);
    const list = buildPrecacheList({
      appPrefix: "",
      artPrefix: "",
      mediaPrefix: "",
      files: ["index.html", "privacy/index.html"],
      texts: [html],
    });
    expect(list.join("\n")).not.toContain("goatcounter");
    expect(list.join("\n")).not.toContain("zgo.at");
    const sw = domainServiceWorker();
    expect(sw).toContain("if (url.origin !== self.location.origin) return;");
    expect(sw).not.toContain("gc.zgo.at");
    expect(sw).not.toContain("goatcounter");
  });

  it("is absent from the Squishee Math shell and the Academy dev shell", () => {
    const math = readFileSync("index.html", "utf8");
    const academy = readFileSync("academy/index.html", "utf8");
    for (const html of [math, academy]) {
      expect(html).not.toContain("gc.zgo.at");
      expect(html).not.toContain("goatcounter");
      expect(html).not.toContain("data-goatcounter");
    }
    expect(math).toContain("Nothing leaves this device.");
    expect(academy).toContain("Progress stays on this device.");
    expect(academy).not.toContain("Nothing leaves this device.");
  });

  it("opens the privacy page in the language the family is using", () => {
    expect(privacyPathForLocale("en")).toBe("privacy/");
    expect(privacyPathForLocale("pt")).toBe("pt-br/privacy/");
    expect(privacyPathForLocale("zh")).toBe("zh-hans/privacy/");
    expect(privacyPathForLocale("ar")).toBe("ar/privacy/");
    setLocale("ar");
    const arabic = renderToStaticMarkup(Foot());
    setLocale("en");
    expect(arabic).toContain("ar/privacy/");
    const english = renderToStaticMarkup(Foot());
    expect(english).toContain('href="/times-tables/privacy/"');
    expect(english).not.toContain("ar/privacy/");
  });
});
