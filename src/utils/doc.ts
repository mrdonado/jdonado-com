import { getCollection } from 'astro:content'

export const getDoc = async (name: string) => {
	const docs = await getCollection('doc')
	const lowercaseName = name.toLowerCase()
	const nameWithoutExt = lowercaseName.replace(/\.[^/.]+$/, '')
	return docs.filter((doc) => {
		return (
			doc.id === lowercaseName ||
			doc.id === nameWithoutExt ||
			doc.id.replace(/\.[^/.]+$/, '') === nameWithoutExt
		)
	})[0]
}
