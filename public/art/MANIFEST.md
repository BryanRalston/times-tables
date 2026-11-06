# Imagine art — Nix & Rem

Magenta key `#FF00FF`. Use `*.png` in the UI (transparent). JPGs are the Imagine masters.

## Nix (fox) — coach
- `nix-wave.png` — idle / welcome
- `nix-think.png` — working a problem
- `nix-star.png` — earned a star
- `nix-celebrate.png` + `nix-celebrate.mp4` — correct / lesson done
- `nix-oops.png` — miss / try again
- `nix-idle.mp4` — looping wave

## Rem (raccoon) — review buddy
- `rem-idle.png`
- `rem-celebrate.png`

## Path nodes (Duolingo-style)
- `node-open.png` — playable
- `node-locked.png` — not yet

## Lessons world (`public/candy-zones/`)
One continuous quiet map. Keep hop, numbers, locks, glow, and mist as overlays — do not bake them into the PNG. Do not stack zone plates.
- `tall-map.png` — landscape winding boardwalk, meadow → cove → forest, 13 cream pads in path order; first/last ends cropped
- `overlays/cove-boulder.png` — vinyl candy boulder on the 4↔5 water-rise shoulder, not a unit

Older `meadow.png` / `cove.png` / `forest.png` plates are leftovers, not the Lessons world model.

Do not put letters on new art. Chroma the magentas; do not leave hot pink boxes in the layout.

## Academy story / Word Problems objects (Imagine, November 2026)
- `story-props/{hat,mat,sun,bug,cup,kite,fish,log,snack,moon,house,boat}.png`
- `problem-objects/{apple,fish,star,cookie,ball,frog}.png`

512px transparent, matte, faceless objects; no overlays on squishees. All 18 are explicitly copied by `scripts/academy-prop-assets.mjs` in both Academy builds.
Story colors follow **both** catalog and shelf: red hat/kite/fish, yellow sun/cup/snack (golden apple), white full moon, green sailboat. Counting fish stays teal. The frog is rear-facing to avoid a character face.
Imagine masters live outside the website; provenance in `docs/story-props-generation.json`. Key with `scripts/key-story-props.py` (Pillow, NumPy, imagequant); existing edge-flood chroma key, one-pixel choke, 512px Lanczos, high-quality dithered palette. No WebP copies: these small PNGs are the established art format.
