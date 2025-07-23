<script lang="ts">
	import { onMount } from 'svelte';
	
	interface Props {
		hlsUrl: string;
		posterImage?: any;
		classes?: string;
		shouldAutoplay?: boolean;
		autoplayWithSound?: boolean;
		waitForWelcomeDismissal?: boolean;
	}
	
	const { hlsUrl, posterImage = null, classes = 'w-full h-auto rounded object-cover mb-4', shouldAutoplay = false, autoplayWithSound = false, waitForWelcomeDismissal = false }: Props = $props();
	
	let videoElement: HTMLVideoElement;
	let showUnmuteOverlay = $state(false);
	let isPlaying = $state(false);
	let isMuted = $state(true); // Always start muted, unmute via JavaScript
	
	// Automatically generate MP4 URL from HLS URL
	const videoUrl = $derived(hlsUrl.replace('.m3u8', '.mp4'));
	// Determine if we should use HLS or MP4
	const useHls = $derived(hlsUrl && hlsUrl.includes('.m3u8'));
	
	// Function to trigger autoplay with sound
	async function triggerAutoplayWithSound() {
		console.log('🎮 Triggering autoplay with sound...');
		console.log('- Video element exists:', !!videoElement);
		console.log('- Video readyState:', videoElement?.readyState);
		console.log('- Video src:', videoElement?.src);
		
		if (!videoElement) {
			console.log('❌ No video element, retrying in 500ms...');
			setTimeout(triggerAutoplayWithSound, 500);
			return;
		}
		
		// Wait for video to be ready if needed
		if (videoElement.readyState < 2) {
			console.log('⏳ Video not ready, waiting for loadeddata event...');
			videoElement.addEventListener('loadeddata', triggerAutoplayWithSound, { once: true });
			return;
		}
		
		try {
			videoElement.muted = false;
			isMuted = false;
			
			console.log('🎵 Attempting to play video with sound...');
			const playPromise = videoElement.play();
			
			if (playPromise !== undefined) {
				playPromise
					.then(() => {
						console.log('✅ Autoplay with sound succeeded!');
						isPlaying = true;
						showUnmuteOverlay = false;
					})
					.catch((error) => {
						console.log('❌ Autoplay with sound failed:', error.message);
						console.log('❌ Not falling back to muted - user interaction should allow sound!');
						showUnmuteOverlay = false;
					});
			}
		} catch (error) {
			console.log('❌ Autoplay error:', error);
		}
	}

	onMount(() => {
		console.log('🎥 VideoAdvanced Debug:');
		console.log('- shouldAutoplay prop:', shouldAutoplay);
		console.log('- autoplayWithSound prop:', autoplayWithSound);
		console.log('- waitForWelcomeDismissal prop:', waitForWelcomeDismissal);
		console.log('- hlsUrl:', hlsUrl);
		
		let cleanup: (() => void) | undefined;
		
		// Handle HLS setup asynchronously
		if (useHls && videoElement) {
			import('hls.js').then(({ default: Hls }) => {
				if (Hls.isSupported()) {
					const hls = new Hls();
					hls.loadSource(hlsUrl);
					hls.attachMedia(videoElement);
				} else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
					// Safari has native HLS support
					videoElement.src = hlsUrl;
				}
			});
		}
		
		// Handle autoplay with sound - always listen for welcome dismissal with fallback
		if (autoplayWithSound && !waitForWelcomeDismissal) {
			console.log('🎮 Setting up autoplay with sound...');
			console.log('- Video element ready:', !!videoElement);
			
			let hasTriggered = false;
			
			const handleWelcomeDismissed = () => {
				console.log('🎉 Received welcome dismissed event!');
				if (!hasTriggered) {
					console.log('🚀 First time receiving event, waiting 1 second then triggering autoplay!');
					hasTriggered = true;
					
					// Wait for welcome screen to be 80% faded out before starting video
					setTimeout(() => {
						console.log('⏰ Welcome screen 80% faded, now triggering autoplay...');
						triggerAutoplayWithSound();
					}, 1850); // 1.2s letters + 0.64s (80% of 0.8s background fade)
				} else {
					console.log('⚠️ Event already handled, ignoring...');
				}
			};
			
			// Listen for welcome dismissal
			console.log('👂 Adding welcome-dismissed event listener...');
			window.addEventListener('welcome-dismissed', handleWelcomeDismissed);
			
			// Fallback: if no welcome dismissal after 2 seconds, try autoplay anyway (navigation case)
			setTimeout(() => {
				if (!hasTriggered && !isPlaying) {
					console.log('⏰ No welcome dismissal after 2s, trying autoplay (navigation case)...');
					hasTriggered = true;
					triggerAutoplayWithSound();
				} else if (hasTriggered) {
					console.log('✅ Welcome event already handled, no fallback needed');
				} else if (isPlaying) {
					console.log('✅ Video already playing, no fallback needed');
				}
			}, 2000);
			
			cleanup = () => {
				console.log('🧹 Cleaning up welcome event listener...');
				window.removeEventListener('welcome-dismissed', handleWelcomeDismissed);
			};
		}
		
		// Handle explicit waiting for welcome dismissal
		if (waitForWelcomeDismissal) {
			console.log('🎭 Waiting for welcome screen dismissal...');
			
			const handleWelcomeDismissed = () => {
				console.log('🎉 Welcome dismissed, triggering autoplay!');
				triggerAutoplayWithSound();
			};
			
			window.addEventListener('welcome-dismissed', handleWelcomeDismissed);
			
			cleanup = () => {
				window.removeEventListener('welcome-dismissed', handleWelcomeDismissed);
			};
		}
		
		// Handle legacy autoplay
		if (shouldAutoplay && !autoplayWithSound && !waitForWelcomeDismissal && videoElement) {
			console.log('🎮 Attempting immediate autoplay...');
			
			if (autoplayWithSound) {
				// Aggressive autoplay with sound (user has already interacted)
				triggerAutoplayWithSound();
			} else {
				// Legacy behavior: try with sound, fallback to muted
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
							.catch((error) => {
								console.log('❌ Autoplay with sound blocked:', error.message);
								
								// Fallback: Try muted autoplay
								videoElement.muted = true;
								isMuted = true;
								videoElement.play().then(() => {
									console.log('✅ Muted autoplay succeeded!');
									isPlaying = true;
									showUnmuteOverlay = true; // Show unmute button
								}).catch((mutedError: any) => {
									console.log('❌ Even muted autoplay failed:', mutedError.message);
									showUnmuteOverlay = false;
								});
							});
					}
				} catch (error) {
					console.log('❌ Autoplay error:', error);
				}
			}
		}
		
		// Return cleanup function if it was set
		return cleanup;
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
		loop
		muted={true}
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
			class="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg flex items-center gap-3 hover:bg-opacity-90 transition-opacity"
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
