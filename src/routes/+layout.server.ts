import { createClient } from '$lib/prismicio';

export const prerender = 'auto';

export async function load({ fetch, cookies }) {
	const client = createClient({ fetch, cookies });

	try {
		// Fetch settings and home page meta fields in parallel
		const [settings, homeMeta] = await Promise.all([
			client.getSingle('settings'),
			// Only fetch SEO fields from home - not the heavy project data
			client.getSingle('home', {
				fetch: ['home.meta_description', 'home.meta_title', 'home.meta_image']
			})
		]);

		return {
			settings,
			// Global fallbacks from home page
			fallbackMetaDescription: homeMeta?.data?.meta_description ?? null,
			fallbackMetaTitle: homeMeta?.data?.meta_title ?? null,
			fallbackMetaImage: homeMeta?.data?.meta_image?.url ?? null
		};
	} catch (error) {
		// If documents don't exist, return empty values
		return {
			settings: null,
			fallbackMetaDescription: null,
			fallbackMetaTitle: null,
			fallbackMetaImage: null
		};
	}
}
