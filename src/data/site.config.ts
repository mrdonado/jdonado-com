interface SiteConfig {
	site: string
	author: string
	applicationName: string
	title: string
	logo: string
	description: string
	lang: string
	ogLocale: string
	shareMessage: string
	paginationSize: number
	gtmId: string
	showAppBanner: boolean
}

export const siteConfig: SiteConfig = {
	site: 'https://www.jdonado.com/', // Write here your website url
	author: 'Javier Donado', // Site author
	applicationName: 'Javier Donado', // Application name
	logo: 'https://www.jdonado.com/favicon.svg', // Write here your website url
	title: 'Javier Donado - Engineering Leadership & Product Engineering', // Site title.
	description:
		'Javier Donado is an engineering and people leader, solution architect, and product engineer working across technical strategy, organisations, and digital products.', // Description to display in the meta tags
	lang: 'en-GB',
	ogLocale: 'en_GB',
	shareMessage: 'Sharing this with you:', // Message to share a post on social media
	paginationSize: 6, // Number of posts per page,
	gtmId: 'GTM-59KVPQ82', // Google Tag Manager ID
	showAppBanner: false // Show app promotion banner on blog posts
}
