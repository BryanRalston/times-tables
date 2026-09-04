"""Animation kitchen: Imagine i2v MP4 (magenta bg) → keyed sprite strip + json.

Pipeline: still PNG → Imagine image-to-video (solid #FF00FF, camera locked,
one motion) → this script → <name>-strip.png + .json (iOS/coarse) and optional
<name>-magenta.mp4 (desktop MagentaVideo). Reuses key-squishees.py flood-fill.

Poke: --name <id>-poke (squash/flatten). Cheer: --name <id>-cheer (hop, not pancake).
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import shutil
import subprocess
import sys
from pathlib import Path
from types import ModuleType

from PIL import Image

MAGENTA = (255, 0, 255, 255)
CELL_CAP = 384


def fail(msg: str, code: int = 1) -> None:
    print(msg, file=sys.stderr)
    raise SystemExit(code)


def which_ffmpeg() -> str:
    exe = shutil.which("ffmpeg")
    if not exe:
        fail("ffmpeg not found on PATH. Install ffmpeg full build (tested 8.1.2) and retry.")
    return exe


def which_ffprobe() -> str | None:
    return shutil.which("ffprobe")


def load_keyer() -> ModuleType:
    path = Path(__file__).with_name("key-squishees.py")
    spec = importlib.util.spec_from_file_location("key_squishees", path)
    if spec is None or spec.loader is None:
        fail(f"cannot load keyer {path}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def run(cmd: list[str], what: str) -> None:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        err = (r.stderr or r.stdout or "").strip() or f"exit {r.returncode}"
        fail(f"{what} failed:\n{err}")


def probe_frames(mp4: Path, ffmpeg: str) -> tuple[int, float]:
    """Return (frame_count, duration_s)."""
    ffprobe = which_ffprobe()
    if ffprobe:
        r = subprocess.run(
            [
                ffprobe,
                "-v",
                "error",
                "-select_streams",
                "v:0",
                "-count_packets",
                "-show_entries",
                "stream=nb_read_packets,r_frame_rate,duration,nb_frames",
                "-show_entries",
                "format=duration",
                "-of",
                "json",
                str(mp4),
            ],
            capture_output=True,
            text=True,
        )
        if r.returncode == 0 and r.stdout:
            data = json.loads(r.stdout)
            stream = (data.get("streams") or [{}])[0]
            fmt = data.get("format") or {}
            n = stream.get("nb_frames") or stream.get("nb_read_packets")
            dur_s = stream.get("duration") or fmt.get("duration")
            rate = stream.get("r_frame_rate") or "24/1"
            duration = float(dur_s) if dur_s not in (None, "N/A") else 0.0
            count = int(n) if n not in (None, "N/A") else 0
            if count <= 0 and duration > 0 and "/" in str(rate):
                a, b = str(rate).split("/", 1)
                fps = float(a) / max(float(b), 1.0)
                count = max(1, round(duration * fps))
            if count > 0:
                if duration <= 0:
                    duration = count / 24.0
                return count, duration
    r = subprocess.run([ffmpeg, "-i", str(mp4)], capture_output=True, text=True)
    blob = (r.stderr or "") + (r.stdout or "")
    duration = 0.0
    for part in blob.replace(",", " ").split():
        if part.count(":") == 2 and part[:1].isdigit():
            try:
                h, m, s = part.split(":")
                duration = int(h) * 3600 + int(m) * 60 + float(s)
                break
            except ValueError:
                pass
    if duration <= 0:
        fail(f"could not probe duration of {mp4}")
    return max(1, round(duration * 24)), duration


def pick_indices(n: int, max_frames: int) -> list[int]:
    if n <= 0:
        fail("source has 0 frames")
    if n <= max_frames:
        return list(range(n))
    if max_frames == 1:
        return [0]
    out: list[int] = []
    for i in range(max_frames):
        idx = round(i * (n - 1) / (max_frames - 1))
        if not out or idx != out[-1]:
            out.append(idx)
    return out


def extract_selected(ffmpeg: str, mp4: Path, dest: Path, indices: list[int]) -> list[Path]:
    dest.mkdir(parents=True, exist_ok=True)
    for old in dest.glob("raw_*.png"):
        old.unlink()
    expr = "+".join(f"eq(n\\,{i})" for i in indices)
    run(
        [
            ffmpeg,
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(mp4),
            "-vf",
            f"select={expr}",
            "-vsync",
            "vfr",
            "-an",
            str(dest / "raw_%04d.png"),
        ],
        "ffmpeg extract",
    )
    files = sorted(dest.glob("raw_*.png"))
    if len(files) >= max(1, len(indices) // 2):
        return files
    # Fallback: dump at a low fps that spans the clip, then take what we got.
    for old in dest.glob("raw_*.png"):
        old.unlink()
    fps = max(1, len(indices))
    run(
        [
            ffmpeg,
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(mp4),
            "-vf",
            f"fps={fps}",
            "-an",
            str(dest / "raw_%04d.png"),
        ],
        "ffmpeg extract (fps fallback)",
    )
    files = sorted(dest.glob("raw_*.png"))
    if not files:
        fail(f"ffmpeg wrote no frames from {mp4}")
    keep = pick_indices(len(files), len(indices))
    chosen = [files[i] for i in keep]
    for p in files:
        if p not in chosen:
            p.unlink()
    return chosen


def alpha_bbox(im: Image.Image) -> tuple[int, int, int, int] | None:
    return im.getchannel("A").getbbox()


def union_square(boxes: list[tuple[int, int, int, int]], pad_ratio: float = 0.08) -> tuple[int, int, int]:
    x0 = min(b[0] for b in boxes)
    y0 = min(b[1] for b in boxes)
    x1 = max(b[2] for b in boxes)
    y1 = max(b[3] for b in boxes)
    bw, bh = x1 - x0, y1 - y0
    pad = max(4, int(max(bw, bh) * pad_ratio))
    x0 -= pad
    y0 -= pad
    x1 += pad
    y1 += pad
    side = max(x1 - x0, y1 - y0)
    cx = (x0 + x1) / 2
    cy = (y0 + y1) / 2
    sx = int(round(cx - side / 2))
    sy = int(round(cy - side / 2))
    return sx, sy, side


def crop_center(im: Image.Image, sx: int, sy: int, side: int, cell: int) -> Image.Image:
    tile = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    tile.paste(im, (-sx, -sy))
    if side != cell:
        tile = tile.resize((cell, cell), Image.Resampling.LANCZOS)
    return tile


def checker(w: int, h: int, tile: int = 12) -> Image.Image:
    a = Image.new("RGB", (tile * 2, tile * 2), (196, 196, 196))
    d = Image.new("RGB", (tile, tile), (236, 236, 236))
    a.paste(d, (0, 0))
    a.paste(d, (tile, tile))
    out = Image.new("RGB", (w, h))
    for y in range(0, h, a.height):
        for x in range(0, w, a.width):
            out.paste(a, (x, y))
    return out


def magenta_left(im: Image.Image, is_key) -> int:
    px = im.load()
    w, h = im.size
    n = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 16 and is_key(r, g, b):
                n += 1
    return n


def drop_remaining_key(im: Image.Image, is_key) -> None:
    """Zero leftover chroma the flood-fill missed (video compression fringe)."""
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 0 and is_key(r, g, b):
                px[x, y] = (0, 0, 0, 0)


def choke_fringe(im: Image.Image, fringe_fn, passes: int = 2) -> None:
    """Same edge choke as key-squishees; extra passes for i2v compression spill."""
    px = im.load()
    w, h = im.size
    for _ in range(passes):
        kill: list[tuple[int, int]] = []
        for y in range(h):
            for x in range(w):
                r, g, b, a = px[x, y]
                if a < 16 or not fringe_fn(r, g, b):
                    continue
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] < 16:
                        kill.append((x, y))
                        break
        for x, y in kill:
            px[x, y] = (0, 0, 0, 0)


def encode_magenta_mp4(ffmpeg: str, cells: list[Image.Image], fps: int, dest: Path) -> None:
    tmp = dest.parent / "_magenta_frames"
    if tmp.exists():
        shutil.rmtree(tmp)
    tmp.mkdir(parents=True)
    try:
        for i, cell in enumerate(cells, start=1):
            bg = Image.new("RGB", cell.size, MAGENTA[:3])
            bg.paste(cell, mask=cell.split()[3])
            bg.save(tmp / f"m_{i:04d}.png")
        run(
            [
                ffmpeg,
                "-y",
                "-hide_banner",
                "-loglevel",
                "error",
                "-framerate",
                str(fps),
                "-i",
                str(tmp / "m_%04d.png"),
                "-an",
                "-c:v",
                "libx264",
                "-pix_fmt",
                "yuv420p",
                "-movflags",
                "+faststart",
                str(dest),
            ],
            "ffmpeg magenta remake",
        )
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Key an Imagine poke clip into a sprite strip.")
    p.add_argument("--mp4", required=True, type=Path, help="source magenta-bg mp4")
    p.add_argument("--out", required=True, type=Path, help="output directory")
    p.add_argument("--name", required=True, help="id, writes <name>-strip.png")
    p.add_argument("--fps", type=int, default=12)
    p.add_argument("--max-frames", type=int, default=16)
    p.add_argument("--strict", action="store_true", help="strict chroma (see key-squishees)")
    return p.parse_args()


def main() -> None:
    args = parse_args()
    if args.fps < 1 or args.fps > 30:
        fail("--fps must be 1..30")
    if args.max_frames < 2 or args.max_frames > 64:
        fail("--max-frames must be 2..64")
    if not args.name.replace("-", "").replace("_", "").isalnum():
        fail("--name must be alphanumeric plus - _")
    mp4 = args.mp4
    if not mp4.is_file():
        fail(f"missing mp4 {mp4}")
    ffmpeg = which_ffmpeg()
    keyer = load_keyer()
    out = args.out
    out.mkdir(parents=True, exist_ok=True)
    raw_dir = out / "raw"
    n_src, duration = probe_frames(mp4, ffmpeg)
    indices = pick_indices(n_src, args.max_frames)
    print(f"source {mp4.name} frames={n_src} duration={duration:.2f}s sample={len(indices)}")
    raws = extract_selected(ffmpeg, mp4, raw_dir, indices)
    keyed: list[Image.Image] = []
    boxes: list[tuple[int, int, int, int]] = []
    for path in raws:
        im = keyer.key_image(Image.open(path), strict=args.strict)
        drop_remaining_key(im, keyer.is_key)
        choke_fringe(im, keyer.fringe)
        box = alpha_bbox(im)
        if box is None:
            fail(f"keyed frame is empty: {path.name}")
        keyed.append(im)
        boxes.append(box)
    sx, sy, side = union_square(boxes)
    cell = min(CELL_CAP, side)
    cell = max(128, cell)
    if cell % 2:
        cell += 1
    cells = [crop_center(im, sx, sy, side, cell) for im in keyed]
    for tile in cells:
        drop_remaining_key(tile, keyer.is_key)
        choke_fringe(tile, keyer.fringe, passes=1)
    frames = len(cells)
    strip = Image.new("RGBA", (cell * frames, cell), (0, 0, 0, 0))
    for i, tile in enumerate(cells):
        strip.paste(tile, (i * cell, 0))
    strip_name = f"{args.name}-strip.png"
    json_name = f"{args.name}-strip.json"
    strip_path = out / strip_name
    strip.save(strip_path, "PNG")
    meta = {"frames": frames, "fps": args.fps, "cell": cell, "src": strip_name}
    (out / json_name).write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")

    contact = checker(cell * frames, cell)
    contact.paste(strip, (0, 0), strip)
    contact.save(out / "contact.png", "PNG")
    first = checker(cell, cell)
    first.paste(cells[0], (0, 0), cells[0])
    last = checker(cell, cell)
    last.paste(cells[-1], (0, 0), cells[-1])
    first.save(out / "first.png", "PNG")
    last.save(out / "last.png", "PNG")
    cells_dir = out / "cells"
    cells_dir.mkdir(exist_ok=True)
    for i, tile in enumerate(cells):
        tile.save(cells_dir / f"{i:02d}.png", "PNG")

    mag = magenta_left(strip, keyer.is_key)
    remake = out / f"{args.name}-magenta.mp4"
    encode_magenta_mp4(ffmpeg, cells, args.fps, remake)
    print(
        f"wrote {strip_path.name} frames={frames} fps={args.fps} cell={cell} "
        f"square={side} crop=({sx},{sy}) magenta_left={mag} remake={remake.name}"
    )
    if mag > 8:
        print(f"WARN leftover magenta {mag}px on strip — inspect {out / 'contact.png'}", file=sys.stderr)


if __name__ == "__main__":
    main()
