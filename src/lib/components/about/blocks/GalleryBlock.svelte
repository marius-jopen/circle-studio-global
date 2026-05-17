<script lang="ts">
	import type { GalleryBlock } from '$lib/types/aboutBlock';

	export let block: GalleryBlock;

	let currentIndex = 0;

	function next() {
		if (block.items.length === 0) return;
		currentIndex = (currentIndex + 1) % block.items.length;
	}

	$: item = block.items[currentIndex];
	$: count = block.items.length;
</script>

<div class="relative w-full h-full overflow-hidden bg-neutral-100 {item?.no_rounded_corners ? '' : 'rounded'}">
	{#if item}
		{#if item.image?.url}
			<img
				src={item.image.url}
				alt={item.image.alt ?? ''}
				class="absolute inset-0 h-full w-full object-cover"
				loading="lazy"
			/>
		{:else if item.video_url}
			<video
				src={item.video_url}
				autoplay
				muted
				loop
				playsinline
				class="absolute inset-0 h-full w-full object-cover"
			></video>
		{:else}
			<div class="flex h-full w-full items-center justify-center text-neutral-400 text-sm">
				empty
			</div>
		{/if}
		{#if count > 1}
			<button
				type="button"
				class="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
				on:click={next}
			>
				next ({currentIndex + 1}/{count})
			</button>
		{/if}
	{/if}
</div>
