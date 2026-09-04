"""Key + crop classroom measure tools. Not part of the app."""
from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

SRC = Path(r"C:\Users\bryma\.grok\sessions\C%3A%5CUsers%5Cbryma%5Ctimes-tables\01a05d98-bc11-7bd1-bd03-9fbc8ba8e4a5\images")
DST = Path(__file__).resolve().parents[1] / "public" / "measure"
PAD = 8


def is_chroma(r: int, g: int, b: int) -> bool:
    if g <= 45 and r >= 190 and b >= 170 and (r - g) > 140:
        return True
    if r >= 160 and 15 <= g <= 90 and 90 <= b <= 200 and (r - g) >= 80 and (b - g) >= 35:
        return True
    if g < 90 and r > 190 and b > 130 and (r - g) > 100 and (b - g) > 50:
        return True
    if r >= 130 and g <= 90 and (r - g) >= 50 and b >= 30:
        return True
    return False


def is_glass_magenta(r: int, g: int, b: int) -> bool:
    if r >= 95 and g <= 85 and b >= 50 and (r - g) >= 45 and r > b - 10:
        return True
    return False


def fringe(r: int, g: int, b: int) -> bool:
    if g < 110 and r > 140 and (r - g) > 40 and b > 20:
        return True
    if r > 180 and g < 185 and (r - g) > 40 and b > 70:
        return True
    return False


def key_rgba(im: Image.Image, punch_enclosed: bool) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    seen = [[False] * h for _ in range(w)]
    q: deque[tuple[int, int]] = deque()

    def consider(x: int, y: int) -> None:
        if x < 0 or y < 0 or x >= w or y >= h or seen[x][y]:
            return
        r, g, b, a = px[x, y]
        if a < 16 or is_chroma(r, g, b):
            seen[x][y] = True
            q.append((x, y))

    for x in range(w):
        consider(x, 0)
        consider(x, h - 1)
    for y in range(h):
        consider(0, y)
        consider(w - 1, y)

    if punch_enclosed:
        for x in range(w):
            for y in range(h):
                r, g, b, a = px[x, y]
                if is_chroma(r, g, b):
                    consider(x, y)

    while q:
        x, y = q.popleft()
        px[x, y] = (0, 0, 0, 0)
        consider(x - 1, y)
        consider(x + 1, y)
        consider(x, y - 1)
        consider(x, y + 1)

    for _ in range(6):
        choke: list[tuple[int, int]] = []
        for x in range(w):
            for y in range(h):
                r, g, b, a = px[x, y]
                if a < 16:
                    continue
                if not fringe(r, g, b):
                    continue
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] < 16:
                        choke.append((x, y))
                        break
        if not choke:
            break
        for x, y in choke:
            px[x, y] = (0, 0, 0, 0)
    return im


def dilate_enclosed_holes(im: Image.Image, rings: int = 5) -> Image.Image:
    px = im.load()
    w, h = im.size
    bg = [[False] * h for _ in range(w)]
    q: deque[tuple[int, int]] = deque()

    def consider(x: int, y: int) -> None:
        if x < 0 or y < 0 or x >= w or y >= h or bg[x][y]:
            return
        if px[x, y][3] < 16:
            bg[x][y] = True
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

    hole: list[tuple[int, int]] = []
    for x in range(w):
        for y in range(h):
            if px[x, y][3] < 16 and not bg[x][y]:
                hole.append((x, y))
    print(f"  enclosed hole {len(hole)}px")
    for _ in range(rings):
        extra: list[tuple[int, int]] = []
        seen = set(hole)
        for x, y in hole:
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if not (0 <= nx < w and 0 <= ny < h) or (nx, ny) in seen:
                    continue
                r, g, b, a = px[nx, ny]
                if a < 16:
                    continue
                if fringe(r, g, b) or is_chroma(r, g, b) or (g < 90 and r > g + 30):
                    extra.append((nx, ny))
                    seen.add((nx, ny))
        for x, y in extra:
            px[x, y] = (0, 0, 0, 0)
        hole.extend(extra)
        if not extra:
            break
    return im


