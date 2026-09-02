import { afterEach, describe, expect, it } from "vitest";
import { fallbackPublicSrc, skipPokeVideo } from "./magenta-video";

describe("MagentaVideo skip", () => {
  const nav = globalThis.navigator;
  const win = globalThis.window;

  afterEach(() => {
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: nav });
    if (win === undefined) {
      Reflect.deleteProperty(globalThis, "window");
    } else {
      Object.defineProperty(globalThis, "window", { configurable: true, value: win });
    }
  });

  it("skips chroma-key clips on iPhone", () => {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        platform: "iPhone",
        maxTouchPoints: 5,
      },
    });
    expect(skipPokeVideo()).toBe(true);
  });

  it("skips chroma-key clips on coarse pointers", () => {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: { userAgent: "Mozilla/5.0", platform: "Win32", maxTouchPoints: 1 },
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { matchMedia: (q: string) => ({ matches: q.includes("pointer: coarse") }) },
    });
    expect(skipPokeVideo()).toBe(true);
  });
});

describe("MagentaImg public fallback", () => {
  it("retries unprefixed public files if BASE_URL 404s", () => {
    expect(fallbackPublicSrc("/times-tables/squishees/cat.png")).toBe("/squishees/cat.png");
    expect(fallbackPublicSrc("/squishees/cat.png")).toBe("/times-tables/squishees/cat.png");
    expect(fallbackPublicSrc("/times-tables/squishees/cat.png")).not.toBe("/times-tables/squishees/cat.png");
  });
});
