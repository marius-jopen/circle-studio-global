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
	let containerElement: HTMLDivElement;
	let progressBar: HTMLDivElement;
	
	// Video state
	let isPlaying = $state(false);
	let isMuted = $state(true);
	let currentTime = $state(0);
	let duration = $state(0);
	let isLoaded = $state(false);
	let showControls = $state(false);
	let controlsTimeout: ReturnType<typeof setTimeout>;
	
	// Automatically generate MP4 URL from HLS URL
	const videoUrl = $derived(hlsUrl.replace('.m3u8', '.mp4'));
	const useHls = $derived(hlsUrl && hlsUrl.includes('.m3u8'));
	
	// Format time display
	function formatTime(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const remainingSeconds = Math.floor(seconds % 60);
		
		if (hours > 0) {
			return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
		}
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	}
	
	// Progress percentage
	const progressPercent = $derived(duration > 0 ? (currentTime / duration) * 100 : 0);
	
	// Control visibility management
	function showControlsTemporarily() {
		showControls = true;
		clearTimeout(controlsTimeout);
		controlsTimeout = setTimeout(() => {
			if (isPlaying) {
				showControls = false;
			}
		}, 3000);
	}
	
	function handleMouseMove() {
		showControlsTemporarily();
	}
	
	function handleMouseLeave() {
		if (isPlaying) {
			clearTimeout(controlsTimeout);
			controlsTimeout = setTimeout(() => {
				showControls = false;
			}, 1000);
		}
	}
	
	// Video controls
	function togglePlay() {
		if (!videoElement || !isLoaded) return;
		
		if (isPlaying) {
			videoElement.pause();
		} else {
			videoElement.play();
		}
	}
	
	function toggleMute() {
		if (!videoElement) return;
		
		videoElement.muted = !videoElement.muted;
		isMuted = videoElement.muted;
	}
	
	function seek(event: MouseEvent) {
		if (!videoElement || !progressBar || !isLoaded) return;
		
		const rect = progressBar.getBoundingClientRect();
		const percent = (event.clientX - rect.left) / rect.width;
		const newTime = percent * duration;
		
		videoElement.currentTime = Math.max(0, Math.min(newTime, duration));
	}
	
	// Video event handlers
	function handleLoadedData() {
		isLoaded = true;
		duration = videoElement.duration;
	}
	
	function handleTimeUpdate() {
		currentTime = videoElement.currentTime;
	}
	
	function handlePlay() {
		isPlaying = true;
	}
	
	function handlePause() {
		isPlaying = false;
		showControls = true; // Show controls when paused
	}
	
	function handleEnded() {
		isPlaying = false;
		showControls = true;
	}
	
	// Autoplay functionality (same as VideoAdvanced)
	async function triggerAutoplayWithSound() {
		console.log('🎮 Triggering autoplay with sound...');
		
		if (!videoElement) {
			console.log('❌ No video element, retrying in 500ms...');
			setTimeout(triggerAutoplayWithSound, 500);
			return;
		}
		
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
					})
					.catch((error) => {
						console.log('❌ Autoplay with sound failed:', error.message);
						console.log('❌ Not falling back to muted - user interaction should allow sound!');
					});
			}
		} catch (error) {
			console.log('❌ Autoplay error:', error);
		}
	}
	
	onMount(() => {
		console.log('🎥 VideoPlayerCustom Debug:');
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
			console.log('🎮 Attempting immediate legacy autoplay...');
			
			try {
				videoElement.muted = false;
				isMuted = false;
				const playPromise = videoElement.play();
				
				if (playPromise !== undefined) {
					playPromise
						.then(() => {
							console.log('✅ Autoplay with sound succeeded!');
							isPlaying = true;
						})
						.catch((error) => {
							console.log('❌ Autoplay with sound blocked:', error.message);
							
							// Fallback: Try muted autoplay
							videoElement.muted = true;
							isMuted = true;
							videoElement.play().then(() => {
								console.log('✅ Muted autoplay succeeded!');
								isPlaying = true;
							}).catch((mutedError: any) => {
								console.log('❌ Even muted autoplay failed:', mutedError.message);
							});
						});
				}
			} catch (error) {
				console.log('❌ Autoplay error:', error);
			}
		}
		
		// Return cleanup function if it was set
		return cleanup;
	});
