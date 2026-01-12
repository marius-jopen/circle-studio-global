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

export function setAuthCookie(cookies: any, url?: URL | string): void {
	// Determine if we should use secure cookies
	// Check if URL is HTTPS or if we're in production
	let isSecure = false;
	
	if (url) {
		const urlObj = typeof url === 'string' ? new URL(url) : url;
		isSecure = urlObj.protocol === 'https:';
	} else {
		// Fallback: check if we're in production
		// In Vercel, this will be true
		isSecure = import.meta.env.PROD;
	}
	
	cookies.set(AUTH_COOKIE_NAME, 'true', {
		path: '/',
		httpOnly: true,
		secure: isSecure, // true in production (HTTPS), false in dev (HTTP)
		sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
		maxAge: 60 * 60 * 24 * 30 // 30 days
	});
}

export function clearAuthCookie(cookies: any): void {
	cookies.delete(AUTH_COOKIE_NAME, { path: '/' });
}

export function verifyPassword(password: string): boolean {
	return password === AUTH_PASSWORD;
}
