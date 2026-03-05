/**
 * Redirects /preview/:uid to /:uid so that /preview/about-new etc. resolve correctly.
 * The preview cookie (from /api/preview) works on both URLs.
 */
import { redirect } from '@sveltejs/kit';

export async function GET({ params }) {
	return redirect(302, `/${params.uid}`);
}
