import { createClient } from '$lib/prismicio';

export const prerender = false;
// Render this preview/testing page on the client only. Its About modules already load
// client-side (about_modules_area fetches in the browser), and server-rendering the slices
// here was throwing a 500 in production (a prod-bundle SSR crash dev can't reproduce).
export const ssr = false;

export async function load({ fetch, cookies }) {
	const client = createClient({ fetch, cookies });

	const page = await client.getByUID('page', 'test').catch(() => null);

	return { page };
}
