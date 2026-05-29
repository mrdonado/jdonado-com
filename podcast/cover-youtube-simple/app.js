const DEFAULTS = {
  title: 'Thinking Like an Engineer',
}

function readParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    title: params.get('title') || DEFAULTS.title,
  }
}

function formatTitle(rawTitle) {
  const compact = rawTitle.replace(/\s+/g, ' ').trim()
  // Turn separator hyphens into explicit line breaks for clearer two-line titles.
  return compact.replace(/\s[-–—]\s/g, '\n')
}

function fits(element, sizePx) {
  element.style.fontSize = `${sizePx}px`
  const computed = window.getComputedStyle(element)
  const lineHeight = Number.parseFloat(computed.lineHeight)
  const lines = lineHeight > 0 ? Math.round(element.scrollHeight / lineHeight) : 99

  return (
    element.scrollHeight <= element.clientHeight &&
    element.scrollWidth <= element.clientWidth &&
    lines <= 2
  )
}

function fitHeadline() {
  const titleZone = document.querySelector('.title-zone')
  const headline = document.querySelector('[data-title]')
  if (!titleZone || !headline) return

  const zoneHeight = Math.max(190, Math.floor(window.innerHeight * 0.24))
  const descenderSafety = Math.max(12, Math.floor(zoneHeight * 0.07))
  titleZone.style.height = `${zoneHeight}px`
  headline.style.maxHeight = `${zoneHeight - descenderSafety}px`

  let low = 96
  let high = 460
  let best = low

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if (fits(headline, mid)) {
      best = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  headline.style.fontSize = `${best}px`
}

function main() {
  const data = readParams()
  const title = document.querySelector('[data-title]')
  if (title) title.textContent = formatTitle(data.title)

  fitHeadline()
  window.addEventListener('resize', fitHeadline)
  document.title = `${data.title} - YouTube Cover`
  document.documentElement.dataset.ready = 'true'
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main, { once: true })
} else {
  main()
}
