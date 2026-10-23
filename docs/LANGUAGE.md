# Academy language

Squishee Academy starts in English. The hello screen lists English, Español, Português, Français, 中文, हिन्दी, and العربية, and the same list is in Settings and on the Grown-ups page. The choice is saved on this device (`save.lang`, `save.langChosen`).

The Spanish is Latin American and kid-friendly, with tú. The Portuguese is Brazilian and kid-friendly, with você. The French is from France and kid-friendly, with tu. The Chinese is simplified Mandarin for mainland classrooms, with 你. The Hindi is standard school Hindi in Devanagari, with तुम. The Arabic is Modern Standard Arabic for school, with أنت, and the page direction is right to left. Math expressions, clocks, rulers, and number lines stay left to right. Western digits stay. Character names (Peach, Frog, and the bosses) stay as they are. Squishee stays Squishee. Portuguese, French, Chinese, Hindi, and Arabic strings, and their voice maps, load only after that language is chosen, so an English first visit stays the same size. The language list uses a two-character Noto Sans SC subset for 中文, a small Noto Sans Devanagari subset for हिन्दी, and a small Noto Sans Arabic subset for العربية. The rest of each face loads only after that language is chosen.

## English reading games

Phonics, Sight Words, and Spelling teach English reading. The word, the sentence, and the letter tiles stay in English. The instruction around them is translated: Spanish “Toca la palabra que escuchas”, Portuguese “Toque a palavra que você ouve”, and French “Touche le mot que tu entends”. The recorded voice for that language says the instruction and also says the English word, so one offline voice can coach both. Mandarin, Hindi, and Arabic hide those three games, and letter tracing with them, instead of translating the English alphabet. Number tracing stays.

## Stories

Read-along books play in every language on the shelf. The pictures stay the same. The words are a kid-friendly telling in that language, and character names stay Peach, Frog, and the rest. Each word has its own clip from the same offline voice the games use, so the highlight follows the voice. Arabic pages run right to left, and Next sits on the left. A missing clip is a short silence while the highlight still moves, and the page keeps going. The grown-up report names the books in the language the child was reading.

## Worksheets

The in-app printable follows the language the child is using. The public pages that search engines read stay in English, so a shared link does not change language with the browser.

## Voice

Spanish speech uses Kokoro `ef_dora`. Portuguese speech uses Kokoro `pf_dora` with `lang="pt-br"`. French speech uses Kokoro `ff_siwis` with `lang="fr-fr"`. Mandarin speech uses Kokoro `zf_xiaobei` with `lang="cmn"`. Hindi speech uses Kokoro `hf_alpha` with `lang="hi"`. Arabic speech uses eSpeak NG voice `ar`. Clips load only after that language is chosen. English players do not download them. Details are in `docs/VOICE.md`.
