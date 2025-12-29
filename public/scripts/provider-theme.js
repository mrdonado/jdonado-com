;(() => {
	const getTheme = () => {
		try {
			const storedTheme = localStorage.getItem('theme')
			if (storedTheme) return storedTheme
		} catch (e) {}
		return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
	}

	let lastApplied = ''
	const setTheme = (newTheme) => {
		if (newTheme === lastApplied) return
		const html = document.documentElement
		const isDark = newTheme === 'dark'

		html.classList.toggle('dark', isDark)
		html.classList.toggle('light', !isDark)
		lastApplied = newTheme

		try {
			localStorage.setItem('theme', newTheme)
		} catch (e) {}
	}

	const applyStoredTheme = () => {
		setTheme(getTheme())
	}

	let themeListenerBound = false
	const bindThemeChangeListener = () => {
		if (themeListenerBound) return
		document.addEventListener('theme-change', (e) => {
			setTheme(e.detail.theme)
		})
		themeListenerBound = true
	}

	const start = () => {
		applyStoredTheme()
		bindThemeChangeListener()
	}

	// Run immediately (blocking)
	start()

	// Re-apply on navigation lifecycle events
	document.addEventListener('astro:page-load', start)
	document.addEventListener('astro:after-swap', start)
})()
