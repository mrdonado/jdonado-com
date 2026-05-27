#!/usr/bin/env python3
"""
Step 2 – Text-to-Speech
Convert a narration script to audio using Kokoro ONNX TTS.

Usage:
    # From a file
    python generate_audio.py --input output/narration.txt --output output/audio.wav

    # Piped directly from Step 1
    python generate_narration.py | python generate_audio.py --output output/audio.wav

    # Pick a different voice or adjust speed
    python generate_audio.py --input output/narration.txt --voice af_bella --speed 0.95

GPU note:
    By default CPU inference is used (onnxruntime).
    For CUDA acceleration, replace onnxruntime with onnxruntime-gpu:
        pip uninstall onnxruntime && pip install onnxruntime-gpu
    The script detects CUDAExecutionProvider automatically when available.
"""

import argparse
import ctypes
import os
import re
import site
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
import soundfile as sf

# ---------------------------------------------------------------------------
# Available Kokoro voices (for --list-voices)
# ---------------------------------------------------------------------------

VOICES = {
    # American English – female
    "af_heart":   "American female – Heart (warm, expressive)",
    "af_bella":   "American female – Bella (bright)",
    "af_nicole":  "American female – Nicole (calm)",
    "af_sarah":   "American female – Sarah (clear)",
    "af_sky":     "American female – Sky (airy)",
    "af_nova":    "American female – Nova",
    "af_river":   "American female – River",
    # American English – male
    "am_adam":    "American male – Adam (deep)",
    "am_michael": "American male – Michael (neutral, podcast-friendly)",
    "am_echo":    "American male – Echo",
    "am_eric":    "American male – Eric",
    "am_liam":    "American male – Liam",
    # British English – female
    "bf_emma":    "British female – Emma",
    "bf_isabella":"British female – Isabella",
    "bf_alice":   "British female – Alice",
    "bf_lily":    "British female – Lily",
    # British English – male
    "bm_george":  "British male – George",
    "bm_lewis":   "British male – Lewis",
    "bm_daniel":  "British male – Daniel",
    "bm_fable":   "British male – Fable",
}

DEFAULT_VOICE = "am_michael"

# ---------------------------------------------------------------------------
# Model download — files live on GitHub releases, not HuggingFace
# ---------------------------------------------------------------------------

# kokoro v1.0 fp16: half the size of fp32 (169 MB vs 310 MB), same quality
_GH_BASE   = "https://github.com/thewh1teagle/kokoro-onnx/releases/download"
MODEL_URL  = f"{_GH_BASE}/model-files-v1.0/kokoro-v1.0.fp16.onnx"
VOICES_URL = f"{_GH_BASE}/model-files-v1.0/voices-v1.0.bin"
MODEL_FILE  = "kokoro-v1.0.fp16.onnx"
VOICES_FILE = "voices-v1.0.bin"
CACHE_DIR   = Path.home() / ".cache" / "kokoro-onnx"
SAMPLE_RATE = 24_000  # Kokoro output sample rate

# ---------------------------------------------------------------------------
# Text helpers
# ---------------------------------------------------------------------------

def read_narration(input_path: str | None) -> str:
    if input_path:
        path = Path(input_path)
        if not path.exists():
            print(f"Error: input file not found: {path}", file=sys.stderr)
            sys.exit(1)
        return path.read_text(encoding="utf-8").strip()
    if sys.stdin.isatty():
        print(
            "Error: provide --input FILE or pipe narration text via stdin.",
            file=sys.stderr,
        )
        sys.exit(1)
    return sys.stdin.read().strip()


def split_into_paragraphs(text: str) -> list[str]:
    """Split text on blank lines; return non-empty paragraphs."""
    paragraphs = re.split(r"\n{2,}", text)
    return [p.strip() for p in paragraphs if p.strip()]


# ---------------------------------------------------------------------------
# Device / provider selection
# ---------------------------------------------------------------------------

def resolve_provider() -> str:
    """Return the best available ONNX Execution Provider."""
    available = ort.get_available_providers()
    if "CUDAExecutionProvider" in available:
        return "CUDAExecutionProvider"
    return "CPUExecutionProvider"


