import { createClient } from '$lib/prismicio';

export async function load({ fetch, cookies }) {
	const client = createClient({ fetch, cookies });

	const page = await client.getSingle('home');
	const allProjectsRaw = await client.getAllByType('projects');
	// Dedupe defensively by ID in case of duplicates from API or locales
	const allProjects = Array.from(new Map(allProjectsRaw.map((p) => [p.id, p])).values());

	return {
		page,
		allProjects,
		title: page.data.meta_title || 'ART CAMP GLOBAL',
		meta_description: page.data.meta_description,
		meta_title: page.data.meta_title,
		meta_image: page.data.meta_image.url
	};
}

export function entries() {
	return [{}];
}
