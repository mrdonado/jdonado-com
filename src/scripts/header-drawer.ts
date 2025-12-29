const DRAWER_ID = 'astro-header-drawer'
const DRAWER_BUTTON_ID = 'astro-header-drawer-button'
const DRAWER_CLOSE_ID = 'astro-header-drawer-close'

let listenersBound = false

const toggleDrawerClasses = (drawer, classes) => {
	classes.forEach((cls) => drawer.classList.toggle(cls))
}

const handleClick = (event) => {
	const drawer = document.getElementById(DRAWER_ID)
	const btn = document.getElementById(DRAWER_BUTTON_ID)
	const closeBtn = document.getElementById(DRAWER_CLOSE_ID)

	if (!drawer || !btn) return

	// Only handle drawer toggle on mobile (when button is visible)
	const isMobile = window.getComputedStyle(btn).display !== 'none'
	if (!isMobile) return

	const classes = (btn.dataset.translateClass || '')
		.split(' ')
		.map((cls) => cls.trim())
		.filter(Boolean)

	const target = event.target

	if (btn.contains(target) || closeBtn?.contains(target)) {
		toggleDrawerClasses(drawer, classes)
	}
}

const addEventListeners = () => {
	if (listenersBound) return
	listenersBound = true
	document.addEventListener('click', handleClick)
}

const start = () => {
	addEventListeners()
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', start, { once: true })
} else {
	start()
}

document.addEventListener('astro:page-load', start)
document.addEventListener('astro:after-swap', start)
