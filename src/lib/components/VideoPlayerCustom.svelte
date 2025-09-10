<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		hlsUrl: string;
		posterImage?: any;
		classes?: string;
		playMode?: string | 'no-sound' | 'has-sound';
		controls?: boolean;
		context?: string;
		controlsTextClass?: string;
		width?: number | 'auto';
		height?: number | 'auto';
		autoplayOnMount?: boolean;
		defaultMuted?: boolean;
		unmuteOnUserPlay?: boolean;
		showControlsOnMount?: boolean;
	}

	const {
		hlsUrl,
		posterImage = null,
		classes = 'w-full h-auto rounded object-cover mb-3',
		playMode = 'no-sound',
		controls = false,
		context = undefined,
		controlsTextClass = 'h2',
		width = 1920,
		height = 1080,
		autoplayOnMount = true,
		defaultMuted = true,
		unmuteOnUserPlay = false,
		showControlsOnMount = false
	}: Props = $props();

	const useFixedAspect = $derived(typeof width === 'number' && typeof height === 'number');
	const containerStyle = $derived(useFixedAspect ? `aspect-ratio: ${width}/${height};` : '');
	const videoClass = $derived(
		useFixedAspect
			? 'w-full h-full object-cover scale-[100.5%] cursor-pointer'
			: 'w-full h-auto object-contain cursor-pointer'
	);
	
	// Create responsive text class for mobile controls
	const mobileControlsTextClass = $derived(() => {
		// Map controlsTextClass to proper responsive classes
		let desktopClass = controlsTextClass;
		if (controlsTextClass === 'h2') {
			desktopClass = 'text-3xl'; // h2 maps to text-3xl in CSS
		}
		
		// Create mobile-appropriate sizes that scale with desktop
		// Use very small text for mobile - try text-xs first, if still too big we can go smaller
		let mobileClass = 'text-xs';
		
		const result = `${mobileClass} md:${desktopClass}`;
		console.log('Video controls text class:', result, 'controlsTextClass:', controlsTextClass);
		return result;
	});

	let videoElement: HTMLVideoElement;
    let isHovering = $state(false);
    let isMuted = $state(defaultMuted);
    let showSoundIcon = $state(true);
	const videoId = Math.random().toString(36).slice(2);
	let isPlaying = $state(false);
	let currentTime = $state(0);
	let duration = $state(0);
    let showControls = $state(showControlsOnMount);
    let isFullscreen = $state(false);
    let containerElement: HTMLDivElement;
    let hideUiTimeout: ReturnType<typeof setTimeout> | undefined;
    let suppressUI = $state(false);
    let isScrubbing = $state(false);
    let scrubLeft = 0;
    let scrubWidth = 1;
    let lastShowControls = $state(false);

    function notifyControlsShown() {
        window.dispatchEvent(new CustomEvent('video-controls-shown', { detail: { videoId, context } }));
    }

    function notifyControlsHidden() {
        window.dispatchEvent(new CustomEvent('video-controls-hidden', { detail: { videoId, context } }));
    }

    function scheduleAutoHide() {
        if (hideUiTimeout) clearTimeout(hideUiTimeout);
        hideUiTimeout = setTimeout(() => {
            showControls = false;
            showSoundIcon = false;
            notifyControlsHidden();
        }, 1500);
    }

    function clearAutoHide() {
        if (hideUiTimeout) {
            clearTimeout(hideUiTimeout);
            hideUiTimeout = undefined;
        }
    }

    function togglePlayPause() {
        if (!videoElement) return;
        if (videoElement.paused) {
            if (unmuteOnUserPlay && videoElement.muted) {
                videoElement.muted = false;
                isMuted = false;
                notifyVideoPlayingWithSound();
            }
            videoElement.play();
        } else {
            videoElement.pause();
        }
        scheduleAutoHide();
    }

    // Expose imperative play to allow first-click synchronous playback from parent
    export function playNow(unmute: boolean = false) {
        if (!videoElement) return;
        if (unmute) {
            videoElement.muted = false;
            isMuted = false;
            notifyVideoPlayingWithSound();
        }
        try { videoElement.play(); } catch (e) {}
        showControls = true;
    }

    function positionToPercent(clientX: number): number {
        return Math.min(Math.max((clientX - scrubLeft) / scrubWidth, 0), 1);
    }

    function handleScrubMoveClientX(clientX: number) {
        if (!videoElement || duration <= 0) return;
        const percent = positionToPercent(clientX);
        videoElement.currentTime = percent * duration;
        currentTime = videoElement.currentTime;
    }

    function onMouseMove(e: MouseEvent) {
        handleScrubMoveClientX(e.clientX);
    }

    function onMouseUp() {
        isScrubbing = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        scheduleAutoHide();
    }

    function onTouchMove(e: TouchEvent) {
        if (e.touches && e.touches[0]) {
            handleScrubMoveClientX(e.touches[0].clientX);
        }
    }

    function onTouchEnd() {
        isScrubbing = false;
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
        scheduleAutoHide();
    }

    function startScrubMouse(e: MouseEvent) {
        if (!duration) return;
        isScrubbing = true;
        showControls = true;
        const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
        scrubLeft = rect.left;
        scrubWidth = rect.width;
        handleScrubMoveClientX(e.clientX);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }

    function startScrubTouch(e: TouchEvent) {
        if (!duration) return;
        isScrubbing = true;
        showControls = true;
        const target = e.currentTarget as HTMLButtonElement;
        if (target) {
            const rect = target.getBoundingClientRect();
            scrubLeft = rect.left;
            scrubWidth = rect.width;
        }
        if (e.touches && e.touches[0]) {
            handleScrubMoveClientX(e.touches[0].clientX);
        }
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('touchend', onTouchEnd);
    }

    $effect(() => {
        if (showControls && !lastShowControls) {
            notifyControlsShown();
        } else if (!showControls && lastShowControls) {
            notifyControlsHidden();
        }
        lastShowControls = showControls;
    });

	function notifyVideoPlayingWithSound() {
		window.dispatchEvent(new CustomEvent('video-playing-with-sound', { detail: { videoId, context } }));
	}

	function notifyVideoSoundOff() {
		window.dispatchEvent(new CustomEvent('video-sound-off', { detail: { videoId, context } }));
	}

	function handleOtherVideoPlaying(event: Event) {
		const { videoId: otherId } = (event as CustomEvent).detail || {};
		if (otherId && otherId !== videoId && videoElement && !videoElement.muted) {
			videoElement.muted = true;
			isMuted = true;
			notifyVideoSoundOff();
		}
	}

	const useHls = $derived(hlsUrl && hlsUrl.includes('.m3u8'));
	const videoUrl = $derived(hlsUrl.replace('.m3u8', '.mp4'));
    const hasSoundMode = $derived(playMode === 'has-sound' || playMode === 'has sound');

	onMount(() => {
		// Configure initial mute/autoplay based on props
		if (videoElement) {
			videoElement.muted = defaultMuted;
			isMuted = defaultMuted;
			videoElement.autoplay = autoplayOnMount;
			if (autoplayOnMount) {
				const tryPlay = () => {
					const p = videoElement.play();
					if (p && typeof p.then === 'function') {
						p.catch(() => {
							// If autoplay with sound is blocked, ensure muted and retry
							videoElement.muted = true;
							isMuted = true;
							videoElement.play().catch(() => {});
						});
					}
				};
				if (videoElement.readyState >= 2) {
					tryPlay();
				} else {
					videoElement.addEventListener('loadeddata', tryPlay, { once: true });
				}
			}
		}

		// Listen for other videos unmuting
		window.addEventListener('video-playing-with-sound', handleOtherVideoPlaying);

		// Listen for external play requests (used by no-autoplay poster click)
		const playRequestHandler = (event: Event) => {
			const { context: requestContext } = (event as CustomEvent).detail || {};
			if (!videoElement) return;
			if (requestContext && context && requestContext === context) {
				if (unmuteOnUserPlay) {
					videoElement.muted = false;
					isMuted = false;
				}
				videoElement.play().catch(() => {});
			}
		};
		window.addEventListener('video-play-request', playRequestHandler);

		// Track fullscreen state
		const fsHandler = () => {
			isFullscreen = !!document.fullscreenElement;
		};
		document.addEventListener('fullscreenchange', fsHandler);

		if (useHls && videoElement) {
			import('hls.js').then(({ default: Hls }) => {
				if (Hls.isSupported()) {
					const hls = new Hls({ autoStartLoad: true });
					hls.loadSource(hlsUrl);
					hls.attachMedia(videoElement);
				} else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
					videoElement.src = hlsUrl;
				}
			});
		}

		return () => {
			window.removeEventListener('video-playing-with-sound', handleOtherVideoPlaying);
			document.removeEventListener('fullscreenchange', fsHandler);
			window.removeEventListener('video-play-request', playRequestHandler);
		};
	});

	// Handle URL changes when navigating between projects
	$effect(() => {
		if (!videoElement || !hlsUrl) return;
		
		// Reset video state
		isPlaying = false;
		currentTime = 0;
		duration = 0;
		
		if (useHls) {
			import('hls.js').then(({ default: Hls }) => {
				if (Hls.isSupported()) {
					// Destroy existing HLS instance if any
					if (videoElement.hls) {
						videoElement.hls.destroy();
					}
					
					const hls = new Hls({ autoStartLoad: true });
					hls.loadSource(hlsUrl);
					hls.attachMedia(videoElement);
					
					// Store HLS instance for cleanup
					videoElement.hls = hls;
				} else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
					videoElement.src = hlsUrl;
				}
			});
		} else {
			videoElement.src = videoUrl;
		}
		
		// Reset mute state and autoplay
		videoElement.muted = defaultMuted;
		isMuted = defaultMuted;
		videoElement.autoplay = autoplayOnMount;
		
		if (autoplayOnMount) {
			const tryPlay = () => {
				const p = videoElement.play();
				if (p && typeof p.then === 'function') {
					p.catch(() => {
						videoElement.muted = true;
						isMuted = true;
						videoElement.play().catch(() => {});
					});
				}
			};
			
			if (videoElement.readyState >= 2) {
				tryPlay();
			} else {
				videoElement.addEventListener('loadeddata', tryPlay, { once: true });
			}
		}
	});
