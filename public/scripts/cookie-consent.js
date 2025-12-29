'use strict'
;(() => {
	const s = (t, e, n) => {
		const o = new Date(Date.now() + n * 24 * 60 * 60 * 1e3).toUTCString()
		document.cookie = `${t}=${e}; expires=${o}; path=/; SameSite=Lax`
	}
	function g() {
		document.cookie.split(';').forEach((e) => {
			const n = e.indexOf('='),
				o = n > -1 ? e.substring(0, n) : e
			;((document.cookie = `${o}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`),
				(document.cookie =
					o + '=; Path=/; Domain=.jdonado.com; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'))
		})
	}
	const i = function () {
		window.dataLayer.push(arguments)
	}
	function u(t) {
		if (!window.dataLayer || !Array.isArray(window.dataLayer)) return null
		for (let e = window.dataLayer.length - 1; e >= 0; e--) {
			const n = window.dataLayer[e]
			if (n[0] === 'consent' && n[2] && n[2][t] === 'granted') return !0
		}
		return !1
	}
	function w(t) {
		if (!t) return
		const e = document.createElement('iframe')
		;((e.src = 'https://www.googletagmanager.com/ns.html?id=' + t),
			(e.height = '0'),
			(e.width = '0'),
			(e.style.display = 'none'),
			(e.style.visibility = 'hidden'),
			document.body.appendChild(e))
		const n = document.createElement('script')
		;((n.async = !0),
			(n.src = `https://www.googletagmanager.com/gtm.js?id=${t}`),
			document.head.appendChild(n))
	}
	function m() {
		;((window.gtag = window.gtag || i),
			(window.dataLayer = window.dataLayer || []),
			window.gtag('js', new Date()),
			window.gtag('consent', 'default', {
				analytics_storage: 'denied',
				ad_storage: 'denied',
				functionality_storage: 'denied',
				personalization_storage: 'denied',
				security_storage: 'denied',
				ad_personalization: 'denied',
				ad_user_data: 'denied'
			}))
	}
	function r() {
		;((window.gtag = window.gtag || i),
			(window.dataLayer = window.dataLayer || []),
			window.gtag('js', new Date()),
			window.gtag('consent', 'default', {
				analytics_storage: 'granted',
				ad_storage: 'granted',
				functionality_storage: 'granted',
				personalization_storage: 'granted',
				security_storage: 'granted',
				ad_personalization: 'denied',
				ad_user_data: 'denied'
			}),
			window.dataLayer.push({ event: 'gtm.js', timestamp: new Date().getTime() }),
			window.dataLayer.push({ event: 'gtm.init' }))
	}
	const l = () => {
		const t = document.getElementById('cookie-banner'),
			e = t ? t.dataset.gtmId : ''
		e && w(e)
	}
	function p() {
		u('analytics_storage') || r()
		const e = window.location.pathname,
			n = document.title
		;((window.gtag = window.gtag || i),
			(window.dataLayer = window.dataLayer || []),
			window.dataLayer.push({ event: 'page_view', page: { path: e, title: n } }))
	}
	const d = () => {
			const t = document.getElementById('cookie-banner')
			t && t.classList.add('hidden')
		},
		y = () => {
			const t = document.getElementById('cookie-banner')
			t && t.classList.remove('hidden')
		},
		f = () => {
			;(m(), g(), s('cookies_accepted', 'required', 365), d())
		},
		k = () => {
			;(s('cookies_accepted', 'all', 365), l(), r(), d())
		},
		h = () => {
			if (!document.cookie.includes('cookies_accepted')) {
				y()
				return
			}
			;((
				(document.cookie || '').split(';').find((o) => o.includes('cookies_accepted')) || ''
			).includes('all') && (l(), p()),
				d())
		}
	let c = !1
	const L = () => {
			if (c) return
			const t = document.getElementById('accept-only-required'),
				e = document.getElementById('accept-all-cookies')
			t && e && (t.addEventListener('click', f), e.addEventListener('click', k), (c = !0))
		},
		_ = () => {
			;(L(), h())
		},
		a = () => {
			_()
		}
	document.readyState !== 'loading'
		? a()
		: document.addEventListener('DOMContentLoaded', a, { once: !0 })
	document.addEventListener('astro:page-load', a)
	document.addEventListener('astro:after-swap', a)
})()
