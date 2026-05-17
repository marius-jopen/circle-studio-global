<script lang="ts">
	import type { SliceComponentProps } from '@prismicio/svelte';
	import GalleryBlock from '$lib/components/about/blocks/GalleryBlock.svelte';
	import { sliceToGalleryBlock } from '$lib/utils/aboutSliceMappers';

	type Props = SliceComponentProps<any>;
	const { slice }: Props = $props();

	const block = $derived(sliceToGalleryBlock(slice));
</script>

<section data-slice-type={slice.slice_type} data-slice-variation={slice.variation}>
	<GalleryBlock {block} />
</section>
