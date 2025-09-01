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
</script>

<section 
	data-slice-type={slice.slice_type} 
	data-slice-variation={slice.variation}
	class="mx-auto pb-2"
>
	{#if slice.primary.items && slice.primary.items.length > 0}
		<div class="grid gap-2 {gridClass}">
			{#each slice.primary.items as item}
				<DocumentationItem {item} itemsPerRow={itemsPerRow} />
			{/each}
		</div>
	{/if}
</section>