def configure_cuda_runtime_libraries() -> list[Path]:
    """Expose CUDA/cuDNN libs from pip-installed nvidia wheels to ONNX Runtime."""
    candidates: list[Path] = []
    site_paths = list(site.getsitepackages())
    user_site = site.getusersitepackages()
    if user_site:
        site_paths.append(user_site)

    for base in site_paths:
        nvidia_root = Path(base) / "nvidia"
        if not nvidia_root.exists():
            continue
        # Catch all runtime libs shipped as nvidia/<component>/lib/*.so*
        candidates.extend(
            p for p in nvidia_root.glob("*/lib")
            if p.is_dir()
        )

    # Deduplicate while preserving order
    seen: set[Path] = set()
    lib_dirs = [p for p in candidates if not (p in seen or seen.add(p))]

    if not lib_dirs:
        return []

    existing = os.environ.get("LD_LIBRARY_PATH", "")
    prefix = ":".join(str(p) for p in lib_dirs)
    os.environ["LD_LIBRARY_PATH"] = f"{prefix}:{existing}" if existing else prefix

    # Preload key shared libraries so provider initialization can resolve deps.
    key_libs = [
        # Base runtime first
        "libcudart.so.12",
        # Core CUDA EP deps
        "libcublasLt.so.12",
        "libcublas.so.12",
        "libcufft.so.11",
        "libcufft.so.12",
        "libcurand.so.10",
        "libcusparse.so.12",
        "libcusolver.so.11",
        "libcudnn.so.9",
        "libnvrtc.so.12",
    ]
    for name in key_libs:
        for lib_dir in lib_dirs:
            lib_path = lib_dir / name
            if lib_path.exists():
                try:
                    ctypes.CDLL(str(lib_path), mode=ctypes.RTLD_GLOBAL)
                except OSError:
                    pass
                break

    return lib_dirs


# ---------------------------------------------------------------------------
# Model download
# ---------------------------------------------------------------------------

def _download_file(url: str, dest: Path) -> None:
    """Download *url* to *dest*, showing a tqdm progress bar."""
    import urllib.request

    with urllib.request.urlopen(url) as response:
        total = int(response.headers.get("Content-Length", 0))
        try:
            from tqdm import tqdm
            pbar = tqdm(
                total=total, unit="B", unit_scale=True,
                desc=dest.name, file=sys.stderr,
            )
        except ImportError:
            pbar = None

        with open(dest, "wb") as f:
            downloaded = 0
            while chunk := response.read(65_536):
                f.write(chunk)
                downloaded += len(chunk)
                if pbar:
                    pbar.update(len(chunk))
                else:
                    pct = downloaded * 100 // total if total else 0
                    print(f"\r  {dest.name}: {pct}%", end="", flush=True, file=sys.stderr)

        if pbar:
            pbar.close()
        else:
            print(file=sys.stderr)


