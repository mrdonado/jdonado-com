const DEFAULTS = {
  headline: 'Thinking Like an Engineer',
}

function readParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    headline: params.get('headline') || DEFAULTS.headline,
  }
}

function setText(selector, value) {
  const node = document.querySelector(selector)
  if (node) node.textContent = value
}

function fitsInBox(element, fontSizePx) {
  element.style.fontSize = `${fontSizePx}px`
  return element.scrollWidth <= element.clientWidth && element.scrollHeight <= element.clientHeight
}

function formatHeadline(rawHeadline) {
  const compact = rawHeadline.replace(/\s+/g, ' ').trim()
  // Turn separator hyphens into explicit line breaks for clearer two-line titles.
  return compact.replace(/\s[-–—]\s/g, '\n')
}

function fitsHeadline(element, fontSizePx) {
  element.style.fontSize = `${fontSizePx}px`
  const computed = window.getComputedStyle(element)
  const lineHeight = Number.parseFloat(computed.lineHeight)
  const lines = lineHeight > 0 ? Math.round(element.scrollHeight / lineHeight) : 99

  return (
    element.scrollHeight <= element.clientHeight &&
    element.scrollWidth <= element.clientWidth &&
    lines <= 2
  )
}

function fitText(element, { min, max, fitCheck = fitsInBox }) {
  let low = min
  let high = max
  let best = min

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if (fitCheck(element, mid)) {
      best = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  element.style.fontSize = `${best}px`
  return best
}

function fitCopyBlock() {
  const copy = document.querySelector('.copy')
  const headline = document.querySelector('[data-headline]')
  const socialPanel = document.querySelector('.social-panel')
  const podcastBadge = document.querySelector('.podcast-badge')
  const heroPanel = document.querySelector('.visual-panel')
  if (!copy || !headline || !socialPanel || !heroPanel) return

  const heroRect = heroPanel.getBoundingClientRect()
  const socialRectForHeight = socialPanel.getBoundingClientRect()
  const alignedTop = heroRect.bottom - socialRectForHeight.height - 22
  socialPanel.style.top = `${Math.round(alignedTop)}px`
  if (podcastBadge) {
    podcastBadge.style.top = `${Math.round(alignedTop)}px`
  }

  const zoneHeight = Math.max(190, Math.floor(window.innerHeight * 0.24))
  const descenderSafety = Math.max(12, Math.floor(zoneHeight * 0.07))
  copy.style.height = `${zoneHeight}px`
  headline.style.maxHeight = `${zoneHeight - descenderSafety}px`

  fitText(headline, {
    min: 96,
    max: 460,
    fitCheck: fitsHeadline,
  })
}

function scheduleFit() {
  window.requestAnimationFrame(() => {
    fitCopyBlock()
  })
}

window.addEventListener('resize', scheduleFit)

function main() {
  const data = readParams()
  setText('[data-headline]', formatHeadline(data.headline))
  scheduleFit()
  document.title = `${data.headline} – Cover Builder`
  document.documentElement.dataset.ready = 'true'
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main, { once: true })
} else {
  main()
}
