<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import DocumentationItem from '$lib/components/DocumentationItem.svelte';

	type Props = SliceComponentProps<Content.DocumentationSlice>;

	const { slice }: Props = $props();
	
	// Get grid columns class based on items_per_row
	const getGridCols = (itemsPerRow: string) => {
		switch (itemsPerRow) {
			case '1': return 'grid-cols-1';
			case '2': return 'grid-cols-1 md:grid-cols-2';
			case '3': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
			case '4': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
			default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
		}
	};
	
	const itemsPerRow = $derived(slice.primary.items_per_row || '3');
	const gridClass = $derived(getGridCols(itemsPerRow));
	
	// Only render items that actually have a video
	const itemsWithVideo = $derived((slice.primary.items ?? []).filter((it) => !!it.video_url));
	// Check if any items have videos
	const hasVideos = $derived(itemsWithVideo.length > 0);
</script>

{#if hasVideos}
	<section 
		data-slice-type={slice.slice_type} 
		data-slice-variation={slice.variation}
		class="mx-auto pb-2"
	>
		<div class="grid gap-2 {gridClass}">
			{#each itemsWithVideo as item}
				<DocumentationItem {item} itemsPerRow={itemsPerRow} showVideoOnMobile={false} />
			{/each}
		</div>
	</section>
{/if}