<script lang="ts">
	import { PrismicImage } from '@prismicio/svelte';
	import VideoPlayerCustom from './VideoPlayerCustom.svelte';

	interface Props {
		item: any;
		itemsPerRow?: string;
		showVideoOnMobile?: boolean;
	}
	const { item, itemsPerRow, showVideoOnMobile = false }: Props = $props();

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
			<!-- Video on desktop only -->
			<div class="relative brightness-[95%] hidden md:block">
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
		{/if}
		{#if imageField?.url}
			<!-- Image on mobile only -->
			<div class="relative brightness-[95%] block md:hidden">
				<!-- Image -->
				<PrismicImage 
					field={imageField} 
					class="w-full h-auto rounded object-cover"
				/>
			</div>
		{/if}
	{/if}
</div> 