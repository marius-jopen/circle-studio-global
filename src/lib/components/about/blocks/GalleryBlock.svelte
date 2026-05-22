<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import VideoPlayerSimple from '$lib/components/VideoPlayerSimple.svelte';
	import type { GalleryBlock, GalleryItem } from '$lib/types/aboutBlock';
	import { FORMAT_ASPECT } from '$lib/types/aboutBlock';

	export let block: GalleryBlock;

	let currentIndex = 0;
	let highestLoaded = 2;

	$: items = (block.items ?? []).filter((m) => {
		const hasVideo = typeof m?.video_url === 'string' && (m.video_url ?? '').trim().length > 0;
		const hasImage = !!m?.image?.url;
		return hasVideo || hasImage;
	});
	$: count = items.length;

	// Title slot: per-item value wins, otherwise fall back to the slice-level title/color.
	$: currentItem = items[currentIndex];
	$: effectiveTitle = (currentItem?.title ?? '').trim() || (block.title ?? '');
	$: effectiveTitleColor =
		currentItem?.title_color === 'black' || currentItem?.title_color === 'white'
			? currentItem.title_color
			: block.titleColor;

	$: {
		const target = Math.min(currentIndex + 2, count - 1);
		if (target > highestLoaded) highestLoaded = target;
	}

	function getVideoUrl(m: GalleryItem): string {
		return typeof m?.video_url === 'string' ? m.video_url.trim() : '';
	}

	function next() {
		if (count < 2) return;
		currentIndex = (currentIndex + 1) % count;
	}

	function prev() {
		if (count < 2) return;
		currentIndex = (currentIndex - 1 + count) % count;
	}

	let cellRef: HTMLDivElement | null = null;
	let mediaW = 0;
	let mediaH = 0;
	let resizeObserver: ResizeObserver | null = null;

	$: forced = block.forceFormat === true;
	$: forcedAspect = FORMAT_ASPECT[block.preferredFormat];

	function updateSize() {
		if (!cellRef) return;
		const cw = cellRef.clientWidth;
		const ch = cellRef.clientHeight;
		if (cw <= 0 || ch <= 0) return;
		if (!forced) {
			mediaW = cw;
			mediaH = ch;
			return;
		}
		const cellAspect = cw / ch;
		if (cellAspect > forcedAspect) {
			mediaH = ch;
			mediaW = ch * forcedAspect;
		} else {
			mediaW = cw;
			mediaH = cw / forcedAspect;
		}
	}

	onMount(() => {
		if (!browser || !cellRef) return;
		updateSize();
		resizeObserver = new ResizeObserver(updateSize);
		resizeObserver.observe(cellRef);
	});

	onDestroy(() => {
		resizeObserver?.disconnect();
	});

	$: forced, forcedAspect, updateSize();
</script>

<div bind:this={cellRef} class="w-full h-full min-h-0 flex items-center justify-center">
	<div
		class="group relative overflow-hidden rounded-lg bg-neutral-100 min-h-0"
		style={forced
			? `width: ${mediaW}px; height: ${mediaH}px;`
			: 'width: 100%; height: 100%;'}
	>
		{#each items as media, i}
			{@const url = getVideoUrl(media)}
			{@const imgUrl = media.image?.url ?? ''}
			{@const isLoaded = i <= highestLoaded}
			<div
				class="absolute inset-0 transition-opacity duration-150"
				style="opacity: {i === currentIndex ? 1 : 0}; z-index: {i === currentIndex ? 1 : 0}; pointer-events: {i === currentIndex ? 'auto' : 'none'};"
			>
				{#if url}
					{#if isLoaded}
						<VideoPlayerSimple
							hlsUrl={url}
							posterImage={media.image}
							classes="w-full h-full object-cover"
							dimension="square"
							itemsPerRow={1}
							containerSizePercent={100}
							enableOnMobile={true}
							square={true}
							active={i === currentIndex}
							restartOnActivate={block.videoPlaybackMode === 'restart'}
						/>
					{:else if imgUrl}
						<img src={imgUrl} alt={media.image?.alt ?? ''} class="w-full h-full object-cover" />
					{/if}
				{:else if imgUrl}
					<img src={imgUrl} alt={media.image?.alt ?? ''} class="w-full h-full object-cover" />
				{/if}
			</div>
		{/each}

		{#if effectiveTitle}
			<div
				class="absolute bottom-0 left-0 z-[2] text-sm md:text-xl font-medium text-left pl-4 pr-4 md:pr-6 pt-2.5 pb-[13px] pointer-events-none {effectiveTitleColor === 'black' ? 'text-black [text-shadow:0_1px_3px_rgba(255,255,255,0.45)]' : 'text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]'}"
			>
				{effectiveTitle}
			</div>
		{/if}

		{#if count > 1}
			<div
				class="absolute bottom-[7px] right-[7px] z-[2] flex gap-1 transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100"
			>
				<button
					type="button"
					on:click={(e) => { e.preventDefault(); e.stopPropagation(); prev(); }}
					class="h-10 px-3 rounded-md bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors duration-200 pointer-events-auto cursor-pointer"
					aria-label="Previous media"
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
						<path d="M19 12H5M12 19l-7-7 7-7" />
					</svg>
				</button>
				<button
					type="button"
					on:click={(e) => { e.preventDefault(); e.stopPropagation(); next(); }}
					class="h-10 px-3 rounded-md bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors duration-200 pointer-events-auto cursor-pointer"
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
			</div>
		{/if}
	</div>
</div>
