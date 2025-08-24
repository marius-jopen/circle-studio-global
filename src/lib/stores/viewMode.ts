import { writable } from 'svelte/store';

export type ViewMode = 'grid' | 'list';

// Create a writable store for view mode
export const viewMode = writable<ViewMode>('grid');

// Function to set view mode and save to localStorage
export function setViewMode(mode: ViewMode) {
	console.log('🔄 setViewMode called with:', mode, 'current localStorage:', localStorage.getItem('indexViewMode'));
	viewMode.set(mode);
	try {
		localStorage.setItem('indexViewMode', mode);
		console.log('💾 View mode saved to localStorage:', mode);
	} catch {}
}

// Function to initialize view mode from localStorage or URL
export function initializeViewMode() {
	try {
		console.log('🚀 initializeViewMode called');
		const url = new URL(window.location.href);
		const fromQuery = url.searchParams.get('view');
		const stored = localStorage.getItem('indexViewMode');
		console.log('📊 initializeViewMode - fromQuery:', fromQuery, 'stored:', stored);
		
		const initial: ViewMode = (fromQuery === 'grid' || fromQuery === 'list')
			? (fromQuery as ViewMode)
			: (stored === 'grid' || stored === 'list' ? (stored as ViewMode) : 'grid');
		
		console.log('🎯 Setting initial view mode to:', initial);
		viewMode.set(initial);
	} catch {
		console.log('❌ Error in initializeViewMode, setting to grid');
		viewMode.set('grid');
	}
}
