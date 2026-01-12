import { redirect } from '@sveltejs/kit';
import { isAuthenticated } from '$lib/utils/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	if (!isAuthenticated(cookies)) {
		throw redirect(302, `/login?redirect=${encodeURIComponent(url.pathname)}`);
	}
	return {};
};
