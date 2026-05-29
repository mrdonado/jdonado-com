#!/usr/bin/env node
/**
 * generate-youtube-simple-cover-image.mjs
 *
 * Renders a simplified YouTube-only thumbnail:
 * - Almost full-bleed hero image with a clean contour
 * - Very large title at the bottom for readability
 *
 * Usage:
 *   node scripts/generate-youtube-simple-cover-image.mjs
 *   node scripts/generate-youtube-simple-cover-image.mjs --post thinking-like-an-engineer
 *   node scripts/generate-youtube-simple-cover-image.mjs --post thinking-like-an-engineer --title "Custom title"
 */

import puppeteer from 'puppeteer'
import { spawn, spawnSync } from 'child_process'
import { readFileSync, mkdirSync } from 'fs'
import { resolve, dirname, basename, extname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const PODCAST_ROOT = resolve(ROOT, 'podcast')
const BLOG_DIR = resolve(ROOT, 'src', 'content', 'blog')
const COVER_PAGE = resolve(PODCAST_ROOT, 'cover-youtube-simple', 'index.html')
const DEFAULT_OUTPUT_ROOT = resolve(PODCAST_ROOT, 'output')

function parseArgs(argv) {
  const args = {
    post: null,
    title: null,
    output: null,
    open: false,
    all: false,
  }

  for (let i = 2; i < argv.length; i += 1) {
    const value = argv[i]
    if (value === '--post' || value === '-p') args.post = argv[++i]
    else if (value === '--title') args.title = argv[++i]
    else if (value === '--output' || value === '-o') args.output = argv[++i]
    else if (value === '--open') args.open = true
    else if (value === '--all') args.all = true
    else if (value === '--help' || value === '-h') args.help = true
  }

  return args
}

function helpText() {
  return `Usage: node scripts/generate-youtube-simple-cover-image.mjs [options]\n\nOptions:\n  -p, --post <slug|file>   Select a blog post by slug or file path\n      --title <text>       Override title text (defaults to post title)\n  -o, --output <file>      Output PNG file path\n      --open               Open the output folder after render\n      --all                List all posts and render the newest one\n  -h, --help               Show this help text\n`
}

function parseFrontmatter(filePath) {
  const raw = readFileSync(filePath, 'utf8')
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/)
  const metadataBlock = match ? match[1] : ''
  const metadata = {}

  for (const line of metadataBlock.split(/\r?\n/)) {
    const matchLine = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/)
    if (!matchLine) continue
    const [, key, rawValue] = matchLine
    const value = rawValue.trim().replace(/^['"]|['"]$/g, '')
    metadata[key] = value
  }

  return metadata
}

function listPosts() {
  const entries = []
  const result = spawnSync('sh', ['-lc', `find ${JSON.stringify(BLOG_DIR)} -type f \\( -name '*.md' -o -name '*.mdx' \\) | sort -r`], { encoding: 'utf8' })
  if (result.status !== 0) {
    throw new Error(result.stderr || 'Failed to list blog posts')
  }

  for (const filePath of result.stdout.split(/\r?\n/).filter(Boolean)) {
    const metadata = parseFrontmatter(filePath)
    entries.push({
      filePath,
      title: metadata.title || basename(filePath, extname(filePath)),
      heroImage: metadata.heroImage || '',
      slug: basename(filePath, extname(filePath)),
    })
  }

  return entries
}

function pickPost(posts, requested) {
  if (requested) {
    const normalized = requested.trim()
    const direct = posts.find((post) => post.slug === normalized || post.filePath.endsWith(normalized))
    if (direct) return direct

    const fuzzy = posts.filter((post) =>
      post.slug.includes(normalized) || post.title.toLowerCase().includes(normalized.toLowerCase())
    )
    if (fuzzy.length === 1) return fuzzy[0]
    if (fuzzy.length > 1) return fuzzy[0]

    throw new Error(`Could not find a post matching: ${requested}`)
  }

  const fzf = spawnSync('fzf', ['--delimiter=\t', '--with-nth=1', '--prompt=Select post > ', '--height=40%', '--reverse', '--info=inline'], {
    input: posts.map((post) => `${post.title}\t${post.slug}`).join('\n'),
    encoding: 'utf8',
  })

  if (fzf.status === 0 && fzf.stdout.trim()) {
    const slug = fzf.stdout.trim().split('\t')[1]
    const selected = posts.find((post) => post.slug === slug)
    if (selected) return selected
  }

  if (!process.stdin.isTTY) return posts[0]

  console.log('\nAvailable posts:\n')
  posts.forEach((post, index) => {
    console.log(`${String(index + 1).padStart(3, ' ')}. ${post.title}`)
  })
  console.log('')

  const prompt = new Promise((resolvePromise) => {
    process.stdout.write('Enter post number: ')
    process.stdin.setEncoding('utf8')
    process.stdin.once('data', (data) => resolvePromise(data.trim()))
  })

  return prompt.then((answer) => {
    const index = Number(answer) - 1
    if (Number.isFinite(index) && index >= 0 && index < posts.length) return posts[index]
    throw new Error('Invalid post selection')
  })
}

function buildUrl(params) {
  const url = new URL(pathToFileURL(COVER_PAGE).href)
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value)
  }
  return url.toString()
}

