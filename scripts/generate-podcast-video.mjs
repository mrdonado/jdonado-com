#!/usr/bin/env node
/**
 * generate-podcast-video.mjs
 *
 * Builds a podcast video from a static cover image + audio track.
 * The generated video includes a fade-in at the beginning and a fade-to-black at the end.
 *
 * Usage:
 *   node scripts/generate-podcast-video.mjs --episode 2026-01-21-thinking-like-an-engineer
 *   node scripts/generate-podcast-video.mjs --episode-dir podcast/output/my-episode
 *   node scripts/generate-podcast-video.mjs --image podcast/output/my-episode/youtube-cover.png --audio podcast/output/my-episode/audio.mp3
 */

import { readdirSync, statSync, existsSync } from 'fs'
import { basename, dirname, isAbsolute, resolve } from 'path'
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const PODCAST_ROOT = resolve(ROOT, 'podcast')
const OUTPUT_ROOT = resolve(PODCAST_ROOT, 'output')

function parseArgs(argv) {
  const args = {
    episode: null,
    episodeDir: null,
    image: null,
    audio: null,
    output: null,
    fadeIn: 1.0,
    fadeOut: 1.2,
    fps: 30,
    waveform: true,
  }

  for (let i = 2; i < argv.length; i += 1) {
    const value = argv[i]
    if (value === '--episode' || value === '-e') args.episode = argv[++i]
    else if (value === '--episode-dir') args.episodeDir = argv[++i]
    else if (value === '--image') args.image = argv[++i]
    else if (value === '--audio') args.audio = argv[++i]
    else if (value === '--output' || value === '-o') args.output = argv[++i]
    else if (value === '--fade-in') args.fadeIn = Number(argv[++i])
    else if (value === '--fade-out') args.fadeOut = Number(argv[++i])
    else if (value === '--fps') args.fps = Number(argv[++i])
    else if (value === '--no-waveform') args.waveform = false
    else if (value === '--help' || value === '-h') args.help = true
  }

  return args
}

function helpText() {
  return `Usage: node scripts/generate-podcast-video.mjs [options]\n\nOptions:\n  -e, --episode <name>       Episode folder under podcast/output\n      --episode-dir <path>   Absolute or relative path to an episode folder\n      --image <path>         Cover image path (default: <episode>/youtube-cover.png)\n      --audio <path>         Audio path (default: <episode>/audio.mp3 then audio.wav)\n  -o, --output <path>        Output video path (default: <episode>/podcast-video.mp4)\n      --fade-in <seconds>    Fade-in duration in seconds (default: 1.0)\n      --fade-out <seconds>   Fade-out duration in seconds (default: 1.2)\n      --fps <number>         Video FPS (default: 30)\n      --no-waveform          Disable waveform visualization overlay\n  -h, --help                 Show this help text\n`
}

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, { stdio: 'pipe', encoding: 'utf8', ...options })
  if (result.status !== 0) {
    const stderr = result.stderr?.trim()
    const stdout = result.stdout?.trim()
    throw new Error(stderr || stdout || `${cmd} failed`)
  }
  return result.stdout?.trim() || ''
}

function commandExists(command) {
  return spawnSync(command, ['-version'], { stdio: 'ignore' }).status === 0
}

function resolvePath(input) {
  if (!input) return null
  return isAbsolute(input) ? input : resolve(process.cwd(), input)
}

function mostRecentEpisodeDir() {
  const entries = readdirSync(OUTPUT_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const fullPath = resolve(OUTPUT_ROOT, entry.name)
      return {
        path: fullPath,
        mtimeMs: statSync(fullPath).mtimeMs,
      }
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs)

  return entries[0]?.path || null
}

function resolveEpisodeDir(args) {
  if (args.episodeDir) return resolvePath(args.episodeDir)
  if (args.episode) return resolve(OUTPUT_ROOT, args.episode)
  return mostRecentEpisodeDir()
}

function resolveInputFiles(episodeDir, args) {
  const image = resolvePath(args.image) || resolve(episodeDir, 'youtube-cover.png')

  let audio = resolvePath(args.audio)
  if (!audio) {
    const mp3 = resolve(episodeDir, 'audio.mp3')
    const wav = resolve(episodeDir, 'audio.wav')
    audio = existsSync(mp3) ? mp3 : wav
  }

  return { image, audio }
}

