<script lang="ts">
	import type { SliceComponentProps } from '@prismicio/svelte';
	import PressBlock from '$lib/components/about/blocks/PressBlock.svelte';
	import { sliceToPressBlock } from '$lib/utils/aboutSliceMappers';

	type Props = SliceComponentProps<any>;
	const { slice }: Props = $props();

	const block = $derived(sliceToPressBlock(slice));
</script>

<section data-slice-type={slice.slice_type} data-slice-variation={slice.variation}>
	<PressBlock {block} />
</section>
