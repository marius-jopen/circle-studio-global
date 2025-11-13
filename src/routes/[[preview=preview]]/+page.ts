import type { PageLoad } from './$types';
import { browser } from '$app/environment';

export const load: PageLoad = async ({ data }) => {
	let initialViewMode: 'grid' | 'list' | null = null;

	// On client: prefer explicit query param; fallback to localStorage
	if (browser) {
		try {
			const fromQuery = new URLSearchParams(window.location.search).get('view');
			if (fromQuery === 'grid' || fromQuery === 'list') {
				initialViewMode = fromQuery;
			}
		} catch {
			// ignore
		}
	}
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