</script>

<div 
	class="relative {classes} bg-black rounded-lg overflow-hidden"
	bind:this={containerElement}
	on:mousemove={handleMouseMove}
	on:mouseleave={handleMouseLeave}
	role="button"
	tabindex="0"
>
	<!-- Video Element -->
	<video 
		bind:this={videoElement}
		class="w-full h-full object-cover"
		poster={posterImage?.url || ''}
		preload="metadata"
		loop
		muted={true}
		playsinline
		on:loadeddata={handleLoadedData}
		on:timeupdate={handleTimeUpdate}
		on:play={handlePlay}
		on:pause={handlePause}
		on:ended={handleEnded}
		on:click={togglePlay}
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

	<!-- Custom Controls -->
	<div 
		class="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
		class:opacity-100={showControls || !isPlaying}
		class:opacity-0={!showControls && isPlaying}
	>
		<!-- Play/Pause Button (Center) -->
		{#if !isPlaying}
			<button 
				class="flex items-center justify-center w-16 h-16 bg-black bg-opacity-70 rounded-full text-white hover:bg-opacity-90 transition-all duration-200"
				on:click={togglePlay}
				aria-label="Play video"
			>
				<svg class="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 20 20">
					<path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
				</svg>
			</button>
		{/if}
	</div>

	<!-- Bottom Controls Bar -->
	<div 
		class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4 transition-opacity duration-300"
		class:opacity-100={showControls || !isPlaying}
		class:opacity-0={!showControls && isPlaying}
	>
		<!-- Progress Bar -->
		<div 
			class="w-full h-1 bg-white bg-opacity-30 rounded-full mb-3 cursor-pointer"
			bind:this={progressBar}
			on:click={seek}
			role="progressbar"
			aria-valuenow={progressPercent}
			aria-valuemin="0"
			aria-valuemax="100"
		>
			<div 
				class="h-full bg-white rounded-full transition-all duration-100"
				style="width: {progressPercent}%"
			></div>
		</div>

		<!-- Control Buttons and Time -->
		<div class="flex items-center justify-between text-white text-sm">
			<div class="flex items-center space-x-3">
				<!-- Play/Pause Button -->
				<button 
					class="flex items-center justify-center w-8 h-8 hover:bg-white hover:bg-opacity-20 rounded transition-colors duration-200"
					on:click={togglePlay}
					aria-label={isPlaying ? 'Pause video' : 'Play video'}
				>
					{#if isPlaying}
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
							<path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z"/>
						</svg>
					{:else}
						<svg class="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
							<path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
						</svg>
					{/if}
				</button>

				<!-- Mute/Unmute Button -->
				<button 
					class="flex items-center justify-center w-8 h-8 hover:bg-white hover:bg-opacity-20 rounded transition-colors duration-200"
					on:click={toggleMute}
					aria-label={isMuted ? 'Unmute video' : 'Mute video'}
				>
					{#if isMuted}
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
							<path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.797L4.05 13.06a.5.5 0 00-.383-.06H2a1 1 0 01-1-1V8a1 1 0 011-1h1.667a.5.5 0 00.383-.06l4.333-3.737a1 1 0 011-.127zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z"/>
						</svg>
					{:else}
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
							<path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.797L4.05 13.06a.5.5 0 00-.383-.06H2a1 1 0 01-1-1V8a1 1 0 011-1h1.667a.5.5 0 00.383-.06l4.333-3.737a1 1 0 011-.127zM12.5 9a2.5 2.5 0 012.5 2.5 2.5 2.5 0 01-2.5 2.5V9z"/>
						</svg>
					{/if}
				</button>
			</div>

			<!-- Time Display -->
			{#if isLoaded}
				<div class="text-xs opacity-90 font-mono">
					{formatTime(currentTime)} / {formatTime(duration)}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	/* Ensure smooth transitions */
	button {
		transition: all 0.2s ease;
	}
	
	/* Custom progress bar hover effect */
	[role="progressbar"]:hover div {
		background-color: rgb(255 255 255 / 0.9);
	}
</style> 