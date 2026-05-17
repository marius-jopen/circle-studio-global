<script lang="ts">
	import AboutBlock from './AboutBlock.svelte';
	import {
		buildAboutLayout,
		gridColsClassFor,
		colSpanClassFor,
		rowAspectRatio
	} from '$lib/utils/aboutLayoutEngine';
	import type { AboutBlock as AboutBlockType, LayoutRow } from '$lib/types/aboutBlock';

	export let blocks: AboutBlockType[] = [];

	let layout: LayoutRow[] = [];
	$: layout = buildAboutLayout(blocks);

	function rowStyle(row: LayoutRow): string {
		const aspect = rowAspectRatio(row);
		return aspect ? `--md-aspect: ${aspect};` : '';
	}
</script>

<div class="space-y-2">
	{#each layout as row, rowIndex (rowIndex + '-' + row.blocks.map((b) => b.id).join('-'))}
		<div
			class="about-row grid gap-2 {gridColsClassFor(row.pattern)}"
			style={rowStyle(row)}
		>
			{#each row.blocks as block, i (block.id)}
				<div class="min-h-[120px] h-full {colSpanClassFor(row.pattern[i], row.pattern)}">
					<AboutBlock {block} size={row.pattern[i]} />
				</div>
			{/each}
		</div>
	{/each}
</div>

<style>
	@media (min-width: 768px) {
		.about-row {
			aspect-ratio: var(--md-aspect, auto);
		}
	}
</style>
