# Imagine story backgrounds

## Inventory and coverage

22 books, 140 pages. Round 3 seats every prop by placement (`ground` | `sky` | `water`) so scenes make physical sense: moon/sun/kite high in the sky, fish/boat on water, everything else on the ground. Water pages use split backgrounds (land/dock on the left for pals, water on the right for props).

| Book | Page backgrounds (1-based) |
| --- | --- |
| pk-peach-cat | 1–5 meadow |
| pk-frog-hop | 1–5 meadow |
| k-bunny-hat | 1–6 room |
| k-pig-bug | 1–6 garden |
| g1-fox-kite | 1–7 meadow |
| g1-duck-fish | 1–3 shore-split, 4–6 meadow |
| g2-owl-night | 1–6 night, 7 bedroom |
| g2-bear-boat | 1–6 dock-split, 7 meadow |
| pk-panda-sun | 1–5 meadow |
| pk-chick-hug | 1–5 meadow |
| k-penguin-cup | 1–6 room |
| k-otter-fish | 1–6 shore-split |
| g1-koala-snack | 1–4 kitchen, 5–6 garden |
| g1-hedgehog-hat | 1–7 room |
| g2-panda-moon | 1–6 night, 7 bedroom |
| g2-fox-boat | 1–6 dock-split, 7 meadow |
| g3-bear-warm | 1–5 dock-split, 6–7 meadow |
| g3-owl-story | 1–3 night, 4 bedroom, 5–6 night, 7 bedroom |
| g3-fox-kind | 1–7 room |
| g4-owl-habitat | 1–6 night, 7 bedroom |
| g4-duck-water | 1–6 shore-split, 7 meadow |
| g4-bear-measure | 1–6 dock-split, 7 meadow |

## Background set (8)

| Id | Zones | Notes |
| --- | --- | --- |
| meadow | ground, sky | outdoor day |
| garden | ground, sky | outdoor bugs / sun |
| night | ground, sky | outdoor moon |
| shore-split | ground, sky, water | left grassy bank, right pond |
| dock-split | ground, sky, water | left dock, right lake |
| room | ground | indoor rugs/mats |
| kitchen | ground | snack/cup |
| bedroom | ground, sky | sleep; moon via window sky |

## Prop placements

| Placement | Props |
| --- | --- |
| sky | sun, moon, kite |
| water | fish, boat |
| ground | hat, mat, bug, cup, log, snack, house |

## Verification

Local only. Prop-zone tests require every page prop to match its background zones. Browser sweep audits pals and props.