function getAudioInfo(audioFile) {
  const output = run('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration:stream=sample_rate',
    '-select_streams', 'a:0',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    audioFile,
  ])

  const [sampleRateRaw, durationRaw] = output.split(/\r?\n/)
  const sampleRate = Number(sampleRateRaw)
  const duration = Number(durationRaw)

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Could not read audio duration for ${audioFile}`)
  }
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) {
    throw new Error(`Could not read audio sample rate for ${audioFile}`)
  }

  return { duration, sampleRate }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function main() {
  const args = parseArgs(process.argv)
  if (args.help) {
    console.log(helpText())
    process.exit(0)
  }

  if (!commandExists('ffmpeg')) {
    throw new Error('ffmpeg is required but was not found in PATH.')
  }
  if (!commandExists('ffprobe')) {
    throw new Error('ffprobe is required but was not found in PATH.')
  }

  const episodeDir = resolveEpisodeDir(args)
  if (!episodeDir || !existsSync(episodeDir)) {
    throw new Error('Could not resolve an episode folder. Use --episode or --episode-dir.')
  }

  const { image, audio } = resolveInputFiles(episodeDir, args)
  if (!image || !existsSync(image)) {
    throw new Error(`Cover image not found: ${image || '<unset>'}`)
  }
  if (!audio || !existsSync(audio)) {
    throw new Error(`Audio file not found: ${audio || '<unset>'}`)
  }

  const output = resolvePath(args.output) || resolve(episodeDir, 'podcast-video.mp4')
  const { duration, sampleRate } = getAudioInfo(audio)

  const fadeIn = clamp(args.fadeIn, 0, Math.max(0, duration - 0.05))
  const maxFadeOut = Math.max(0, duration - fadeIn - 0.05)
  const fadeOut = clamp(args.fadeOut, 0, maxFadeOut)
  const fadeOutStart = Math.max(0, duration - fadeOut)

  // Upsample the waveform input so we can run at a higher visual rate while
  // still keeping full-width rendering with draw=full.
  const waveformSampleRate = 96000
  const waveformRateMax = Math.max(1, Math.floor(waveformSampleRate / 1920))
  const waveformRate = Math.min(args.fps * 2, waveformRateMax)

  let complexFilter
  if (args.waveform) {
    complexFilter = `[0]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p,fade=t=in:st=0:d=${fadeIn.toFixed(3)},fade=t=out:st=${fadeOutStart.toFixed(3)}:d=${fadeOut.toFixed(3)}[base];[1]aresample=${waveformSampleRate},showwaves=s=1920x280:mode=cline:colors=white@0.45:scale=log:rate=${waveformRate}:draw=full[wave];[base][wave]overlay=0:(H-h)/2:format=auto[out]`
  } else {
    const filter = [
      `scale=1920:1080:force_original_aspect_ratio=decrease`,
      `pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black`,
      `format=yuv420p`,
      `fade=t=in:st=0:d=${fadeIn.toFixed(3)}`,
      `fade=t=out:st=${fadeOutStart.toFixed(3)}:d=${fadeOut.toFixed(3)}`,
    ].join(',')
    complexFilter = filter
  }

  console.log(`Episode folder: ${episodeDir}`)
  console.log(`Image        : ${image}`)
  console.log(`Audio        : ${audio}`)
  console.log(`Sample rate  : ${sampleRate}Hz`)
  console.log(`Duration     : ${duration.toFixed(2)}s`)
  console.log(`Fade in/out  : ${fadeIn.toFixed(2)}s / ${fadeOut.toFixed(2)}s`)
  console.log(`Waveform     : ${args.waveform ? 'enabled' : 'disabled'}`)
  if (args.waveform) console.log(`Wave rate    : ${waveformRate} fps`)
  console.log(`Output       : ${output}`)

  const ffmpegArgs = [
    '-y',
    '-loop', '1',
    '-framerate', String(args.fps),
    '-i', image,
    '-i', audio,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-tune', 'stillimage',
    '-pix_fmt', 'yuv420p',
  ]

  if (args.waveform) {
    ffmpegArgs.push('-filter_complex', complexFilter)
    ffmpegArgs.push('-map', '[out]')
    ffmpegArgs.push('-map', '1:a')
  } else {
    ffmpegArgs.push('-vf', complexFilter)
  }

  ffmpegArgs.push(
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    '-movflags', '+faststart',
    output,
  )

  run('ffmpeg', ffmpegArgs)

  console.log(`✓ Podcast video written to: ${output}`)
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
