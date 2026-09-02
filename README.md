# Squishee Math

A school-year of **LCPS 2026–27 Grade 3** math, mapped to the 2023 Virginia SOLs. Home is today's walk plus the year map. **Lessons** is every unit, every activity — nothing locks.

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

The old single-file leftover page lives in `legacy/`.

## Play

1. First visit: leftover `6 + n = 10` as **Start here**. Then Home and every lesson.
2. **Lessons** lists every unit. Calendar marks **Now**. It does not lock.
3. **Start today's walk** — 8–12 new plus 3–5 review. Grown-ups set **class is on unit N** to change that suggestion only.
4. Sort pictures, then read the graph you made. Take leftover dots you can see. Check is gated until that work is done.

Progress stays on this device.
