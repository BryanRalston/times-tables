# Shipped bugs and the gate that catches each

These already shipped (or shipped-and-broke). A test or script must fail if they return.

| # | Bug | Catch |
|---|-----|--------|
| 1 | Live Pages HTML still pointed at `/src/main.tsx` or left `%BASE_URL%` unsubstituted, so React never mounted. Must serve hashed `/times-tables/assets/*.js`. | `scripts/check-pages.mjs` (after `npm run build`, also in `.github/workflows/pages.yml`). Optional live GET of github.io, fail-open. Vitest does not fetch the live site. |
| 2 | Leftover / what's hiding / find-n ten-frame gated **Check** until the kid tapped dots. `needsInteract` must be falsy. Check works with no taps. | `src/lib/answers-audit.test.ts` leftover ten-frames; `src/lib/year.test.ts` `welcomeFirst`. Playwright `scripts/g3-answer-playtest.mjs` leftover Check enabled. |
| 3 | Collect graphs (`u1-tally`, `u6-picto`, `u7-bar`) let Check fire before the tray was empty. | `answers-audit.test.ts` / `year.test.ts` `needsInteract` true + collect tray. Graph board calls `onInteract` only when tray length hits 0. Playwright waits to sort or skips function, still checks UI. |
| 4 | Graph `ask==="more"` named the smaller group first, allowed ties, or scored the wrong difference. | `answers-audit.test.ts` “how-many-more names the larger group first”. |
| 5 | Combine showed the named result polygon in the drawing (spoiler). Result slot is `?`. | `answers-audit.test.ts` combine parts; `src/components/models.test.tsx` combine `?` and no result label in the drawing. |
| 6 | Money **count** prompt contained the total or `$x.xx`. | `answers-audit.test.ts` coins sum / prompt; `year.test.ts` count money; `models.test.tsx` board HTML. |
| 7 | Match minigame dealt four frogs (one toy id). Must be two distinct ids. | `src/lib/minigames.test.ts` match. |
| 8 | Related-fact distractors were sometimes true; ASCII `-` missed Unicode minus `−`. | `answers-audit.test.ts` related-fact distractors (`[×÷+\u2212-]`). |
| 9 | Geometry **choice** questions omitted the scored name (or side count). | `answers-audit.test.ts` “choices include the scored answer”; `year.test.ts` name-the-shape. |
| 10 | Length-read used yards/meters/etc. Must be `in` or `cm` only. | `answers-audit.test.ts` length read. |
| 11 | MagentaVideo hid the PNG before the canvas painted; iPhone/coarse still tried chroma-key and showed an empty glyph. PNG stays until paint; skip on iOS/coarse. | `src/components/poke-toy.test.tsx` PNG in the tree; `src/components/magenta-video.test.ts` skip. |
| 12 | Donut (and squishees) had two faces or leftover magenta. | `scripts/check-assets.py` (`npm run check:assets`, run from `npm test`). Two-eye-pair detector + magenta + missing files. |
| 13 | Beaker interior was keyed out (glass ring). Teal fill sat *behind* the punch-out and did not read as liquid. | `scripts/check-assets.py` beaker bbox/tube center must be opaque. `models.test.tsx` beaker `data-fill-y` equals `beakerMeniscusY(value, max)`. |

`npm test` = vitest + asset check. `npm run test:play` = answering Playwright (local preview).
