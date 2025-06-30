<script lang="ts">
	import { onMount } from 'svelte';
	
	export let hlsUrl: string;
	export let posterImage: any = null;
	export let classes: string = 'w-full h-auto rounded object-cover mb-4';
	
	let videoElement: HTMLVideoElement;
	
	// Automatically generate MP4 URL from HLS URL
	$: videoUrl = hlsUrl.replace('.m3u8', '.mp4');
	// Determine if we should use HLS or MP4
	$: useHls = hlsUrl && hlsUrl.includes('.m3u8');
	
	onMount(async () => {
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
	});
</script>

<video 
	bind:this={videoElement}
	controls 
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
