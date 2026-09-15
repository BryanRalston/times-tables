# Squishee Math — feature map

**Product:** Squishee Math  
**Audience:** Loudoun County Grade 3, LCPS 2026–27 year, 2023 Virginia SOLs  
**Live:** https://bryanralston.github.io/times-tables/  
**Repo HEAD this map describes:** `dc0b31d` (2026-09-15)  
**Privacy:** nothing leaves the device. No accounts. Save is `localStorage` key `g3-path-v2`.

This is a map of **what ships**, not a wishlist. Hidden or held surfaces are labeled.

---

## 1. What it is

A year-long Grade 3 math game. The kid sees a **picture of the math**, answers on a keypad or by tapping the board, then hops a squishee around a candy-board Lessons map. Coins buy more toys on Shelf. Times tables are one family on that year, not the product title.

Three kid tabs, always: **Home | Lessons | Shelf**. Gear (PIN `2026`) is Grown-ups.

```
first visit          every day                optional juice
-----------          ---------                --------------
name                 today's walk  ──┐
pick Peach/Frog/Cat  (calendar unit) ├── Check ── coins ── Shelf
                     Lessons hop   ←─┘         presents
                     (earn a die)
```

---

## 2. Surfaces (kid)

| Route | Screen | Job |
| --- | --- | --- |
| `#/` | Home | First-run setup, then the daily door |
| `#/play/daily` | Play | Today's walk (mixed cards from the calendar unit) |
| `#/play/activity/:id` | Play | One lesson, ~10 cards |
| `#/play/welcome` | Play | Old leftover welcome pack (not the first-visit door) |
| `#/lessons` | Lessons | Radial candy map, die, hop, unit chips |
| `#/unit/:id` | Unit | One unit’s activity list + Play |
| `#/shelf` | Shelf | Your piece, commons shop, rares (find-only), dress-up |
| `#/grownup` | Grown-ups | PIN wall, then class/language/save |
| `#/path` | Path | Legacy leftover/friends kiosk (not in the tab bar) |

Chrome on kid screens: wordmark **Squishee Math / GRADE 3**, mute, grown-ups gear, coin chip (opens Shelf), bottom tabs. Play adds a back chevron. No Score / Streak / 1-of-20 in the header.

---

## 3. First run (setup)

Empty save (`setupDone: false`, `squishees: []`).

1. **Name** — “Hi. I'm a Squishee.” / “This is Grade 3 math. We play a few cards — then we hop.” Name is required (max 24). Next disabled until there is a name.
2. **Pick your buddy** — Peach, Frog, or Cat. Tap to select, **Let's go**. Back returns to name.
3. Chosen toy is **owned + equipped**. The other two starters stay on Shelf at 10 coins. The rest of the catalog unlocks the same way as before.

Old saves (`save version < 17`) skip setup, keep Peach, and do not lose toys.

After setup, Home is **Hi, {name}.** / “Finish, then hop on Lessons.” / **Today's walk · {unit} · N cards** / **Start**.

---

## 4. Daily loop

### Today's walk

Built in `src/lib/daily.ts` from the **calendar unit** (or Grown-ups “class is on unit N”).

| Day | Fresh | Review | Fluency | Extra |
| --- | --- | --- | --- | --- |
| School day | 8 | 4 | 2 | — |
| Friday | 8 | 4 | 2 | 4 Friday check |
| Weekend (if extra on) | 4 | 4 | 2 | — |

Review prefers shaky facts; otherwise earlier units. Fluency is × facts for that unit’s tables. Home shows the **honest total card count**, not “6 new · 5 review.”

Leaving mid-walk and coming back **does not re-roll** the pack (attempt is the current play count, not +1).

### Play answering

- **Boards** render the model (`src/components/models.tsx`).
- **Check** / choice chips / compare / clock / money tray.
- Interact gates (must tap the picture first): leftover ten-frame, graph sort, coin count.
- Wrong: shake + “Try again.” After **2 misses**, auto-reveal the answer (~1.4s) then next.
- Correct: celebration, star, hold (~0.8s), next card.
- Skip is available except while a leftover/graph/money gate is still closed.
- Progress: `n / total` + bar.
- End of walk: **Nice walk** summary (streak, coins). Optional **minigame**, then Lessons **Roll**.

### Coins from a round

`5 + correct + (perfect ? 3 : ≥70% ? 1 : 0)` — see `coinsForResult`.

Stars on an activity: 1–3 from that play. Grown-ups see practice stats (today, shaky facts, bests). Kid header does not show them.

---

## 5. Curriculum (Grade 3)

13 units. **Nothing locks.** Calendar marks **Now** on Lessons. A child can open Unit 13 in August.

