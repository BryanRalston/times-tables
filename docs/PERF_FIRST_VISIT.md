# First visit, 26 October 2026

A fresh phone visit to Squishee Academy was downloading the offline library before the first round could speak. This pass splits that library so the first question only waits for the clips it actually says. The pictures on the home screen stay where they are. Squishee Math is unchanged.

## What was downloading

The old service worker cached its whole list during install, before a child picked a language. That list was the same set that is now split below: **12,828 files, about 151 MB**. It included every language's clips and the costume, wardrobe, coin, and poke art. The files are stored in alphabetical order, so an English visit started on the costume folder and then on Arabic clips.

The spoken prompt for the first question is about 25 KB of the language the family picked.

| List | Files | Size |
| --- | ---: | ---: |
| Install, before | 12,828 | 151 MB |
| Install shell, after | 20 | 1.06 MB |
| English clips, after the first prompt | 1,132 | 5.24 MB |
| Spanish clips, only if the family picks Español | 1,817 | 10.13 MB |
| Portuguese / French / Chinese / Hindi / Arabic | 1,821 / 1,832 / 1,652 / 2,010 / 2,023 | 11.13 / 9.18 / 11.03 / 12.74 / 17.64 MB |
| Costumes, portraits, and the rest, after that language | 521 | 72.61 MB |

The main script is still one file, about 478 KB (gzip about 152 KB). The voice manifest for the language in use still loads with the first spoken line (gzip about 73 KB in English, about 78 KB in Spanish). The other languages' manifests stay unloaded.

## How it was measured

Local production build of the academy domain (`npm run build:academy-domain`). Chrome at 390×844, a fresh profile, no saved child. Text files were gzipped. Media was sent raw. The clock stopped when the first question card was on screen and a recorded clip started. The "Pick a buddy" line does not stop the clock. The same check was run in English and Spanish, once with no cap and once through a shared 1.6 Mbit/s pipe.

## Bytes until that first spoken question

| Visit | Before | After |
| --- | ---: | ---: |
| English, no cap | 71.7 MB in 2.4 s | 8.4 MB in 2.0 s |
| Spanish, no cap | 71.3 MB in 2.2 s | 8.4 MB in 1.9 s |
| English, 1.6 Mbit/s | 3.2 MB in 17 s | 2.8 MB in 14 s |
| Spanish, 1.6 Mbit/s | 1.6 MB in 8 s | 2.6 MB in 13 s |

On the fast runs the old install had already moved about 47 MB of costumes and a few megabytes of Arabic before the question spoke. After the change, those files are absent. The 8.4 MB is mostly the buddy pictures on the home screen (about 7.8 MB), plus the app shell. The prompt itself was 6 English clips (25 KB) or 6 Spanish clips (23 KB). `AudioBufferSourceNode.start` ran 10 times on each fast visit, and the card showed an English sentence ("Peach the sweet has…") or a Spanish one ("Peach, la dulce, tiene…").

The slow-pipe totals move with how many of those pictures finish before the question. They are not a clean before/after of the install list. The lab pipe serves the page's own requests first, so the old 151 MB download often had not arrived yet when the card appeared. On an open connection it had. A phone on cellular shares its radio across every request, so not starting that 151 MB download is the saving a family actually feels. The first prompt is still the chosen language, about 25 KB, on the slow pipe too.

## After the first question

The page asks the service worker to cache what it has already used, then that language's clips, then the rest of the offline set. The background fetch waits while a prompt's clips are still loading, so the first round is not competing with the costume folder. A family that picked Español gets `/voice/es/` clips, not the English set. The other five languages are not fetched on that visit.

Offline check, after that language list was in the cache: the network was turned off, the app was reloaded, and Play was tapped again.

- English: 1,132 core clips cached and no other language. The new round spoke ("Peach the sweet has 1 squishee…"). A core clip the question did not need, `/voice/core/100-….mp3`, came back from the cache (200, 4,407 bytes).
- Spanish: 1,817 Spanish clips and no other language. The new round spoke ("Peach, la dulce, tiene 4 squishees…"). `/voice/es/100-….mp3` came back from the cache (200, 2,630 bytes).

GoatCounter is unchanged. Nothing new is requested from a third party. Squishee Math's source, build, and first-run setup were not part of this change.
