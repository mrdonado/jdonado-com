import test from 'node:test'
import assert from 'node:assert/strict'
import worker from '../infrastructure/worker/agent-negotiation.mjs'

const env = { AMPLIFY_ORIGIN: 'https://main.example.amplifyapp.com' }
const get = (path, accept) =>
	new Request(`https://www.jdonado.com${path}`, { headers: { Accept: accept } })

test('proxy negotiates the homepage without weakening origin security headers', async () => {
	const originalFetch = globalThis.fetch
	const paths = []
	globalThis.fetch = async (request) => {
		paths.push(new URL(request.url).pathname)
		return new Response(
			paths.at(-1) === '/index.md' ? '# Javier Donado\n' : '<h1>Javier Donado</h1>',
			{
				headers: {
					'Content-Type': 'text/html',
					Vary: 'Accept-Encoding',
					'Content-Security-Policy': "default-src 'self'",
					'Strict-Transport-Security': 'max-age=31536000'
				}
			}
		)
	}
	try {
		const markdown = await worker.fetch(get('/', 'text/markdown'), env)
		assert.equal(markdown.status, 200)
		assert.match(markdown.headers.get('Content-Type'), /^text\/markdown/)
		assert.equal(markdown.headers.get('Vary'), 'Accept-Encoding, Accept')
		assert.equal(markdown.headers.get('Content-Security-Policy'), "default-src 'self'")
		assert.equal(markdown.headers.get('Strict-Transport-Security'), 'max-age=31536000')
		assert.match(await markdown.text(), /^# Javier Donado/)

		const html = await worker.fetch(get('/', 'text/html'), env)
		assert.equal(html.status, 200)
		assert.equal(html.headers.get('Content-Type'), 'text/html')
		assert.equal(html.headers.get('Vary'), 'Accept-Encoding, Accept')
		assert.match(await html.text(), /<h1>/)
		assert.deepEqual(paths, ['/index.md', '/'])
	} finally {
		globalThis.fetch = originalFetch
	}
})

test('proxy keeps 404 status and serves Markdown errors only when requested', async () => {
	const originalFetch = globalThis.fetch
	globalThis.fetch = async () =>
		new Response('<h1>Not found</h1>', {
			status: 404,
			headers: { 'Content-Type': 'text/html', 'X-Content-Type-Options': 'nosniff' }
		})
	try {
		const markdown = await worker.fetch(get('/missing', 'text/markdown'), env)
		assert.equal(markdown.status, 404)
		assert.match(markdown.headers.get('Content-Type'), /^text\/markdown/)
		assert.equal(markdown.headers.get('Vary'), 'Accept')
		assert.equal(markdown.headers.get('X-Content-Type-Options'), 'nosniff')
		assert.match(await markdown.text(), /https:\/\/www\.jdonado\.com\/llms\.txt/)
		const html = await worker.fetch(get('/missing', 'text/html'), env)
		assert.equal(html.status, 404)
		assert.equal(html.headers.get('Content-Type'), 'text/html')
		assert.match(await html.text(), /<h1>Not found/)
	} finally {
		globalThis.fetch = originalFetch
	}
})

test('proxy does not route to an unconfigured or untrusted origin', async () => {
	assert.equal(
		(await worker.fetch(get('/', 'text/markdown'), { AMPLIFY_ORIGIN: 'https://evil.example' }))
			.status,
		503
	)
})

test('origin redirects keep visitors on the public host', async () => {
	const originalFetch = globalThis.fetch
	globalThis.fetch = async () =>
		new Response(null, {
			status: 301,
			headers: { Location: 'https://main.example.amplifyapp.com/about/' }
		})
	try {
		const response = await worker.fetch(get('/about', 'text/html'), env)
		assert.equal(response.headers.get('Location'), 'https://www.jdonado.com/about/')
	} finally {
		globalThis.fetch = originalFetch
	}
})
