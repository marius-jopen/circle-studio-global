import { writable } from 'svelte/store';

export interface HoverPreviewState {
  url: string | null;
  poster?: any;
  uid?: string;
}

export const hoverPreview = writable<HoverPreviewState>({ url: null });


