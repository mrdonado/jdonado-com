const applyFoucFix = () => {
	try {
		const elm = document.documentElement
		elm.classList.add('fouc-fix')
		document.addEventListener(
			'DOMContentLoaded',
			() => {
				elm.classList.remove('fouc-fix')
			},
			{ once: true }
		)
	} catch (err) {
		// swallow
	}
}

if (document.readyState === 'loading') {
	applyFoucFix()
} else {
	applyFoucFix()
}
