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
		
		// Verify cookie was set
		const cookieValue = cookies.get('admin_auth');
		console.log('Cookie set:', cookieValue);

		return json({ success: true });
	} catch (error) {
		console.error('Login error:', error);
		return json({ error: 'Invalid request' }, { status: 400 });
	}
};
