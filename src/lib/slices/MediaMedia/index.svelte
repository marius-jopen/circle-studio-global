<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import VideoPlayerSimple from '$lib/components/VideoPlayerSimple.svelte';

	type Props = SliceComponentProps<Content.MediaMediaSlice>;

	const { slice }: Props = $props();

	type MediaItem = {
		image?: { url?: string | null; alt?: string | null } | null;
		video_url?: string | null;
	};

	function filterMedia(items: MediaItem[] | undefined): MediaItem[] {
		return (items ?? []).filter((m) => {
			const hasVideo = typeof m?.video_url === 'string' && m.video_url.trim().length > 0;
			const hasImage = !!m?.image?.url;
			return hasVideo || hasImage;
		});
	}

	const leftItems = $derived(
		filterMedia((slice.primary as { media_left?: MediaItem[] }).media_left)
	);
	const rightItems = $derived(
		filterMedia((slice.primary as { media_right?: MediaItem[] }).media_right)
	);

	const switchOrder = $derived((slice.primary as { switch?: boolean }).switch ?? false);

	let leftIndex = $state(0);
	let leftHighestLoaded = $state(2);
	let rightIndex = $state(0);
	let rightHighestLoaded = $state(2);

	$effect(() => {
		const target = Math.min(leftIndex + 2, leftItems.length - 1);
		if (target > leftHighestLoaded) leftHighestLoaded = target;
	});

	$effect(() => {
		const target = Math.min(rightIndex + 2, rightItems.length - 1);
		if (target > rightHighestLoaded) rightHighestLoaded = target;
	});

	function getVideoUrl(m: MediaItem): string {
		return typeof m?.video_url === 'string' ? m.video_url.trim() : '';
	}

	function showNextLeft() {
		if (leftItems.length < 2) return;
		leftIndex = (leftIndex + 1) % leftItems.length;
	}

	function showNextRight() {
		if (rightItems.length < 2) return;
		rightIndex = (rightIndex + 1) % rightItems.length;
	}

	const panelClass =
		'bg-white rounded-lg flex items-center justify-center overflow-hidden w-full aspect-square min-w-0 relative group';
</script>

{#snippet mediaPanel(
	items: MediaItem[],
	currentIndex: number,
	highestLoaded: number,
	onNext: () => void
)}
	<div class={panelClass}>
		{#each items as media, i}
			{@const url = getVideoUrl(media)}
			{@const imgUrl = media.image?.url ?? ''}
			{@const isLoaded = i <= highestLoaded}
			<div
				class="absolute inset-0 transition-opacity duration-150"
				style="opacity: {i === currentIndex ? 1 : 0}; z-index: {i === currentIndex
					? 1
					: 0}; pointer-events: {i === currentIndex ? 'auto' : 'none'};"
			>
				{#if url}
					{#if isLoaded}
						<VideoPlayerSimple
							hlsUrl={url}
							posterImage={media.image as any}
							classes="w-full h-full object-cover"
							dimension="square"
							itemsPerRow={1}
							containerSizePercent={100}
							enableOnMobile={true}
							square={true}
						/>
					{:else if imgUrl}
						<img src={imgUrl} alt={media.image?.alt ?? ''} class="w-full h-full object-cover" />
					{/if}
				{:else if imgUrl}
					<img src={imgUrl} alt={media.image?.alt ?? ''} class="w-full h-full object-cover" />
				{/if}
			</div>
		{/each}

		{#if items.length > 1}
			<button
				type="button"
				onclick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					onNext();
				}}
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
{/snippet}

<section
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	class="w-full mb-2"
>
	<div class="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
		{#if switchOrder}
			{#if rightItems.length > 0}
				{@render mediaPanel(rightItems, rightIndex, rightHighestLoaded, showNextRight)}
			{/if}
			{#if leftItems.length > 0}
				{@render mediaPanel(leftItems, leftIndex, leftHighestLoaded, showNextLeft)}
			{/if}
		{:else}
			{#if leftItems.length > 0}
				{@render mediaPanel(leftItems, leftIndex, leftHighestLoaded, showNextLeft)}
			{/if}
			{#if rightItems.length > 0}
				{@render mediaPanel(rightItems, rightIndex, rightHighestLoaded, showNextRight)}
			{/if}
		{/if}
	</div>
</section>
