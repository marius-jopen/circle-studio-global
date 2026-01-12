import { json } from '@sveltejs/kit';
import { clearAuthCookie } from '$lib/utils/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	clearAuthCookie(cookies);
	return json({ success: true });
};
