import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { installHindi, setLocale } from "../i18n";
import { BOSS_HI, HI, PERSONA_FALLBACK_HI, PERSONA_HI, TRAIT_HI } from "../i18n-hi";
import { collectClipSpecs, collectSpokenLines, lineChunkErrors } from "./catalog";
import { VOICE_FILES_HI, VOICE_MODEL_HI } from "./manifest-hi";
import { idealPieces, planSpeech } from "./plan";

installHindi({ HI, PERSONA_HI, PERSONA_FALLBACK_HI, BOSS_HI, TRAIT_HI });
setLocale("hi");
const lines = collectSpokenLines();
const specs = collectClipSpecs(lines);

afterAll(() => {
  setLocale("en");
});

describe("Hindi recorded voice", () => {
  it("uses a free Kokoro Hindi voice and keeps clips out of the English cache", () => {
    expect(VOICE_MODEL_HI.voice).toBe("hf_alpha");
    expect(VOICE_MODEL_HI.license).toBe("Apache-2.0");
    for (const file of Object.values(VOICE_FILES_HI)) expect(file.startsWith("hi/")).toBe(true);
  });

  it("has a clip for every Hindi speakable line", () => {
    const errors = lineChunkErrors(lines);
    expect(errors.slice(0, 6)).toEqual([]);
    const missing: string[] = [];
    for (const spec of specs) {
      const file = VOICE_FILES_HI[spec.key];
      if (!file) {
        missing.push(spec.key);
        continue;
      }
      const abs = resolve("academy/public/voice", file);
      if (!existsSync(abs) || statSync(abs).size < 200) missing.push(`${spec.key} -> ${file}`);
    }
    expect(missing.slice(0, 12)).toEqual([]);
    expect(missing).toHaveLength(0);

    const has = (key: string) => Object.prototype.hasOwnProperty.call(VOICE_FILES_HI, key);
    const uncovered: string[] = [];
    const seen = new Set<string>();
    for (const row of lines) {
      if (seen.has(row.line)) continue;
      seen.add(row.line);
      const ideal = idealPieces(row.line);
      const plan = planSpeech(row.line, has);
      if (!ideal || !plan || plan.map((piece) => piece.key).join("|") !== ideal.map((piece) => piece.key).join("|")) {
        uncovered.push(row.line);
      }
    }
    expect(uncovered.slice(0, 8)).toEqual([]);
    expect(uncovered).toHaveLength(0);
  });
});
