const DEFAULTS = {
  kicker: 'Engineering Notes',
  headline: 'Thinking Like an Engineer',
  subtitle: 'Avoiding the traps that show up when systems get complex.',
}

function readParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    kicker: params.get('kicker') || DEFAULTS.kicker,
    headline: params.get('headline') || DEFAULTS.headline,
    subtitle: params.get('subtitle') || DEFAULTS.subtitle,
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

function fitsSingleLineWidth(element, fontSizePx) {
  element.style.fontSize = `${fontSizePx}px`
  return element.scrollWidth <= element.clientWidth
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
  const kicker = document.querySelector('[data-kicker]')
  const headline = document.querySelector('[data-headline]')
  const subtitle = document.querySelector('[data-subtitle]')
  const socialPanel = document.querySelector('.social-panel')
  const heroPanel = document.querySelector('.visual-panel')
  if (!copy || !kicker || !headline || !subtitle || !socialPanel || !heroPanel) return

  const heroRect = heroPanel.getBoundingClientRect()
  const initialSocialRect = socialPanel.getBoundingClientRect()
  const alignedTop = heroRect.top + heroRect.height / 2 - initialSocialRect.height / 2
  socialPanel.style.top = `${Math.round(alignedTop)}px`

  const copyRect = copy.getBoundingClientRect()
  const socialRect = socialPanel.getBoundingClientRect()
  const styles = getComputedStyle(copy)
  const gap = parseFloat(styles.gap) || 0

  const safeBottom = socialRect.top - 24
  const maxCopyHeight = Math.max(180, safeBottom - copyRect.top)
  copy.style.maxHeight = `${maxCopyHeight}px`

  headline.style.maxWidth = `${copy.clientWidth}px`
  subtitle.style.maxWidth = `${copy.clientWidth}px`

  fitText(headline, {
    min: 34,
    max: 150,
    fitCheck: fitsSingleLineWidth,
  })

  const kickerHeight = kicker.getBoundingClientRect().height
  const headlineHeight = headline.getBoundingClientRect().height
  const used = kickerHeight + headlineHeight + gap * 2
  const subtitleMaxHeight = Math.max(56, maxCopyHeight - used)

  subtitle.style.maxHeight = `${subtitleMaxHeight}px`
  fitText(subtitle, {
    min: 32,
    max: 72,
  })

  while (subtitle.scrollHeight > subtitleMaxHeight && parseFloat(subtitle.style.fontSize) > 32) {
    subtitle.style.fontSize = `${Math.floor(parseFloat(subtitle.style.fontSize) - 1)}px`
  }
}

function scheduleFit() {
  window.requestAnimationFrame(() => {
    fitCopyBlock()
  })
}

window.addEventListener('resize', scheduleFit)

function main() {
  const data = readParams()
  setText('[data-kicker]', data.kicker)
  setText('[data-headline]', data.headline)
  setText('[data-subtitle]', data.subtitle)
  scheduleFit()
  document.title = `${data.headline} – Cover Builder`
  document.documentElement.dataset.ready = 'true'
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main, { once: true })
} else {
  main()
}
