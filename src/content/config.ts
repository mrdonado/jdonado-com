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
			heroImage: image(),
			category: z.enum(CATEGORIES),
			tags: z.array(z.string()),
			draft: z.boolean().default(false),
			xComThread: z.string().optional(),
			linkedInThread: z.string().optional()
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
			icon: image(),
			heroImage: image(),
			screenShots: z.array(image()),
			appStore: z.string().optional(),
			playStore: z.string().optional(),
			draft: z.boolean().default(false)
		})
})

export const collections = { blog, app, doc }
