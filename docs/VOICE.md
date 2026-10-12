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