</script>


<div 
	class="relative {classes} overflow-hidden bg-neutral-100 cursor-pointer"
	role="button"
	data-video-interactive="true"
	bind:this={containerElement}
	style={containerStyle}
	tabindex="0"
	onclick={togglePlayPause}
	onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePlayPause(); } }}
	onmouseenter={() => { if (suppressUI) return; isHovering = true; showSoundIcon = true; if (controls) { showControls = true; notifyControlsShown(); } scheduleAutoHide(); }}
	onmouseleave={() => { isHovering = false; clearAutoHide(); showControls = false; notifyControlsHidden(); }}
	onmousemove={() => { if (suppressUI) return; showSoundIcon = true; if (controls) { showControls = true; notifyControlsShown(); } scheduleAutoHide(); }}
>
	<video
		bind:this={videoElement}
		class={videoClass}
		poster={posterImage?.url || ''}
		preload="auto"
		loop
		muted={isMuted}
		autoplay={autoplayOnMount}
		playsinline
		ontimeupdate={() => { currentTime = videoElement.currentTime; }}
		onloadedmetadata={() => { duration = videoElement.duration; }}
		onplay={() => { isPlaying = true; }}
		onpause={() => { isPlaying = false; }}
	>
		{#if useHls}
			<source src={hlsUrl} type="application/x-mpegURL" />
			<source src={videoUrl} type="video/mp4" />
		{:else}
			<source src={videoUrl} type="video/mp4" />
		{/if}
		<track kind="captions" src="" label="Captions" />
	</video>

	<!-- Semi-transparent overlay for better control readability -->
	{#if controls && hasSoundMode}
	<div 
		class="absolute inset-0 bg-black/10 transition-opacity duration-200 pointer-events-none"
		class:opacity-100={(isHovering && showControls) || (showControlsOnMount && showControls)}
		class:opacity-0={!isHovering && !showControlsOnMount || !showControls}
	></div>
	{/if}

	{#if controls && hasSoundMode}
	<div 
		class="absolute left-3 right-3 bottom-3 transition-opacity w-full duration-200 opacity-80 pointer-events-none"
		class:opacity-70={(isHovering && showControls) || (showControlsOnMount && showControls)}
		class:opacity-0={!isHovering && !showControlsOnMount || !showControls}
	>
		<button
			data-video-control="true"
			class="relative block w-full h-3 pointer-events-auto transition-opacity duration-400"
			class:opacity-100={(isHovering && showControls) || (showControlsOnMount && showControls)}
			class:opacity-0={!isHovering && !showControlsOnMount || !showControls}
			class:pointer-events-none={!isHovering && !showControlsOnMount || !showControls}
			role="slider"
			aria-valuemin="0"
			aria-valuemax="100"
			aria-valuenow={(duration > 0 ? (currentTime / duration) * 100 : 0)}
			aria-label="Seek"
			onmousedown={(e) => { e.stopPropagation(); startScrubMouse(e as MouseEvent); }}
			ontouchstart={(e) => { e.stopPropagation(); startScrubTouch(e as TouchEvent); }}
		>
			<!-- Centered thin visible track -->
			<div class="absolute left-0  right-3 top-1/2 -translate-y-1/2 h-0.5 bg-white/40 rounded w-[calc(100%-1.5rem)]">
				<div 
					class="h-full bg-white rounded"
					style={`width: ${duration > 0 ? (currentTime / duration) * 100 : 0}%`}
				></div>
			</div>
		</button>

		<div class="text-white w-full pr-2 md:pr-0">
			{#if controls && hasSoundMode}
				<div class="flex px-3 pointer-events-none w-full">
					<div 
						class="w-full pr-3 flex flex-row justify-between md:justify-between pointer-events-auto text-white transition-opacity duration-400"
						class:opacity-100={(isHovering && showControls) || (showControlsOnMount && showControls)}
						class:opacity-0={!isHovering && !showControlsOnMount || !showControls}
					>

							<!-- Time display - hidden on mobile, visible on desktop -->
							<button 
							onclick={(e) => {
								e.stopPropagation();
								if (!videoElement) return;
								videoElement.currentTime = 0;
								currentTime = 0;
								scheduleAutoHide();
							}}
							class="hidden md:block {mobileControlsTextClass} text-left w-1/4 cursor-pointer tabular-nums opacity-80 group-hover:opacity-80 hover:opacity-100 transition-opacity duration-200">
								{(() => {
									const s = (n: number) => Math.floor(n).toString().padStart(2, '0');
									const mins = Math.floor(currentTime / 60);
									const secs = Math.floor(currentTime % 60);
									const dmins = Math.floor(duration / 60);
									const dsecs = Math.floor(duration % 60);
									return `${mins}:${s(secs)} / ${dmins}:${s(dsecs)}`;
								})()}
							</button>



						<button
							class="{mobileControlsTextClass} w-1/3 md:w-1/4 cursor-pointer opacity-80 group-hover:opacity-80 hover:opacity-100 transition-opacity duration-200 text-left"
							aria-label={isPlaying ? 'Pause video' : 'Play video'}
							onclick={(e) => { e.stopPropagation(); togglePlayPause(); }}
						>
							{isPlaying ? 'Pause' : 'Play'}
						</button>

						<button
						class="{mobileControlsTextClass} w-1/3 md:w-1/4 cursor-pointer opacity-80 group-hover:opacity-80 hover:opacity-100 transition-opacity duration-200 text-center"
						aria-label={isMuted ? 'Unmute video' : 'Mute video'}
						onclick={(e) => {
							e.stopPropagation();
							if (!videoElement) return;
							videoElement.muted = !videoElement.muted;
							isMuted = videoElement.muted;
							if (!isMuted) notifyVideoPlayingWithSound();
							else notifyVideoSoundOff();
							scheduleAutoHide();
						}}
					>
						Sound {isMuted ? 'On' : 'Off'}
						</button>
						

						<button
							class="{mobileControlsTextClass} text-right w-1/3 md:w-1/4 cursor-pointer opacity-80 group-hover:opacity-80 hover:opacity-100 transition-opacity duration-200"
							aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
							onclick={async (e) => {
								e.stopPropagation();
								if (!videoElement) return;
								try {
									if (!document.fullscreenElement) {
										await videoElement.requestFullscreen();
										isFullscreen = true;
									} else {
										await document.exitFullscreen();
										isFullscreen = false;
									}
								} catch (e) {}
								scheduleAutoHide();
							}}
						>
							{isFullscreen ? 'Back' : 'Fullscreen'}
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
	{/if}
</div>

<style>
	video { transition: opacity 0.2s ease; }
</style>