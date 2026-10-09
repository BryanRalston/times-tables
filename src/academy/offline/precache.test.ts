import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COSMETIC_IDS } from "@/lib/cosmetics";
import { SQUAD_IDS } from "../model";
import { artPaths, buildPrecacheList, domainServiceWorker, isPrecacheFile, referencedUrls, SHARE_IMAGE_PATH, subpathServiceWorker } from "../../../scripts/academy-precache.mjs";
import { SHARE_IMAGE_PATH as htmlShareImage } from "../seo/html";

describe("offline precache", () => {
  it("lists app files, squad art, outfits, and sounds", () => {
    const paths = artPaths();
    for (const id of SQUAD_IDS) {
      expect(paths).toContain(`squishees/${id}.png`);
      for (const cosmetic of COSMETIC_IDS) expect(paths).toContain(`cosmetics/${id}-${cosmetic}.png`);
    }
    expect(isPrecacheFile("assets/app.js")).toBe(true);
    expect(isPrecacheFile("assets/font.woff2")).toBe(true);
    expect(isPrecacheFile("sounds/cheer.wav")).toBe(true);
    expect(isPrecacheFile("squishees/frog.png")).toBe(false);
    expect(isPrecacheFile("precache-manifest.json")).toBe(false);

    const list = buildPrecacheList({
      appPrefix: "/times-tables/academy",
      artPrefix: "/times-tables",
      files: ["index.html", "assets/app.js", "assets/app.css", "worksheets/multiplication-7s/index.html", "sounds/cheer.wav", "privacy/index.html"],
      texts: ['const clip = "/sounds/cheer.wav"; const face = "/times-tables/squishees/frog.png";'],
    });
    expect(list).toContain("/times-tables/academy/");
    expect(list).toContain("/times-tables/academy/index.html");
    expect(list).toContain("/times-tables/academy/assets/app.js");
    expect(list).toContain("/times-tables/academy/assets/app.css");
    expect(list).toContain("/times-tables/academy/worksheets/multiplication-7s/");
    expect(list).toContain("/times-tables/academy/worksheets/multiplication-7s/index.html");
    expect(list).toContain("/times-tables/academy/privacy/");
    expect(list).toContain("/times-tables/academy/sounds/cheer.wav");
    expect(list).toContain("/times-tables/squishees/frog.png");
    expect(list).toContain("/sounds/cheer.wav");
    expect(referencedUrls('src="/assets/index-abc123.js"')).toContain("/assets/index-abc123.js");

    const sound = readFileSync("src/academy/sound.ts", "utf8");
    expect(sound).not.toMatch(/\.(mp3|wav|ogg|m4a)/);
    expect(readFileSync("public/academy-sw.js", "utf8")).toBe(subpathServiceWorker());
    expect(htmlShareImage).toBe(SHARE_IMAGE_PATH);
    expect(isPrecacheFile(SHARE_IMAGE_PATH.slice(1))).toBe(false);
    const domainSw = domainServiceWorker();
    expect(domainSw).toContain(`const SHARE_IMAGE = ${JSON.stringify(SHARE_IMAGE_PATH)}`);
    expect(domainSw).toContain("if (url.pathname === SHARE_IMAGE) return;");
    expect(domainSw).toContain('caches.match("/index.html")');
  });
});
