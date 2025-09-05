import { asText } from '@prismicio/client';
import { error } from '@sveltejs/kit';

import { createClient } from '$lib/prismicio';

export async function load({ params, fetch, cookies }) {
	const client = createClient({ fetch, cookies });

	try {
		const project = await client.getByUID('projects', params.uid, {
			fetchLinks: ['people.title'] // Fetch the title field from linked people documents
		});

		// Get 3 random related projects excluding current
		const allProjects = await client.getAllByType('projects');
		const supportsPortrait = (p: any) =>
			Array.isArray(p?.data?.preview) && p.data.preview.some((i: any) => i?.preview_video_url_portrait || i?.preview_image_portrait?.url);
		const otherProjects = allProjects.filter((p) => p.id !== project.id).filter(supportsPortrait);
		const shuffled = [...otherProjects].sort(() => Math.random() - 0.5);
		const relatedProjects = shuffled.slice(0, 3);


		return {
			project,
			relatedProjects,
			title: project.data.title || 'Project',
			meta_description: project.data.meta_description,
			meta_title: project.data.meta_title,
			meta_image: project.data.meta_image?.url
		};
	} catch (err) {
		// Log the error for debugging but throw a 404 instead of 500
		console.error(`Failed to fetch project with UID: ${params.uid}`, err);
		throw error(404, `Project not found: ${params.uid}`);
	}
}

export async function entries() {
	const client = createClient();

	try {
		const projects = await client.getAllByType('projects');

		// Filter out any projects that might be invalid
		return projects
			.filter(project => project.uid && project.uid.length > 0)
			.map((project) => {
				return { uid: project.uid };
			});
	} catch (err) {
		console.error('Failed to fetch projects for prerendering:', err);
		// Return empty array to prevent build failure
		return [];
	}
}
