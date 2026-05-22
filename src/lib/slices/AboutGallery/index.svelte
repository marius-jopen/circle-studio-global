<script lang="ts">
	import type { SliceComponentProps } from '@prismicio/svelte';
	import GalleryBlock from '$lib/components/about/blocks/GalleryBlock.svelte';
	import { sliceToGalleryBlock } from '$lib/utils/aboutSliceMappers';

	type Props = SliceComponentProps<any>;
	const { slice }: Props = $props();

	const block = $derived(sliceToGalleryBlock(slice));
</script>

<!--
	On a real page these blocks get their height from the About layout grid (h-full).
	Rendered standalone (the Slice Machine simulator / page-builder screenshot) there is no
	grid, so give them a square box — otherwise h-full collapses to 0 and the preview is blank.
-->
<section data-slice-type={slice.slice_type} data-slice-variation={slice.variation} class="p-2">
	<div class="mx-auto aspect-square w-full max-w-[500px]">
		<GalleryBlock {block} />
	</div>
</section>
