import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { installPortuguese, setLocale } from "../i18n";
import { BOSS_PT, PERSONA_FALLBACK_PT, PERSONA_PT, PT, TRAIT_PT } from "../i18n-pt";
import { collectClipSpecs, collectSpokenLines, lineChunkErrors } from "./catalog";
import { VOICE_FILES_PT, VOICE_MODEL_PT } from "./manifest-pt";
import { idealPieces, planSpeech } from "./plan";

installPortuguese({ PT, PERSONA_PT, PERSONA_FALLBACK_PT, BOSS_PT, TRAIT_PT });
setLocale("pt");
const lines = collectSpokenLines();
const specs = collectClipSpecs(lines);

afterAll(() => {
  setLocale("en");
});

describe("Portuguese recorded voice", () => {
  it("uses a free Kokoro Brazilian voice and keeps clips out of the English cache", () => {
    expect(VOICE_MODEL_PT.voice).toBe("pf_dora");
    expect(VOICE_MODEL_PT.license).toBe("Apache-2.0");
    for (const file of Object.values(VOICE_FILES_PT)) expect(file.startsWith("pt/")).toBe(true);
  });

  it("has a clip for every Portuguese speakable line", () => {
    const errors = lineChunkErrors(lines);
    expect(errors.slice(0, 6)).toEqual([]);
    const missing: string[] = [];
    for (const spec of specs) {
      const file = VOICE_FILES_PT[spec.key];
      if (!file) {
        missing.push(spec.key);
        continue;
      }
      const abs = resolve("academy/public/voice", file);
      if (!existsSync(abs) || statSync(abs).size < 200) missing.push(`${spec.key} -> ${file}`);
    }
    expect(missing.slice(0, 12)).toEqual([]);
    expect(missing).toHaveLength(0);

    const has = (key: string) => Object.prototype.hasOwnProperty.call(VOICE_FILES_PT, key);
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
