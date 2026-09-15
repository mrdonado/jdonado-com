import astro from 'eslint-plugin-astro'
import typescriptParser from '@typescript-eslint/parser'

export default [
	{
		ignores: ['dist', 'node_modules', '.github', '.changeset']
	},
	...astro.configs['flat/recommended'],
	{
		files: ['**/*.{js,cjs,mjs,ts,tsx}'],
		languageOptions: {
			parser: typescriptParser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
				tsconfigRootDir: import.meta.dirname
			}
		}
	},
	{
		files: ['**/*.astro'],
		languageOptions: {
			parserOptions: {
				parser: typescriptParser,
				extraFileExtensions: ['.astro']
			}
		},
		rules: {
			'astro/no-set-html-directive': 'error'
		}
	},
	{
		files: ['src/components/BaseHead.astro'],
		rules: {
			'astro/no-set-html-directive': 'off'
		}
	}
]
