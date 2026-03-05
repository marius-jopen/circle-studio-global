import { asText } from '@prismicio/client';
import { error } from '@sveltejs/kit';

import { createClient } from '$lib/prismicio';

export async function load({ params, fetch, cookies }) {
	const client = createClient({ fetch, cookies });

	try {
		const uid = params?.uid;
		if (!uid) {
			throw error(404, 'Page not found');
		}

		const page = await client.getByUID('page', uid);

		return {
			page,
			title: page?.data?.title ? asText(page.data.title) : '',
			meta_description: page?.data?.meta_description ?? null,
			meta_title: page?.data?.meta_title ?? null,
			meta_image: page?.data?.meta_image?.url ?? null
		};
	} catch (err: unknown) {
		console.error(`Failed to fetch page with UID: ${params?.uid}`, err);
		// Re-throw SvelteKit errors (404) as-is; treat other errors as 500 for debugging
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throw error(404, `Page not found: ${params?.uid}`);
	}
}

export async function entries() {
	const client = createClient();

	try {
		const pages = await client.getAllByType('page');

		return pages
			.filter(page => page.uid && page.uid.length > 0)
			.map((page) => {
				return { uid: page.uid };
			});
	} catch (err) {
		console.error('Failed to fetch pages for prerendering:', err);
		return [];
	}
}
