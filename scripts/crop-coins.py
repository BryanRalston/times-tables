"""Crop coin PNGs so the metal disc fills ~96% of a square canvas.

Does not touch dollar.png or five.png. Does not invent new coins.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MONEY = ROOT / "public" / "money"
COINS = ("dime", "penny", "nickel", "quarter")
TARGET_FILL = 0.96
# US-relative box sizes from src/components/models.tsx (do not invert).
QUARTER_PX = 56
COIN_RATIO = {"dime": 0.74, "penny": 0.79, "nickel": 0.87, "quarter": 1.0}
BLACK = 18


def is_disc(r: int, g: int, b: int, a: int) -> bool:
    if a < 16:
        return False
    return r > BLACK or g > BLACK or b > BLACK


def disc_bbox(im: Image.Image) -> tuple[int, int, int, int]:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    minx, miny, maxx, maxy = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_disc(r, g, b, a):
                if x < minx:
                    minx = x
                if y < miny:
                    miny = y
                if x > maxx:
                    maxx = x
                if y > maxy:
                    maxy = y
    if maxx < 0:
        raise SystemExit("no disc pixels found")
    return minx, miny, maxx, maxy


def fill_of(im: Image.Image) -> tuple[float, int, int, int]:
    minx, miny, maxx, maxy = disc_bbox(im)
    dw, dh = maxx - minx + 1, maxy - miny + 1
    d = max(dw, dh)
    side = max(im.size)
    return d / side, d, im.size[0], im.size[1]


def recrop(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    minx, miny, maxx, maxy = disc_bbox(im)
    cropped = im.crop((minx, miny, maxx + 1, maxy + 1))
    dw, dh = cropped.size
    d = max(dw, dh)
    canvas = max(d, round(d / TARGET_FILL))
    out = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    out.paste(cropped, ((canvas - dw) // 2, (canvas - dh) // 2), cropped)
    return out


def box_width(name: str) -> int:
    return round(QUARTER_PX * COIN_RATIO[name])


def main() -> int:
    before: dict[str, tuple[float, int, int, int]] = {}
    after: dict[str, tuple[float, int, int, int]] = {}
    print("before")
    for name in COINS:
        path = MONEY / f"{name}.png"
        im = Image.open(path)
        fill, d, w, h = fill_of(im)
        vis = box_width(name) * fill
        before[name] = (fill, d, w, h)
        print(f"  {name}: canvas={w}x{h} disc={d} fill={fill:.4f} visual={vis:.2f}")
        out = recrop(im)
        out.save(path, "PNG", optimize=True)
        fill2, d2, w2, h2 = fill_of(out)
        vis2 = box_width(name) * fill2
        after[name] = (fill2, d2, w2, h2)
        print(f"  {name} after: canvas={w2}x{h2} disc={d2} fill={fill2:.4f} visual={vis2:.2f}")

    print("after visual order (box.width * fill)")
    order = sorted(COINS, key=lambda n: box_width(n) * after[n][0], reverse=True)
    for name in order:
        print(f"  {name}: {box_width(name) * after[name][0]:.2f}")
    q, n, p, di = (box_width(n) * after[n][0] for n in ("quarter", "nickel", "penny", "dime"))
    if not (q > n > p > di):
        raise SystemExit(f"visual size order failed: quarter={q:.2f} nickel={n:.2f} penny={p:.2f} dime={di:.2f}")
    print("order ok: quarter > nickel > penny > dime")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
