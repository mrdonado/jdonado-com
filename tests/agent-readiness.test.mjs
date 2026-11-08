import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')
const edge = (name) =>
	runInNewContext(`${read(`../infrastructure/cloudfront/${name}.js`)}\nhandler`, {})

test('edge selects a distinct cache path only when Markdown is preferred', () => {
	const request = edge('homepage-request')
	for (const [accept, expected] of [
		['text/markdown', '/index.md'],
		['text/markdown;q=0', '/'],
		['text/markdown;q=0.8, text/html;q=0.5', '/index.md'],
		['text/html, text/markdown', '/'],
		['*/*', '/'],
		['', '/']
	]) {
		const result = request({
			request: { uri: '/', method: 'GET', headers: { accept: { value: accept } } }
		})
		assert.equal(result.uri, expected, accept)
	}
	assert.equal(
		request({
			request: { uri: '/about/', method: 'GET', headers: { accept: { value: 'text/markdown' } } }
		}).uri,
		'/about/'
	)
	assert.equal(
		request({
			request: { uri: '/', method: 'POST', headers: { accept: { value: 'text/markdown' } } }
		}).uri,
		'/'
	)
})

test('edge labels only the Markdown representation and preserves security headers', () => {
	const respond = edge('homepage-response')
	const headers = { 'content-security-policy': { value: "default-src 'self'" } }
	const markdown = respond({
		request: { uri: '/index.md' },
		response: { statusCode: 200, headers: { ...headers } }
	})
	assert.equal(markdown.headers['content-type'].value, 'text/markdown; charset=utf-8')
	assert.equal(markdown.headers.vary.value, 'Accept')
	assert.equal(markdown.headers['content-security-policy'].value, "default-src 'self'")
	const html = respond({
		request: { uri: '/' },
		response: { statusCode: 200, headers: { ...headers, vary: { value: 'Accept-Encoding' } } }
	})
	assert.equal(html.headers.vary.value, 'Accept-Encoding, Accept')
	assert.equal(html.headers['content-type'], undefined)
	const missing = respond({
		request: { uri: '/index.md' },
		response: { statusCode: 404, headers: {} }
	})
	assert.equal(missing.headers['content-type'], undefined)
})

test('crawler instructions and built public files remain available', () => {
	const robots = read('../public/robots.txt')
	for (const bot of ['PerplexityBot', 'Applebot-Extended', 'ClaudeBot', 'ChatGPT-User']) {
		assert.match(robots, new RegExp(`User-agent: ${bot}`))
	}
	assert.match(robots, /User-agent: \*\nAllow: \//)
	assert.match(read('../public/llms.txt'), /## When to use this site/)
	assert.match(read('../dist/llms.txt'), /## When to use this site/)
	assert.match(read('../dist/robots.txt'), /User-agent: PerplexityBot/)
	assert.match(read('../dist/sitemap-index.xml'), /sitemap/)
	assert.match(read('../dist/rss.xml'), /<rss/)
	const markdown = read('../dist/index.md')
	assert.match(markdown, /^# Javier Donado\n/)
	assert.match(markdown, /## Latest from Pulse/)
	assert.match(markdown, /## Recent Apps & Labs/)
	assert.match(markdown, /https:\/\/www\.jdonado\.com\/post\//)
	assert.match(read('../dist/index.html'), /<html lang="en"/)
	assert.match(read('../dist/index.html'), /https:\/\/www\.jdonado\.com\//)
})
