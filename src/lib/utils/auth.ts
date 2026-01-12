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

export function setAuthCookie(cookies: any, url?: URL | string, request?: Request): void {
	// Determine if we should use secure cookies
	// Check multiple sources to detect HTTPS (important for Vercel/proxies)
	let isSecure = false;
	
	// First, check x-forwarded-proto header (Vercel sets this)
	if (request) {
		const forwardedProto = request.headers.get('x-forwarded-proto');
		if (forwardedProto === 'https') {
			isSecure = true;
		}
	}
	
	// If not set yet, check URL protocol
	if (!isSecure && url) {
		const urlObj = typeof url === 'string' ? new URL(url) : url;
		isSecure = urlObj.protocol === 'https:';
	}
	
	// Fallback: check if we're in production
	// In Vercel, this will be true
	if (!isSecure) {
		isSecure = import.meta.env.PROD;
	}
	
	// Cookie options for Vercel/production
	const cookieOptions: any = {
		path: '/',
		httpOnly: true,
		secure: isSecure, // true in production (HTTPS), false in dev (HTTP)
		sameSite: 'lax' as const, // Changed from 'strict' to 'lax' for better compatibility
		maxAge: 60 * 60 * 24 * 30 // 30 days
	};
	
	// In production (Vercel), don't set domain to allow subdomain cookies
	// Setting domain can cause issues with cookies not being set
	
	cookies.set(AUTH_COOKIE_NAME, 'true', cookieOptions);
}

export function clearAuthCookie(cookies: any): void {
	cookies.delete(AUTH_COOKIE_NAME, { path: '/' });
}

export function verifyPassword(password: string): boolean {
	return password === AUTH_PASSWORD;
}
