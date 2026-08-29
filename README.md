# n / What's hiding

A single-file, offline math page. Home is a trail of grade chapters. Nothing is sent to a server. No accounts.

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

1. Open the live page. You should see **n / What's hiding** and a list of grade chapters, not a wall of topic chips.
2. Tap **Grade 3**.
3. Tap **Start** on **Missing addend**.
4. Drag the known dots (the matching 8s) off both pans. The prompt becomes `n = leftover`. Type that leftover. A wrong leftover tilts the balance; try again.
5. Coins are the quiet number in the corner. A correct n **after** the drag earns coins. Miss, skip, or tapping OK before the move earns 0.
6. Spend coins on the trail to open the next family or grade chapter. Those later nodes stay locked as content for now — paying does not start a new quiz. Looks are an optional cheap extra. There is no real-money shop.

First visit: Grade 3 is open. Missing addend is the only playable puzzle. Number sense, missing subtrahend, and times tables facts sit on the Grade 3 path but stay locked. Other grades are closed chapters.

## Practice

- **Missing addend:** `8 + n = 12` style, small numbers. Drag the known cluster off both pans, then type n.
- Timer and question count sit behind **Round length** on the map, not on the puzzle as the product.
- Progress and coins stay in the browser (`localStorage`)
