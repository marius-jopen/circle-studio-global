import { json } from '@sveltejs/kit';
import { isAuthenticated } from '$lib/utils/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	if (isAuthenticated(cookies)) {
		return json({ authenticated: true });
	}
	return json({ authenticated: false }, { status: 401 });
};
