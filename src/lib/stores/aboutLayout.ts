import { writable, get } from 'svelte/store';
import { createClient } from '$lib/prismicio';
import { slicesToBlocks } from '$lib/utils/aboutSliceMappers';
import { buildAboutLayout } from '$lib/utils/aboutLayoutEngine';
import type { AboutBlock, LayoutRow } from '$lib/types/aboutBlock';

export interface CachedAboutLayout {
	blocks: AboutBlock[];
	layout: LayoutRow[];
}

export const aboutLayoutCache = writable<CachedAboutLayout | null>(null);

let inflight: Promise<CachedAboutLayout> | null = null;

// Fetch the about_library once per session, run the random row shuffle, and cache the result.
// Called eagerly from the root layout so the layout is already prepared by the time the user
// opens the About page — no visible re-shuffle when the slice mounts.
export function ensureAboutLayout(): Promise<CachedAboutLayout> {
	const cached = get(aboutLayoutCache);
	if (cached) return Promise.resolve(cached);
	if (inflight) return inflight;

	inflight = (async () => {
		try {
			const client = createClient();
			const library = await client.getSingle('about_library' as any);
			const librarySlices = (library?.data as { slices?: unknown[] })?.slices ?? [];
			const blocks = slicesToBlocks(librarySlices as any[]);
			const layout = buildAboutLayout(blocks);
			const result: CachedAboutLayout = { blocks, layout };
			aboutLayoutCache.set(result);
			return result;
		} catch (e) {
			inflight = null;
			throw e;
		}
	})();

	return inflight;
}
