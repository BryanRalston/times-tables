"""Flood-fill chroma key from image edges. Writes real alpha PNGs."""
from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "public" / "squishees"


def is_key(r: int, g: int, b: int) -> bool:
    return r > 180 and b > 140 and g < 140 and (r - g) > 70 and (b - g) > 40


def is_hole(r: int, g: int, b: int) -> bool:
    return g < 50 and r > 220 and b > 200


def fringe(r: int, g: int, b: int) -> bool:
    return g < 150 and r > 150 and b > 120 and (r - g) > 50 and (b - g) > 30


def key_file(path: Path) -> None:
    im = Image.open(path).convert("RGBA")
    px = im.load()
    w, h = im.size
    seen = [[False] * h for _ in range(w)]
    q: deque[tuple[int, int]] = deque()

    def consider(x: int, y: int) -> None:
        if x < 0 or y < 0 or x >= w or y >= h or seen[x][y]:
            return
        r, g, b, a = px[x, y]
        if a < 16 or is_key(r, g, b) or is_hole(r, g, b):
            seen[x][y] = True
            q.append((x, y))

    for x in range(w):
        consider(x, 0)
        consider(x, h - 1)
    for y in range(h):
        consider(0, y)
        consider(w - 1, y)
    for x in range(w):
        for y in range(h):
            r, g, b, a = px[x, y]
            if a < 16 or is_hole(r, g, b):
                consider(x, y)

    while q:
        x, y = q.popleft()
        px[x, y] = (0, 0, 0, 0)
        consider(x - 1, y)
        consider(x + 1, y)
        consider(x, y - 1)
        consider(x, y + 1)

    for x in range(w):
        for y in range(h):
            r, g, b, a = px[x, y]
            if a > 16 and is_hole(r, g, b):
                px[x, y] = (0, 0, 0, 0)

    for _ in range(2):
        choke: list[tuple[int, int]] = []
        for x in range(w):
            for y in range(h):
                r, g, b, a = px[x, y]
                if a < 16 or not fringe(r, g, b):
                    continue
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] < 16:
                        choke.append((x, y))
                        break
        for x, y in choke:
            px[x, y] = (0, 0, 0, 0)

    im.save(path, "PNG")
    print(f"keyed {path.name} {w}x{h}")


def main() -> None:
    files = sorted(ROOT.glob("*.png"))
    skip = {"catalog.json"}
    for path in files:
        if path.name in skip:
            continue
        key_file(path)


if __name__ == "__main__":
    main()
