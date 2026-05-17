<script lang="ts">
	import type { SliceComponentProps } from '@prismicio/svelte';
	import CollaboratorsBlock from '$lib/components/about/blocks/CollaboratorsBlock.svelte';
	import { sliceToCollaboratorsBlock } from '$lib/utils/aboutSliceMappers';

	type Props = SliceComponentProps<any>;
	const { slice }: Props = $props();

	const block = $derived(sliceToCollaboratorsBlock(slice));
</script>

<section data-slice-type={slice.slice_type} data-slice-variation={slice.variation}>
	<CollaboratorsBlock {block} />
</section>
