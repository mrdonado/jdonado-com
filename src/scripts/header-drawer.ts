const DRAWER_ID = 'astro-header-drawer'
const DRAWER_BUTTON_ID = 'astro-header-drawer-button'
const DRAWER_CLOSE_ID = 'astro-header-drawer-close'

let headerDrawerListenersBound = false

const getDrawerClasses = (btn: HTMLElement): string[] => {
	return (btn.dataset.translateClass || '')
		.split(' ')
		.map((cls) => cls.trim())
		.filter(Boolean)
}

const closeDrawer = (drawer: HTMLElement, classes: string[]): void => {
	classes.forEach((cls) => drawer.classList.add(cls))
}

const openDrawer = (drawer: HTMLElement, classes: string[]): void => {
	classes.forEach((cls) => drawer.classList.remove(cls))
}

const isDrawerOpen = (drawer: HTMLElement): boolean => {
	return !drawer.classList.contains('invisible')
}

const isMobileView = (btn: HTMLElement): boolean => {
	return window.getComputedStyle(btn).display !== 'none'
}

const handleClick = (event: MouseEvent): void => {
	const drawer = document.getElementById(DRAWER_ID)
	const btn = document.getElementById(DRAWER_BUTTON_ID)
	const closeBtn = document.getElementById(DRAWER_CLOSE_ID)

	if (!drawer || !btn) return
	if (!isMobileView(btn)) return

	const target = event.target as Node | null
	if (!target) return

	const isMenuButton = btn.contains(target)
	const isCloseButton = closeBtn?.contains(target) ?? false
	const isLink = target instanceof HTMLAnchorElement || (target as Element).closest?.('a')
	const isInsideDrawer = drawer.contains(target)
	const drawerOpen = isDrawerOpen(drawer)
	const classes = getDrawerClasses(btn)

	// Open drawer when clicking menu button
	if (isMenuButton) {
		if (drawerOpen) {
			closeDrawer(drawer, classes)
		} else {
			openDrawer(drawer, classes)
		}
		return
	}

	// Close drawer when clicking close button, or clicking inside drawer but not on a link
	if (drawerOpen && (isCloseButton || (isInsideDrawer && !isLink))) {
		closeDrawer(drawer, classes)
	}
}

const ensureDrawerClosed = (): void => {
	const drawer = document.getElementById(DRAWER_ID)
	const btn = document.getElementById(DRAWER_BUTTON_ID)
	if (!drawer || !btn) return

	const classes = getDrawerClasses(btn)
	// Always ensure drawer is closed after navigation
	closeDrawer(drawer, classes)
}

const bindListeners = (): void => {
	if (headerDrawerListenersBound) return
	headerDrawerListenersBound = true
	document.addEventListener('click', handleClick)
}

const init = (): void => {
	bindListeners()
	ensureDrawerClosed()
}

// Initial load
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init, { once: true })
} else {
	init()
}

// Astro navigation events
document.addEventListener('astro:page-load', init)
document.addEventListener('astro:after-swap', init)
