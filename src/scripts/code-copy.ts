;(() => {
	const bindCopyButtons = () => {
		const codeBlocks = document.querySelectorAll('pre')
		codeBlocks.forEach((code) => {
			const button = code.querySelector('.copy-button')
			const check = code.querySelector('.check-span')
			if (!button) return
			// Skip if already bound
			if (button.hasAttribute('data-copy-bound')) return
			button.setAttribute('data-copy-bound', 'true')

			button.addEventListener('click', () => {
				navigator.clipboard.writeText(code.textContent?.trim() || '')
				check?.classList.remove('opacity-0')
				button?.classList.add('opacity-0')
				setTimeout(() => {
					check?.classList.add('opacity-0')
					button?.classList.remove('opacity-0')
				}, 2000)
			})
		})
	}

	const start = () => {
		bindCopyButtons()
	}

	if (document.readyState !== 'loading') {
		start()
	} else {
		document.addEventListener('DOMContentLoaded', start, { once: true })
	}

	document.addEventListener('astro:after-swap', start)
})()
