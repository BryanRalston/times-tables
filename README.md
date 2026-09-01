# Grade 3 Path

A school-year of LCPS 2026–27 math trails. Home is today's walk plus a year map. **Lessons** is the menu: every unit, every activity, nothing locked. Leftover `6 + n = 10` is the loud first lesson, not a trap.

Times tables are a family on that path (equal groups, then 2s 5s 10s, then 3s 4s 8s 9s), not the product title. Nothing is sent to a server. No accounts.

Nix (fox) coaches. Rem (raccoon) sits on review.

## Open it

```bash
npm install
npm run dev
```

Then open [http://localhost:5173/times-tables/](http://localhost:5173/times-tables/).

```bash
npm test
npm run build
npm run preview
```

## GitHub Pages

Live:

https://bryanralston.github.io/times-tables/

The Vite `base` is `/times-tables/`. A GitHub Action builds `dist` on push to `main` and deploys it. In the repo: **Settings → Pages → Source: GitHub Actions**.

The old single-file leftover page lives in `legacy/`.

## Play

1. Home has **Home** and **Lessons**. A first visit offers leftover `6 + n = 10` as **Start here**. You can leave for Home after any card.
2. **Lessons** lists every unit and activity. Calendar marks **Now**. It does not lock Q4 in August.
3. **Start today's walk** — 8–12 new plus 3–5 review on the suggested unit. Grown-ups set **class is on unit N** to change that suggestion only.
4. Nix thinks while you work, hops on a correct leftover, oops on a miss, and celebrates the walk. Rem shows on review.

Progress stays in `localStorage` on this device.