def download_model_files() -> tuple[str, str]:
    """Return (model_path, voices_path), downloading from GitHub releases if needed."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    model_path  = CACHE_DIR / MODEL_FILE
    voices_path = CACHE_DIR / VOICES_FILE

    for path, url in [(model_path, MODEL_URL), (voices_path, VOICES_URL)]:
        if path.exists():
            continue
        print(f"Downloading {path.name} …", file=sys.stderr)
        tmp = path.with_suffix(".tmp")
        try:
            _download_file(url, tmp)
            tmp.rename(path)
        except Exception:
            tmp.unlink(missing_ok=True)
            raise

    print(f"Model cache : {CACHE_DIR}", file=sys.stderr)
    return str(model_path), str(voices_path)


# ---------------------------------------------------------------------------
# Audio generation
# ---------------------------------------------------------------------------

def generate_audio(text: str, voice: str, speed: float) -> np.ndarray:
    from kokoro_onnx import Kokoro  # lazy import so --list-voices works without model

    provider = resolve_provider()
    print(f"Voice    : {voice}  ({VOICES.get(voice, 'custom voice')})", file=sys.stderr)
    print(f"Speed    : {speed}x", file=sys.stderr)
    print(f"Provider : {provider}", file=sys.stderr)

    if provider == "CUDAExecutionProvider":
        lib_dirs = configure_cuda_runtime_libraries()
        if lib_dirs:
            print(f"CUDA libs: {', '.join(str(p) for p in lib_dirs)}", file=sys.stderr)
        try:
            import torch
            if torch.cuda.is_available():
                gpu_name = torch.cuda.get_device_name(0)
                vram_gb  = torch.cuda.get_device_properties(0).total_memory / 1e9
                print(f"GPU      : {gpu_name} ({vram_gb:.1f} GB)", file=sys.stderr)
        except ImportError:
            pass
    else:
        try:
            import torch
            if torch.cuda.is_available():
                print(
                    "Tip: GPU detected but onnxruntime-gpu is not installed.\n"
                    "     Run: pip uninstall onnxruntime && pip install onnxruntime-gpu",
                    file=sys.stderr,
                )
        except ImportError:
            pass

    # Set provider via env var — kokoro_onnx reads ONNX_PROVIDER at init time
    os.environ["ONNX_PROVIDER"] = provider

    model_path, voices_path = download_model_files()
    kokoro = Kokoro(model_path, voices_path)

    # Validate voice name against the loaded voices binary
    if voice not in kokoro.voices:
        available = ", ".join(sorted(kokoro.voices.keys()))
        print(
            f"Error: voice '{voice}' not found.\nAvailable: {available}",
            file=sys.stderr,
        )
        sys.exit(1)

    lang = "en-gb" if voice.startswith("b") else "en-us"
    paragraphs = split_into_paragraphs(text)
    total = len(paragraphs)
    all_chunks: list[np.ndarray] = []

    for idx, paragraph in enumerate(paragraphs, 1):
        print(
            f"\r  Paragraph {idx}/{total}…" + " " * 20,
            end="", flush=True, file=sys.stderr,
        )
        samples, _ = kokoro.create(paragraph, voice=voice, speed=speed, lang=lang)
        if samples is not None and len(samples) > 0:
            all_chunks.append(samples)

    print(file=sys.stderr)  # newline after progress line

    if not all_chunks:
        print("Error: no audio was generated.", file=sys.stderr)
        sys.exit(1)

    # Interleave a short silence between paragraphs for natural pacing
    silence = np.zeros(int(SAMPLE_RATE * 0.5), dtype=np.float32)
    interleaved: list[np.ndarray] = []
    for i, chunk in enumerate(all_chunks):
        interleaved.append(chunk)
        if i < len(all_chunks) - 1:
            interleaved.append(silence)

    return np.concatenate(interleaved).astype(np.float32)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert a narration script to audio using Kokoro TTS."
    )
    parser.add_argument(
        "--input", "-i",
        metavar="FILE",
        help="Path to narration text file. Reads from stdin if omitted.",
    )
    parser.add_argument(
        "--output", "-o",
        metavar="FILE",
        default="output/audio.wav",
        help="Output WAV file path (default: output/audio.wav).",
    )
    parser.add_argument(
        "--voice", "-v",
        default=DEFAULT_VOICE,
        help=f"Kokoro voice ID (default: {DEFAULT_VOICE}). Use --list-voices to see all.",
    )
    parser.add_argument(
        "--speed", "-s",
        type=float,
        default=1.0,
        help="Speech speed multiplier 0.5–2.0 (default: 1.0). Try 0.9–1.05 for podcasts.",
    )
    parser.add_argument(
        "--list-voices",
        action="store_true",
        help="Print available voices and exit.",
    )
    args = parser.parse_args()

    if args.list_voices:
        print("\nAvailable Kokoro voices:\n")
        for vid, desc in VOICES.items():
            marker = " *" if vid == DEFAULT_VOICE else "  "
            print(f"{marker} {vid:<15} {desc}")
        print(f"\n  (* default)\n")
        return

    narration = read_narration(args.input)
    word_count = len(narration.split())
    print(f"Input    : {word_count} words", file=sys.stderr)

    audio = generate_audio(narration, voice=args.voice, speed=args.speed)

    duration_s = len(audio) / SAMPLE_RATE
    minutes, seconds = divmod(int(duration_s), 60)
    print(f"Duration : {minutes}m {seconds:02d}s", file=sys.stderr)

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(out_path), audio, SAMPLE_RATE)
    print(f"Saved    : {out_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
