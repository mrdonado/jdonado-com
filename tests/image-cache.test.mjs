import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fsCachePath } from '../node_modules/astro-imagetools/utils/runtimeChecks.js'
import { saveAndCopyAsset } from '../node_modules/astro-imagetools/integration/utils/saveAndCopyAsset.js'

test('concurrent image generation repairs an empty cache and writes complete assets', async () => {
	const hash = `test-${randomUUID()}`
	const cacheFile = join(fsCachePath, hash)
	const outDir = await mkdtemp(join(tmpdir(), 'astro-image-test-'))
	const expected = Buffer.from('generated image data')
	const image = { clone: () => ({ toBuffer: async () => expected }) }

	try {
		await writeFile(cacheFile, '')
		await Promise.all(
			Array.from({ length: 25 }, (_, index) =>
				saveAndCopyAsset(
					hash,
					image,
					null,
					outDir,
					'_astro',
					`_astro/test-${index % 2}.webp`,
					false
				)
			)
		)
		assert.deepEqual(await readFile(join(outDir, '_astro/test-0.webp')), expected)
		assert.deepEqual(await readFile(join(outDir, '_astro/test-1.webp')), expected)
		assert.deepEqual(await readFile(cacheFile), expected)
	} finally {
		await rm(cacheFile, { force: true })
		await rm(outDir, { recursive: true, force: true })
	}
})

test('single-size image fallback in the built about page points to an existing asset', async () => {
	const html = await readFile('dist/about/index.html', 'utf8')
	const src = html.match(/src="(\/_astro\/nerd-avatar-mini@[^"]+)"/)
	assert.ok(src, 'expected the avatar fallback image')
	assert.match(src[1], /\.png$/)
	assert.ok((await stat(join('dist', src[1]))).size > 0)
})
