import { defineConfig } from 'vite'
import { resolve } from 'path'
import { readdirSync, mkdirSync, writeFileSync, existsSync } from 'fs'
import { build } from 'esbuild'

/**
 * Vite plugin to compile TypeScript files from src/scripts/ to public/scripts/
 */
function compileScriptsPlugin() {
	const srcDir = resolve(process.cwd(), 'src/scripts')
	const outDir = resolve(process.cwd(), 'public/scripts')

	async function compileScripts() {
		if (!existsSync(srcDir)) return

		if (!existsSync(outDir)) {
			mkdirSync(outDir, { recursive: true })
		}

		const files = readdirSync(srcDir).filter((f) => f.endsWith('.ts') || f.endsWith('.js'))

		for (const file of files) {
			const inputPath = resolve(srcDir, file)
			const outputName = file.replace(/\.ts$/, '.js')
			const outputPath = resolve(outDir, outputName)

			try {
				const result = await build({
					entryPoints: [inputPath],
					bundle: false,
					minify: true,
					format: 'iife',
					target: ['es2020'],
					write: false
				})

				if (result.outputFiles?.[0]) {
					writeFileSync(outputPath, result.outputFiles[0].text)
					console.log(`✓ Compiled ${file} → public/scripts/${outputName}`)
				}
			} catch (err) {
				console.error(`✗ Failed to compile ${file}:`, err)
			}
		}
	}

	return {
		name: 'compile-scripts',
		buildStart: async () => {
			await compileScripts()
		},
		configureServer(server) {
			// Watch for changes in dev mode
			server.watcher.add(srcDir)
			server.watcher.on('change', async (path) => {
				if (path.startsWith(srcDir)) {
					await compileScripts()
				}
			})
		}
	}
}

export default compileScriptsPlugin
