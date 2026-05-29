#!/usr/bin/env node
/**
 * build-podcast-video.mjs
 *
 * One-command orchestrator:
 *   1) Select article once
 *   2) Generate narration
 *   3) Generate WAV audio
 *   4) Convert WAV -> MP3
 *   5) Generate cover image
 *   6) Generate final MP4 (cover + audio track + fades)
 *
 * Usage:
 *   node scripts/build-podcast-video.mjs
 *   node scripts/build-podcast-video.mjs --post thinking-like-an-engineer
 *   node scripts/build-podcast-video.mjs --voice am_michael --speed 0.95
 */

import { spawnSync } from 'child_process'
import { mkdirSync, readFileSync } from 'fs'
import { basename, dirname, extname, resolve } from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const PODCAST_ROOT = resolve(ROOT, 'podcast')
const BLOG_DIR = resolve(ROOT, 'src', 'content', 'blog')
const OUTPUT_ROOT = resolve(PODCAST_ROOT, 'output')

function parseArgs(argv) {
  const args = {
    post: null,
    name: null,
    youtubeTitle: null,
    voice: 'af_heart',
    speed: 1.0,
    fadeIn: 1.0,
    fadeOut: 1.2,
    python: process.env.PODCAST_PYTHON || 'python',
  }

  for (let i = 2; i < argv.length; i += 1) {
    const value = argv[i]
    if (value === '--post' || value === '-p') args.post = argv[++i]
    else if (value === '--name' || value === '-n') args.name = argv[++i]
    else if (value === '--youtube-title') args.youtubeTitle = argv[++i]
    else if (value === '--voice' || value === '-v') args.voice = argv[++i]
    else if (value === '--speed' || value === '-s') args.speed = Number(argv[++i])
    else if (value === '--fade-in') args.fadeIn = Number(argv[++i])
    else if (value === '--fade-out') args.fadeOut = Number(argv[++i])
    else if (value === '--python') args.python = argv[++i]
    else if (value === '--help' || value === '-h') args.help = true
  }

  return args
}

function helpText() {
  return `Usage: node scripts/build-podcast-video.mjs [options]\n\nOptions:\n  -p, --post <slug|file>   Select a post by slug or file path\n  -n, --name <episode>     Output episode directory name (default: post slug)\n      --youtube-title <t>  Override title for the simple YouTube-only cover\n  -v, --voice <voice>      Kokoro voice ID (default: af_heart)\n  -s, --speed <number>     TTS speed multiplier (default: 1.0)\n      --fade-in <seconds>  Video fade-in duration (default: 1.0)\n      --fade-out <seconds> Video fade-out duration (default: 1.2)\n      --python <command>   Python executable (default: PODCAST_PYTHON env or python)\n  -h, --help               Show this help text\n`
}

function banner(title) {
  const line = '-'.repeat(64)
  console.log(`\n${line}`)
  console.log(`  ${title}`)
  console.log(`${line}\n`)
}

function run(command, args, goal) {
  if (goal) console.log(goal)
  const result = spawnSync(command, args, { stdio: 'inherit' })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function shell(command) {
  const result = spawnSync('sh', ['-lc', command], { encoding: 'utf8' })
  if (result.status !== 0) {
    throw new Error(result.stderr || 'Shell command failed')
  }
  return result.stdout
}

function parseFrontmatter(filePath) {
  const raw = readFileSync(filePath, 'utf8')
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/) || null
  const block = match ? match[1] : ''
  const metadata = {}

  for (const line of block.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/)
    if (!m) continue
    metadata[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '')
  }

  return metadata
}

function listPosts() {
  const raw = shell(`find ${JSON.stringify(BLOG_DIR)} -type f \\( -name '*.md' -o -name '*.mdx' \\) | sort -r`)
  return raw
    .split(/\r?\n/)
    .filter(Boolean)
    .map((filePath) => {
      const meta = parseFrontmatter(filePath)
      return {
        filePath,
        slug: basename(filePath, extname(filePath)),
        title: meta.title || basename(filePath, extname(filePath)),
      }
    })
}

function pickPostFuzzy(posts, query) {
  const needle = query.trim().toLowerCase()
  const direct = posts.find((p) => p.slug === needle || p.filePath.endsWith(query))
  if (direct) return direct

  const fuzzy = posts.filter((p) => p.slug.includes(needle) || p.title.toLowerCase().includes(needle))
  if (fuzzy.length === 1) return fuzzy[0]
  if (fuzzy.length > 1) return fuzzy[0]
  return null
}

function pickPostWithFzf(posts) {
  const result = spawnSync(
    'fzf',
    ['--delimiter=\t', '--with-nth=1', '--prompt=Select post > ', '--height=40%', '--reverse', '--info=inline'],
    {
      input: posts.map((post) => `${post.title}\t${post.slug}`).join('\n'),
      encoding: 'utf8',
    }
  )

  if (result.status !== 0 || !result.stdout.trim()) {
    return null
  }

  const slug = result.stdout.trim().split('\t')[1]
  return posts.find((post) => post.slug === slug) || null
}

