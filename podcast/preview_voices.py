#!/usr/bin/env python3
"""
Mini utility to audition Kokoro voices quickly.

It generates short WAV previews for selected voices in one run, plus an optional
combined comparison track so you can A/B test in a single file.

Usage:
    python preview_voices.py
    python preview_voices.py --all
    python preview_voices.py --voices am_michael,af_bella,bm_george
    python preview_voices.py --text "This is my custom sample text."
    python preview_voices.py --input output/my-post-narration.txt --max-words 90
"""

import argparse
import os
import re
import sys
from datetime import datetime
from pathlib import Path

import numpy as np
import soundfile as sf

from generate_audio import (
    VOICES,
    SAMPLE_RATE,
    configure_cuda_runtime_libraries,
    download_model_files,
    resolve_provider,
    split_into_paragraphs,
)

DEFAULT_SAMPLE_TEXT = (
    "Welcome to the show. Today we explore how to think clearly under pressure, "
    "and why simple systems often outperform clever plans over the long term."
)

DEFAULT_VOICE_SET = [
    "am_michael",
    "am_adam",
    "af_bella",
    "af_heart",
    "bm_george",
    "bf_emma",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate short voice previews using Kokoro ONNX."
    )
    parser.add_argument(
        "--text",
        help="Inline sample text to synthesize.",
    )
    parser.add_argument(
        "--input", "-i",
        metavar="FILE",
        help="Optional input narration file. If omitted, uses an internal sample text.",
    )
    parser.add_argument(
        "--max-words",
        type=int,
        default=90,
        help="When using --input, keep only the first N words (default: 90).",
    )
    parser.add_argument(
        "--voices",
        help="Comma-separated voice IDs to test.",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Generate previews for all available voices.",
    )
    parser.add_argument(
        "--speed", "-s",
        type=float,
        default=1.0,
        help="Speech speed multiplier 0.5–2.0 (default: 1.0).",
    )
    parser.add_argument(
        "--output-dir", "-o",
        default=f"output/voice-preview-{datetime.now().strftime('%Y-%m-%d_%H-%M')}",
        help="Directory where voice previews are written.",
    )
    parser.add_argument(
        "--no-combined",
        action="store_true",
        help="Do not generate combined.wav (voice-by-voice comparison).",
    )
    parser.add_argument(
        "--list-voices",
        action="store_true",
        help="Print voice IDs and exit.",
    )
    return parser.parse_args()


def load_text(args: argparse.Namespace) -> str:
    if args.text:
        return args.text.strip()

    if args.input:
        path = Path(args.input)
        if not path.exists():
            print(f"Error: input file not found: {path}", file=sys.stderr)
            sys.exit(1)
        content = path.read_text(encoding="utf-8")
        words = content.split()
        return " ".join(words[: args.max_words]).strip()

    return DEFAULT_SAMPLE_TEXT


def pick_voices(args: argparse.Namespace) -> list[str]:
    if args.all:
        return sorted(VOICES.keys())

    if args.voices:
        return [v.strip() for v in args.voices.split(",") if v.strip()]

    return DEFAULT_VOICE_SET


def synthesize(kokoro, text: str, voice: str, speed: float) -> np.ndarray:
    lang = "en-gb" if voice.startswith("b") else "en-us"
    paragraphs = split_into_paragraphs(text)
    chunks: list[np.ndarray] = []

    for paragraph in paragraphs:
        samples, _ = kokoro.create(paragraph, voice=voice, speed=speed, lang=lang)
        if samples is not None and len(samples) > 0:
            chunks.append(samples)

    if not chunks:
        raise RuntimeError(f"No audio produced for voice '{voice}'.")

    gap = np.zeros(int(SAMPLE_RATE * 0.3), dtype=np.float32)
    out: list[np.ndarray] = []
    for idx, chunk in enumerate(chunks):
        out.append(chunk)
        if idx < len(chunks) - 1:
            out.append(gap)

    return np.concatenate(out).astype(np.float32)


def main() -> None:
    args = parse_args()

    if args.list_voices:
        print("\nAvailable voices:\n")
        for voice_id, desc in sorted(VOICES.items()):
            print(f"  {voice_id:<12} {desc}")
        print()
        return

    if args.speed < 0.5 or args.speed > 2.0:
        print("Error: --speed must be between 0.5 and 2.0", file=sys.stderr)
        sys.exit(1)

    text = load_text(args)
    if not text:
        print("Error: sample text is empty.", file=sys.stderr)
        sys.exit(1)

    selected = pick_voices(args)
    unknown = [v for v in selected if v not in VOICES]
    if unknown:
        print(f"Error: unknown voices: {', '.join(unknown)}", file=sys.stderr)
        print("Run with --list-voices to see valid IDs.", file=sys.stderr)
        sys.exit(1)

    provider = resolve_provider()
    os.environ["ONNX_PROVIDER"] = provider

    if provider == "CUDAExecutionProvider":
        lib_dirs = configure_cuda_runtime_libraries()
        if lib_dirs:
            print(f"CUDA libs : {', '.join(str(p) for p in lib_dirs)}", file=sys.stderr)

    print(f"Provider  : {provider}", file=sys.stderr)
    print(f"Voices    : {', '.join(selected)}", file=sys.stderr)
    print(f"Speed     : {args.speed}x", file=sys.stderr)

    model_path, voices_path = download_model_files()
    from kokoro_onnx import Kokoro

    kokoro = Kokoro(model_path, voices_path)

    missing = [v for v in selected if v not in kokoro.voices]
    if missing:
        print(
            f"Error: voices not present in loaded voice pack: {', '.join(missing)}",
            file=sys.stderr,
        )
        sys.exit(1)

    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    combined_parts: list[np.ndarray] = []
    combined_gap = np.zeros(int(SAMPLE_RATE * 1.2), dtype=np.float32)

    manifest_lines = [
        f"text={re.sub(r'\\s+', ' ', text).strip()}",
        f"speed={args.speed}",
        f"provider={provider}",
        "",
    ]

    for voice in selected:
        print(f"Generating: {voice}", file=sys.stderr)
        audio = synthesize(kokoro, text, voice, args.speed)

        voice_path = out_dir / f"{voice}.wav"
        sf.write(str(voice_path), audio, SAMPLE_RATE)

        desc = VOICES.get(voice, "")
        manifest_lines.append(f"{voice_path.name}  |  {desc}")

        if not args.no_combined:
            combined_parts.append(audio)
            combined_parts.append(combined_gap)

    if not args.no_combined and combined_parts:
        combined_audio = np.concatenate(combined_parts[:-1]).astype(np.float32)
        sf.write(str(out_dir / "combined.wav"), combined_audio, SAMPLE_RATE)

    (out_dir / "manifest.txt").write_text("\n".join(manifest_lines), encoding="utf-8")

    print(f"\nDone. Voice previews saved in: {out_dir}", file=sys.stderr)
    print("Files:", file=sys.stderr)
    for voice in selected:
        print(f"  - {voice}.wav", file=sys.stderr)
    if not args.no_combined:
        print("  - combined.wav", file=sys.stderr)
    print("  - manifest.txt", file=sys.stderr)


if __name__ == "__main__":
    main()
