import { asText } from '@prismicio/client';
import { error } from '@sveltejs/kit';

import { createClient } from '$lib/prismicio';

export async function load({ params, fetch, cookies }) {
	const client = createClient({ fetch, cookies });

	try {
		const project = await client.getByUID('projects', params.uid, {
			fetchLinks: ['people.title', 'people.link'] // Fetch the title and link fields from linked people documents
		});

		// Get 3 random related projects excluding current
		const allProjects = await client.getAllByType('projects', {
			pageSize: 100 // Ensure all projects are fetched
		});
		const supportsPortrait = (p: any) =>
			Array.isArray(p?.data?.preview) && p.data.preview.some((i: any) => i?.preview_video_url_portrait || i?.preview_image_portrait?.url);
		const otherProjects = allProjects.filter((p) => p.id !== project.id).filter(supportsPortrait);
		const shuffled = [...otherProjects].sort(() => Math.random() - 0.5);
		const relatedProjects = shuffled.slice(0, 3);


		// Most projects have no meta_description filled in, which used to leave every
		// project page sharing the studio-wide boilerplate. Fall back to the project's
		// own description so each page describes itself.
		const descriptionText = asText(project.data.description).replace(/\s+/g, ' ').trim();

		return {
			project,
			relatedProjects,
			title: project.data.title || 'Project',
			meta_description: project.data.meta_description || summarize(descriptionText) || null,
			meta_title: project.data.meta_title,
			meta_image: project.data.meta_image?.url
		};
	} catch (err) {
		// Log the error for debugging but throw a 404 instead of 500
		console.error(`Failed to fetch project with UID: ${params.uid}`, err);
		throw error(404, `Project not found: ${params.uid}`);
	}
}

/** Trim to roughly a meta-description length, cutting on a word boundary. */
function summarize(text: string, max = 160): string {
	if (text.length <= max) return text;
	const cut = text.slice(0, max);
	const lastSpace = cut.lastIndexOf(' ');
	return (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…';
}

export async function entries() {
	const client = createClient();

	try {
		const projects = await client.getAllByType('projects', {
			pageSize: 100 // Ensure all projects are fetched
		});

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
