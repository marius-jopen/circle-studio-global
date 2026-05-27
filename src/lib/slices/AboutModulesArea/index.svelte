<script lang="ts">
	import { onMount } from 'svelte';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import AboutLayoutRenderer from '$lib/components/about/AboutLayoutRenderer.svelte';
	import { aboutLayoutCache, ensureAboutLayout } from '$lib/stores/aboutLayout';
	import type { LayoutRow } from '$lib/types/aboutBlock';

	type Props = SliceComponentProps<any>;
	const { slice }: Props = $props();

	let layout = $state<LayoutRow[]>([]);
	let loaded = $state(false);

	// Use the cached layout if the root layout already prefetched it; otherwise kick off the fetch
	// here as a fallback (e.g. deep-link straight to /about while the prefetch is still inflight).
	const unsubscribe = aboutLayoutCache.subscribe((value) => {
		if (value) {
			layout = value.layout;
			loaded = true;
		}
	});

	onMount(() => {
		ensureAboutLayout().catch((e) => {
			console.error('Failed to load About library', e);
			loaded = true;
		});
		return unsubscribe;
	});
</script>

<section
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	class="my-2"
>
	{#if loaded && layout.length > 0}
		<AboutLayoutRenderer {layout} />
	{/if}
</section>
