<script lang="ts">
	import { onMount } from 'svelte';
	import AboutBlock from './AboutBlock.svelte';
	import {
		buildAboutLayout,
		gridColsClassFor,
		colSpanClassFor,
		cellAspectRatio
	} from '$lib/utils/aboutLayoutEngine';
	import type { AboutBlock as AboutBlockType, LayoutRow } from '$lib/types/aboutBlock';

	export let blocks: AboutBlockType[] = [];

	let clientSeed = 0;
	let layout: LayoutRow[] = [];
	let isDesktop = false;
	$: {
		clientSeed;
		layout = buildAboutLayout(blocks);
	}

	onMount(() => {
		clientSeed = Math.random();
		const mq = window.matchMedia('(min-width: 768px)');
		isDesktop = mq.matches;
		const handler = (e: MediaQueryListEvent) => (isDesktop = e.matches);
		mq.addEventListener('change', handler);
		return () => mq.removeEventListener('change', handler);
	});

	function cellStyle(row: LayoutRow, i: number): string {
		if (!isDesktop) return '';
		const aspect = cellAspectRatio(row, i);
		return aspect ? `aspect-ratio: ${aspect};` : '';
	}

	$: cellStyles = layout.map((row) => row.blocks.map((_, i) => cellStyle(row, i)));
</script>

<div class="space-y-2">
	{#each layout as row, rowIndex (rowIndex + '-' + row.blocks.map((b) => b.id).join('-'))}
		<div class="grid gap-2 {gridColsClassFor(row.pattern)}">
			{#each row.blocks as block, i (block.id)}
				<div
					class="overflow-hidden {colSpanClassFor(row.pattern[i], row.pattern)}"
					style={cellStyles[rowIndex]?.[i] ?? ''}
				>
					<AboutBlock {block} size={row.pattern[i]} />
				</div>
			{/each}
		</div>
	{/each}
</div>
