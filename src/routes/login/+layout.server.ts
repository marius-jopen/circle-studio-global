import { redirect } from '@sveltejs/kit';
import { isAuthenticated } from '$lib/utils/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	// If already authenticated, redirect to admin
	if (isAuthenticated(cookies)) {
		throw redirect(302, '/admin');
	}
	return {};
};
