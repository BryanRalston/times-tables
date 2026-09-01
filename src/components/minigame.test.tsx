import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MiniGame } from "./minigame";

function htmlFor(seed: string, owned: string[] = ["frog", "cat"]) {
  return renderToStaticMarkup(
    <MiniGame
      seed={seed}
      owned={owned}
      skipLabel="Skip"
      pokePrompt={(n) => `Poke the ${n}`}
      whoHidLabel="Who hid?"
      matchLabel="Find the pairs"
      onDone={() => undefined}
    />,
  );
}

describe("MiniGame", () => {
  it("renders on desktop markup with tap targets and no video", () => {
    const kinds = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const html = htmlFor(`minigame:kid:u1-tally:${i}`);
      kinds.add(html.includes("Find the pairs") ? "match" : html.includes("Who hid?") ? "who-hid" : "poke");
      expect(html).toContain("min-h-[96px]");
      expect(html).not.toContain("<video");
      expect(html).not.toContain("<canvas");
    }
    expect(kinds.has("match")).toBe(true);
    expect(kinds.has("who-hid")).toBe(true);
    expect(kinds.has("poke")).toBe(true);
  });
});
