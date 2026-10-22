#!/usr/bin/env python3
"""Render Academy Arabic clips with eSpeak NG. Kokoro has no Arabic voice."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VOICE = ROOT / "academy" / "public" / "voice"
JOBS = Path(os.environ.get("VOICE_JOBS", "/tmp/voice-jobs-ar.json"))


def render(say: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    wav = dest.with_suffix(".wav")
    subprocess.run(
        ["espeak-ng", "-v", "ar", "-s", "132", "-w", str(wav), say],
        check=True,
    )
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-loglevel",
            "error",
            "-i",
            str(wav),
            "-ac",
            "1",
            "-ar",
            "22050",
            "-codec:a",
            "libmp3lame",
            "-b:a",
            "32k",
            "-map_metadata",
            "-1",
            str(dest),
        ],
        check=True,
    )
    wav.unlink(missing_ok=True)


def main() -> None:
    jobs = json.loads(JOBS.read_text(encoding="utf-8"))
    if not isinstance(jobs, list) or not jobs:
        sys.stderr.write("voice jobs missing\n")
        sys.exit(1)
    shard = int(os.environ.get("VOICE_SHARD", "0"))
    shards = int(os.environ.get("VOICE_SHARDS", "1"))
    mine = [job for index, job in enumerate(jobs) if index % shards == shard]
    made = 0
    for index, job in enumerate(mine):
        dest = VOICE / job["file"]
        if dest.exists() and dest.stat().st_size > 200:
            continue
        render(job["say"], dest)
        made += 1
        if made % 50 == 0:
            print(f"shard {shard} rendered {made} (at {index + 1}/{len(mine)})", flush=True)
    removed = 0
    if os.environ.get("VOICE_CLEAN") == "1":
        wanted = {(VOICE / job["file"]).resolve() for job in jobs}
        folders = {Path(job["file"]).parts[0] for job in jobs if job.get("file")}
        for folder in sorted(folders):
            directory = VOICE / folder
            if not directory.exists():
                continue
            for path in directory.glob("*.mp3"):
                if path.resolve() not in wanted:
                    path.unlink()
                    removed += 1
        total = sum(path.stat().st_size for path in wanted if path.exists())
        print(f"clips {len(jobs)} removed {removed} bytes {total}")
    print(f"shard {shard} new {made} of {len(mine)}", flush=True)


if __name__ == "__main__":
    main()
