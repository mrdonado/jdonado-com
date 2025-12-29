const initAnimationsPreference = () => {
	if (!('animations' in localStorage)) {
		localStorage.setItem('animations', 'true')
	} else {
		localStorage.setItem('animations', 'false')
	}
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initAnimationsPreference, { once: true })
} else {
	initAnimationsPreference()
}
