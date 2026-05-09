<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import DocumentationItem from '$lib/components/DocumentationItem.svelte';

	type Props = SliceComponentProps<Content.MediaMultipleSlice>;

	const { slice }: Props = $props();

	type Item = {
		image?: { url?: string | null } | null;
		video_url?: string | null;
		play?: string | null;
		hide_on_mobile?: boolean | null;
		no_rounded_corners?: boolean | null;
	};

	const items = $derived(((slice.primary.items ?? []) as Item[]).filter((it) => {
		const hasVideo = typeof it?.video_url === 'string' && it.video_url.trim().length > 0;
		const hasImage = !!it?.image?.url;
		return hasVideo || hasImage;
	}));

	let currentIndex = $state(0);
	let highestLoaded = $state(2);

	$effect(() => {
		const target = Math.min(currentIndex + 2, items.length - 1);
		if (target > highestLoaded) highestLoaded = target;
	});

	function showNext() {
		if (items.length < 2) return;
		currentIndex = (currentIndex + 1) % items.length;
	}
</script>

{#if items.length > 0}
	<section
		data-slice-type={slice.slice_type}
		data-slice-variation={slice.variation}
		class="mx-auto mb-2"
	>
		<div class="relative w-full group">
			{#each items as item, i}
				{@const isLoaded = i <= highestLoaded}
				{@const isActive = i === currentIndex}
				{@const needsControlsOnMobile =
					item.play === 'click-to-play-with-sound' || item.play === 'has-sound'}
				<div
					class={isActive
						? (item.hide_on_mobile ? 'hidden md:block relative' : 'relative')
						: 'absolute inset-0 opacity-0 pointer-events-none'}
					aria-hidden={!isActive}
				>
					{#if isLoaded}
						<DocumentationItem
							{item}
							itemsPerRow={'1'}
							showVideoOnMobile={false}
							noRoundedCorners={item.no_rounded_corners}
							basicVideo={needsControlsOnMobile}
						/>
					{/if}
				</div>
			{/each}

			{#if items.length > 1}
				<button
					type="button"
					onclick={(e) => { e.preventDefault(); e.stopPropagation(); showNext(); }}
					class="absolute bottom-[7px] right-[7px] z-[2] h-10 px-3 rounded-md bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-[opacity,colors] duration-200 pointer-events-auto cursor-pointer md:opacity-0 md:group-hover:opacity-100"
					aria-label="Next media"
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M5 12h14M12 5l7 7-7 7" />
					</svg>
				</button>
			{/if}
		</div>
	</section>
{/if}
