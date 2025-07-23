<script lang="ts">
	import { PrismicImage } from '@prismicio/svelte';
	import VideoPlayerCustom from './VideoPlayerCustom.svelte';

	export let item: any;
</script>

<div class="block brightness-[97%]">
	{#if item}
		{@const imageField = item.image}
		{@const videoUrl = item.video_url}
		{@const playMode = item.play || 'autoplay-muted'} <!-- Default to autoplay-muted if not set -->
		{#if videoUrl}
			<div class="relative">
				<VideoPlayerCustom 
					hlsUrl={videoUrl}
					posterImage={imageField} 
					classes="w-full h-auto rounded object-cover"
					shouldAutoplay={playMode === 'autoplay-muted'}
					hideControls={playMode === 'autoplay-muted'}
					startMuted={playMode === 'autoplay-muted'}
				/>
			</div>
		{:else if imageField?.url}
			<div class="relative">
				<PrismicImage 
					field={imageField} 
					class="w-full h-auto rounded object-cover"
				/>
			</div>
		{/if}
	{/if}
</div> 