import { defineCollection, z } from 'astro:content'
import { CATEGORIES } from '@/data/categories'

const doc = defineCollection({
	// Type-check frontmatter using a schema
	schema: () =>
		z.object({
			title: z.string().max(80),
			description: z.string()
		})
})

const blog = defineCollection({
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string().max(80),
			description: z.string(),
			// Transform string to Date object
			pubDate: z
				.string()
				.or(z.date())
				.transform((val) => new Date(val)),
			heroImage: z.string(),
			category: z.enum(CATEGORIES),
			tags: z.array(z.string()),
			draft: z.boolean().default(false),
			xComThread: z.string().optional(),
			linkedInThread: z.string().optional(),
			youTubeThread: z.string().optional(),
			tikTokThread: z.string().optional(),
			instagramThread: z.string().optional()
		})
})

const app = defineCollection({
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			name: z.string().max(80),
			description: z.string(),
			// Transform string to Date object
			pubDate: z
				.string()
				.or(z.date())
				.transform((val) => new Date(val)),
			icon: z.string(),
			heroImage: z.string(),
			screenShots: z.array(z.string()),
			appStore: z.string().optional(),
			playStore: z.string().optional(),
			draft: z.boolean().default(false)
		})
})

export const collections = { blog, app, doc }
