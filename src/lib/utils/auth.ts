const AUTH_COOKIE_NAME = 'admin_auth';
const AUTH_PASSWORD = '5u4TO2ynSz36';

export function isAuthenticated(cookies?: any): boolean {
	if (cookies) {
		// Server-side check
		return cookies.get(AUTH_COOKIE_NAME) === 'true';
	}
	// Client-side check (fallback, but should use server-side)
	return false;
}

export function setAuthCookie(cookies: any): void {
	const isProduction = process.env.NODE_ENV === 'production';
	cookies.set(AUTH_COOKIE_NAME, 'true', {
		path: '/',
		httpOnly: true,
		secure: isProduction,
		sameSite: 'strict',
		maxAge: 60 * 60 * 24 * 30 // 30 days
	});
}

export function clearAuthCookie(cookies: any): void {
	cookies.delete(AUTH_COOKIE_NAME, { path: '/' });
}

export function verifyPassword(password: string): boolean {
	return password === AUTH_PASSWORD;
}
