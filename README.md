# Squishee Math

A school-year of **LCPS 2026–27 Grade 3** math, mapped to the 2023 Virginia SOLs. First visit opens on **Home**. **Lessons** is every unit, every activity — nothing locks.

Times tables are one family on that path (equal groups, then 2s 5s 10s, then 3s 4s 8s 9s), not the product title.

**Nothing leaves this device.** No accounts. Progress stays in `localStorage`.

Toys on the boards are the squishee shelf (frogs, cats, pandas — poke them). Coins and the shop are optional juice.

## For a principal (60 seconds)

- **What it is:** Loudoun 2026–27 Grade 3 year. 2023 SOLs. A kid can see the math, type what they see, Check, go Home.
- **Class is on:** Grown-ups set **unit N** so the daily walk follows the class. Lessons never lock — a child can open Q4 in August.
- **Privacy:** nothing is sent to a server.
- **Advanced (Grade 4) — preview** in Grown-ups is VDOE Grade 4 strands, not an LCPS 2026–27 year map. Don’t demo it as the school’s Grade 4 course. Default path stays Grade 3.
- Add to Home Screen on a class iPad (Safari → Share → Add to Home Screen). Theme color `#f4b3d0`.

## Open it

```bash
npm install
npm run dev
```

Then [http://localhost:5173/times-tables/](http://localhost:5173/times-tables/).

```bash
npm test
npm run build
npm run preview
```

Live: https://bryanralston.github.io/times-tables/

Vite `base` is `/times-tables/`. GitHub Action builds `dist` on push to `main`. Repo: **Settings → Pages → Source: GitHub Actions**.

## Squishee Academy

K–3 games (times tables, add & subtract, telling time, money) live on the same Pages site, at a separate entry:

https://bryanralston.github.io/times-tables/academy/

`npm run build` emits that app into `dist/academy/` after the Squishee Math build. Academy keeps its own `localStorage` key and does not change Squishee Math. Worksheets: `/academy/worksheets/times-tables/`, `/academy/worksheets/add-subtract/`, `/academy/worksheets/telling-time/`, `/academy/worksheets/money/`. Adding a game is one module: [`docs/ADDING_A_GAME.md`](docs/ADDING_A_GAME.md).

The old single-file leftover page lives in `legacy/`.

## Play

1. First visit: **Home** — name, pick Peach / Frog / Cat, then today's walk. Leftover `What's hiding` is a lesson, not a first-visit trap.
2. **Lessons** is the candy map. Calendar marks **Now**. Units never lock.
3. **Start today's walk** — mixed cards from the calendar unit (or the class unit Grown-ups set).
4. Sort pictures, then read the graph you made. Take leftover dots you can see. Check is gated until that work is done.

Feature map: [`docs/FEATURE-MAP.md`](docs/FEATURE-MAP.md).

Progress stays on this device.
