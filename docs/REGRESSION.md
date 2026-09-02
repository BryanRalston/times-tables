# Shipped bugs and the gate that catches each

These already shipped (or shipped-and-broke). A test or script must fail if they return.

| # | Bug | Catch |
|---|-----|--------|
| 1 | Live Pages HTML still pointed at `/src/main.tsx` or left `%BASE_URL%` unsubstituted, so React never mounted. Must serve hashed `/times-tables/assets/*.js`. | `scripts/check-pages.mjs` (after `npm run build`, also in `.github/workflows/pages.yml`). Optional live GET of github.io, fail-open. Vitest does not fetch the live site. |
| 2 | Leftover / what's hiding / find-n ten-frame let **Check** or **Skip** succeed with zero model taps. `needsInteract` must be true. Keypad, Check, and Skip stay hidden until the kid takes the known group **and the take-out why-move finishes** (`.take-out` 280ms). | `src/lib/answers-audit.test.ts` leftover ten-frames; `src/lib/year.test.ts` `welcomeFirst`; `src/lib/leftover.test.ts` `leftoverWhyMoveMs() >= 280`. Playwright leftover Check not present until after known-group tap **and** the why-move wait. |
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
| 14 | Spring-scale photo printed **SPRING SCALE 5 kg / 50 N** while questions use oz/lb/g/kg. Kid reads the lie, not the overlay. | `scripts/check-assets.py` dark-ink count on the housing plate (above the white dial, between screws). PNG must be a blank plate. `models.test.tsx` `data-scale-deg` = `scaleNeedleDeg(value, max)`. |
| 15 | Ruler photo chewed to a stub / mostly transparent so overlay ticks sat on empty air. | `scripts/check-assets.py` every `public/measure/*.png` exists; ruler strip width/opaque span. `models.test.tsx` `data-ruler-x` = `rulerPointerX(value, max)`. |
| 16 | Join/take leftover stories (`u7-add`, `u7-take`) let **Check** or **Skip** succeed without the why-move — same class as leftover ten-frames. | `answers-audit.test.ts` leftover ten-frames includes `u7-add` / `u7-take`; `needsInteract` true. |
| 17 | `u6-picto` (tally with a key) ignored `key: 2` and always scored/legend as 1. | `answers-audit.test.ts` collect graphs: `u6-picto` key is 2 and value answers are picture-count × key. |
| 18 | Refresh wiped coins, stars, name, and path: `hydrateProgress` called `setHydrated` before `rehydrate`, so persist wrote empty over `g3-path-v2`. | `src/lib/progress.test.ts` seed 12 coins → hydrate still 12; setHydrated-before-rehydrate does not overwrite; migrate `times-tables-progress`; `main.tsx` has no `resetAll`. Playwright `scripts/persist-reload.mjs`. |
| 19 | Empty/fresh Guest (`seenWelcome: false`, no save) landed on Home with two equal CTAs **Play leftover** / **Start today's walk** plus the year map. First visit must already be on leftover `6 + n = 10` (What's hiding). Keypad and Check stay hidden until the known group is taken and the why-move finishes. Home, year map, Lessons, today's walk, and Shelf only after that leftover run / on return visits. | `src/app.test.tsx` empty Guest App paint; `src/lib/year.test.ts` `doorRoute`; Playwright first-visit in `scripts/persist-reload.mjs` and `scripts/g3-answer-playtest.mjs`. |

`npm test` = vitest + asset check. `npm run test:play` = answering Playwright (local preview). `npm run test:shots` = local dump files exist (shots are gitignored).
