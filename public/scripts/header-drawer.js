'use strict'
;(() => {
	const l = 'astro-header-drawer',
		i = 'astro-header-drawer-button',
		u = 'astro-header-drawer-close'
	let o = !1
	const m = (s, t) => {
			t.forEach((e) => s.classList.toggle(e))
		},
		E = (s) => {
			const t = document.getElementById(l),
				e = document.getElementById(i),
				r = document.getElementById(u)
			if (!t || !e) return
			const d = (e.dataset.translateClass || '')
					.split(' ')
					.map((c) => c.trim())
					.filter(Boolean),
				a = s.target
			;(e.contains(a) || r?.contains(a) || a === t) && m(t, d)
		},
		g = () => {
			o || ((o = !0), document.addEventListener('click', E))
		},
		n = () => {
			g()
		}
	document.readyState === 'loading'
		? document.addEventListener('DOMContentLoaded', n, { once: !0 })
		: n()
	document.addEventListener('astro:page-load', n)
	document.addEventListener('astro:after-swap', n)
})()
