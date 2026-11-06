# Imagine story backgrounds

## Inventory and coverage

22 books, 140 pages. Round 2 answers Bryan's feedback that water filled the lower stage so characters looked like they were sitting on the lake. Every background now keeps solid ground (grass, dock planks, garden path, rug, floor, or bedroom floor) in the lower half; water appears only behind the stage. Added indoor room, kitchen, and bedroom where the page text calls for mats, snacks/cups, or sleep.

| Book | Page backgrounds (1-based) |
| --- | --- |
| pk-peach-cat | 1–5 meadow |
| pk-frog-hop | 1–5 meadow |
| k-bunny-hat | 1–6 room |
| k-pig-bug | 1–6 garden |
| g1-fox-kite | 1–7 meadow |
| g1-duck-fish | 1–3 shore, 4–6 meadow |
| g2-owl-night | 1–6 night, 7 bedroom |
| g2-bear-boat | 1–6 dock, 7 meadow |
| pk-panda-sun | 1–5 meadow |
| pk-chick-hug | 1–5 meadow |
| k-penguin-cup | 1–6 room |
| k-otter-fish | 1–5 shore, 6 meadow |
| g1-koala-snack | 1–4 kitchen, 5–6 garden |
| g1-hedgehog-hat | 1–7 room |
| g2-panda-moon | 1–6 night, 7 bedroom |
| g2-fox-boat | 1–6 dock, 7 meadow |
| g3-bear-warm | 1–5 dock, 6–7 meadow |
| g3-owl-story | 1–3 night, 4 bedroom, 5–6 night, 7 bedroom |
| g3-fox-kind | 1–7 room |
| g4-owl-habitat | 1–6 night, 7 bedroom |
| g4-duck-water | 1–6 shore, 7 meadow |
| g4-bear-measure | 1–6 dock, 7 meadow |

## Background set (8)

| Id | Ground in lower half | Used for |
| --- | --- | --- |
| meadow | soft grass | outdoor day play, kite, sun, endings after water |
| garden | peach garden path | bug stories, outdoor sun snack |
| night | lavender outdoor ground | moon / night habitat looking up |
| shore | grassy shore | fish and pond pages (water behind) |
| dock | wooden dock planks | boat pages (water behind) |
| room | cream floor + peach rug | hats, mats, cups-on-mat, indoor house play |
| kitchen | cream table/floor | snack and cup kitchen pages |
| bedroom | lavender floor + rug | sleep and cozy night reading |

## Art direction and crop

Grok Imagine, soft matte clay 3D matching squishee lighting. No characters, faces, text, sun, or moon baked into backgrounds. Source images resized to WebP 1200×900. CSS `object-fit: cover; object-position: center bottom` keeps the floor in tall phone crops. Decorative layer behind unchanged squishee/prop art.

## Verification

Local only; nothing pushed, merged, or deployed. See report for tests, builds, and browser sweep.

## Round 2 notes (Bryan t468u)

Lower half of every background is standable ground. Pond/lake art replaced by shore/dock. Indoor room, kitchen, bedroom added where text needs mats, snacks, or sleep.

### Browser sweep

Pixel audit under every pal's feet across all 22 books / 140 pages: 0 characters sitting on water or in the sky.

### Could not fully fix without a second prop stage

- Fish props share the character stage floor, so the fish sits on the shore beside the duck rather than in the midground water. Lifting the fish looked like hovering, so it was left on shore.
- Boat props sit on the dock with the bear (toy boat at the dock). That fits "Bear can see a boat"; pages that say the boat is on the water still show the boat on the dock planks.
- Moon props sit on the night ground next to the owl (same inherited stage), not up in the sky.
