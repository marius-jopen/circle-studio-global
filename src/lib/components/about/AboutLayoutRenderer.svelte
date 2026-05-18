<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import AboutBlock from './AboutBlock.svelte';
	import {
		buildAboutLayout,
		gridColsClassFor,
		colSpanClassFor,
		rowFormat,
		smallestSlotIndex,
		SIZE_FRACTIONS
	} from '$lib/utils/aboutLayoutEngine';
	import { FORMAT_ASPECT } from '$lib/types/aboutBlock';
	import type { AboutBlock as AboutBlockType, LayoutRow } from '$lib/types/aboutBlock';

	export let blocks: AboutBlockType[] = [];

	let clientSeed = 0;
	let layout: LayoutRow[] = [];
	let isDesktop = false;
	let rowEls: Array<HTMLDivElement | null> = [];
	let rowHeights: number[] = [];
	let resizeObservers: ResizeObserver[] = [];

	$: {
		clientSeed;
		layout = buildAboutLayout(blocks);
	}

	function measureRow(idx: number) {
		const el = rowEls[idx];
		const row = layout[idx];
		if (!el || !isDesktop || !row) {
			rowHeights[idx] = 0;
			rowHeights = rowHeights;
			return;
		}
		// Press rows have natural content height — don't force a row height.
		if (row.blocks.some((b) => b.type === 'press')) {
			rowHeights[idx] = 0;
			rowHeights = rowHeights;
			return;
		}
		const fractions = row.pattern.map((s) => SIZE_FRACTIONS[s]);
		const minFraction = Math.min(...fractions);

		const smallestIdx = smallestSlotIndex(row);
		const cells = el.children;
		const smallestCell = cells[smallestIdx] as HTMLElement | undefined;
		if (!smallestCell) return;
		const w = smallestCell.clientWidth;
		if (w <= 0) return;

		let cellAspect: number;
		if (minFraction === 1) {
			cellAspect = 16 / 9;
		} else {
			const format = rowFormat(row);
			if (!format) {
				rowHeights[idx] = 0;
				rowHeights = rowHeights;
				return;
			}
			cellAspect = FORMAT_ASPECT[format];
		}
		const targetHeight = w / cellAspect;
		rowHeights[idx] = Math.round(targetHeight);
		rowHeights = rowHeights;
	}

	function setupObservers() {
		resizeObservers.forEach((ro) => ro.disconnect());
		resizeObservers = [];
		rowEls.forEach((el, idx) => {
			if (!el) return;
			const ro = new ResizeObserver(() => measureRow(idx));
			ro.observe(el);
			resizeObservers.push(ro);
			measureRow(idx);
		});
	}

	onMount(() => {
		clientSeed = Math.random();
		const mq = window.matchMedia('(min-width: 768px)');
		isDesktop = mq.matches;
		const handler = (e: MediaQueryListEvent) => {
			isDesktop = e.matches;
			setupObservers();
		};
		mq.addEventListener('change', handler);
		tick().then(setupObservers);
		return () => mq.removeEventListener('change', handler);
	});

	onDestroy(() => {
		resizeObservers.forEach((ro) => ro.disconnect());
	});

	$: if (layout) {
		queueMicrotask(() => setupObservers());
	}
</script>

<div class="space-y-2">
	{#each layout as row, rowIndex (rowIndex + '-' + row.blocks.map((b) => b.id).join('-'))}
		<div
			bind:this={rowEls[rowIndex]}
			class="grid gap-2 {gridColsClassFor(row.pattern)}"
			style={isDesktop && rowHeights[rowIndex]
				? `height: ${rowHeights[rowIndex]}px; grid-template-rows: minmax(0, 1fr); align-items: stretch;`
				: ''}
		>
			{#each row.blocks as block, i (block.id)}
				<div class="h-full min-h-0 overflow-hidden {colSpanClassFor(row.pattern[i], row.pattern)}">
					<AboutBlock {block} size={row.pattern[i]} />
				</div>
			{/each}
		</div>
	{/each}
</div>
