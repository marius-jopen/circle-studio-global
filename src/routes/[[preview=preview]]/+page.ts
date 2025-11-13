import type { PageLoad } from './$types';
import { browser } from '$app/environment';

export const load: PageLoad = async ({ data, url }) => {
	let initialViewMode: 'grid' | 'list' | null = null;

	// Prefer explicit query param when present
	const fromQuery = url.searchParams.get('view');
	if (fromQuery === 'grid' || fromQuery === 'list') {
		initialViewMode = fromQuery;
	}

	// Fallback to localStorage on client
	if (initialViewMode === null && browser) {
		try {
			const stored = localStorage.getItem('indexViewMode');
			if (stored === 'grid' || stored === 'list') {
				initialViewMode = stored;
			}
		} catch {
			// ignore
		}
	}

	return {
		...data,
		initialViewMode
	};
};


