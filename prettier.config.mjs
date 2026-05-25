import standardConfig from 'prettier-config-standard'

/** @type {import("prettier").Config} */
export default {
	// i am just using the standard config, change if you need something else
	...standardConfig,
	printWidth: 100,
	semi: false,
	singleQuote: true,
	jsxSingleQuote: true,
	tabWidth: 2,
	useTabs: true,

	plugins: ['prettier-plugin-astro'],
	overrides: [
		{
			files: '*.astro',
			options: {
				parser: 'astro'
			}
		}
	]
}
