<script lang="ts">
	import { PrismicImage } from '@prismicio/svelte';
	import VideoPlayerCustom from './VideoPlayerCustom.svelte';

	interface Props {
		item: any;
		itemsPerRow?: string;
	}
	const { item, itemsPerRow }: Props = $props();

	const controlsTextClass = $derived((itemsPerRow ?? '1') === '1' ? 'h2' : ((itemsPerRow === '2') ? 'text-base' : 'text-sm'));
	
	let showVideo = $state(false);
	let isPlaying = $state(false);
	
	function playVideo() {
		showVideo = true;
		isPlaying = true;
	}
	
	function togglePlayPause() {
		if (showVideo) {
			isPlaying = !isPlaying;
		} else {
			playVideo();
		}
	}
</script>

<div class="block">
	{#if item}
		{@const imageField = item.image}
		{@const videoUrl = item.video_url}
		{@const playMode = item.play}
		{@const displayPlayMode = (playMode === 'autoplay-muted' || playMode === 'auto-muted') ? 'no-sound' : playMode}
		
		{#if videoUrl && imageField?.url}
			<div class="relative brightness-[95%] group cursor-pointer" on:click={togglePlayPause}>
				{#if showVideo}
					<!-- Video loaded after play button click -->
					<VideoPlayerCustom 
						playMode={displayPlayMode}
						hlsUrl={videoUrl}
						posterImage={imageField} 
						classes="w-full h-auto rounded object-cover"
						controlsTextClass={controlsTextClass}
						controls={true}
						width="auto"
						height="auto"
					/>
				{:else}
					<!-- Image with play button overlay -->
					<PrismicImage 
						field={imageField} 
						class="w-full h-auto rounded object-cover"
					/>
				{/if}
				
				<!-- Play/Pause button overlay -->
				<div class="absolute bottom-2 right-2 rounded-full p-2 transition-colors">
					{#if isPlaying}
						<!-- Pause icon -->
						<svg 
							class="w-6 h-6 text-white" 
							fill="currentColor" 
							viewBox="0 0 24 24"
						>
							<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
						</svg>
					{:else}
						<!-- Play icon -->
						<svg 
							class="w-6 h-6 text-white" 
							fill="currentColor" 
							viewBox="0 0 24 24"
						>
							<path d="M8 5v14l11-7z"/>
						</svg>
					{/if}
				</div>
			</div>
		{/if}
	{/if}
</div>
