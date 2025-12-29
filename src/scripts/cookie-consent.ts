///////////////////////////////////////////////////
////////// COOKIE UTILS //////////
const setCookie = (name, value, days) => {
	const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
	document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`
}

function deleteAllCookies() {
	const cookies = document.cookie.split(';')
	cookies.forEach((cookie) => {
		const eqPos = cookie.indexOf('=')
		const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie
		document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
		document.cookie =
			name + '=; Path=/; Domain=.jdonado.com; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
	})
}

///////////////////////////////////////////////////
////////// GTM //////////
const gtagFun = function () {
	window.dataLayer.push(arguments)
}

function getConsentStatus(consentType) {
	if (!window.dataLayer || !Array.isArray(window.dataLayer)) return null
	for (let i = window.dataLayer.length - 1; i >= 0; i--) {
		const event = window.dataLayer[i]
		if (event['0'] === 'consent' && !!event['2'] && event['2'][consentType] === 'granted') {
			return true
		}
	}
	return false
}

function injectGtmScript(containerId) {
	if (!containerId) return
	const iframe = document.createElement('iframe')
	iframe.src = 'https://www.googletagmanager.com/ns.html?id=' + containerId
	iframe.height = '0'
	iframe.width = '0'
	iframe.style.display = 'none'
	iframe.style.visibility = 'hidden'
	document.body.appendChild(iframe)
	const script = document.createElement('script')
	script.async = true
	script.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`
	document.head.appendChild(script)
}

function denyGtmConsents() {
	window.gtag = window.gtag || gtagFun
	window.dataLayer = window.dataLayer || []
	window.gtag('js', new Date())
	window.gtag('consent', 'default', {
		analytics_storage: 'denied',
		ad_storage: 'denied',
		functionality_storage: 'denied',
		personalization_storage: 'denied',
		security_storage: 'denied',
		ad_personalization: 'denied',
		ad_user_data: 'denied'
	})
}

function grantGtmConsents() {
	window.gtag = window.gtag || gtagFun
	window.dataLayer = window.dataLayer || []
	window.gtag('js', new Date())
	window.gtag('consent', 'default', {
		analytics_storage: 'granted',
		ad_storage: 'granted',
		functionality_storage: 'granted',
		personalization_storage: 'granted',
		security_storage: 'granted',
		ad_personalization: 'denied',
		ad_user_data: 'denied'
	})
	window.dataLayer.push({
		event: 'gtm.js',
		timestamp: new Date().getTime()
	})
	window.dataLayer.push({
		event: 'gtm.init'
	})
}

const setupGtm = () => {
	const cookieBanner = document.getElementById('cookie-banner')
	const gtmId = cookieBanner ? cookieBanner.dataset.gtmId : ''
	if (!gtmId) return
	injectGtmScript(gtmId)
}

function registerPageView() {
	const alreadyInitialized = getConsentStatus('analytics_storage')
	if (!alreadyInitialized) {
		grantGtmConsents()
	}
	const path = window.location.pathname
	const title = document.title
	window.gtag = window.gtag || gtagFun
	window.dataLayer = window.dataLayer || []
	window.dataLayer.push({
		event: 'page_view',
		page: {
			path,
			title
		}
	})
}

///////////////////////////////////////////////////
////////// COOKIE BANNER //////////
const hideBanner = () => {
	const cookieBanner = document.getElementById('cookie-banner')
	if (cookieBanner) {
		cookieBanner.classList.add('hidden')
	}
}

const showBanner = () => {
	const cookieBanner = document.getElementById('cookie-banner')
	if (cookieBanner) {
		cookieBanner.classList.remove('hidden')
	}
}

const clickedOnOnlyRequired = () => {
	denyGtmConsents()
	deleteAllCookies()
	setCookie('cookies_accepted', 'required', 365)
	hideBanner()
}

const clickedOnAcceptAll = () => {
	setCookie('cookies_accepted', 'all', 365)
	setupGtm()
	grantGtmConsents()
	hideBanner()
}

const checkCookieConsent = () => {
	const cookiesReviewed = document.cookie.includes('cookies_accepted')
	if (!cookiesReviewed) {
		showBanner()
		return
	}
	const cookieValue = (document.cookie || '')
		.split(';')
		.find((cookie) => cookie.includes('cookies_accepted'))
	const allCookiesAccepted = (cookieValue || '').includes('all')
	if (allCookiesAccepted) {
		setupGtm()
		registerPageView()
	}
	hideBanner()
}

///////////////////////////////////////////////////
////////// EVENT LISTENERS //////////
let listenersBound = false

const addEventListeners = () => {
	if (listenersBound) return
	const acceptOnlyRequiredButton = document.getElementById('accept-only-required')
	const acceptAllCookiesButton = document.getElementById('accept-all-cookies')
	if (acceptOnlyRequiredButton && acceptAllCookiesButton) {
		acceptOnlyRequiredButton.addEventListener('click', clickedOnOnlyRequired)
		acceptAllCookiesButton.addEventListener('click', clickedOnAcceptAll)
		listenersBound = true
	}
}

const initConsent = () => {
	addEventListeners()
	checkCookieConsent()
}

const start = () => {
	initConsent()
}

if (document.readyState !== 'loading') {
	start()
} else {
	document.addEventListener('DOMContentLoaded', start, { once: true })
}

document.addEventListener('astro:page-load', start)
document.addEventListener('astro:after-swap', start)
