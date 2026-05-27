# Podcast Scripts

Tools for generating a YouTube podcast video from a blog post.

## Quick start

```bash
python podcast_pipeline.py                          # full run, timestamp-named episode
python podcast_pipeline.py --name my-post-slug      # named episode
python podcast_pipeline.py --name my-post-slug \
    --voice af_bella --speed 0.95                   # custom voice + speed
python podcast_pipeline.py --name my-post-slug \
    --skip-narration                                # re-run TTS only (reuses narration.txt)
```

Output is written to `output/<name>/`:

| File | Contents |
|------|----------|
| `narration.txt` | Clean narration script |
| `audio.wav` | Uncompressed audio (24 kHz) |
| `audio.mp3` | Final podcast audio (~190 kbps VBR) |

## Steps

| # | Script | Purpose |
|---|--------|---------|
| 1 | `generate_narration.py` | Post → clean narration script (programmatic markdown cleaner) |
| 2 | `generate_audio.py` | Narration script → WAV audio (Kokoro TTS) |
| 2b | `preview_voices.py` | Generate short clips to compare voices quickly |
| – | `podcast_pipeline.py` | Runs all steps end-to-end |
| … | *(more steps to come)* | Video assembly, etc. |

---

## Step 1 – Narration generation

### Prerequisites (all steps)

**Python environment**

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

For CUDA support make sure you install the GPU-enabled PyTorch wheel that
matches your driver, e.g.:

```bash
pip install torch --index-url https://download.pytorch.org/whl/cu124
```

**fzf** (for the interactive post picker)

```bash
# macOS
brew install fzf
# Debian / Ubuntu
sudo apt install fzf
# Arch
sudo pacman -S fzf
```

### Usage

```bash
# Interactive post picker → narration printed to stdout
python generate_narration.py

# Save to a file
python generate_narration.py --output output/my-post-narration.txt

# Skip prepending metadata if needed
python generate_narration.py --no-title --no-description
```

### What it does

- Removes markdown/MDX syntax (headings, links, emphasis, blockquotes, list markers).
- Removes fenced/inline code blocks and indented code sections.
- Removes special visual symbols and normalizes punctuation.
- Keeps readable prose only, suitable for direct TTS input.

---

## Step 2 – Audio generation

### Usage

```bash
# From a narration file
python generate_audio.py --input output/narration.txt --output output/audio.wav

# Pipe directly from Step 1 (no intermediate file)
python generate_narration.py | python generate_audio.py --output output/audio.wav

# List available voices
python generate_audio.py --list-voices

# Use a different voice or adjust speed
python generate_audio.py --input output/narration.txt --voice af_bella --speed 0.95
```

### Voice options

| Voice | Description |
|-------|-------------|
| `am_michael` *(default)* | American male, neutral — podcast-friendly |
| `am_adam` | American male, deep |
| `af_heart` | American female, warm and expressive |
| `af_bella` | American female, bright |
| `af_sarah` | American female, clear |
| `bm_george` | British male |
| `bf_emma` | British female |

Run `--list-voices` for the full list.

### Voice preview utility

```bash
# Quick comparison set (recommended defaults)
python preview_voices.py

# Compare all available voices
python preview_voices.py --all

# Compare only specific voices
python preview_voices.py --voices am_michael,af_bella,bm_george

# Use your narration text (first 90 words by default)
python preview_voices.py --input output/narration.txt --max-words 90
```

The utility writes files to `output/voice-preview-<timestamp>/`:

- `am_michael.wav`, `af_bella.wav`, etc.
- `combined.wav` (all selected voices back-to-back)
- `manifest.txt` (voice metadata + sample text)

### Notes

- Output is a 24 kHz WAV file. Convert to MP3 with: `ffmpeg -i audio.wav -q:a 2 audio.mp3`
- The Kokoro ONNX model (~300 MB) is downloaded automatically on first run.
- Speed `0.9`–`1.05` tends to sound most natural for podcasts.
- **CPU** inference is used by default (`onnxruntime`). For **GPU** acceleration:
  ```bash
  pip uninstall onnxruntime && pip install onnxruntime-gpu
  ```
  The script detects `CUDAExecutionProvider` automatically and prints a tip if
  a CUDA GPU is found but `onnxruntime-gpu` is not installed.
