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
	
	// Render all items; individual items decide whether to show video or image
	const items = $derived(slice.primary.items ?? []);
	// Show the section if there are any items at all
	const hasItems = $derived(items.length > 0);
</script>

{#if hasItems}
	<section 
		data-slice-type={slice.slice_type} 
		data-slice-variation={slice.variation}
		class="mx-auto"
	>
		<div class="grid gap-2 {gridClass}">
		{#each items as item}
			{@const needsControlsOnMobile = item.play === 'click-to-play-with-sound' || item.play === 'has-sound'}
			<div class={item.hide_on_mobile ? 'hidden md:block mb-2' : 'mb-2'}>
				<DocumentationItem {item} itemsPerRow={itemsPerRow} showVideoOnMobile={false} noRoundedCorners={item.no_rounded_corners} basicVideo={needsControlsOnMobile} />
			</div>
		{/each}
		</div>
	</section>
{/if}