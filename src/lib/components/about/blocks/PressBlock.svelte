<script lang="ts">
	import { PrismicLink } from '@prismicio/svelte';
	import { isFilled, asLink } from '@prismicio/client';
	import { onMount } from 'svelte';
	import { hoverPreview } from '$lib/stores/preview';
	import { get } from 'svelte/store';
	import type { PressBlock, PressItem } from '$lib/types/aboutBlock';

	export let block: PressBlock;

	let isMobile = false;

	$: items = block.items ?? [];
	$: headline = block.headline ?? '';

	$: sortedItems = [...items].sort((a, b) => {
		const aYear = a.year ? parseInt(a.year) : -Infinity;
		const bYear = b.year ? parseInt(b.year) : -Infinity;
		return bYear - aYear;
	});

	let visibleItems = new Set<number>();

	onMount(() => {
		const checkMobile = () => {
			isMobile = window.innerWidth < 768;
		};
		checkMobile();
		window.addEventListener('resize', checkMobile);

		setTimeout(() => {
			sortedItems.forEach((_, index) => {
				setTimeout(() => {
					visibleItems.add(index);
					visibleItems = visibleItems;
				}, index * 50);
			});
		}, 100);

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});

	function formatYear(year: string | null | undefined): string {
		return year ?? '';
	}

	function getLinkText(item: PressItem): string {
		const link = item.link as { text?: string } | null;
		if (link?.text) return link.text;
		if (item.link) {
			const url = asLink(item.link as Parameters<typeof asLink>[0]);
			return url || '';
		}
		return '';
	}

	function getImageUrl(item: PressItem): string | null {
		return item?.image?.url ?? null;
	}

	function handleItemMouseEnter(item: PressItem, index: number) {
		if (!isMobile && getImageUrl(item)) {
			hoverPreview.set({
				url: null,
				imageUrl: getImageUrl(item),
				uid: `press-${index}`
			});
		}
	}

	function handleItemMouseLeave(index: number) {
		if (!isMobile) {
			const current = get(hoverPreview);
			if (current?.uid === `press-${index}`) {
				hoverPreview.set({ url: null, imageUrl: null });
			}
		}
	}
</script>

<section class="list-none w-full">
	{#if sortedItems.length > 0}
		<div class="divide-y divide-black/10 text-black md:hover:text-black/25 list-none rounded-lg overflow-hidden px-4 py-1 bg-white">
			{#if headline}
				<div class="text-sm md:text-xl font-medium text-primary pl-0 pr-4 md:pr-6 pt-2.5 pb-[13px] text-left">
					{headline}
				</div>
			{/if}
			{#each sortedItems as item, index}
				{@const linkText = getLinkText(item)}
				{@const hasLink = isFilled.link(item.link as Parameters<typeof isFilled.link>[0])}

				{#if hasLink}
					<PrismicLink
						field={item.link as any}
						class="list-item block py-1.5 transition-all duration-500 ease-out {visibleItems.has(index) ? 'opacity-100 translate-y-0' : 'opacity-100 translate-y-0'} {isMobile ? '' : 'hover:text-black'}"
						onmouseenter={() => handleItemMouseEnter(item, index)}
						onmouseleave={() => handleItemMouseLeave(index)}
					>
						<div class="grid grid-cols-2 md:grid-cols-[25%_1fr_auto] items-start gap-2 md:gap-4 paragraph-1">
							<div class="col-span-1 text-left tracking-wide text-xs md:text-base truncate min-w-0">{linkText || 'Magazine'}</div>
							<div class="col-span-1 text-xs md:text-base truncate min-w-0">{item.text || ''}</div>
							<div class="text-right text-xs md:text-base hidden md:block tabular-nums whitespace-nowrap">{formatYear(item.year)}</div>
						</div>
					</PrismicLink>
				{:else}
					<div
						role="listitem"
						class="list-item block py-1.5 transition-all duration-500 ease-out {visibleItems.has(index) ? 'opacity-100 translate-y-0' : 'opacity-100 translate-y-0'} {isMobile ? '' : 'hover:text-black'}"
						on:mouseenter={() => handleItemMouseEnter(item, index)}
						on:mouseleave={() => handleItemMouseLeave(index)}
					>
						<div class="grid grid-cols-2 md:grid-cols-[25%_1fr_auto] items-start gap-2 md:gap-4 paragraph-1">
							<div class="col-span-1 text-left tracking-wide text-xs md:text-base truncate min-w-0">{linkText || 'Magazine'}</div>
							<div class="col-span-1 text-xs md:text-base truncate min-w-0">{item.text || ''}</div>
							<div class="text-right text-xs md:text-base hidden md:block tabular-nums whitespace-nowrap">{formatYear(item.year)}</div>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</section>

<style>
	section {
		list-style: none;
	}
	section > div {
		list-style: none;
	}
	:global(.list-item) {
		transition: opacity 0.6s ease-out, transform 0.6s ease-out;
		list-style: none;
	}
	@media (max-width: 767px) {
		:global(.paragraph-1) {
			font-size: 0.875rem;
			line-height: 1.25rem;
		}
		:global(.grid) {
			gap: 0.5rem;
		}
		:global(.list-item) {
			cursor: pointer;
			-webkit-tap-highlight-color: transparent;
		}
	}
</style>
