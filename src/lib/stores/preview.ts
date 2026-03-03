import { writable } from 'svelte/store';

export interface HoverPreviewState {
  url: string | null;
  poster?: any;
  imageUrl?: string | null; // For image-only preview (e.g. List slice)
  uid?: string;
}

export const hoverPreview = writable<HoverPreviewState>({ url: null });


