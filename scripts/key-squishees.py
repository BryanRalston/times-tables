"""Flood-fill chroma key from image edges. Writes real alpha PNGs."""
from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "public" / "squishees"


STRICT_FILES = {"aurora-jelly.png", "crystal-axolotl.png", "rainbow-cupcake.png", "donut.png"}


def is_key(r: int, g: int, b: int) -> bool:
    return r > 180 and b > 140 and g < 140 and (r - g) > 70 and (b - g) > 40


def is_strict_key(r: int, g: int, b: int) -> bool:
    return g <= 32 and r >= 210 and b >= 190 and (r - g) > 160 and (b - g) > 140


def is_chroma_bg(r: int, g: int, b: int) -> bool:
    if is_strict_key(r, g, b):
        return True
    return g <= 45 and r >= 190 and b >= 70 and (r - g) > 130


def is_hole(r: int, g: int, b: int) -> bool:
    return g < 50 and r > 220 and b > 200


def fringe(r: int, g: int, b: int) -> bool:
    return g < 150 and r > 150 and b > 120 and (r - g) > 50 and (b - g) > 30


def is_strict_fringe(r: int, g: int, b: int) -> bool:
    return g < 80 and r > 190 and b > 150 and (r - g) > 100 and (b - g) > 70


def key_file(path: Path, strict: bool = False) -> None:
    im = Image.open(path).convert("RGBA")
    px = im.load()
    w, h = im.size
    seen = [[False] * h for _ in range(w)]
    q: deque[tuple[int, int]] = deque()
    keyed = is_chroma_bg if strict else is_key

    def consider(x: int, y: int) -> None:
        if x < 0 or y < 0 or x >= w or y >= h or seen[x][y]:
            return
        r, g, b, a = px[x, y]
        hole = False if strict else is_hole(r, g, b)
        if a < 16 or keyed(r, g, b) or hole:
            seen[x][y] = True
            q.append((x, y))

    for x in range(w):
        consider(x, 0)
        consider(x, h - 1)
    for y in range(h):
        consider(0, y)
        consider(w - 1, y)
    if not strict:
        for x in range(w):
            for y in range(h):
                r, g, b, a = px[x, y]
                if a < 16 or is_hole(r, g, b):
                    consider(x, y)
    else:
        for x in range(w):
            for y in range(h):
                r, g, b, a = px[x, y]
                if keyed(r, g, b):
                    consider(x, y)

    while q:
        x, y = q.popleft()
        px[x, y] = (0, 0, 0, 0)
        consider(x - 1, y)
        consider(x + 1, y)
        consider(x, y - 1)
        consider(x, y + 1)

    if not strict:
        for x in range(w):
            for y in range(h):
                r, g, b, a = px[x, y]
                if a > 16 and is_hole(r, g, b):
                    px[x, y] = (0, 0, 0, 0)

    if strict:
        for x in range(w):
            for y in range(h):
                r, g, b, a = px[x, y]
                if a > 16 and is_strict_fringe(r, g, b):
                    px[x, y] = (0, 0, 0, 0)

    for _ in range(1 if strict else 2):
        choke: list[tuple[int, int]] = []
        for x in range(w):
            for y in range(h):
                r, g, b, a = px[x, y]
                if a < 16:
                    continue
                near = is_strict_fringe(r, g, b) if strict else fringe(r, g, b)
                if not near:
                    continue
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] < 16:
                        choke.append((x, y))
                        break
        for x, y in choke:
            px[x, y] = (0, 0, 0, 0)

    im.save(path, "PNG")
    print(f"keyed {path.name} {w}x{h}{' strict' if strict else ''}")


def main() -> None:
    import sys

    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    force_strict = "--strict" in sys.argv[1:]
    files = []
    if args:
        for n in args:
            p = Path(n)
            files.append(p if p.is_absolute() or p.parent != Path(".") else ROOT / n)
    else:
        files = sorted(ROOT.glob("*.png"))
    skip = {"catalog.json"}
    for path in files:
        if path.name in skip or not path.exists():
            continue
        key_file(path, strict=force_strict or path.name in STRICT_FILES)


if __name__ == "__main__":
    main()
