<script lang="ts">
	import type { SliceComponentProps } from '@prismicio/svelte';
	import CircleBlock from '$lib/components/about/blocks/CircleBlock.svelte';
	import { sliceToCircleBlock } from '$lib/utils/aboutSliceMappers';

	type Props = SliceComponentProps<any>;
	const { slice }: Props = $props();

	const block = $derived(sliceToCircleBlock(slice));
</script>

<section data-slice-type={slice.slice_type} data-slice-variation={slice.variation}>
	<CircleBlock {block} />
</section>
