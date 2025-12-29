class ThemeToggle extends HTMLElement {
	constructor() {
		super()
		const button = this.querySelector('button')
		if (button) {
			button.addEventListener('click', (e) => {
				const current = e.currentTarget
				if (!(current instanceof HTMLButtonElement)) return
				const isPressed = current.getAttribute('aria-pressed') === 'true'
				const themeChangeEvent = new CustomEvent('theme-change', {
					detail: { theme: isPressed ? 'light' : 'dark' }
				})
				document.dispatchEvent(themeChangeEvent)
				current.setAttribute('aria-pressed', String(!isPressed))
			})
		}
	}
}

const registerElement = () => {
	if ('customElements' in window && !customElements.get('theme-toggle')) {
		customElements.define('theme-toggle', ThemeToggle)
	}
}

const syncButtonPressed = () => {
	const button = document.getElementById('toggle-theme')
	if (!button) return
	const isDark = document.documentElement.classList.contains('dark')
	button.setAttribute('aria-pressed', String(isDark))
}

const start = () => {
	registerElement()
	syncButtonPressed()
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', start, { once: true })
} else {
	start()
}

document.addEventListener('astro:page-load', start)
document.addEventListener('astro:after-swap', start)
