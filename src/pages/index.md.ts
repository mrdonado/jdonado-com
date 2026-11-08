import type { APIRoute } from 'astro'
import { getApps, getPosts } from '@/utils'
import { siteConfig } from '@/data/site.config'

// A static representation of the homepage for request-aware routing at the CDN.
export const GET: APIRoute = async () => {
	const [posts, apps, labs] = await Promise.all([
		getPosts(5, (post) => post.data.category !== 'Music' && post.data.category !== 'Labs'),
		getApps(),
		getPosts(undefined, (post) => post.data.category === 'Labs')
	])
	const recentProjects = [...apps, ...labs].slice(0, 5)
	const link = (title: string, path: string) => `- [${title}](https://www.jdonado.com${path})`
	const body = [
		'# Javier Donado',
		'',
		siteConfig.description,
		'',
		'## About',
		'',
		link('About Javier Donado', '/about/'),
		link('CV', '/cv/'),
		link('Contact', '/contact/'),
		'',
		'## Latest from Pulse',
		'',
		...posts.map((post) => link(post.data.title, `/post/${post.id}/`)),
		link('All articles', '/archive/'),
		'',
		'## Recent Apps & Labs',
		'',
		...recentProjects.map((item) =>
			'name' in item.data
				? link(item.data.name, `/apps/${item.id}/`)
				: link(item.data.title, `/post/${item.id}/`)
		),
		link('All apps', '/apps/'),
		'',
		'## For agents',
		'',
		link('When to use this site and how to cite it', '/llms.txt'),
		''
	].join('\n')

	return new Response(body, {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
	})
}
