"""Flood-fill chroma key from image edges. Writes real alpha PNGs."""
from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "public" / "squishees"
COS = Path(__file__).resolve().parents[1] / "public" / "cosmetics"


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


def key_image(im: Image.Image, strict: bool = False) -> Image.Image:
    """Flood-fill chroma from edges. Same keyer as key_file; in-memory RGBA."""
    im = im.convert("RGBA").copy()
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

    return im


def is_white(r: int, g: int, b: int) -> bool:
    """Studio white and warm cream drop-shadow. Leaves peach/hat color."""
    sat = max(r, g, b) - min(r, g, b)
    luma = 0.299 * r + 0.587 * g + 0.114 * b
    if luma >= 220 and sat <= 40:
        return True
    if luma >= 188 and sat <= 28:
        return True
    return False


def key_white_image(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA").copy()
    px = im.load()
    w, h = im.size
    seen = [[False] * h for _ in range(w)]
    q: deque[tuple[int, int]] = deque()

    def consider(x: int, y: int) -> None:
        if x < 0 or y < 0 or x >= w or y >= h or seen[x][y]:
            return
        r, g, b, a = px[x, y]
        if a < 16 or is_white(r, g, b):
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
        px[x, y] = (0, 0, 0, 0)
        consider(x - 1, y)
        consider(x + 1, y)
        consider(x, y - 1)
        consider(x, y + 1)

    for _ in range(2):
        choke: list[tuple[int, int]] = []
        for x in range(w):
            for y in range(h):
                r, g, b, a = px[x, y]
                if a < 16 or not is_white(r, g, b):
                    continue
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] < 16:
                        choke.append((x, y))
                        break
        for x, y in choke:
            px[x, y] = (0, 0, 0, 0)
    return im


def key_file(path: Path, strict: bool = False) -> None:
    im = key_image(Image.open(path), strict=strict)
    im.save(path, "PNG")
    w, h = im.size
    print(f"keyed {path.name} {w}x{h}{' strict' if strict else ''}")


SUFFIXES = ("-party-hat", "-scarf", "-bow", "-shades")


def composite_base_id(name: str) -> str:
    stem = name[:-4] if name.endswith(".png") else name
    for suffix in SUFFIXES:
        if stem.endswith(suffix):
            return stem[: -len(suffix)]
    return ""


def is_studio_white(r: int, g: int, b: int) -> bool:
    sat = max(r, g, b) - min(r, g, b)
    luma = 0.299 * r + 0.587 * g + 0.114 * b
    return luma >= 242 and sat <= 16


def key_composite_with_base(comp: Image.Image, base: Image.Image) -> Image.Image:
    """Punch studio white. Keep the bare toy (even pale highlights) and colorful clothes."""
    import numpy as np

    c = comp.convert("RGBA")
    b = base.convert("RGBA").resize(c.size, Image.Resampling.LANCZOS)
    arr = np.array(c)
    protect = np.array(b.split()[3]) > 40
    r, g, bch, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    mx = np.maximum(np.maximum(r, g), bch)
    mn = np.minimum(np.minimum(r, g), bch)
    luma = 0.299 * r + 0.587 * g + 0.114 * bch
    sat = mx - mn
    studio = ((luma >= 235) & (sat <= 22)) | ((luma >= 205) & (sat <= 18))
    punch = (studio | (a < 16)) & ~protect
    arr[punch] = (0, 0, 0, 0)
    return Image.fromarray(arr, "RGBA")


def key_white_file(path: Path) -> None:
    base_id = composite_base_id(path.name)
    base_path = ROOT / f"{base_id}.png"
    im = Image.open(path)
    if base_id and base_path.exists():
        im = key_composite_with_base(im, Image.open(base_path))
    else:
        im = key_white_image(im.convert("RGBA"))
    im.save(path, "PNG", optimize=True, compress_level=9)
    w, h = im.size
    print(f"white-keyed {path.name} {w}x{h}")


def main() -> None:
    import sys

    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    force_strict = "--strict" in sys.argv[1:]
    cosmetics = "--cosmetics" in sys.argv[1:]
    files = []
    if cosmetics and not args:
        files = sorted(COS.glob("*.png"))
        for path in files:
            if path.exists():
                key_white_file(path)
        return
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
        if path.parent == COS or cosmetics:
            key_white_file(path)
        else:
            key_file(path, strict=force_strict or path.name in STRICT_FILES)


if __name__ == "__main__":
    main()
