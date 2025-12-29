const highlightHeadings = () => {
	const headings = document.querySelectorAll(
		'div.prose h1, div.prose h2, div.prose h3, div.prose h4, div.prose h5, div.prose h6'
	)
	if (!headings.length) return

	const handleIntersection = (entries) => {
		entries.forEach((entry) => {
			const index = document.querySelector(`aside a[href="#${entry.target.id}"]`)
			if (entry.isIntersecting) {
				index?.classList.add('font-bold', 'transition-colors', 'duration-200')
			} else {
				index?.classList.remove('font-bold', 'transition-colors', 'duration-200')
			}
		})
	}

	const options = {
		root: null,
		rootMargin: ' 15% 0px 0% 0px ',
		threshold: 1
	}

	const observer = new IntersectionObserver(handleIntersection, options)
	headings.forEach((heading) => observer.observe(heading))
}

const start = () => {
	highlightHeadings()
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', start, { once: true })
} else {
	start()
}

document.addEventListener('astro:after-swap', start)
