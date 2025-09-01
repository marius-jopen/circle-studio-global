<script lang="ts">
	import { PrismicImage } from '@prismicio/svelte';
	import VideoPlayerCustom from './VideoPlayerCustom.svelte';

	interface Props {
		item: any;
		itemsPerRow?: string;
	}
	const { item, itemsPerRow }: Props = $props();

	const controlsTextClass = $derived((itemsPerRow ?? '1') === '1' ? 'h2' : ((itemsPerRow === '2') ? 'text-base' : 'text-sm'));
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
			<div class="relative brightness-[95%]">
				<!-- Video: {displayPlayMode} -->
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
			</div>
		{:else if imageField?.url}
			<div class="relative brightness-[95%]">
				<!-- Image -->
				<PrismicImage 
					field={imageField} 
					class="w-full h-auto rounded object-cover"
				/>
			</div>
		{/if}
	{/if}
</div> 