function askQuestion(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolvePromise) => {
    rl.question(prompt, (answer) => {
      rl.close()
      resolvePromise(answer.trim())
    })
  })
}

async function pickPost(posts, requested) {
  if (requested) {
    const selected = pickPostFuzzy(posts, requested)
    if (!selected) throw new Error(`Could not find a post matching: ${requested}`)
    return selected
  }

  const fzf = pickPostWithFzf(posts)
  if (fzf) return fzf

  console.log('\nAvailable posts:\n')
  posts.forEach((post, index) => {
    console.log(`${String(index + 1).padStart(3, ' ')}. ${post.title}`)
  })

  const answer = await askQuestion('\nEnter post number: ')
  const index = Number(answer) - 1
  if (!Number.isInteger(index) || index < 0 || index >= posts.length) {
    throw new Error('Invalid post selection')
  }

  return posts[index]
}

async function main() {
  const args = parseArgs(process.argv)
  if (args.help) {
    console.log(helpText())
    return
  }

  const posts = listPosts()
  if (!posts.length) {
    throw new Error(`No posts found in ${BLOG_DIR}`)
  }

  const selected = await pickPost(posts, args.post)
  const episodeName = args.name || selected.slug
  const episodeDir = resolve(OUTPUT_ROOT, episodeName)
  mkdirSync(episodeDir, { recursive: true })

  const narrationFile = resolve(episodeDir, 'narration.txt')
  const wavFile = resolve(episodeDir, 'audio.wav')
  const mp3File = resolve(episodeDir, 'audio.mp3')
  const coverFile = resolve(episodeDir, 'youtube-cover.png')
  const youtubeSimpleCoverFile = resolve(episodeDir, 'youtube-cover-simple.png')
  const videoFile = resolve(episodeDir, 'podcast-video.mp4')

  console.log(`\nSelected post : ${selected.title}`)
  console.log(`Slug          : ${selected.slug}`)
  console.log(`Episode dir   : ${episodeDir}`)

  banner('Step 1 / 5 - Narration')
  run(args.python, [
    resolve(PODCAST_ROOT, 'generate_narration.py'),
    '--post', selected.filePath,
    '--output', narrationFile,
  ], `Generating narration from ${selected.slug}...`)

  banner('Step 2 / 5 - Audio (WAV)')
  run(args.python, [
    resolve(PODCAST_ROOT, 'generate_audio.py'),
    '--input', narrationFile,
    '--output', wavFile,
    '--voice', args.voice,
    '--speed', String(args.speed),
  ], `Generating WAV with voice ${args.voice}...`)

  banner('Step 3 / 5 - WAV to MP3')
  run('ffmpeg', [
    '-y',
    '-i', wavFile,
    '-codec:a', 'libmp3lame',
    '-q:a', '2',
    mp3File,
  ], 'Converting WAV to MP3...')

  banner('Step 4 / 6 - Cover image (video)')
  run('node', [
    resolve(ROOT, 'scripts', 'generate-cover-image.mjs'),
    '--post', selected.slug,
    '--output', coverFile,
  ], 'Rendering YouTube cover image...')

  banner('Step 5 / 6 - Cover image (YouTube simple)')
  const simpleCoverArgs = [
    resolve(ROOT, 'scripts', 'generate-youtube-simple-cover-image.mjs'),
    '--post', selected.slug,
    '--output', youtubeSimpleCoverFile,
  ]
  if (args.youtubeTitle && args.youtubeTitle.trim()) {
    simpleCoverArgs.push('--title', args.youtubeTitle.trim())
  }
  run('node', simpleCoverArgs, 'Rendering simplified YouTube-only cover image...')

  banner('Step 6 / 6 - Final MP4')
  run('node', [
    resolve(ROOT, 'scripts', 'generate-podcast-video.mjs'),
    '--episode-dir', episodeDir,
    '--image', coverFile,
    '--audio', mp3File,
    '--fade-in', String(args.fadeIn),
    '--fade-out', String(args.fadeOut),
    '--output', videoFile,
  ], 'Building final YouTube-ready video...')

  const line = '-'.repeat(64)
  console.log(`\n${line}`)
  console.log('  Done!')
  console.log(`  Narration : ${narrationFile}`)
  console.log(`  WAV       : ${wavFile}`)
  console.log(`  MP3       : ${mp3File}`)
  console.log(`  Cover     : ${coverFile}`)
  console.log(`  YT Cover  : ${youtubeSimpleCoverFile}`)
  console.log(`  Video     : ${videoFile}`)
  console.log(`${line}\n`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
