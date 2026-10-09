# Adding a game to Squishee Academy

A new game is one module plus a worksheet page. Rounds, stars, streaks, unlocks, and the grown-ups page already apply to every game in the registry.

## 1. Add the module

Create `src/academy/games/<id>.tsx` that exports a `GameModule` (see `src/academy/games/types.ts`).

The module owns:

- metadata: id, title, audience, tint, mascot, worksheet slug
- grade levels: the list, which level each grade starts on, and the play-pill text
- `makeQuestion` and `makeSheetItem`
- `Prompt` (and `Aside`, for a wide layout like the clock) and `SheetBody`
- parent-page bars and chips (`bars`, `chips`, `skillLabel`, `chipLabel`)

Copy `times.tsx`, `add.tsx`, `time.tsx`, or `money.tsx` as the starting point. Register it in `src/academy/games/registry.ts` by appending it to `GAMES`. Home, the island map, settings, worksheets, today’s game, and the grown-ups skill list read that list. Append only. The map stores a game id, and inserting a game in front would move families who are mid-island.

Do not put a half-built game in the registry. A locked “coming soon” card can stay on the home screen until the module exists.

## 2. Add a worksheet URL

Add `academy/worksheets/<slug>/index.html` with `<body data-screen="sheet-<id>">` matching `sheetScreen`, and add that HTML file to `rollupOptions.input` in `vite.academy.config.ts`. The page is real HTML so it can be linked and printed. The app renders it from the module. The squisheeacademy.com build uses that same input list.

## 3. Add tests

`src/academy/games/registry.test.ts` already checks that every registered game has four choices and a worksheet row. Add `src/academy/games/<id>.test.ts` for the rules that are special to the game (ranges, clock minutes, fact keys). The launch games’ deeper cases live in `src/academy/questions.test.ts`.

Stars, streaks, and unlocks stay in `src/academy/rewards.ts`. They key off the game id and the skill tags your questions already report.

## Saves

Progress stays in `localStorage` under `squishee-academy-v1`. The schema version is `save.version` (`SAVE_VERSION` in `src/academy/storage.ts`), not the key name. Changing the key would orphan existing families.

A new game does not need a migration. On load, any registered game missing from `levels` or `bestStars` is filled (the grade’s default level, and 0 stars).

Boss fights are generic. `bossForGame` in `src/academy/bosses.ts` builds a boss from the module when you do not add a named one. Add a row there if you want a name, a taunt, and a look. Questions stay inside the grade window from `docs/GRADE_MAP.md` (`playWindow`): a normal boss may step one level up inside that window, and a Gold Crown rematch uses the top of it. A game marked “later” still falls back to its core levels so the fight never climbs past the band.

Bump `SAVE_VERSION` only when the shape or meaning of a field changes. Add one function to `MIGRATIONS` keyed by the old version. It must return the next version. `parseSave` runs the chain. A save newer than this build is played in memory if it still parses, and it is not written back over.

Keep the key different from Squishee Math (`g3-path-v2`). Nothing in the save is sent off the device.
