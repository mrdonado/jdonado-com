; (() => {
  const getTheme = () => {
    try {
      const storedTheme = localStorage.getItem('theme')
      if (storedTheme) return storedTheme
    } catch (e) { }
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  }

  let lastApplied = ''
  const setTheme = (newTheme, instant = false) => {
    if (newTheme === lastApplied) return
    const html = document.documentElement
    const isDark = newTheme === 'dark'

    if (instant) {
      html.classList.add('theme-transitioning')
    }

    html.classList.toggle('dark', isDark)
    html.classList.toggle('light', !isDark)
    lastApplied = newTheme

    if (instant) {
      // Force reflow then remove the class
      html.offsetHeight
      html.classList.remove('theme-transitioning')
    }

    try {
      localStorage.setItem('theme', newTheme)
    } catch (e) { }
  }

  const applyStoredTheme = () => {
    setTheme(getTheme())
  }

  let themeListenerBound = false
  const bindThemeChangeListener = () => {
    if (themeListenerBound) return
    document.addEventListener('theme-change', (e) => {
      setTheme(e.detail.theme, true)
    })
    themeListenerBound = true
  }

  const start = () => {
    applyStoredTheme()
    bindThemeChangeListener()
  }

  start()

  document.addEventListener('astro:page-load', start)
  document.addEventListener('astro:after-swap', start)
})()
