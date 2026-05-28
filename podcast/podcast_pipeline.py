#!/usr/bin/env python3
"""
Full podcast pipeline:
    1. generate_narration.py  →  narration.txt  (markdown cleaner)
  2. generate_audio.py      →  audio.wav      (Kokoro TTS)
  3. ffmpeg                 →  audio.mp3
    4. ffmpeg                 →  podcast-video.mp4  (cover + audio)

Each episode's files are written to output/<name>/.

Usage:
    python podcast_pipeline.py
    python podcast_pipeline.py --name my-episode --voice af_bella --speed 0.95
    python podcast_pipeline.py --name my-episode --skip-narration  # re-run TTS only
"""

import argparse
import subprocess
import sys
from datetime import datetime
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = SCRIPT_DIR / "output"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def banner(title: str) -> None:
    line = "\u2500" * 60
    print(f"\n{line}", flush=True)
    print(f"  {title}", flush=True)
    print(f"{line}\n", flush=True)


def run(cmd: list) -> None:
    """Run *cmd*, inheriting stdin/stdout/stderr; exit if it fails."""
    result = subprocess.run(cmd)
    if result.returncode != 0:
        sys.exit(result.returncode)


def ffmpeg_available() -> bool:
    return subprocess.run(["ffmpeg", "-version"], capture_output=True).returncode == 0


# ---------------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run the full podcast pipeline: post → narration → WAV → MP3."
    )
    parser.add_argument(
        "--name", "-n",
        default=datetime.now().strftime("%Y-%m-%d_%H-%M"),
        help="Episode name used as the output sub-directory (default: current timestamp).",
    )
    parser.add_argument(
        "--voice", "-v",
        default="af_heart",
        help="Kokoro voice ID (default: af_heart). Run generate_audio.py --list-voices for options.",
    )
    parser.add_argument(
        "--speed", "-s",
        type=float,
        default=1.0,
        help="TTS speed multiplier (default: 1.0). 0.9–1.05 sounds natural for podcasts.",
    )
    parser.add_argument(
        "--skip-narration",
        action="store_true",
        help="Skip Step 1 and reuse an existing narration.txt in the episode directory.",
    )
    parser.add_argument(
        "--skip-video",
        action="store_true",
        help="Skip Step 4 video generation.",
    )
    parser.add_argument(
        "--video-fade-in",
        type=float,
        default=1.0,
        help="Video fade-in duration in seconds (default: 1.0).",
    )
    parser.add_argument(
        "--video-fade-out",
        type=float,
        default=1.2,
        help="Video fade-out duration in seconds (default: 1.2).",
    )
    args = parser.parse_args()

    # Resolve paths
    episode_dir = OUTPUT_DIR / args.name
    episode_dir.mkdir(parents=True, exist_ok=True)

    narration_file = episode_dir / "narration.txt"
    wav_file       = episode_dir / "audio.wav"
    mp3_file       = episode_dir / "audio.mp3"
    cover_file     = episode_dir / "youtube-cover.png"
    video_file     = episode_dir / "podcast-video.mp4"

    python = sys.executable

    # ── Step 1: Narration ──────────────────────────────────────────────────
    if args.skip_narration:
        if not narration_file.exists():
            print(
                f"Error: --skip-narration set but {narration_file} does not exist.",
                file=sys.stderr,
            )
            sys.exit(1)
        print(f"Skipping Step 1 — reusing {narration_file}", flush=True)
    else:
        banner("Step 1 / 3 — Narration script  (markdown cleaner)")
        cmd = [
            python, str(SCRIPT_DIR / "generate_narration.py"),
            "--output", str(narration_file),
        ]
        run(cmd)

    # ── Step 2: TTS ────────────────────────────────────────────────────────
    banner("Step 2 / 3 — Audio generation  (Kokoro TTS)")
    run([
        python, str(SCRIPT_DIR / "generate_audio.py"),
        "--input",  str(narration_file),
        "--output", str(wav_file),
        "--voice",  args.voice,
        "--speed",  str(args.speed),
    ])

    # ── Step 3: WAV → MP3 ─────────────────────────────────────────────────
    banner("Step 3 / 3 — WAV \u2192 MP3  (ffmpeg)")
    if not ffmpeg_available():
        print(
            "Warning: ffmpeg not found — skipping MP3 conversion.\n"
            "Install it with:  sudo apt install ffmpeg  /  brew install ffmpeg",
            file=sys.stderr,
        )
        print(f"\nOutput: {wav_file}")
        return

    run([
        "ffmpeg", "-y",
        "-i",        str(wav_file),
        "-codec:a",  "libmp3lame",
        "-q:a",      "2",           # VBR ~190 kbps — good quality for voice
        str(mp3_file),
    ])

    # ── Step 4: Cover + audio → MP4 ─────────────────────────────────────
    if args.skip_video:
        print("Skipping Step 4 — --skip-video provided.", flush=True)
    elif not cover_file.exists():
        print(
            f"Warning: {cover_file} not found — skipping video generation.\n"
            "Generate a cover first with: node ../scripts/generate-cover-image.mjs --post <slug>",
            file=sys.stderr,
        )
    else:
        banner("Step 4 / 4 — Cover + audio → MP4")
        run([
            "node", str(SCRIPT_DIR.parent / "scripts" / "generate-podcast-video.mjs"),
            "--episode-dir", str(episode_dir),
            "--fade-in", str(args.video_fade_in),
            "--fade-out", str(args.video_fade_out),
            "--output", str(video_file),
        ])

    # ── Summary ────────────────────────────────────────────────────────────
    line = "\u2500" * 60
    wav_mb = wav_file.stat().st_size / 1e6
    mp3_mb = mp3_file.stat().st_size / 1e6
    print(f"\n{line}")
    print(f"  Done!")
    print(f"  Narration : {narration_file}")
    print(f"  WAV       : {wav_file}  ({wav_mb:.1f} MB)")
    print(f"  MP3       : {mp3_file}  ({mp3_mb:.1f} MB)")
    if video_file.exists():
        video_mb = video_file.stat().st_size / 1e6
        print(f"  Video     : {video_file}  ({video_mb:.1f} MB)")
    print(f"{line}\n")


if __name__ == "__main__":
    main()
