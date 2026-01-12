import { redirect } from '@sveltejs/kit';
import { isAuthenticated } from '$lib/utils/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	// If already authenticated, redirect to admin
	const cookieValue = cookies.get('admin_auth');
	console.log('Login layout - cookie value:', cookieValue);
	
	if (isAuthenticated(cookies)) {
		console.log('User is authenticated, redirecting to /admin');
		throw redirect(302, '/admin');
	}
	return {};
};
