# Imagine story backgrounds

## Inventory and coverage

22 books, 140 pages. Existing moods: day, night, water. Text implies open play, hats/mats/cups, bugs, picnics, kite flying, freshwater swimming, boating, a house exterior, and night sky/habitat. No book explicitly requires a bedroom, kitchen, beach or sea, so no invented indoor/sea settings were added.

| Book | Page backgrounds (1-based) |
| --- | --- |
| pk-peach-cat | 1–5 meadow |
| pk-frog-hop | 1–5 meadow |
| k-bunny-hat | 1–6 garden |
| k-pig-bug | 1–6 garden |
| g1-fox-kite | 1–7 meadow |
| g1-duck-fish | 1–3 pond, 4–6 meadow |
| g2-owl-night | 1–7 night |
| g2-bear-boat | 1–6 lake, 7 meadow |
| pk-panda-sun | 1–5 meadow |
| pk-chick-hug | 1–5 meadow |
| k-penguin-cup | 1–6 garden |
| k-otter-fish | 1–5 pond, 6 meadow |
| g1-koala-snack | 1–6 garden |
| g1-hedgehog-hat | 1–7 garden |
| g2-panda-moon | 1–7 night |
| g2-fox-boat | 1–6 lake, 7 meadow |
| g3-bear-warm | 1–5 lake, 6–7 meadow |
| g3-owl-story | 1–7 night |
| g3-fox-kind | 1–7 garden |
| g4-owl-habitat | 1–7 night |
| g4-duck-water | 1–6 pond, 7 meadow |
| g4-bear-measure | 1–6 lake, 7 meadow |

## Art direction and crop

Five Grok Imagine calls, one accepted attempt each. Material/light reference: the existing boat prop. No characters, faces, text, sun or moon are baked into these backgrounds. Meadow and garden support daytime play; pond supports freshwater animal stories; lake supports boat stories; night supports all moon/habitat stories. Source images 1024×768; delivery WebP 1200×900. The actual 390×844 phone scene is 358×448–500 (portrait), while 820px-wide scenes are 704×549; center-safe landscape artwork is intentionally cropped horizontally on phones. Bottom-center stage remains unobstructed. The image is decorative, behind unchanged squishee/prop layers; no overlays touch character art. CSS fallback colors remain while loading. `object-fit: cover; object-position: center bottom` preserves the floor in tall phone crops and wider layouts.

## Quality review

Target stranger: a young independent reader on a 390px phone, already familiar with Khan Academy Kids, Pok Pok, and Sago Mini. Consulted public previews/product descriptions this turn: https://playpokpok.com/ and https://sagomini.com/article/introducing-jinjas-garden-sago-minis-first-3d-game/ (Khan public landing page could not load). Applied restraint rather than copying their art: calm colors, obvious foreground cast, no decorative clutter, no new UI or distracting motion. This is a scene-art improvement, not a claim of equal overall learning/product quality.

Reviewed all five exported backgrounds and the four before/after phone shots. Consistent matte diorama surfaces and soft light; no obvious malformed scenery, duplicate story objects, or content-obscuring graphics. Night deliberately stays readable lavender rather than near-black. Pond/lake ripples suggest water but avoid glossy highlights. Existing glossy character appearance is unchanged. Inherited limitation: boat scenes place the bear beside the toy boat, rather than compositing it inside; this slice intentionally changes backgrounds only.

## Verification

See local logs and report for tests/builds and browser coverage. New tests cover every page resolving to existing manifested art, all seven locale mappings including Arabic, decorative layering, file-size/WebP guardrails, and existing story grade guardrails. All visual work is local; nothing is pushed, merged, or deployed.

### Completed local checks

- One complete test/build cycle: `npm test` — 102 files / 679 tests passed, plus `check-assets OK` (only an existing Pillow deprecation warning).
- `npx tsc --noEmit` passed.
- Non-domain Academy build passed (4.92s); domain Academy build passed (5.62s); `check-academy-domain` passed rewrite and dist-domain checks.
- Both outputs contain all five source-identical WebPs and all five precache entries.
- Built-domain browser sweep: all 22 books / 140 pages decoded all background, prop and character images; no phone overflow, local HTTP errors, or page errors. Wider boat scene and Arabic RTL phone scene also passed.
- Four matched 390×844 before/after screenshots: hat, fish, boat, night. Plus all-background sheet, wide boat, and Arabic night screenshots under `/workspace/squishee-academy-deploy/screens/story-bg-*`.

### Weak spots / intentionally unchanged

- Backgrounds are intentionally soft and reusable rather than bespoke narrative illustrations for every page.
- Narrow phones crop away some edge flowers/reeds; the safe center and usable stage floor survive.
- Existing stories still display a small bear beside a toy boat and English cast names in Arabic. Those are inherited scene/text choices, not introduced by this art slice.
