import { getCollection } from 'astro:content'

export const getDoc = async (name: string) => {
	const docs = await getCollection('doc')
	const lowercaseTag = name.toLowerCase()
	return docs.filter((doc) => {
		return doc.id === lowercaseTag
	})[0]
}
