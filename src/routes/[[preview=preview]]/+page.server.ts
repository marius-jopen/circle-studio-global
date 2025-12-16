import { createClient } from '$lib/prismicio';

export async function load({ fetch, cookies }) {
	const client = createClient({ fetch, cookies });

	const page = await client.getSingle('home');
	const allProjectsRaw = await client.getAllByType('projects', {
		pageSize: 100 // Ensure all projects are fetched (max per page)
	});
	// Dedupe defensively by ID in case of duplicates from API or locales
	const allProjects = Array.from(new Map(allProjectsRaw.map((p) => [p.id, p])).values());
	
	console.log(`📊 Total projects fetched from Prismic: ${allProjectsRaw.length}`);
	console.log(`📊 Total projects after deduplication: ${allProjects.length}`);

	return {
		page,
		allProjects,
		title: page?.data?.meta_title || 'ART CAMP EST.2016',
		meta_description: page?.data?.meta_description ?? null,
		meta_title: page?.data?.meta_title ?? null,
		meta_image: page?.data?.meta_image?.url ?? null
	};
}

export function entries() {
	return [{}];
}
