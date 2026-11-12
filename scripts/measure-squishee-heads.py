"""Measure where each squishee's head is, for seating boss hats.

Writes src/academy/head-fit.ts. Run: python3 scripts/measure-squishee-heads.py
"""
import re
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
# Dark bodies or seeds fool the pupil finder; these were read off the art by eye.
EYE_OVERRIDES = {"penguin": 0.31, "melon": 0.52, "panda": None}


def measure(path: Path) -> dict:
    rgba = np.asarray(Image.open(path).convert("RGBA")).astype(int)
    h, w = rgba.shape[:2]
    solid = rgba[..., 3] > 128
    rows = np.where(solid.any(1))[0]
    y0, y1 = rows[0], rows[-1]
    body = y1 - y0
    counts = solid.sum(1)
    top = next(y for y in range(y0, y1) if counts[y] >= 0.45 * counts.max())
    spans = [np.where(solid[y])[0] for y in range(top, int(top + 0.30 * body)) if solid[y].any()]
    left = float(np.median([s[0] for s in spans]))
    right = float(np.median([s[-1] for s in spans]))
    cx, hw = (left + right) / 2 / w, (right - left) / w
    lum = rgba[..., 0] * 0.3 + rgba[..., 1] * 0.59 + rgba[..., 2] * 0.11
    dark = (lum < 40) & (rgba[..., 3] > 200)
    x0, x1 = int((cx - hw * 0.45) * w), int((cx + hw * 0.45) * w)
    ey0, ey1 = top, int(min(0.8, top / h + 0.45) * h)
    hits = np.where(dark[ey0:ey1, x0:x1].sum(1) >= max(4, w * 0.006))[0]
    eye = (ey0 + hits[0]) / h if len(hits) else None
    if eye is not None and eye < top / h + 0.02:
        eye = None  # dark fur or shell, not a pupil
    return {"top": top / h, "cx": cx, "w": hw, "eye": eye}


def main() -> None:
    src = (ROOT / "src/lib/squishees.ts").read_text()
    rows = re.findall(r'\{ id: "([^"]+)",[^}]*?file: "([^"]+)"', src)
    lines = []
    for sid, file in sorted(rows):
        m = measure(ROOT / "public/squishees" / file)
        if sid in EYE_OVERRIDES:
            m["eye"] = EYE_OVERRIDES[sid]
        eye = "null" if m["eye"] is None else f'{m["eye"]:.3f}'
        lines.append(f'  "{sid}": {{ top: {m["top"]:.3f}, cx: {m["cx"]:.3f}, w: {m["w"]:.3f}, eye: {eye} }},')
    out = ROOT / "src/academy/head-fit.ts"
    head = out.read_text().split("export const HEAD_FIT")[0]
    tail = "\n};\n" + out.read_text().split("\n};\n", 1)[1]
    out.write_text(head + "export const HEAD_FIT: Readonly<Record<string, HeadFit>> = {\n" + "\n".join(lines) + tail)
    print(f"wrote {len(lines)} heads to {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
