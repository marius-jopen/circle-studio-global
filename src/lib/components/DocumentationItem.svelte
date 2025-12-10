<script lang="ts">
	import { PrismicImage } from '@prismicio/svelte';
	import VideoPlayerCustom from './VideoPlayerCustom.svelte';
	import DocumentationVideoMobile from './DocumentationVideoMobile.svelte';

	interface Props {
		item: any;
		itemsPerRow?: string;
		showVideoOnMobile?: boolean;
		noRoundedCorners?: boolean;
	}
	const { item, itemsPerRow, showVideoOnMobile = false, noRoundedCorners = false }: Props = $props();

	const controlsTextClass = $derived((itemsPerRow ?? '1') === '1' ? 'h2' : ((itemsPerRow === '2') ? 'text-base' : 'text-sm'));
	const roundedClass = $derived(noRoundedCorners ? '' : 'rounded');
</script>

{#if item}
	{@const imageField = item.image}
	{@const rawVideoUrl = item.video_url}
	{@const videoUrl = (typeof rawVideoUrl === 'string' ? rawVideoUrl.trim() : '')}
	{@const playMode = item.play}
	{@const displayPlayMode = (playMode === 'autoplay-muted' || playMode === 'auto-muted') ? 'no-sound' : playMode}
	{@const isClickToPlayWithSound = playMode === 'click-to-play-with-sound'}
	
	{#if videoUrl}
		<!-- Desktop: Show video with autoplay -->
		<div class="hidden md:block">
			<VideoPlayerCustom 
				playMode={displayPlayMode}
				hlsUrl={videoUrl}
				posterImage={imageField} 
				classes="w-full h-auto {roundedClass} object-cover"
				controlsTextClass={controlsTextClass}
				controls={true}
				width="auto"
				height="auto"
				autoplayOnMount={!isClickToPlayWithSound}
				defaultMuted={!isClickToPlayWithSound && displayPlayMode !== 'has-sound'}
				unmuteOnUserPlay={isClickToPlayWithSound}
				showControlsOnMount={isClickToPlayWithSound}
			/>
		</div>
		
		<!-- Mobile: Show still image for videos -->
		<div class="block md:hidden">
			<DocumentationVideoMobile {item} {itemsPerRow} {noRoundedCorners} />
		</div>
	{:else if imageField?.url}
		<!-- Regular images (no video) -->
		{@const imgW = imageField?.dimensions?.width}
		{@const imgH = imageField?.dimensions?.height}
		{@const isLandscape = !!imgW && !!imgH ? imgW > imgH : false}
		<!-- Desktop: keep natural aspect ratio -->
		<div class="hidden md:block">
			<PrismicImage 
				field={imageField} 
				class="w-full h-auto {roundedClass} object-cover"
			/>
		</div>
		<!-- Mobile: force square crop with object-cover -->
		<div class="block md:hidden">
			{#if isLandscape}
				<div class="relative aspect-square">
					<PrismicImage 
						field={imageField} 
						class="absolute inset-0 w-full h-full {roundedClass} object-cover"
					/>
				</div>
			{:else}
				<PrismicImage 
					field={imageField} 
					class="w-full h-auto {roundedClass} object-cover"
				/>
			{/if}
		</div>
	{/if}
{/if} 