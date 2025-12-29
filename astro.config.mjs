import { defineConfig, passthroughImageService } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { remarkReadingTime } from './src/utils/readTime.ts'
import { siteConfig } from './src/data/site.config'
import remarkRehype from 'remark-rehype'
import { visit } from 'unist-util-visit'
import { astroImageTools } from "astro-imagetools";
import compileScriptsPlugin from './plugins/compile-scripts.js'

// https://astro.build/config
export default defineConfig({
	image: {
		// Uncomment to disable the built-in image optimization service
		// service: passthroughImageService()
	},
	site: siteConfig.site,
	build: {
		inlineStylesheets: 'always',
	},
	vite: {
		plugins: [tailwindcss(), compileScriptsPlugin()],
		build: {
			cssCodeSplit: true,
			minify: 'esbuild',
			assetsInlineLimit: 4096,
		}
	},
	markdown: {
		remarkPlugins: [
			remarkReadingTime,
			remarkRehype,
		],
		rehypePlugins: [
			() => (tree) => {
				// Walk through the tree to process `a` elements
				visit(tree, 'element', (node) => {
					if (node.tagName === 'a' && node.properties && node.properties.href) {
						const isExternal = /^https?:\/\//.test(node.properties.href);
						if (isExternal) {
							node.properties.target = '_blank';
							node.properties.rel = 'noopener noreferrer';
						}
					}
				});
			}
		],
		drafts: true,
		shikiConfig: {
			theme: 'material-theme-palenight',
			wrap: true
		}
	},
	integrations: [
		mdx({
			syntaxHighlight: 'shiki',
			shikiConfig: {
				experimentalThemes: {
					light: 'vitesse-light',
					dark: 'material-theme-palenight',
				},
				wrap: true
			},
			drafts: true
		}),
		sitemap(),
		astroImageTools
	]
})
