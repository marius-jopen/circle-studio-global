import { createClient } from '$lib/prismicio';

export const prerender = false;

export async function load({ fetch, cookies }) {
	const client = createClient({ fetch, cookies });

	const page = await client.getByUID('page', 'test').catch(() => null);

	return { page };
}
