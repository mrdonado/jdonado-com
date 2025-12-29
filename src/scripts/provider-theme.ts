;(() => {
	const getTheme = (): string => {
		try {
			const storedTheme = localStorage.getItem('theme')
			if (storedTheme) return storedTheme
		} catch (e) {}
		return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
	}

	let lastApplied = ''
	const setTheme = (newTheme: string, animate = false): void => {
		if (newTheme === lastApplied) return
		const html = document.documentElement
		const isDark = newTheme === 'dark'

		if (animate) {
			html.classList.add('theme-transition')
		}

		html.classList.toggle('dark', isDark)
		html.classList.toggle('light', !isDark)
		lastApplied = newTheme

		if (animate) {
			setTimeout(() => {
				html.classList.remove('theme-transition')
			}, 300)
		}

		try {
			localStorage.setItem('theme', newTheme)
		} catch (e) {}
	}

	const applyStoredTheme = (): void => {
		setTheme(getTheme())
	}

	let themeListenerBound = false
	const bindThemeChangeListener = (): void => {
		if (themeListenerBound) return
		document.addEventListener('theme-change', (e) => {
			setTheme((e as CustomEvent<{ theme: string }>).detail.theme, true)
		})
		themeListenerBound = true
	}

	const start = (): void => {
		applyStoredTheme()
		bindThemeChangeListener()
	}

	start()

	document.addEventListener('astro:page-load', start)
	document.addEventListener('astro:after-swap', start)
})()
