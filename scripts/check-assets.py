"""Fail CI if squishee/money PNGs are missing, magenta, or two-faced.

Donut has a real doughnut hole — listed in ALLOW_INTERIOR_HOLES.
"""
from __future__ import annotations

import re
import sys
from collections import deque
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.stderr.write("check-assets needs Pillow (pip install pillow)\n")
    raise

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
SQUISH = PUBLIC / "squishees"
MONEY = PUBLIC / "money"
SRC = ROOT / "src" / "lib" / "squishees.ts"

# Intentional transparent interiors, not a keying miss.
ALLOW_INTERIOR_HOLES = {
    "donut.png",  # doughnut hole
    "pig.png",  # tail curl
    "crystal-axolotl.png",  # gaps between gill frills
    "aurora-jelly.png",  # tentacle spirals
}

MONEY_FILES = ["penny.png", "nickel.png", "dime.png", "quarter.png", "dollar.png", "five.png"]


def squishee_files() -> list[str]:
    text = SRC.read_text(encoding="utf-8")
    return re.findall(r'file:\s*"([^"]+\.png)"', text)


def is_magenta(r: int, g: int, b: int, a: int) -> bool:
    return a > 16 and g < 80 and r > 190 and b > 150 and (r - g) > 100 and (b - g) > 70


def flood_from_edges(px, w: int, h: int) -> list[list[bool]]:
    seen = [[False] * h for _ in range(w)]
    q: deque[tuple[int, int]] = deque()

    def consider(x: int, y: int) -> None:
        if x < 0 or y < 0 or x >= w or y >= h or seen[x][y]:
            return
        a = px[x, y][3]
        if a < 16:
            seen[x][y] = True
            q.append((x, y))

    for x in range(w):
        consider(x, 0)
        consider(x, h - 1)
    for y in range(h):
        consider(0, y)
        consider(w - 1, y)
    while q:
        x, y = q.popleft()
        consider(x - 1, y)
        consider(x + 1, y)
        consider(x, y - 1)
        consider(x, y + 1)
    return seen


def interior_holes(px, w: int, h: int, edge: list[list[bool]]) -> tuple[int, bool]:
    n = 0
    sx = sy = 0
    for y in range(h):
        for x in range(w):
            if px[x, y][3] < 16 and not edge[x][y]:
                n += 1
                sx += x
                sy += y
    if n < 800:
        return n, False
    cx, cy = sx / n, sy / n
    central = abs(cx - w / 2) < w * 0.18 and abs(cy - h / 2) < h * 0.18
    return n, central


def magenta_count(px, w: int, h: int) -> int:
    n = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_magenta(r, g, b, a):
                n += 1
    return n


