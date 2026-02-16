<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';

	type Props = SliceComponentProps<Content.TagCloudSlice>;

	const { slice }: Props = $props();
</script>

<section data-slice-type={slice.slice_type} data-slice-variation={slice.variation} class="max-w-10/12 mx-auto">
	<div class="max-w-10/12 mx-auto flex flex-col md:flex-row md:flex-wrap gap-3 items-center md:justify-center">
		{#each slice.primary.items as item}
			<span class="bg-neutral-100 hover:bg-neutral-900 hover:text-white transition-colors duration-300 rounded-md px-5 py-2 text-sm md:text-xl ">
				{item.text}
			</span>
		{/each}
	</div>
</section>
