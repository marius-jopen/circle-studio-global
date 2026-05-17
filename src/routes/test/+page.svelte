<script lang="ts">
	import AboutLayoutRenderer from '$lib/components/about/AboutLayoutRenderer.svelte';
	import type { AboutBlock } from '$lib/types/aboutBlock';

	export let data;

	let blocks: AboutBlock[] = [];
	$: blocks = data.blocks;

	let rerollKey = 0;
	function reroll() {
		rerollKey += 1;
	}
</script>

<svelte:head>
	<title>About — Test</title>
</svelte:head>

<div class="px-2 py-6">
	<div class="mb-4 flex items-center justify-between">
		<h1 class="text-xl font-medium text-primary">
			About — Test Layout
			{#if data.usingDummyData}
				<span class="ml-2 text-xs text-neutral-400">(dummy data)</span>
			{/if}
		</h1>
		<button
			type="button"
			class="rounded bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-700"
			on:click={reroll}
		>
			Re-roll layout
		</button>
	</div>

	{#key rerollKey}
		<AboutLayoutRenderer {blocks} />
	{/key}
</div>
