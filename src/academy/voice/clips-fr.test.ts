import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { installFrench, setLocale } from "../i18n";
import { BOSS_FR, FR, PERSONA_FALLBACK_FR, PERSONA_FR, TRAIT_FR } from "../i18n-fr";
import { collectClipSpecs, collectSpokenLines, lineChunkErrors } from "./catalog";
import { VOICE_FILES_FR, VOICE_MODEL_FR } from "./manifest-fr";
import { idealPieces, planSpeech } from "./plan";

installFrench({ FR, PERSONA_FR, PERSONA_FALLBACK_FR, BOSS_FR, TRAIT_FR });
setLocale("fr");
const lines = collectSpokenLines();
const specs = collectClipSpecs(lines);

afterAll(() => {
  setLocale("en");
});

describe("French recorded voice", () => {
  it("uses a free Kokoro French voice and keeps clips out of the English cache", () => {
    expect(VOICE_MODEL_FR.voice).toBe("ff_siwis");
    expect(VOICE_MODEL_FR.license).toBe("Apache-2.0");
    for (const file of Object.values(VOICE_FILES_FR)) expect(file.startsWith("fr/")).toBe(true);
  });

  it("has a clip for every French speakable line", () => {
    const errors = lineChunkErrors(lines);
    expect(errors.slice(0, 6)).toEqual([]);
    const missing: string[] = [];
    for (const spec of specs) {
      const file = VOICE_FILES_FR[spec.key];
      if (!file) {
        missing.push(spec.key);
        continue;
      }
      const abs = resolve("academy/public/voice", file);
      if (!existsSync(abs) || statSync(abs).size < 200) missing.push(`${spec.key} -> ${file}`);
    }
    expect(missing.slice(0, 12)).toEqual([]);
    expect(missing).toHaveLength(0);

    const has = (key: string) => Object.prototype.hasOwnProperty.call(VOICE_FILES_FR, key);
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
