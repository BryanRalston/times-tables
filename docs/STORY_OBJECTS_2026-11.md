# Story and Word Problems objects — local review

## Scope
18 faceless matte Imagine objects, replacing only story SVG props and Word Problems' device emoji. Squishee files, other games' emoji, questions, grade bounds, difficulty choices, save schema, spoken clips and all seven locales are unchanged. 25 generation calls: 18 first attempts and 7 retries (snack/star/cookie background; cup/fish/moon/boat story colors). No object exceeded two attempts.

## Meaning and art
Read both `stories/catalog.ts` and `stories/shelf.ts`: Bunny/Hedgehog red hat, Fox red kite, Penguin yellow cup, Otter red fish, Koala yellow snack, Panda yellow sun, Owl/Panda white full moon, Fox green boat. Duck's snack remains an apple, now golden yellow to also fit Koala. A cream-sailed green sailboat preserves the original boat type. Mat stays turquoise, log brown, house cream/red roof, bug plum/mint. Counting apple remains red and fish teal; soccer ball remains a soccer ball.

Golden snack apple uses the generated apple master with a skin-only hue adjustment; green leaf and brown stem are preserved. No text or faces were introduced. Frog is deliberately viewed from behind: less immediately expressive than the old emoji but clearly separate from a squishee character.

## Guardrails
- File/id coverage test includes all 12 story props and all 6 counting objects.
- Render tests assert alt/dimensions, exact token counts, group boundaries, no rendered emoji, and unchanged story grade-band validation.
- check-assets checks 512px alpha corners, magenta residue and <120KB per PNG.
- Both Academy builds copy all assets using an explicit manifest rather than bundle string scanning. Domain check compares all 18 output files byte-for-byte against source.
- Preview harness decodes all 18 images in Chromium and checks four story pages plus a 4+4 cookie problem at 390x844, with no broken images, page errors or horizontal overflow.

## Review evidence
Contact sheet and before/after phone screenshots are under `/workspace/squishee-academy-deploy/screens/`. Generate phone evidence with `SHOTS_DIR=... node scripts/props-preview.mjs` after the domain build. All work is local and unpublished; Bryan must review the artwork and approve any merge/publish separately.

## Final local results
675 tests across 101 files passed, including grade guardrails, plus check-assets. TypeScript and both Academy Vite builds passed; check-academy-domain passed. Two full test/build cycles used. All 18 files in each output directory match source byte-for-byte. Total PNG payload 1,039,505 bytes; each 24,192–104,632 bytes (under 120KB). Existing Vite >500KB main-chunk warning remains.

Install optional regeneration dependencies with `python3 -m pip install -r scripts/requirements-props.txt`; they are not needed for the app or tests (beyond the existing Pillow asset checks).