function resolveHeroImagePath(heroImage) {
  if (!heroImage) return null
  const normalized = heroImage.startsWith('/') ? heroImage.slice(1) : heroImage
  return resolve(ROOT, normalized)
}

function fileToDataUrl(filePath) {
  const raw = readFileSync(filePath)
  const extension = extname(filePath).toLowerCase()
  const mimeType =
    extension === '.png'
      ? 'image/png'
      : extension === '.webp'
        ? 'image/webp'
        : extension === '.gif'
          ? 'image/gif'
          : 'image/jpeg'
  return `data:${mimeType};base64,${raw.toString('base64')}`
}

async function main() {
  const args = parseArgs(process.argv)
  if (args.help) {
    console.log(helpText())
    process.exit(0)
  }

  const posts = listPosts()
  if (!posts.length) throw new Error(`No posts found in ${BLOG_DIR}`)

  const picked = args.all ? posts[0] : await Promise.resolve(pickPost(posts, args.post))
  const post = picked

  const title = args.title ? args.title.trim() : post.title.trim().replace(/\s+/g, ' ')
  const heroImagePath = resolveHeroImagePath(post.heroImage)
  const heroImageDataUrl = heroImagePath ? fileToDataUrl(heroImagePath) : null

  const outputFile = args.output
    ? resolve(PODCAST_ROOT, args.output)
    : resolve(DEFAULT_OUTPUT_ROOT, post.slug, 'youtube-cover-simple.png')
  const outputDir = dirname(outputFile)
  mkdirSync(outputDir, { recursive: true })

  const url = buildUrl({ title })
  console.log(`Rendering simple cover from: ${url}`)
  console.log(`Output file               : ${outputFile}`)

  const browser = await puppeteer.launch({ headless: true })
  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 })
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30_000 })

    if (heroImageDataUrl) {
      await page.evaluate(
        async ({ imageDataUrl, imageAlt }) => {
          const img = document.querySelector('[data-hero-image]')
          if (!img) return
          img.alt = imageAlt || ''
          img.src = imageDataUrl
          if (img.decode) {
            try {
              await img.decode()
            } catch {
              // Ignore decode failures; screenshot can still proceed.
            }
          }
        },
        {
          imageDataUrl: heroImageDataUrl,
          imageAlt: post.title,
        }
      )
      await page.waitForFunction(() => {
        const img = document.querySelector('[data-hero-image]')
        return Boolean(img && img.complete && img.naturalWidth > 0)
      })
    }

    await page.waitForSelector('[data-ready="true"]', { timeout: 10_000 })
    await page.screenshot({ path: outputFile, type: 'png' })
  } finally {
    await browser.close()
  }

  console.log(`✓ Simple YouTube cover written to: ${outputFile}`)

  if (args.open) {
    const folder = dirname(outputFile)
    const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
    spawn(opener, [folder], { detached: true, stdio: 'ignore' }).unref()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
