<script lang="ts">
	import { onMount } from 'svelte';
	
	interface Props {
		hlsUrl: string;
		posterImage?: any;
		classes?: string;
		shouldAutoplay?: boolean;
	}
	
	const { hlsUrl, posterImage = null, classes = 'w-full h-auto rounded object-cover mb-4', shouldAutoplay = false }: Props = $props();
	
	let videoElement: HTMLVideoElement;
	let showUnmuteOverlay = $state(false);
	let isPlaying = $state(false);
	let isMuted = $state(true);
	
	// Automatically generate MP4 URL from HLS URL
	const videoUrl = $derived(hlsUrl.replace('.m3u8', '.mp4'));
	// Determine if we should use HLS or MP4
	const useHls = $derived(hlsUrl && hlsUrl.includes('.m3u8'));
	
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
		
		// Handle autoplay with fallback strategy
		if (shouldAutoplay && videoElement) {
			console.log('🎮 Attempting autoplay...');
			
			// First try: Attempt autoplay with sound
			try {
				videoElement.muted = false;
				isMuted = false;
				const playPromise = videoElement.play();
				
				if (playPromise !== undefined) {
					playPromise
						.then(() => {
							console.log('✅ Autoplay with sound succeeded!');
							isPlaying = true;
							showUnmuteOverlay = false;
						})
						.catch(async (error) => {
							console.log('❌ Autoplay with sound blocked:', error.message);
							
							// Fallback: Try muted autoplay
							try {
								videoElement.muted = true;
								isMuted = true;
								await videoElement.play();
								console.log('✅ Muted autoplay succeeded!');
								isPlaying = true;
								showUnmuteOverlay = true; // Show unmute button
							} catch (mutedError: any) {
								console.log('❌ Even muted autoplay failed:', mutedError.message);
								showUnmuteOverlay = false;
							}
						});
				}
			} catch (error) {
				console.log('❌ Autoplay error:', error);
			}
		}
	});
	
	function handleUnmute() {
		if (videoElement) {
			videoElement.muted = false;
			isMuted = false;
			showUnmuteOverlay = false;
			console.log('🔊 User unmuted video');
		}
	}
	
	function handleVideoPlay() {
		isPlaying = true;
	}
	
	function handleVideoPause() {
		isPlaying = false;
	}
</script>

<div class="relative">
	<video 
		autoplay={shouldAutoplay}
		loop
		muted={shouldAutoplay ? isMuted : true}
		playsinline
		controls
		bind:this={videoElement}
		class="{classes}"
		poster={posterImage?.url || ''}
		preload="metadata"
		on:play={handleVideoPlay}
		on:pause={handleVideoPause}
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
	
	<!-- Unmute overlay for muted autoplay -->
	{#if showUnmuteOverlay && isPlaying}
		<button 
			class="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-opacity-90 transition-opacity"
			on:click={handleUnmute}
			aria-label="Unmute video"
		>
			<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.797L4.05 13.06a.5.5 0 00-.383-.06H2a1 1 0 01-1-1V8a1 1 0 011-1h1.667a.5.5 0 00.383-.06l4.333-3.737a1 1 0 011-.127zM13 8.25V7a.75.75 0 011.5 0v1.25h1.25a.75.75 0 010 1.5H14.5V11a.75.75 0 01-1.5 0V9.75H11.75a.75.75 0 010-1.5H13z" clip-rule="evenodd" />
			</svg>
			Click to unmute
		</button>
	{/if}
</div>
