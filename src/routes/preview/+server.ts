/**
 * Redirects /preview?token=... to /api/preview so Prismic preview works
 * when the repository is configured with preview URL: https://yoursite.com/preview
 */
import { redirect } from '@sveltejs/kit';

export async function GET({ url }) {
	const params = url.searchParams.toString();
	const target = params ? `/api/preview?${params}` : '/api/preview';
	return redirect(302, target);
}
