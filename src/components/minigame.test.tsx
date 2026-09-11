import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MiniGame } from "./minigame";
import { MINI_KINDS, pickMiniKind, type WhoHidStage } from "@/lib/minigames";

function htmlFor(seed: string, owned: string[] = ["frog", "cat"], whoStage?: WhoHidStage) {
  return renderToStaticMarkup(
    <MiniGame
      seed={seed}
      owned={owned}
      skipLabel="Skip"
      pokePrompt={(n) => `Poke the ${n}`}
      whoHidLabel="Who hid?"
      matchLabel="Find the pairs"
      peekLabel="Who's peeking?"
      twinLabel="Tap two that match"
      hopLabel="Tap the glow"
      whoStage={whoStage}
      onDone={() => undefined}
    />,
  );
}

function kindFromHtml(html: string): string {
  const attr = /data-mini-kind="([^"]+)"/.exec(html)?.[1];
  if (attr) return attr;
  if (html.includes("Find the pairs")) return "match";
  if (html.includes("Who hid?") || html.includes("Remember these toys")) return "who-hid";
  if (html.includes("Who's peeking?")) return "peek";
  if (html.includes("Tap two that match")) return "twin";
  if (html.includes("Tap the glow")) return "hop";
  return "poke";
}

describe("MiniGame", () => {
  it("renders every end-walk kind with tap targets and no video", () => {
    const kinds = new Set<string>();
    for (let i = 0; i < 80; i++) {
      const seed = `minigame:kid:u1-tally:${i}`;
      const html = htmlFor(seed);
      kinds.add(kindFromHtml(html));
      expect(html.includes("mini-tap") || html.includes("mini-pad")).toBe(true);
      expect(html).toContain("data-mini-kind");
      expect(html).not.toContain("<video");
      expect(html).not.toContain("<canvas");
      expect(pickMiniKind(seed)).toBe(kindFromHtml(html));
    }
    expect(kinds).toEqual(new Set(MINI_KINDS));
  });

  it("who-hid remember stage uses unique slots and no blank sixth tile", () => {
    const htmls: string[] = [];
    for (let i = 0; i < 80; i++) {
      const html = htmlFor(`minigame:kid:who:${i}`);
      if (html.includes("Remember these toys")) htmls.push(html);
    }
    expect(htmls.length).toBeGreaterThan(0);
    const html = htmls[0]!;
    expect(html).toContain("data-who-stage=\"remember\"");
    expect(html).not.toContain("border-dashed");
    const slots = html.match(/data-who-slot="shown-\d+"/g) ?? [];
    expect(slots.length).toBe(3);
    expect(new Set(slots).size).toBe(slots.length);
  });

  it("who-hid choose stage keeps unfound toys in holes — no roster dump", () => {
    const htmls: string[] = [];
    for (let i = 0; i < 80; i++) {
      const seed = `minigame:kid:who:${i}`;
      if (pickMiniKind(seed) !== "who-hid") continue;
      htmls.push(htmlFor(seed, ["frog", "cat"], "choose"));
    }
    expect(htmls.length).toBeGreaterThan(0);
    const html = htmls[0]!;
    expect(html).toContain("data-who-stage=\"choose\"");
    expect(html).toContain("Who hid?");
    expect(html).not.toContain("Remember these toys");
    const holes = html.match(/data-who-hole="shut"/g) ?? [];
    expect(holes.length).toBe(3);
    expect(html).not.toContain("data-who-hole=\"open\"");
    expect(html).toContain("mini-hole");
    expect(html).toContain("mini-hole-mound");
    const faces = html.match(/squishees\/[a-z0-9-]+\.png/g) ?? [];
    expect(faces).toHaveLength(0);
  });

  it("peek shows one peek and keeps the other holes shut", () => {
    const htmls: string[] = [];
    for (let i = 0; i < 80; i++) {
      const seed = `minigame:kid:peek:${i}`;
      if (pickMiniKind(seed) !== "peek") continue;
      htmls.push(htmlFor(seed));
    }
    expect(htmls.length).toBeGreaterThan(0);
    const html = htmls[0]!;
    expect(html).toMatch(/Who(?:'|&#x27;)s peeking\?/);
    expect(html).toContain("data-mini-peek");
    expect(html.match(/data-peek-spot=/g)?.length).toBe(4);
    expect(html.match(/data-peeking="1"/g)?.length).toBe(1);
    expect(html.match(/data-peeking="0"/g)?.length).toBe(3);
    expect(html).toContain("mini-hole");
  });

  it("twin shows the hopper and three silhouettes, hop shows one glow pad", () => {
    let twin = "";
    let hop = "";
    for (let i = 0; i < 80; i++) {
      const seed = `minigame:kid:new:${i}`;
      const kind = pickMiniKind(seed);
      if (kind === "twin" && !twin) twin = htmlFor(seed, ["peach"]);
      if (kind === "hop" && !hop) hop = htmlFor(seed, ["frog"]);
    }
    expect(twin).toContain("Tap two that match");
    expect(twin).toContain("data-mini-twin");
    expect(twin).toContain("squishee-silhouette");
    expect(twin.match(/data-twin-card=/g)?.length).toBe(3);
    expect(hop).toContain("Tap the glow");
    expect(hop).toContain("data-mini-hop");
    expect(hop.match(/data-hop-pad=/g)?.length).toBe(3);
    expect(hop.match(/data-hop-glow="1"/g)?.length).toBe(1);
  });
});
