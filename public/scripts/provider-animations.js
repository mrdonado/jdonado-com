'use strict'
;(() => {
	const e = () => {
		'animations' in localStorage
			? localStorage.setItem('animations', 'false')
			: localStorage.setItem('animations', 'true')
	}
	document.readyState === 'loading'
		? document.addEventListener('DOMContentLoaded', e, { once: !0 })
		: e()
})()
