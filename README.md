# Grade 3 Path

A school-year of LCPS 2026–27 math trails. First visit is the leftover `6 + n = 10`. After that, home is a Duolingo-style year map with an IXL-style skill walk that lasts Monday–Friday all year.

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

1. Brand-new visit lands on `6 + n = 10` on a ten-frame. Take the 6. Type 4. A short leftover run, then the year map.
2. **Start today's walk** — 8–12 new items on the current unit plus 3–5 review. Fluency walks all year. Units last weeks; you cannot finish one in a weekend.
3. Nix thinks while you work, hops on a correct leftover, oops on a miss, and celebrates the walk (a 6s clip, not every keystroke). Rem shows on review.
4. Grown-ups (gear) set **class is on unit N** if the room is ahead or behind the calendar.

Progress stays in `localStorage` on this device.
