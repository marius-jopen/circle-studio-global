<script lang="ts">
	import { PrismicImage } from '@prismicio/svelte';
	import VideoPreview from './VideoPreview.svelte';

	export let item: any;
	export let dimension: 'landscape' | 'square' | 'portrait' = 'landscape';
	
	// Get aspect ratio class based on dimension
	$: aspectClass = {
		// landscape: 'aspect-video',
		// square: 'aspect-square',
		// portrait: 'aspect-[3/4]'
	}[dimension];
</script>

<div class="block">
	{#if item}
		{@const imageField = item.image}
		{@const videoUrl = item.video_url}
		
		{#if videoUrl}
			<div class="relative mb-4">
				<VideoPreview 
					hlsUrl={videoUrl}
					posterImage={imageField} 
					classes="w-full h-auto rounded object-cover {aspectClass}"
				/>
			</div>
		{:else if imageField?.url}
			<div class="relative mb-4">
				<PrismicImage 
					field={imageField} 
					class="w-full h-auto rounded {aspectClass} object-cover"
				/>
			</div>
		{/if}
	{/if}
</div> 