| # | Kid short | Teacher title (English) | SOL | Activities |
| --- | --- | --- | --- | --- |
| 1 | Graphs | Building a Mathematical Community Through the Data Cycle | 3.NS.1, 3.NS.4, 3.CE.1, 3.PS.1 | What's hiding, Number friends, Count the coins, Tally and graph, Pictograph key of 1 |
| 2 | Place value | Place Value / Addition and Subtraction Part 1 | 3.NS.1–2 | Place and value, Word form, Compose and decompose, Tens you can see, Compare, Put in order |
| 3 | Groups | Multiplication and Division Part 1 — Meaning with Models | 3.CE.2 | Equal groups, Jumps on a line, Arrays, Missing factor, Share equally, Related facts |
| 4 | Shapes | Geometry | 3.MG.4 | Name the shape, Count the sides, Polygon or not, Attributes, Combine polygons, Subdivide |
| 5 | Fractions | Fractions Part 1 | 3.NS.3 | Name, number line, unit fractions, leftover pieces, wholes and leftover, of a set |
| 6 | Times 2s 5s | Foundational ×÷ facts | 3.CE.2, 3.PS.1 | Groups 0/1/2/5/10, easy arrays, missing factor, skip count, tally with key of 2 |
| 7 | Word problems | Addition and Subtraction Part 2 | 3.CE.1, 3.PFA.1, 3.PS.1 | Join, take-from, how many more, estimate, exact to 1,000, +/− patterns, bar graph |
| 8 | Measure | Measurement, perimeter, area | 3.MG.1–2 | Ruler, weight/mass, liquid volume, pick the unit, cover the grid, around the shape, missing side |
| 9 | Times 3s 4s 8s | Facts 3, 4, 8, 9 | 3.CE.2 | Groups, arrays, missing factor, related facts, mixed ×÷ |
| 10 | Same amount | Fractions Part 2 | 3.NS.3 | Equivalent, which is more, near 0/½/1, order, compare on a line |
| 11 | Clock & coins | Time and money | 3.MG.3, 3.NS.4 | Time to the minute, match clocks, one hour later, count to $5, compare, make this amount, make change |
| 12 | Mix | ×÷ fluency | 3.CE.2 | 6s and 7s, mixed 0–10, missing factor mix, related mix, array mix |
| 13 | Challenge | Moving Forward and Digging Deeper | mix | Two-step stories, add/subtract mix, patterns, measure again, area stories |

**75 Grade 3 activities.** Each is a visible model board, not a title over a keypad.

Year window: **2026-08-17 → 2027-06-11**, LCPS student holidays in `src/lib/calendar.ts`.

---

## 6. Board models (what the kid sees)

| Kind | Where | What the hands do |
| --- | --- | --- |
| Ten-frame / leftover | u1 leftover, friends, welcome | Tap known dots; type hiding `?` |
| Place-value chart | u2 place, word, expanded | Read place / value / tens-and-ones |
| Build | u2-build | Compose a number more than one way |
| Compare / order | u2, u10 | `<` `=` `>` or tap numbers in order |
| Equal groups | u3, u6, u9, u12 | Isolate a group / share |
| Number-line jumps | u3-jumps | Equal hops |
| Array | u3, u6, u9, u12 | Rows × columns |
| Related facts | family activities | One model, four facts |
| Geometry | u4 | Name, sides, polygon, combine/subdivide (VA triangle/quad set) |
| Fraction bars / line / set | u5, u10 | Name, leftover, mixed, equivalent, benchmark |
| Graph / tally | u1, u6, u7 | Sort pictures, then read the graph they made |
| Word stories | u7, u13 | Join / take / compare / two-step with a model |
| Compute | u7, u13 | Estimate or exact to 1,000 |
| Pattern | u6 skip, u7, u13 | Extend +/− (and × skip) |
| Ruler / scale / beaker | u8, u13 | Nearest half or whole; pick the unit |
| Area / perimeter | u8, u13 | Unit squares; missing side |
| Clock | u11 | Read / set / +1 hour |
| Money | u1 coins, u11 | Count, compare, make amount, change — cents keypad, decimal on money |

Input modes: keypad (optional `.`), choice, compare, order, fraction slash, clock hands, money tray.

---

## 7. Lessons map

Radial candy JPEG (`candy-zones/radial-web-locked.jpg`). **107 hop pads.** Grass is not hoppable. Portals sit on the **floor of the gate**, not the swirl.

