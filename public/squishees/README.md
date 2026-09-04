# Squishees

Style refs: `ref-jelly.jpeg` (jellyfish), `ref-berry.jpeg` (strawberry). Generated toys are `*.png` (magenta keyed). Poke clips: `frog-poke.mp4`, `cat-poke.mp4`, `bunny-poke.mp4`. iOS strips: `*-poke-strip.png` + `.json`. Catalog: `catalog.json`.

Use PNGs in the UI. Poke = CSS squash plus optional mp4 (desktop MagentaVideo) or sprite strip (iOS / coarse). Cheer = hop/bounce on buy (`*-cheer.mp4` / `*-cheer-strip`), never the poke flatten; if no cheer clip the tile uses `.unlock-pop` (scale-in). Locked toys are silhouettes until earned.

## Poke clip pipeline

1. Still: keyed PNG in this folder (`scripts/key-squishees.py` flood-fill from edges).
2. Imagine i2v: lock the camera, solid `#FF00FF` background, one poke/squash motion (~6s).
3. Kitchen: `python scripts/anim-kitchen.py --mp4 <clip> --out <dir> --name <id>-poke`
4. Same keyer; center the alpha bbox in a square cell (round toys, not foot-anchored).
5. Writes `<id>-poke-strip.png` + `.json` (`frames`, `fps`, `cell`, `src`) for iOS/coarse `steps()` playback.
6. Optional short muted `*-magenta.mp4` for desktop MagentaVideo — do not overwrite live mp4 until proof is clean.
7. Inspect `scripts/playtest-out/anim-kitchen/<id>/contact.png`, `first.png`, `last.png`.
8. Ship strip+json here when there are no magenta boxes and the toy is centered. Idle stays the PNG.
9. Class iPads skip chroma-key video (`skipPokeVideo`) and play the strip once; other toys are still `poke: null`.
