"""Batch kitchen hop takes into public cheer clips + strips.

For each squishee id with kitchen/<id>/take-hop.mp4:
  python scripts/anim-kitchen.py --mp4 <take> --out kitchen/<id>/out --name <id>-cheer --fps 24 --max-frames 36
  copy take-hop.mp4 → public/squishees/<id>-cheer.mp4
  copy out/<id>-cheer-strip.png and .json → public/squishees/

Skips missing takes. Leaves panda unless kitchen/panda/take-hop.mp4 is newer
than the public cheer files. Continues on a single-id failure.
"""
from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KITCHEN = ROOT / "kitchen"
PUBLIC = ROOT / "public" / "squishees"
SRC = ROOT / "src" / "lib" / "squishees.ts"
ANIM = Path(__file__).with_name("anim-kitchen.py")
LEGACY_DIRS = {"panda-cheer"}
SETTLE_S = 3.0
MIN_TAKE_BYTES = 50_000


def fail(msg: str, code: int = 1) -> None:
    print(msg, file=sys.stderr)
    raise SystemExit(code)


def squishee_ids() -> list[str]:
    text = SRC.read_text(encoding="utf-8")
    ids = re.findall(r'\{ id: "([a-z0-9-]+)"', text)
    if len(ids) < 10:
        fail(f"parsed only {len(ids)} ids from {SRC}")
    seen: set[str] = set()
    out: list[str] = []
    for sid in ids:
        if sid in seen:
            continue
        seen.add(sid)
        out.append(sid)
    return out


def public_files(sid: str) -> tuple[Path, Path, Path]:
    return (
        PUBLIC / f"{sid}-cheer.mp4",
        PUBLIC / f"{sid}-cheer-strip.png",
        PUBLIC / f"{sid}-cheer-strip.json",
    )


def public_complete(sid: str) -> bool:
    return all(p.is_file() and p.stat().st_size > 0 for p in public_files(sid))


def public_mtime(sid: str) -> float:
    times = [p.stat().st_mtime for p in public_files(sid) if p.is_file()]
    return max(times) if times else 0.0


def take_path(sid: str) -> Path:
    return KITCHEN / sid / "take-hop.mp4"


def take_ready(take: Path) -> bool:
    if not take.is_file():
        return False
    st = take.stat()
    if st.st_size < MIN_TAKE_BYTES:
        return False
    if time.time() - st.st_mtime < SETTLE_S:
        return False
    return True


def skip_panda(sid: str, take: Path) -> bool:
    if sid != "panda":
        return False
    if not public_complete("panda"):
        return False
    if not take.is_file():
        return True
    return take.stat().st_mtime <= public_mtime("panda")


def already_current(sid: str, take: Path) -> bool:
    if not public_complete(sid):
        return False
    take_m = take.stat().st_mtime
    return all(p.is_file() and p.stat().st_mtime >= take_m for p in public_files(sid))


def parse_magenta(blob: str) -> int | None:
    m = re.search(r"magenta_left=(\d+)", blob)
    return int(m.group(1)) if m else None


def run_kitchen(sid: str, take: Path) -> tuple[int, str]:
    out = KITCHEN / sid / "out"
    out.mkdir(parents=True, exist_ok=True)
    cmd = [
        sys.executable,
        str(ANIM),
        "--mp4",
        str(take),
        "--out",
        str(out),
        "--name",
        f"{sid}-cheer",
        "--fps",
        "24",
        "--max-frames",
        "36",
    ]
    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    blob = (r.stdout or "") + (r.stderr or "")
    return r.returncode, blob


def copy_public(sid: str, take: Path) -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    out = KITCHEN / sid / "out"
    strip = out / f"{sid}-cheer-strip.png"
    meta = out / f"{sid}-cheer-strip.json"
    if not strip.is_file() or not meta.is_file():
        raise FileNotFoundError(f"kitchen missing strip/json in {out}")
    shutil.copy2(take, PUBLIC / f"{sid}-cheer.mp4")
    shutil.copy2(strip, PUBLIC / f"{sid}-cheer-strip.png")
    shutil.copy2(meta, PUBLIC / f"{sid}-cheer-strip.json")


def process_id(sid: str, print_missing: bool) -> str:
    take = take_path(sid)
    if skip_panda(sid, take):
        if print_missing:
            print(f"skip {sid}")
        return "skip"
    if not take.is_file():
        if print_missing:
            print(f"skip {sid}")
        return "missing"
    if not take_ready(take):
        if print_missing:
            print(f"skip {sid}")
        return "pending"
    if already_current(sid, take):
        if print_missing:
            print(f"skip {sid}")
        return "skip"
    code, blob = run_kitchen(sid, take)
    blob = blob.strip()
    if blob:
        print(blob)
    mag = parse_magenta(blob)
    if code != 0:
        print(f"fail {sid}")
        return "fail"
    if mag is not None and mag > 8:
        print(f"fail {sid} leftover magenta {mag}px")
        return "fail"
    try:
        copy_public(sid, take)
    except OSError as e:
        print(f"fail {sid} {e}")
        return "fail"
    extra = f" magenta_left={mag}" if mag is not None else ""
    print(f"ok {sid}{extra}")
    return "ok"


def run_pass(ids: list[str], print_missing: bool) -> dict[str, str]:
    statuses: dict[str, str] = {}
    for sid in ids:
        try:
            statuses[sid] = process_id(sid, print_missing)
        except Exception as e:  # noqa: BLE001 — one id must not abort the batch
            print(f"fail {sid} {e}")
            statuses[sid] = "fail"
    return statuses


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Key kitchen hop takes into public cheer assets.")
    p.add_argument("--watch", type=int, default=0, help="keep polling this many seconds")
    p.add_argument("--interval", type=int, default=20, help="seconds between watch passes")
    p.add_argument(
        "--only",
        nargs="+",
        metavar="ID",
        help="process only these squishee ids (still skip panda unless take is newer)",
    )
    return p.parse_args()


def main() -> None:
    args = parse_args()
    if not ANIM.is_file():
        fail(f"missing {ANIM}")
    all_ids = squishee_ids()
    ids = all_ids
    if args.only:
        unknown = [sid for sid in args.only if sid not in all_ids]
        if unknown:
            fail(f"unknown id(s): {', '.join(unknown)}")
        ids = list(args.only)
    # kitchen/panda-cheer is the shipped panda workbench, not a squishee id.
    extra = sorted(
        d.name
        for d in KITCHEN.iterdir()
        if d.is_dir() and d.name not in LEGACY_DIRS and d.name not in all_ids
    )
    if extra:
        print(f"note ignored kitchen dirs: {', '.join(extra)}")
    started = time.time()
    first = True
    seen_ok: set[str] = set()
    while True:
        statuses = run_pass(ids, print_missing=first)
        for sid, st in statuses.items():
            if st == "ok":
                seen_ok.add(sid)
        first = False
        if args.watch <= 0:
            break
        elapsed = time.time() - started
        if elapsed >= args.watch:
            break
        missing = [sid for sid, st in statuses.items() if st in {"missing", "pending"}]
        if not missing:
            break
        sleep_for = min(args.interval, max(1, args.watch - int(elapsed)))
        print(f"watch {len(missing)} missing; sleep {sleep_for}s")
        time.sleep(sleep_for)
    missing = [sid for sid in ids if not take_path(sid).is_file() and sid not in seen_ok]
    print(f"done ok={len(seen_ok)} missing_take={len(missing)}")


if __name__ == "__main__":
    main()
