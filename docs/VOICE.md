# Academy voice

Squishee Academy speaks with recorded clips so every device, including one with no network and no system voice, hears the same warm voice. The device `speechSynthesis` voice is only used when a line has no clip.

## Model

| | |
|---|---|
| Engine | [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M), run through [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx) |
| Voice | `af_heart` (American English, warm and clear) |
| Speed | 0.92 |
| License | Apache License 2.0 |

Kokoro's weights and the ONNX runtime are Apache-2.0. Generated clips in `academy/public/voice/` may be shipped with the Academy. Piper's Lessac and Amy voices were not used: their training data is research-only.

Clips are mono MP3, 22,050 Hz, 32 kbps. Shared lines (numbers 0–100, minutes, Add & Subtract, Telling Time, buddy lines, and the home) live in `voice/core/` and are precached on the first visit. Other games live in `voice/lazy/` and are cached by the service worker the first time that game plays.

## Regenerating

From the repo root, with the Kokoro ONNX model and `voices-v1.0.bin` available to `scripts/render-voice.py`:

```bash
npx vite-node scripts/export-voice-clips.ts
python3 scripts/render-voice.py
```

`src/academy/voice/clips.test.ts` fails if a new prompt, hint, praise line, word, or number cannot be played from clips.

## Spanish

Spanish uses the same Kokoro model and the same line-splitting as English. The voice is `ef_dora` (`lang="es"`), also Apache-2.0. Clips live in `academy/public/voice/es/` and are not part of the English precache. The manifest is a separate chunk (`src/academy/voice/manifest-es.ts`) loaded only when the language is Español, so an English player does not download the Spanish files.

Number clips do not share filenames with English. “7” is `siete` in Spanish and `seven` in English.

`ef_dora` also reads the English words that stay on screen in Phonics, Sight Words, and Spelling. Those games teach English reading, so the target word stays English while the instruction around it is Spanish. See `docs/LANGUAGE.md`.

```bash
npx vite-node scripts/export-voice-es.ts
VOICE_JOBS=/tmp/voice-jobs-es.json VOICE_NAME=ef_dora VOICE_LANG=es python3 scripts/render-voice.py
```

`src/academy/voice/clips-es.test.ts` fails if any Spanish speakable line has no clip. `VOICE_CLEAN=1` only deletes files in folders named by the current job list, so a Spanish render does not remove English clips.
