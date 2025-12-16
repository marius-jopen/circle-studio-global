import { writable } from 'svelte/store';

export type ViewMode = 'grid' | 'list';

// Create a writable store for view mode
export const viewMode = writable<ViewMode>('grid');

// Function to set view mode and save to localStorage
export function setViewMode(mode: ViewMode) {
	// Check if we're on mobile - if so, always force grid view
	const isMobile = window.innerWidth < 768; // md breakpoint
	if (isMobile && mode === 'list') {
		mode = 'grid';
	}
	
	viewMode.set(mode);
	try {
		localStorage.setItem('indexViewMode', mode);
	} catch {}
}

// Function to initialize view mode from localStorage or URL
export function initializeViewMode() {
	try {
		// Check if we're on mobile - if so, always use grid view
		const isMobile = window.innerWidth < 768; // md breakpoint
		if (isMobile) {
			viewMode.set('grid');
			return;
		}
		
		const url = new URL(window.location.href);
		const fromQuery = url.searchParams.get('view');
		const stored = localStorage.getItem('indexViewMode');
		
		const initial: ViewMode = (fromQuery === 'grid' || fromQuery === 'list')
			? (fromQuery as ViewMode)
			: (stored === 'grid' || stored === 'list' ? (stored as ViewMode) : 'grid');
		
		viewMode.set(initial);
	} catch {
		viewMode.set('grid');
	}
}
