<script lang="ts">
	import { onMount } from 'svelte';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import AboutLayoutRenderer from '$lib/components/about/AboutLayoutRenderer.svelte';
	import { createClient } from '$lib/prismicio';
	import { slicesToBlocks } from '$lib/utils/aboutSliceMappers';
	import type { AboutBlock } from '$lib/types/aboutBlock';

	type Props = SliceComponentProps<any>;
	const { slice }: Props = $props();

	let blocks = $state<AboutBlock[]>([]);
	let loaded = $state(false);

	onMount(async () => {
		try {
			const client = createClient();
			const library = await client.getSingle('about_library' as any);
			const librarySlices =
				(library?.data as { slices?: unknown[] })?.slices ?? [];
			blocks = slicesToBlocks(librarySlices as any[]);
		} catch (e) {
			console.error('Failed to load About library', e);
			blocks = [];
		} finally {
			loaded = true;
		}
	});
</script>

<section
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	class="my-2"
>
	{#if loaded && blocks.length > 0}
		<AboutLayoutRenderer {blocks} />
	{/if}
</section>