def flood_interior(im: Image.Image, seed: tuple[int, int] | None = None) -> Image.Image:
    px = im.load()
    w, h = im.size
    if seed is None:
        seed = (w // 2, int(h * 0.45))
    sx, sy = seed
    r, g, b, a = px[sx, sy]

    def pinkish(rr: int, gg: int, bb: int, aa: int) -> bool:
        return aa > 16 and (is_chroma(rr, gg, bb) or is_glass_magenta(rr, gg, bb))

    if a < 16 or not pinkish(r, g, b, a):
        found = None
        for dy in range(-h // 4, h // 4, 4):
            for dx in range(-w // 6, w // 6, 4):
                x, y = sx + dx, sy + dy
                if 0 <= x < w and 0 <= y < h:
                    rr, gg, bb, aa = px[x, y]
                    if pinkish(rr, gg, bb, aa):
                        found = (x, y)
                        break
            if found:
                break
        if not found:
            print(f"  no interior chroma at {seed} sample={(r, g, b, a)}")
            return im
        sx, sy = found
    seen = [[False] * h for _ in range(w)]
    q: deque[tuple[int, int]] = deque()

    def consider(x: int, y: int) -> None:
        if x < 0 or y < 0 or x >= w or y >= h or seen[x][y]:
            return
        r, g, b, a = px[x, y]
        if a > 16 and (is_chroma(r, g, b) or is_glass_magenta(r, g, b)):
            seen[x][y] = True
            q.append((x, y))

    consider(sx, sy)
    n = 0
    while q:
        x, y = q.popleft()
        px[x, y] = (0, 0, 0, 0)
        n += 1
        consider(x - 1, y)
        consider(x + 1, y)
        consider(x, y - 1)
        consider(x, y + 1)
    print(f"  interior flood {n}px from ({sx},{sy})")
    return im


def crop_opaque(im: Image.Image, pad: int = PAD) -> Image.Image:
    px = im.load()
    w, h = im.size
    minx, miny, maxx, maxy = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > 16:
                if x < minx:
                    minx = x
                if y < miny:
                    miny = y
                if x > maxx:
                    maxx = x
                if y > maxy:
                    maxy = y
    if maxx < minx:
        raise SystemExit("fully transparent")
    minx = max(0, minx - pad)
    miny = max(0, miny - pad)
    maxx = min(w, maxx + pad + 1)
    maxy = min(h, maxy + pad + 1)
    return im.crop((minx, miny, maxx, maxy))


def stats(path: Path, im: Image.Image) -> None:
    px = im.load()
    w, h = im.size
    opaque = chroma_left = 0
    minx, miny, maxx, maxy = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 16:
                opaque += 1
                if x < minx:
                    minx = x
                if y < miny:
                    miny = y
                if x > maxx:
                    maxx = x
                if y > maxy:
                    maxy = y
                if is_chroma(r, g, b):
                    chroma_left += 1
    print(
        f"{path.name} {w}x{h} opaque={opaque} chroma_left={chroma_left} "
        f"bbox=({minx},{miny})-({maxx},{maxy})"
    )


def sample_corners(path: Path) -> None:
    im = Image.open(path).convert("RGB")
    w, h = im.size
    px = im.load()
    pts = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, h // 2)]
    print(path.name, w, h, [(p, px[p[0], p[1]]) for p in pts])


def process(src: Path, dest: Path, punch_enclosed: bool, interior: bool) -> None:
    im = Image.open(src)
    sample_corners(src)
    im = key_rgba(im, punch_enclosed=punch_enclosed)
    if interior:
        im = flood_interior(im)
        im = de_magenta(im)
    if punch_enclosed:
        im = dilate_enclosed_holes(im)
    im = crop_opaque(im)
    if dest.name == "scale.png":
        im = crop_scale_body(im)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "PNG")
    stats(dest, im)


def crop_scale_body(im: Image.Image) -> Image.Image:
    """Keep hanging hook stubs + circular gauge; drop the long empty S-hook."""
    px = im.load()
    w, h = im.size
    rows = [sum(1 for x in range(w) if px[x, y][3] > 16) for y in range(h)]
    body_y = next((y for y, n in enumerate(rows) if n > w * 0.4), 0)
    top = max(0, body_y - 70)
    bot = min(h, h - 80)
    cropped = im.crop((0, top, w, bot))
    print(f"  scale body y={top}:{bot} -> {cropped.size[0]}x{cropped.size[1]}")
    return cropped


def crop_dial(im: Image.Image) -> Image.Image:
    px = im.load()
    w, h = im.size
    white: list[tuple[int, int]] = []
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 200 and r > 200 and g > 200 and b > 200 and abs(r - g) < 18:
                white.append((x, y))
    if not white:
        return im
    cy = sum(p[1] for p in white) / len(white)
    import math

    cx = sum(p[0] for p in white) / len(white)
    ds = sorted(math.hypot(p[0] - cx, p[1] - cy) for p in white)
    rad = ds[int(len(ds) * 0.9)]
    top = max(0, int(cy - rad - 130))
    bot = min(h, int(cy + rad + 200))
    cropped = im.crop((0, top, w, bot))
    print(f"  dial crop y={top}:{bot} -> {cropped.size[0]}x{cropped.size[1]}")
    return cropped


def de_magenta(im: Image.Image) -> Image.Image:
    px = im.load()
    w, h = im.size
    n = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 16:
                continue
            if r > g + 20 and b > g - 5 and r > 70:
                yv = int(0.25 * r + 0.55 * g + 0.20 * b)
                px[x, y] = (min(255, yv + 18), min(255, yv + 22), min(255, yv + 26), a)
                n += 1
    print(f"  de-magenta {n}px")
    return im


def main() -> None:
    jobs = [
        (SRC / "2.jpg", DST / "ruler.png", True, False),
        (SRC / "2.jpg", DST / "ruler-cm.png", True, False),
        (SRC / "1.jpg", DST / "scale.png", True, False),
    ]
    for src, dest, punch, interior in jobs:
        print("---", src.name, "->", dest.name)
        process(src, dest, punch, interior)


if __name__ == "__main__":
    main()
