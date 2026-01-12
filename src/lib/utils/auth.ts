const AUTH_PASSWORD = '5u4TO2ynSz36';
const AUTH_STORAGE_KEY = 'admin_auth';

// Simple client-side only authentication using sessionStorage
export function verifyPassword(password: string): boolean {
	return password === AUTH_PASSWORD;
}

export function setAuth(): void {
	if (typeof window !== 'undefined') {
		sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
	}
}

export function clearAuth(): void {
	if (typeof window !== 'undefined') {
		sessionStorage.removeItem(AUTH_STORAGE_KEY);
	}
}

export function isAuthenticated(): boolean {
	if (typeof window !== 'undefined') {
		return sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true';
	}
	return false;
}
