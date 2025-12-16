<script lang="ts">
	import type { Content } from '@prismicio/client';
	import { PrismicImage, type SliceComponentProps } from '@prismicio/svelte';
	import VideoPlayerCustom from '../../components/VideoPlayerCustom.svelte';

	type Props = SliceComponentProps<Content.VideoSlice>;

	const { slice }: Props = $props();

	const imageField = slice.primary.image;
	const videoUrl = slice.primary.videourl || '';
	const option = slice.primary.options || '';
	const context = `video-slice-${crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;

	// Map slice options to VideoPlayerCustom play modes
	const playMode = option === 'autoplay-has-sound' ? 'has-sound' : 'no-sound';
	const isNoAutoplay = option === 'no-autoplay';

	let showOverlay = $state(isNoAutoplay);
	let playerRef: any = $state();
</script>

<section data-slice-type={slice.slice_type} data-slice-variation={slice.variation}>
	<div class="">
		{#if videoUrl}
			<div class="relative cursor-pointer">
				<VideoPlayerCustom
					bind:this={playerRef}
					hlsUrl={videoUrl}
					posterImage={imageField}
					classes="w-full h-auto rounded-none object-cover"
					controls={true}
					playMode={isNoAutoplay ? 'has-sound' : playMode}
					context={context}
					autoplayOnMount={!isNoAutoplay}
					defaultMuted={option === 'autoplay-no-sound'}
					unmuteOnUserPlay={isNoAutoplay}
					width="auto"
					height="auto"
					showControlsOnMount={isNoAutoplay}
					basicVideo={true}
				/>

				{#if isNoAutoplay && showOverlay}
					<div class="absolute inset-0">
						<div 
							role="button"
							tabindex="0"
							class="w-full h-full"
							onclick={(e) => { e.stopPropagation(); showOverlay = false; playerRef?.playNow(true); }}
							onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); showOverlay = false; playerRef?.playNow(true); } }}
						></div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</section>
