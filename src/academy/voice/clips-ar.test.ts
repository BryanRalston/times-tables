import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { installArabic, setLocale } from "../i18n";
import { AR, BOSS_AR, PERSONA_AR, PERSONA_FALLBACK_AR, TRAIT_AR } from "../i18n-ar";
import { collectClipSpecs, collectSpokenLines, lineChunkErrors } from "./catalog";
import { VOICE_FILES_AR, VOICE_MODEL_AR } from "./manifest-ar";
import { idealPieces, planSpeech } from "./plan";

installArabic({ AR, PERSONA_AR, PERSONA_FALLBACK_AR, BOSS_AR, TRAIT_AR });
setLocale("ar");
const lines = collectSpokenLines();
const specs = collectClipSpecs(lines);

afterAll(() => {
  setLocale("en");
});

describe("Arabic recorded voice", () => {
  it("uses eSpeak NG for Arabic and keeps clips out of the English cache", () => {
    expect(VOICE_MODEL_AR.voice).toBe("ar");
    expect(VOICE_MODEL_AR.engine).toBe("eSpeak NG");
    expect(VOICE_MODEL_AR.license).toBe("GPL-3.0");
    for (const file of Object.values(VOICE_FILES_AR)) expect(file.startsWith("ar/")).toBe(true);
  });

  it("has a clip for every Arabic speakable line", () => {
    const errors = lineChunkErrors(lines);
    expect(errors.slice(0, 6)).toEqual([]);
    const missing: string[] = [];
    for (const spec of specs) {
      const file = VOICE_FILES_AR[spec.key];
      if (!file) {
        missing.push(spec.key);
        continue;
      }
      const abs = resolve("academy/public/voice", file);
      if (!existsSync(abs) || statSync(abs).size < 200) missing.push(`${spec.key} -> ${file}`);
    }
    expect(missing.slice(0, 12)).toEqual([]);
    expect(missing).toHaveLength(0);

    const has = (key: string) => Object.prototype.hasOwnProperty.call(VOICE_FILES_AR, key);
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
