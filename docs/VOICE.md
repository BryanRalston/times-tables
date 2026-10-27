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

Spanish uses the same Kokoro model and the same line-splitting as English. The voice is `ef_dora` (`lang="es"`), also Apache-2.0. Clips live in `academy/public/voice/es/`. The install cache includes the Spanish clips for Add & Subtract, Times Tables, and Telling Time (prompts, numbers through 1,000, clock words, praise, and Almost), plus buddy lines and the home. Sight words, spelling, phonics, money, and the other games are saved the first time they play. The manifest is a separate chunk (`src/academy/voice/manifest-es.ts`) loaded only when the language is Español, so the English script bundle does not include the Spanish map.

Number clips do not share filenames with English. “7” is `siete` in Spanish and `seven` in English.

`ef_dora` also reads the English words that stay on screen in Phonics, Sight Words, and Spelling. Those games teach English reading, so the target word stays English while the instruction around it is Spanish. See `docs/LANGUAGE.md`.

```bash
npx vite-node scripts/export-voice-es.ts
VOICE_JOBS=/tmp/voice-jobs-es.json VOICE_NAME=ef_dora VOICE_LANG=es python3 scripts/render-voice.py
```

## Portuguese

Brazilian Portuguese uses the same Kokoro model and the same line-splitting. The voice is `pf_dora` (`lang="pt-br"`), also Apache-2.0. Clips live in `academy/public/voice/pt/`. The install cache includes the Portuguese clips for Add & Subtract, Times Tables, and Telling Time, plus buddy lines and the home. The manifest is a separate chunk (`src/academy/voice/manifest-pt.ts`) loaded only when the language is Português. The string table is its own chunk too (`src/academy/i18n-pt.ts`).

Number clips do not share filenames with English or Spanish. “7” is `sete` in Portuguese.

`pf_dora` also reads the English words that stay on screen in Phonics, Sight Words, and Spelling. The instruction around them is Portuguese.

```bash
npx vite-node scripts/export-voice-pt.ts
VOICE_JOBS=/tmp/voice-jobs-pt.json VOICE_NAME=pf_dora VOICE_LANG=pt-br python3 scripts/render-voice.py
```

`src/academy/voice/clips-es.test.ts` fails if any Spanish speakable line has no clip. `src/academy/voice/clips-pt.test.ts` does the same for Portuguese. `src/academy/voice/clips-fr.test.ts` does the same for French. `src/academy/voice/clips-zh.test.ts` does the same for Mandarin. `src/academy/voice/clips-hi.test.ts` does the same for Hindi. `src/academy/voice/clips-ar.test.ts` does the same for Arabic. `VOICE_CLEAN=1` only deletes files in folders named by the current job list, so a Spanish, Portuguese, French, or Chinese render does not remove English clips.

## French

French from France uses the same Kokoro model and the same line-splitting. The voice is `ff_siwis` (`lang="fr-fr"`), also Apache-2.0. Clips live in `academy/public/voice/fr/`. The install cache includes the French clips for Add & Subtract, Times Tables, and Telling Time, plus buddy lines and the home. The manifest is a separate chunk (`src/academy/voice/manifest-fr.ts`) loaded only when the language is Français. The string table is its own chunk too (`src/academy/i18n-fr.ts`).

Number clips do not share filenames with English, Spanish, or Portuguese. “7” is `sept` in French. 70–99 follow the school forms (`soixante-dix`, `quatre-vingts`, `quatre-vingt-un`).

`ff_siwis` also reads the English words that stay on screen in Phonics, Sight Words, and Spelling. The instruction around them is French.

## Mandarin

Simplified Mandarin uses the same Kokoro model. The voice is `zf_xiaobei` (`lang="cmn"`), Apache-2.0. `zh` and `zh-cn` are not espeak language codes for this build. Clips live in `academy/public/voice/zh/`. The install cache includes the Chinese clips for Add & Subtract, Times Tables, and Telling Time, plus buddy lines and the home. The manifest is a separate chunk (`src/academy/voice/manifest-zh.ts`) loaded only when the language is 中文. The string table is its own chunk too (`src/academy/i18n-zh.ts`).

