const initCounters = () => {
	const observerOptions = {
		root: null,
		rootMargin: '0px',
		threshold: 0.1
	}

	const observer = new IntersectionObserver((entries, observerRef) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				const counter = entry.target as HTMLElement
				const target = parseInt(counter.dataset.target || '0', 10)
				const duration = Math.floor(Math.random() * (2500 - 1500 + 1) + 1500)
				const start = 0
				const startTime = performance.now()

				interface CounterAnimationState {
					target: number
					duration: number
					start: number
					startTime: number
					counter: HTMLElement
				}

				const updateCount = (currentTime: DOMHighResTimeStamp): void => {
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
		const el = counter as HTMLElement
		el.innerText = '0'
		observer.observe(el)
	})
}

const startStatsHighlight = () => {
	initCounters()
}

if (document.readyState !== 'loading') {
	startStatsHighlight()
} else {
	document.addEventListener('DOMContentLoaded', startStatsHighlight, { once: true })
}

document.addEventListener('astro:page-load', startStatsHighlight)
document.addEventListener('astro:after-swap', startStatsHighlight)
