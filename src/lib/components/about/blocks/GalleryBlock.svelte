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

<div bind:this={cellRef} class="w-full h-full flex items-center justify-center">
	<div
		class="group relative overflow-hidden rounded bg-neutral-100"
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
						/>
					{:else if imgUrl}
						<img src={imgUrl} alt={media.image?.alt ?? ''} class="w-full h-full object-cover" />
					{/if}
				{:else if imgUrl}
					<img src={imgUrl} alt={media.image?.alt ?? ''} class="w-full h-full object-cover" />
				{/if}
			</div>
		{/each}

		{#if count > 1}
			<button
				type="button"
				on:click={(e) => { e.preventDefault(); e.stopPropagation(); next(); }}
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
</div>