Phonics, Sight Words, and Spelling are hidden in Chinese, so those English-alphabet lines are not recorded. Number words follow mainland school reading: 2 is 二, 200 is 二百, 2000 is 两千, and 101 is 一百零一. Clock speech says 点整, 点半, 点一刻, and 差一刻 next hour. Western digits stay in the writing. A small Noto Sans SC subset draws 中文 on the language list. The face used by the rest of the UI is loaded only after Chinese is chosen, and it is left out of the install cache.

## Hindi

Hindi uses the same Kokoro model. The voice is `hf_alpha` (`lang="hi"`), Apache-2.0. Clips live in `academy/public/voice/hi/`. The install cache includes the Hindi clips for Add & Subtract, Times Tables, and Telling Time, plus buddy lines and the home. The manifest is a separate chunk (`src/academy/voice/manifest-hi.ts`) loaded only when the language is हिन्दी. The string table is its own chunk too (`src/academy/i18n-hi.ts`).

Phonics, Sight Words, and Spelling are hidden in Hindi, so those English-alphabet lines are not recorded. Number words follow school Hindi, including एक सौ एक for 101 and लाख for 100,000. Clock speech says बजे, साढ़े, सवा, and पौने for the next hour. Western digits stay in the writing. A small Noto Sans Devanagari subset draws हिन्दी on the language list. The face used by the rest of the UI is loaded only after Hindi is chosen, and it is left out of the install cache.

```bash
npx vite-node scripts/export-voice-hi.ts
VOICE_JOBS=/tmp/voice-jobs-hi.json VOICE_NAME=hf_alpha VOICE_LANG=hi python3 scripts/render-voice.py
```

## Arabic

Modern Standard Arabic does not have a Kokoro voice. Clips use eSpeak NG (`espeak-ng -v ar`), GPL-3.0. Generated clips in `academy/public/voice/ar/` may be shipped with the Academy. They are mono MP3, 22,050 Hz, 32 kbps, the same as the other languages. The install cache includes the Arabic clips for Add & Subtract, Times Tables, and Telling Time, plus buddy lines and the home. The manifest is a separate chunk (`src/academy/voice/manifest-ar.ts`) loaded only when the language is العربية. The string table is its own chunk too (`src/academy/i18n-ar.ts`).

Phonics, Sight Words, and Spelling are hidden in Arabic, so those English-alphabet lines are not recorded. Number words follow school Arabic: 21 is واحد وعشرون, 101 is مئة وواحد, and 2000 is ألفان. Clock speech says الساعة, والربع, والنصف, and إلا ربع for the next hour. Western digits stay in the writing. The page is right to left, and equations, clocks, rulers, and number lines stay left to right. A small Noto Sans Arabic subset draws العربية on the language list. The face used by the rest of the UI is loaded only after Arabic is chosen, and it is left out of the install cache.

```bash
npx vite-node scripts/export-voice-ar.ts
VOICE_JOBS=/tmp/voice-jobs-ar.json python3 scripts/render-voice-ar.py
```

```bash
npx vite-node scripts/export-voice-fr.ts
VOICE_JOBS=/tmp/voice-jobs-fr.json VOICE_NAME=ff_siwis VOICE_LANG=fr-fr python3 scripts/render-voice.py
```

## Compare and 10 More

Compare and 10 More reuse clips that are already in the seven manifests. Kokoro and eSpeak are not available in every build environment, so those games do not add new recordings.

Spoken compare lines are `Compare 4 and 7` (and the same shape in each language) while both numbers are at most 1,000. A four-digit card says only `Compare`, and the numerals stay on screen. The signs `<` and `>` are never spoken. 10 more says `What is 10 more than 24?` in English. The other languages say the same jump as plus or minus, because a full “10 less than” line, and Spanish “más que”, were not recorded. A 1000 jump says `What is 1000 more?` or `What is 1000 less?` and leaves the starting number on the card, so Mandarin, Hindi, and Arabic never have to speak a number past 1,000. Even and odd were not added: those words are not in the clip set.
