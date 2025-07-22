<script lang="ts">
	import { onMount } from 'svelte';
	
	export let hlsUrl: string;
	export let posterImage: any = null;
	export let classes: string = 'w-full h-auto rounded object-cover mb-4';
	export let shouldAutoplay: boolean = false;
	
	let videoElement: HTMLVideoElement;
	
	// Automatically generate MP4 URL from HLS URL
	$: videoUrl = hlsUrl.replace('.m3u8', '.mp4');
	// Determine if we should use HLS or MP4
	$: useHls = hlsUrl && hlsUrl.includes('.m3u8');
	
	onMount(async () => {
		console.log('🎥 VideoAdvanced Debug:');
		console.log('- shouldAutoplay prop:', shouldAutoplay);
		console.log('- hlsUrl:', hlsUrl);
		
		if (useHls && videoElement) {
			// Dynamically import HLS.js
			const { default: Hls } = await import('hls.js');
			
			if (Hls.isSupported()) {
				const hls = new Hls();
				hls.loadSource(hlsUrl);
				hls.attachMedia(videoElement);
			} else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
				// Safari has native HLS support
				videoElement.src = hlsUrl;
			}
		}
		
		// Debug autoplay behavior
		if (shouldAutoplay && videoElement) {
			console.log('🎮 Attempting autoplay...');
			
			// Try to play and catch any autoplay policy blocks
			try {
				const playPromise = videoElement.play();
				if (playPromise !== undefined) {
					playPromise
						.then(() => {
							console.log('✅ Autoplay succeeded!');
						})
						.catch(error => {
							console.log('❌ Autoplay blocked by browser:', error.message);
							console.log('💡 This is likely due to browser autoplay policies');
						});
				}
			} catch (error) {
				console.log('❌ Autoplay error:', error);
			}
		}
	});
</script>

<video 
	autoplay={shouldAutoplay}
	loop
	muted={!shouldAutoplay}
	playsinline
	controls
	bind:this={videoElement}
	class="{classes}"
	poster={posterImage?.url || ''}
	preload="metadata"
>
	{#if useHls}
		<source src={hlsUrl} type="application/x-mpegURL">
		<source src={videoUrl} type="video/mp4">
	{:else}
		<source src={videoUrl} type="video/mp4">
	{/if}
	<track kind="captions" src="" label="Captions" />
	Your browser does not support the video tag.
</video>