| Mechanic | Behavior |
| --- | --- |
| Die | Fair 1–3. Tumble ~720ms, then steps. Caption stays “Roll the die” until the tumble ends. |
| Credits | One banked roll per Grade 3 lesson or finished daily walk, plus gift rolls, minus spent turns |
| 0 rolls | Dock **Finish a walk to roll** + **Start** (starts today's walk). No grey stamps on every tile |
| Hop | One adjacent painted tile. Glows only on legal next pads. Fat-finger snap ~44px |
| Portals | 16 warps, opposite pairs. **Portal!** pins on the gate you entered. Inner N↔S, E↔W, mid-spoke, outer rim |
| Presents | 4 live boxes. Hop on to unwrap. Mix: coins 40% / extra rolls 40% / common 15% / rare 5%. Respawn |
| Unit chips | 1–13 kid names. **Now** is calendar. Chip opens the unit list (not the daily walk) |
| Phone | Cover + pinch/pan. Hopper/presents wait until the JPEG has real pixels |
| Test mode | Grown-ups only. Free adjacent hops. Never shown as a kid badge |

Die is 1–3. Hopper is the equipped starter (or later shop/find toy), with dress-up if worn.

---

## 8. Shelf / economy

| Item | How you get it | Price |
| --- | --- | --- |
| Starter (Peach, Frog, Cat) | First-run pick (one free). Others buy | 10 coins |
| Other commons (41 total commons) | Buy, or lucky present | 10 |
| Rares (20) | Find on the map only. No Buy | catalog 50 (not sold) |
| Party hat / scarf / bow / shades | Buy; fitted composite per face | 6 / 5 / 4 / 8 |

Unowned commons = mystery silhouette (`???` + price). Unowned rares = gift box, “Find on Lessons.” Owned = full art, poke-to-squish, **Use** / **Playing**. Buy auto-equips. Dress-up previews the Playing hopper, not a hardcoded Peach.

Poke strips wired for frog, cat, bunny. Cheer strips exist for every catalog face.

`#/path` still sells **Number friends** behind 12 coins (legacy kiosk, not in the tab bar).

---

## 9. Grown-ups (PIN `2026`)

Not on kid chrome except the gear.

- Language: English / Español / Português (Brasil)
- Who is playing + add another kid (separate local profiles)
- Name on path (same 24-char name as setup)
- **Class is on unit N** (or follow calendar)
- Weekend extra walks
- Sounds
- Practice summary (today, shaky, bests)
- Export / import save JSON (`grade-3-path.json`)
- Reset this device
- **Test mode** (commented “remove before publish”): +1 roll, +10 coins, clear steps, Grade 4 preview toggle

Grade 4 is **held** unless Test mode is on. 15 preview units, VDOE strands, not an LCPS 2026–27 Grade 4 year map.

---

## 10. Persist, install, sound

- Save version **17**. One device, optional multiple learners in the same JSON.
- Mute is a header toggle; first pointerdown unlocks Web Audio (correct / wrong / star / dice tones).
- PWA: `manifest.webmanifest`, theme `#f4b3d0`, Add to Home Screen.
- GitHub Pages from `main` via Actions (`dist/`). Base path `/times-tables/`.

---

## 11. Minigames (after a walk)

Optional. Skip exists. Kinds: match pairs, who hid, poke the target, peek-a-boo, twins, hop-the-glow. Uses owned toys, or frog if the shelf is empty.

---

## 12. Explicitly not in the product

- Cloud accounts, login, leaderboards
- Lives, hearts, XP walls, 60-second sprints
- Leftover-as-the-only first-visit door (setup is Home; leftover is a lesson)
- Replacing the candy JPEG world
- Shipping Grade 4 as the default path
- Showing “Test mode” on kid surfaces
- Catalog dump of every SOL on Home

---

## 13. Honest thin spots

- Combine/subdivide geometry is the VA triangle/quad set, not every textbook pair.
- Phone character wallpaper is parked (plain pink) — Safari image-layer issues.
- `#/path` is a leftover surface; Home no longer links **All units**.
- `#/play/welcome` still builds a leftover pack if hashed; first visit does not send anyone there.
- Interact gates do not cover every `needsInteract` kind (perimeter / fraction leftover / some compute still allow Check without a board tap).
- Only frog / cat / bunny have poke video strips; other toys still cheer and poke as stills.

---

## 14. File map (where to change it)

| Feature | Primary files |
| --- | --- |
| Routes | `src/lib/nav.ts`, `src/app.tsx` |
| Setup + Home | `src/pages/home.tsx` |
| Play | `src/pages/play.tsx`, `src/lib/questions.ts`, `src/lib/leftover.ts` |
| Boards | `src/components/models.tsx` |
| Daily walk | `src/lib/daily.ts`, `src/lib/calendar.ts` |
| Units / SOLs | `src/lib/curriculum.ts`, `src/lib/labels.ts` |
| Lessons map | `src/pages/lessons.tsx`, `src/components/candy-path.tsx`, `src/lib/radial-web.ts` |
| Presents | `src/lib/presents.ts` |
| Shelf | `src/pages/shelf.tsx`, `src/lib/squishees.ts`, `src/lib/cosmetics.ts` |
| Save | `src/lib/progress.ts` |
| Grown-ups | `src/pages/grownup.tsx` |
| Copy | `src/lib/i18n.ts` |
| Test mode | `src/lib/test-mode.ts` |
