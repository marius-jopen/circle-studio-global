import { createClient } from '$lib/prismicio';

export const prerender = 'auto';

export async function load({ fetch, cookies }) {
	const client = createClient({ fetch, cookies });

	try {
		const settings = await client.getSingle('settings');
		return {
			settings
		};
	} catch (error) {
		// If settings document doesn't exist, return empty settings
		return {
			settings: null
		};
	}
}
