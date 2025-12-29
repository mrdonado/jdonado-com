const initFooter = () => {
	document.body.classList.add('transition-colors', 'duration-300', 'ease-in-out')

	const showCookieBanner = document.getElementById('show-cookie-banner')
	const cookieBanner = document.getElementById('cookie-banner')

	if (showCookieBanner && cookieBanner && !showCookieBanner.dataset.bound) {
		showCookieBanner.addEventListener('click', () => {
			cookieBanner.classList.remove('hidden')
		})
		showCookieBanner.dataset.bound = 'true'
	}
}

const start = () => {
	initFooter()
}

if (document.readyState !== 'loading') {
	start()
} else {
	document.addEventListener('DOMContentLoaded', start, { once: true })
}

document.addEventListener('astro:page-load', start)
document.addEventListener('astro:after-swap', start)
