# n / What's hiding

A single-file, offline math page. Home is the Grade 3 path. Chapters is how you see later years. Nothing is sent to a server. No accounts.

Times tables is a family on the Grade 3 path, not the product title.

## Open it

Double-click `index.html`, or:

```bash
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

## GitHub Pages

This repo is one static file at the root. After Pages is set to **main** / **(root)**:

https://bryanralston.github.io/times-tables/

## For parents

Brand-new visit, taps in order:

1. Open the live page. You land on the **Grade 3** path with **Number sense** and **Start** in front. Later grades stay behind **Chapters**. You do not first tap through a wall of closed grades.
2. Tap **Start** on **Number sense**. First card is `6 + n = 10` on a ten-frame. The frame is the product, not Score / Streak / 20.
3. Drag the dots you can see off the frame. The prompt becomes `n = leftover`. Type that leftover. A wrong leftover tilts; the board stays.
4. A correct leftover holds a beat: you still see `n = 4` on the level frame, leftover cells vs the n-box, before the next card. No popup. Score does not jump the beat.
5. Coins are the quiet number in the corner. A correct n **after** the drag earns coins. Miss, skip, or tapping OK before the move earns 0.
6. Back to the path. Spend 12 coins on **Missing addend**. It becomes **Start**.
7. Tap **Start** on **Missing addend**. First card is `8 + n = 12`. Drag the known dots off both pans, then type `n = leftover`. Same isolated-n beat.
8. Spend 12 coins on **Missing subtrahend**. It becomes **Start**.
9. Tap **Start** on **Missing subtrahend**. First card is `12 − n = 8`. Drag the known leftover off both pans, then type `n = 4`.
10. Spend 12 coins on **Times tables facts**. It becomes **Start**, not Coming-forever.
11. Tap **Start** on **Times tables facts**. First card is `2 × n = 8`. Drag the extra group off both pans so one group is left, then type `n = leftover`.

Other grades stay closed chapters. Looks are an optional cheap extra. There is no real-money shop.

## Practice

- **Number sense:** hide and count on a ten-frame, first within 10, then a short stretch toward 20. Drag the dots you can see, then type n.
- **Missing addend:** `8 + n = 12` style, small numbers. Drag the known cluster off both pans, then type n.
- **Missing subtrahend:** `12 − n = 8` style after you spend to open it. Same board: take the known amount from both pans, then type n.
- **Times tables facts:** missing factor on that same board family. Isolate one group, then type n. Not a 7 × 8 keypad quiz.
- Timer and question count sit behind **Round length** on the map, not on the puzzle as the product.
- Progress and coins stay in the browser (`localStorage`)