def dark_components(px, w: int, h: int) -> list[tuple[int, int, int]]:
    """(cx, cy, area) of compact dark blobs that look like kawaii eyes."""
    seen = [[False] * h for _ in range(w)]
    blobs: list[tuple[int, int, int]] = []

    def dark(x: int, y: int) -> bool:
        r, g, b, a = px[x, y]
        return a > 180 and r < 55 and g < 55 and b < 55

    for y in range(h):
        for x in range(w):
            if seen[x][y] or not dark(x, y):
                continue
            q: deque[tuple[int, int]] = deque([(x, y)])
            seen[x][y] = True
            cells: list[tuple[int, int]] = []
            while q:
                cx, cy = q.popleft()
                cells.append((cx, cy))
                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[nx][ny] and dark(nx, ny):
                        seen[nx][ny] = True
                        q.append((nx, ny))
            area = len(cells)
            if area < 80 or area > 14000:
                continue
            xs = [p[0] for p in cells]
            ys = [p[1] for p in cells]
            bw = max(xs) - min(xs) + 1
            bh = max(ys) - min(ys) + 1
            if bw < 8 or bh < 8:
                continue
            aspect = bw / bh
            if aspect < 0.55 or aspect > 1.8:
                continue
            fill = area / (bw * bh)
            if fill < 0.45:
                continue
            blobs.append((sum(xs) // area, sum(ys) // area, area))
    return blobs


def two_faces(blobs: list[tuple[int, int, int]], w: int, h: int) -> bool:
    """Two vertically separated kawaii eye-pairs (donut had a face above and below the hole)."""
    if len(blobs) < 4:
        return False
    blobs = sorted(blobs, key=lambda b: (b[1], b[0]))
    used = [False] * len(blobs)
    pairs: list[tuple[float, float, float, float]] = []  # mid_y, mid_x, dx, area
    for i, a in enumerate(blobs):
        if used[i]:
            continue
        best = None
        for j in range(i + 1, len(blobs)):
            if used[j]:
                continue
            b = blobs[j]
            dy = abs(a[1] - b[1])
            dx = abs(a[0] - b[0])
            ar = min(a[2], b[2]) / max(a[2], b[2])
            if ar < 0.55:
                continue
            if dy > h * 0.07:
                continue
            if dx < w * 0.1 or dx > w * 0.42:
                continue
            best = j
            break
        if best is None:
            continue
        used[i] = used[best] = True
        b = blobs[best]
        pairs.append(((a[1] + b[1]) / 2, (a[0] + b[0]) / 2, abs(a[0] - b[0]), (a[2] + b[2]) / 2))
    if len(pairs) < 2:
        return False
    pairs.sort(key=lambda p: p[0])
    for i in range(len(pairs)):
        for j in range(i + 1, len(pairs)):
            gap = pairs[j][0] - pairs[i][0]
            if gap < h * 0.14:
                continue
            dx_ratio = min(pairs[i][2], pairs[j][2]) / max(pairs[i][2], pairs[j][2])
            if dx_ratio < 0.55:
                continue
            return True
    return False


def main() -> int:
    fails: list[str] = []
    files = squishee_files()
    if len(files) < 10:
        fails.append(f"parsed only {len(files)} squishee files from {SRC}")
    for name in files:
        path = SQUISH / name
        if not path.exists():
            fails.append(f"missing squishee {name}")
            continue
        im = Image.open(path).convert("RGBA")
        px = im.load()
        w, h = im.size
        edge = flood_from_edges(px, w, h)
        holes, central = interior_holes(px, w, h, edge)
        if holes > 40 and name not in ALLOW_INTERIOR_HOLES:
            fails.append(f"{name}: interior hole {holes}px")
        mag = magenta_count(px, w, h)
        if mag > 8:
            fails.append(f"{name}: leftover magenta {mag}px")
        if central:
            blobs = dark_components(px, w, h)
            if two_faces(blobs, w, h):
                fails.append(f"{name}: two face clusters ({len(blobs)} dark blobs)")

    beaker = PUBLIC / "measure" / "beaker.png"
    if not beaker.exists():
        fails.append("missing measure/beaker.png")
    else:
        im = Image.open(beaker).convert("RGBA")
        px = im.load()
        bw, bh = im.size
        minx, miny, maxx, maxy = bw, bh, 0, 0
        for y in range(bh):
            for x in range(bw):
                if px[x, y][3] > 16:
                    if x < minx:
                        minx = x
                    if y < miny:
                        miny = y
                    if x > maxx:
                        maxx = x
                    if y > maxy:
                        maxy = y
        cx, cy = (minx + maxx) // 2, (miny + maxy) // 2
        # Tube mid-height, not the hex base.
        ty = miny + int((maxy - miny) * 0.4)
        if px[cx, cy][3] < 16 or px[cx, ty][3] < 16:
            fails.append("beaker.png: cylinder center is transparent (interior keyed out)")
        mag = magenta_count(px, bw, bh)
        if mag > 8:
            fails.append(f"beaker.png: leftover magenta {mag}px")

    for name in MONEY_FILES:
        path = MONEY / name
        if not path.exists():
            fails.append(f"missing money {name}")
            continue
        im = Image.open(path).convert("RGBA")
        px = im.load()
        w, h = im.size
        mag = magenta_count(px, w, h)
        if mag > 8:
            fails.append(f"money/{name}: leftover magenta {mag}px")

    if fails:
        print("check-assets FAIL")
        for f in fails:
            print(" ", f)
        return 1
    print(f"check-assets OK {len(files)} squishees {len(MONEY_FILES)} money")
    return 0


if __name__ == "__main__":
    sys.exit(main())
