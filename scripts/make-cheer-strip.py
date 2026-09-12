"""Build a 36-frame hop cheer strip from a still squishee PNG."""
from __future__ import annotations

import math
import sys
from pathlib import Path

from PIL import Image

CELL = 384
FRAMES = 36


def hop_scale(i: int) -> tuple[float, float]:
    t = i / (FRAMES - 1)
    bounce = math.sin(t * math.pi)
    sy = 1.0 - 0.12 * bounce
    sx = 1.0 + 0.08 * bounce
    return sx, sy


def strip_from_still(src: Path, dest: Path) -> None:
    im = Image.open(src).convert("RGBA")
    im.thumbnail((CELL, CELL), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    x = (CELL - im.width) // 2
    y = (CELL - im.height) // 2
    canvas.paste(im, (x, y), im)
    out = Image.new("RGBA", (CELL * FRAMES, CELL), (0, 0, 0, 0))
    for i in range(FRAMES):
        sx, sy = hop_scale(i)
        w = max(8, int(CELL * sx))
        h = max(8, int(CELL * sy))
        frame = canvas.resize((w, h), Image.Resampling.LANCZOS)
        cell = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
        cell.paste(frame, ((CELL - w) // 2, CELL - h), frame)
        out.paste(cell, (i * CELL, 0), cell)
    dest.parent.mkdir(parents=True, exist_ok=True)
    out.save(dest)


def main() -> int:
    if len(sys.argv) < 3:
        print("usage: make-cheer-strip.py still.png dest-strip.png")
        return 2
    strip_from_still(Path(sys.argv[1]), Path(sys.argv[2]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
