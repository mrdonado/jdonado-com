interface SiteConfig {
	site: string
	author: string
	title: string
	description: string
	lang: string
	ogLocale: string
	shareMessage: string
	paginationSize: number
	gtmId: string
}

export const siteConfig: SiteConfig = {
	site: 'https://www.jdonado.com/', // Write here your website url
	author: 'F. Javier R. Donado', // Site author
	title: 'F. Javier R. Donado', // Site title.
	description: 'Javier Donado - Web and mobile apps (iOS and Android). Photos and music too.', // Description to display in the meta tags
	lang: 'en-GB',
	ogLocale: 'en_GB',
	shareMessage: 'Sharing this with you:', // Message to share a post on social media
	paginationSize: 9, // Number of posts per page,
	gtmId: 'GTM-59KVPQ82' // Google Tag Manager ID
}
