# Vinyl mystery presents (Grok-owned art)

Keyed transparent PNGs for Lessons hop-on boxes.

| file | use |
|---|---|
| `present-closed.png` | Closed mystery box on the map. Same sprite for every pad. No rarity/name leak. |
| `present-open.png` | Unwrap beat only. Empty interior. |
| `coin-pile.png` | Coin-reward reveal (~10 gold toy coins). |

Wire as `<img>` / MagentaImg `object-contain`. Background is already alpha, not magenta.

Bob + soft pulsating glow stay CSS. Closed boxes must look identical across common / rare / coin pads.
