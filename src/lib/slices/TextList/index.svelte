<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';

	type Props = SliceComponentProps<Content.TextListSlice>;

	const { slice }: Props = $props();
</script>

<section data-slice-type={slice.slice_type} data-slice-variation={slice.variation}>
	{#if slice.primary.items && slice.primary.items.length > 0}
		<div class="content-container mb-12 md:mb-8 mt-6 text-black md:hover:text-black/25 md:text-center h0">
			{#each slice.primary.items as item}
				<div class="mb-0 md:pb-1 hover:text-black transition-colors duration-200">
					{item.text}
				</div>
			{/each}
		</div>
	{/if}
</section>
