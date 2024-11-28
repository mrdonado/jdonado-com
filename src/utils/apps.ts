import { getCollection } from 'astro:content'

export const getApps = async (max?: number) => {
	return (await getCollection('app'))
		.filter((post) => !post.data.draft)
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
		.slice(0, max)
}
