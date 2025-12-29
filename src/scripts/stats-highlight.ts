const initCounters = () => {
	const observerOptions = {
		root: null,
		rootMargin: '0px',
		threshold: 0.1
	}

	const observer = new IntersectionObserver((entries, observerRef) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				const counter = entry.target
				const target = parseInt(counter.dataset.target || '0', 10)
				const duration = Math.floor(Math.random() * (2500 - 1500 + 1) + 1500)
				const start = 0
				const startTime = performance.now()

				const updateCount = (currentTime) => {
					const elapsed = currentTime - startTime
					const progress = Math.min(elapsed / duration, 1)
					const easeOut = 1 - Math.pow(1 - progress, 3)
					const current = Math.floor(start + (target - start) * easeOut)
					counter.innerText = current.toString()
					if (progress < 1) {
						requestAnimationFrame(updateCount)
					} else {
						counter.innerText = target.toString()
					}
				}

				requestAnimationFrame(updateCount)
				observerRef.unobserve(counter)
			}
		})
	}, observerOptions)

	document.querySelectorAll('.js-counter').forEach((counter) => {
		const el = counter
		el.innerText = '0'
		observer.observe(el)
	})
}

const start = () => {
	initCounters()
}

if (document.readyState !== 'loading') {
	start()
} else {
	document.addEventListener('DOMContentLoaded', start, { once: true })
}

document.addEventListener('astro:page-load', start)
document.addEventListener('astro:after-swap', start)
