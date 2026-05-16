/**
 * generate-cv-pdf.mjs
 *
 * Generates a PDF of the CV from the print page.
 *
 * Usage:
 *   # If the dev server is already running:
 *   node scripts/generate-cv-pdf.mjs
 *
 *   # Or let the script start and stop the dev server for you:
 *   pnpm generate-cv
 *
 * The output PDF is written to: public/javier-donado-cv.pdf
 *
 * Environment variables:
 *   BASE_URL  Override the server URL (default: http://localhost:4321)
 */

import puppeteer from 'puppeteer'
import { spawn } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OUTPUT_PATH = resolve(ROOT, 'public', 'javier-donado-cv.pdf')
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4321'
const PRINT_URL = `${BASE_URL}/cv/print`

/** Poll until the server responds, or throw on timeout. */
async function waitForServer(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) })
      if (res.ok) return
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`)
}

/** Render the print page and write a PDF. */
async function generatePDF() {
  console.log(`Generating PDF from ${PRINT_URL} …`)
  const browser = await puppeteer.launch({ headless: true })
  try {
    const page = await browser.newPage()
    await page.goto(PRINT_URL, { waitUntil: 'networkidle0', timeout: 30_000 })
    await page.pdf({
      path: OUTPUT_PATH,
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' }
    })
    console.log(`✓ PDF written to: ${OUTPUT_PATH}`)
  } finally {
    await browser.close()
  }
}

/** Check if the dev server is already running. */
async function serverIsRunning(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) })
    return res.ok
  } catch {
    return false
  }
}

async function main() {
  if (await serverIsRunning(BASE_URL)) {
    // Server already up — just generate the PDF.
    await generatePDF()
    return
  }

  // Start the dev server, generate the PDF, then stop it.
  console.log('Dev server not detected — starting it temporarily …')
  const devServer = spawn('pnpm', ['dev'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe']
  })

  devServer.stdout?.on('data', (d) => process.stdout.write(d))
  devServer.stderr?.on('data', (d) => process.stderr.write(d))

  let exitCode = 0
  try {
    await waitForServer(BASE_URL)
    await generatePDF()
  } catch (err) {
    console.error('PDF generation failed:', err)
    exitCode = 1
  } finally {
    devServer.kill('SIGTERM')
  }

  process.exit(exitCode)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
