// Request-aware proxy for a separate edge provider in front of Amplify.
// Configure AMPLIFY_ORIGIN to the HTTPS *.amplifyapp.com origin, not the public domain.
export default {
	async fetch(request, env) {
		let origin
		try {
			origin = new URL(env.AMPLIFY_ORIGIN)
		} catch {
			return new Response('Origin is not configured', { status: 503 })
		}
		if (origin.protocol !== 'https:' || !origin.hostname.endsWith('.amplifyapp.com')) {
			return new Response('Origin is not configured', { status: 503 })
		}

		const incoming = new URL(request.url)
		const isHomepage = incoming.pathname === '/' && ['GET', 'HEAD'].includes(request.method)
		const markdownPreferred = prefersMarkdown(request.headers.get('Accept'))
		const target = new URL(incoming.pathname + incoming.search, origin)
		if (isHomepage && markdownPreferred) target.pathname = '/index.md'

		// Request is cloned so normal cookies, method and headers still reach the origin.
		const upstream = await fetch(new Request(target, request))
		const headers = new Headers(upstream.headers)
		const location = headers.get('Location')
		if (location) {
			const redirect = new URL(location, origin)
			if (redirect.origin === origin.origin) {
				redirect.host = incoming.host
				redirect.protocol = incoming.protocol
				headers.set('Location', redirect.href)
			}
		}
		if (isHomepage || upstream.status === 404) addVary(headers, 'Accept')

		if (upstream.status === 404 && markdownPreferred && request.method !== 'HEAD') {
			// Preserve origin security headers, but not metadata for the old HTML body.
			for (const key of ['content-length', 'content-encoding', 'etag', 'last-modified']) {
				headers.delete(key)
			}
			headers.set('Content-Type', 'text/markdown; charset=utf-8')
			headers.set('Cache-Control', 'no-store')
			return new Response(
				'# 404 — Page not found\n\nThe requested page does not exist. ' +
					'See [agent guidance](https://www.jdonado.com/llms.txt) or the ' +
					'[sitemap](https://www.jdonado.com/sitemap-index.xml).\n',
				{ status: 404, headers }
			)
		}

		if (isHomepage && markdownPreferred && upstream.ok) {
			headers.set('Content-Type', 'text/markdown; charset=utf-8')
		}
		return new Response(upstream.body, { status: upstream.status, headers })
	}
}

function prefersMarkdown(accept = '') {
	const quality = new Map()
	for (const entry of accept.split(',')) {
		const [type, ...parameters] = entry.toLowerCase().trim().split(';')
		let q = 1
		for (const parameter of parameters) {
			const match = /^\s*q\s*=\s*(0(?:\.\d+)?|1(?:\.0+)?)\s*$/.exec(parameter)
			if (match) q = Number(match[1])
		}
		quality.set(type.trim(), Math.max(quality.get(type.trim()) ?? 0, q))
	}
	return (quality.get('text/markdown') ?? 0) > (quality.get('text/html') ?? 0)
}

function addVary(headers, name) {
	const vary = headers.get('Vary')
	if (!vary?.split(',').some((item) => item.trim().toLowerCase() === name.toLowerCase())) {
		headers.set('Vary', vary ? `${vary}, ${name}` : name)
	}
}
