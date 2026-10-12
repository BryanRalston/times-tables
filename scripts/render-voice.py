"""Render Academy voice clips with Kokoro. No network calls. The model files stay out of git."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parents[1]
VOICE = ROOT / "academy" / "public" / "voice"
JOBS = Path("/tmp/voice-jobs.json")
MODEL = Path("/tmp/kokoro/kokoro-v1.0.onnx")
VOICES = Path("/tmp/kokoro/voices-v1.0.bin")
VOICE_NAME = "af_heart"
SPEED = 0.92


def render(kokoro: Kokoro, say: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    audio, sample_rate = kokoro.create(say, voice=VOICE_NAME, speed=SPEED, lang="en-us", trim=True)
    wav = dest.with_suffix(".wav")
    sf.write(wav, audio, sample_rate)
    env = os.environ.copy()
    kept = [part for part in env.get("LD_LIBRARY_PATH", "").split(":") if part and "tmux" not in part]
    if kept:
        env["LD_LIBRARY_PATH"] = ":".join(kept)
    else:
        env.pop("LD_LIBRARY_PATH", None)
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
        env=env,
    )
    wav.unlink(missing_ok=True)


def main() -> None:
    if not MODEL.exists() or not VOICES.exists():
        sys.stderr.write("Kokoro model missing in /tmp/kokoro\n")
        sys.exit(1)
    jobs = json.loads(JOBS.read_text(encoding="utf-8"))
    if not isinstance(jobs, list) or not jobs:
        sys.stderr.write("voice jobs missing\n")
        sys.exit(1)
    shard = int(os.environ.get("VOICE_SHARD", "0"))
    shards = int(os.environ.get("VOICE_SHARDS", "1"))
    mine = [job for index, job in enumerate(jobs) if index % shards == shard]
    kokoro = Kokoro(str(MODEL), str(VOICES))
    made = 0
    for index, job in enumerate(mine):
        dest = VOICE / job["file"]
        if dest.exists() and dest.stat().st_size > 200:
            continue
        render(kokoro, job["say"], dest)
        made += 1
        if made % 25 == 0:
            print(f"shard {shard} rendered {made} (at {index + 1}/{len(mine)})", flush=True)
    removed = 0
    if os.environ.get("VOICE_CLEAN") == "1":
        wanted = {(VOICE / job["file"]).resolve() for job in jobs}
        for folder in ("core", "lazy"):
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
