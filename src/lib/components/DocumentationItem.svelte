<script lang="ts">
	import { PrismicImage } from '@prismicio/svelte';
	import VideoPlayerCustom from './VideoPlayerCustom.svelte';

	export let item: any;
</script>

<div class="block">
	{#if item}
		{@const imageField = item.image}
		{@const videoUrl = item.video_url}
		{@const playMode = item.play}
		{@const displayPlayMode = (playMode === 'autoplay-muted' || playMode === 'auto-muted') ? 'no-sound' : playMode}
		<!-- {playMode} -->
		<!-- {displayPlayMode} -->
		{#if videoUrl}
			<div class="relative">
				<!-- Video: {displayPlayMode} -->
				<VideoPlayerCustom 
					playMode={displayPlayMode}
					hlsUrl={videoUrl}
					posterImage={imageField} 
					classes="w-full h-auto rounded object-cover"
					controls={true}
				/>
			</div>
		{:else if imageField?.url}
			<div class="relative">
				<!-- Image -->
				<PrismicImage 
					field={imageField} 
					class="w-full h-auto rounded object-cover"
				/>
			</div>
		{/if}
	{/if}
</div> 