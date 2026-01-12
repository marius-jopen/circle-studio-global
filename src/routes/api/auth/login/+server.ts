import { json } from '@sveltejs/kit';
import { verifyPassword, setAuthCookie } from '$lib/utils/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies, url }) => {
	try {
		const { password } = await request.json();

		if (!verifyPassword(password)) {
			return json({ error: 'Invalid password' }, { status: 401 });
		}

		setAuthCookie(cookies, url, request);

		return json({ success: true });
	} catch (error) {
		return json({ error: 'Invalid request' }, { status: 400 });
	}
};
