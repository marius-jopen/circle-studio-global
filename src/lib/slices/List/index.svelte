<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import { PrismicLink } from '@prismicio/svelte';
	import { isFilled, asLink } from '@prismicio/client';
	import { onMount } from 'svelte';

	type Props = SliceComponentProps<Content.ListSlice>;

	const { slice }: Props = $props();

	// Mobile detection
	let isMobile = $state(false);

	// Get items from slice - Group fields are arrays
	let items = $derived((slice.primary?.items as any[]) || []);
	

	// Sort by year descending
	let sortedItems = $derived([...items].sort((a, b) => {
		const aYear = a.year ? parseInt(a.year) : -Infinity;
		const bYear = b.year ? parseInt(b.year) : -Infinity;
		return bYear - aYear;
	}));

	// Animation state - track which items are visible
	// Initialize with all items visible, then animate them in
	let visibleItems = $state(new Set<number>());
	
	onMount(() => {
		// Check if we're on mobile
		const checkMobile = () => {
			isMobile = window.innerWidth < 768;
		};

		// Initial check
		checkMobile();

		// Listen for resize events
		window.addEventListener('resize', checkMobile);

		// Trigger staggered animation after component mounts
		setTimeout(() => {
			sortedItems.forEach((_, index) => {
				setTimeout(() => {
					visibleItems.add(index);
				}, index * 50);
			});
		}, 100);

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});

	function formatYear(year: string | null | undefined): string {
		if (!year) return '';
		return year;
	}

	function getLinkUrl(item: any): string | null {
		if (!item.link) return null;
		return asLink(item.link) || null;
	}

	function getLinkText(item: any): string {
		if (item.link?.text) return item.link.text;
		if (item.link) {
			const url = asLink(item.link);
			return url || '';
		}
		return '';
	}
</script>

<section data-slice-type={slice.slice_type} data-slice-variation={slice.variation} class="list-none">
	{#if sortedItems.length > 0}
		<div class="divide-y divide-black/10 border-t border-b border-black/10 text-black md:hover:text-black/25 mt-4 mx-6 list-none">
			{#each sortedItems as item, index}
				{@const linkUrl = getLinkUrl(item)}
				{@const linkText = getLinkText(item)}
				{@const hasLink = isFilled.link(item.link)}

				{#if hasLink}
					<PrismicLink
						field={item.link}
						class="list-item block py-2.5 transition-all duration-500 ease-out {visibleItems.has(index) ? 'opacity-100 translate-y-0' : 'opacity-100 translate-y-0'} {isMobile ? '' : 'hover:text-black'}"
					>
						<div class="grid grid-cols-12 items-start gap-2 paragraph-1">
							<div class="col-span-6  md:col-span-3 text-left tracking-wide text-sm md:text-lg">{linkText || 'Magazine'}</div>
							<div class="col-span-6  md:col-span-6  text-sm md:text-lg">{item.text || ''}</div>
							<div class="col-span-6  md:col-span-3 text-right text-sm md:text-lg hidden md:block">{formatYear(item.year)}</div>
						</div>
					</PrismicLink>
				{:else}
					<div class="list-item block py-2.5 transition-all duration-500 ease-out {visibleItems.has(index) ? 'opacity-100 translate-y-0' : 'opacity-100 translate-y-0'} {isMobile ? '' : 'hover:text-black'}">
						<div class="grid grid-cols-12 items-start gap-2 paragraph-1">
							<div class="col-span-6  md:col-span-3 text-left tracking-wide text-sm md:text-lg">{linkText || 'Magazine'}</div>
							<div class="col-span-6  md:col-span-6  text-sm md:text-lg">{item.text || ''}</div>
							<div class="col-span-6  md:col-span-3 text-right text-sm md:text-lg hidden md:block">{formatYear(item.year)}</div>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{:else}
		<div class="text-black mt-4 p-4">
			No items found. Check console for debug info.
		</div>
	{/if}
</section>

<style>
	/* Remove list decorations */
	section {
		list-style: none;
	}
	
	section > div {
		list-style: none;
	}
	
	/* Staggered animation for list items */
	:global(.list-item) {
		transition: opacity 0.6s ease-out, transform 0.6s ease-out;
		list-style: none;
	}

	/* Mobile-specific adjustments */
	@media (max-width: 767px) {
		/* Ensure proper spacing on mobile */
		:global(.paragraph-1) {
			font-size: 0.875rem;
			line-height: 1.25rem;
		}

		/* Adjust grid gap for mobile */
		:global(.grid) {
			gap: 0.5rem;
		}

		/* Optimize touch experience on mobile */
		:global(.list-item) {
			cursor: pointer;
			-webkit-tap-highlight-color: transparent;
		}
	}
</style>
