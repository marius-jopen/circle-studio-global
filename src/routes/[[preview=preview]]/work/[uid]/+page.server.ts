import { asText } from '@prismicio/client';

import { createClient } from '$lib/prismicio';

export async function load({ params, fetch, cookies }) {
	const client = createClient({ fetch, cookies });

	const project = await client.getByUID('projects', params.uid);

	return {
		project,
		title: project.data.title || 'Project',
		meta_description: project.data.meta_description,
		meta_title: project.data.meta_title,
		meta_image: project.data.meta_image?.url
	};
}

export async function entries() {
	const client = createClient();

	const projects = await client.getAllByType('projects');

	return projects.map((project) => {
		return { uid: project.uid };
	});
}
