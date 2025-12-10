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
			? 'w-full h-full object-cover md:scale-[100.5%] cursor-pointer bg-black'
			: 'w-full h-auto object-contain cursor-pointer bg-black'
	);
	
	// Create responsive text class for mobile controls
	// IMPORTANT: return explicit class strings so Tailwind doesn't purge them in production
	const mobileControlsTextClass = $derived(() => {
		let result = 'text-lg md:text-base';
		if (controlsTextClass === 'text-4xl') {
			result = 'text-xl md:text-4xl';
		} else if (controlsTextClass === 'text-base') {
			result = 'text-lg md:text-base';
		} else if (controlsTextClass === 'text-sm') {
			result = 'text-lg md:text-sm';
		} else if (controlsTextClass === 'h2') {
			// map semantic h2 to utility sizes
			result = 'text-lg md:text-3xl';
		}
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
    let wasPlayingBeforeScrub = $state(false);
    let scrubLeft = 0;
    let scrubWidth = 1;
    let lastShowControls = $state(false);
    let hasUserPlayed = $state(false);

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

    function togglePlayPause(e?: Event) {
        if (!videoElement) return;
        // Don't toggle if clicking on a video control element
        if (e && e.target) {
            const target = e.target as HTMLElement;
            if (target.closest('[data-video-control="true"]') || target.closest('button')) {
                return;
            }
        }
        if (videoElement.paused) {
            // For click-to-play-with-sound, always unmute on first play
            // For has-sound mode, do NOT auto-unmute - user must click "Sound On" button
            if (isClickToPlayWithSound && !hasUserPlayed) {
                videoElement.muted = false;
                isMuted = false;
                notifyVideoPlayingWithSound();
            } else if (effectiveUnmuteOnUserPlay && !hasUserPlayed && videoElement.muted && !isHasSoundMode) {
                videoElement.muted = false;
                isMuted = false;
                notifyVideoPlayingWithSound();
            }
            videoElement.play();
            hasUserPlayed = true;
        } else {
            videoElement.pause();
        }
        scheduleAutoHide();
    }

    async function toggleFullscreen(e?: Event) {
        if (e) e.stopPropagation();
        if (!videoElement) return;
        try {
            const anyVideo = videoElement as any;
            const anyDoc = document as any;
            if (!isFullscreen && !document.fullscreenElement && !anyDoc.webkitFullscreenElement) {
                if (videoElement.requestFullscreen) {
                    await videoElement.requestFullscreen();
                    isFullscreen = true;
                } else if (typeof anyVideo.webkitEnterFullscreen === 'function' || typeof anyVideo.webkitEnterFullScreen === 'function') {
                    // iOS Safari fallback to native player fullscreen
                    (anyVideo.webkitEnterFullscreen || anyVideo.webkitEnterFullScreen).call(anyVideo);
                    isFullscreen = true;
                } else if (containerElement && (containerElement as any).requestFullscreen) {
                    await (containerElement as any).requestFullscreen();
                    isFullscreen = true;
                }
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if (typeof anyDoc.webkitExitFullscreen === 'function') {
                    anyDoc.webkitExitFullscreen();
                } else if (typeof (videoElement as any).webkitExitFullscreen === 'function') {
                    (videoElement as any).webkitExitFullscreen();
                }
                isFullscreen = false;
            }
        } catch (_) {}
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
        // Resume playing if video was playing before scrubbing started
        if (wasPlayingBeforeScrub && videoElement && videoElement.paused) {
            videoElement.play().catch(() => {});
        }
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
        // Resume playing if video was playing before scrubbing started
        if (wasPlayingBeforeScrub && videoElement && videoElement.paused) {
            videoElement.play().catch(() => {});
        }
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
        scheduleAutoHide();
    }

    function startScrubMouse(e: MouseEvent) {
        if (!duration) return;
        isScrubbing = true;
        wasPlayingBeforeScrub = !videoElement.paused;
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
        wasPlayingBeforeScrub = !videoElement.paused;
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
    const hasSoundMode = $derived(playMode === 'has-sound' || playMode === 'has sound' || playMode === 'click-to-play-with-sound');
    const isClickToPlayWithSound = $derived(playMode === 'click-to-play-with-sound');
    const isHasSoundMode = $derived(playMode === 'has-sound' || playMode === 'has sound');
    let isMobile = $state(false);
    const effectiveUnmuteOnUserPlay = $derived(
        unmuteOnUserPlay || (isMobile && context === 'main' && isClickToPlayWithSound)
    );
    // Allow autoplay on mobile for main videos when muted
    const shouldAutoplay = $derived(
        autoplayOnMount && (!isMobile || (isMobile && context === 'main' && defaultMuted))
    );
    const controlsVisible = $derived(
        // Visible when hovering with controls, when explicitly requested on mount,
        // or on mobile when we programmatically show controls at start
        ((isHovering && showControls) || (showControlsOnMount && showControls) || (isMobile && showControls))
    );

    onMount(() => {
        // Detect mobile environment (screen size or coarse pointer)
        const mobileQuery = window.matchMedia('(max-width: 767px)');
        const coarsePointerQuery = window.matchMedia('(pointer: coarse)');
        const updateIsMobile = () => {
            isMobile = mobileQuery.matches || coarsePointerQuery.matches;
        };
        updateIsMobile();
        const onResize = () => updateIsMobile();
        mobileQuery.addEventListener('change', updateIsMobile);
        coarsePointerQuery.addEventListener('change', updateIsMobile);
        window.addEventListener('resize', onResize);

        // Configure initial mute/autoplay based on props (allow mobile autoplay for main when muted)
        if (videoElement) {
            videoElement.muted = defaultMuted;
            isMuted = defaultMuted;
            const initialShouldAutoplay = autoplayOnMount && (!isMobile || (isMobile && context === 'main' && defaultMuted));
            videoElement.autoplay = initialShouldAutoplay;
            // Ensure iOS Safari inline playback & autoplay recognition
            try {
                videoElement.setAttribute('playsinline', '');
                videoElement.setAttribute('webkit-playsinline', '');
                if (defaultMuted) videoElement.setAttribute('muted', '');
                if (initialShouldAutoplay) videoElement.setAttribute('autoplay', '');
            } catch (_) {}
            if (initialShouldAutoplay) {
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
            } else {
                // On mobile or when autoplay is disabled, start with visible controls so the user can choose to play
                if (isClickToPlayWithSound || isMobile) {
                    showControls = true;
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
                // For click-to-play-with-sound, always unmute on first play
                // For has-sound mode, do NOT auto-unmute - user must click "Sound On" button
                if (isClickToPlayWithSound && !hasUserPlayed) {
					videoElement.muted = false;
					isMuted = false;
					notifyVideoPlayingWithSound();
				} else if (effectiveUnmuteOnUserPlay && !hasUserPlayed && !isHasSoundMode) {
					videoElement.muted = false;
					isMuted = false;
				}
				videoElement.play().catch(() => {});
                hasUserPlayed = true;
			}
		};
		window.addEventListener('video-play-request', playRequestHandler);

        // Track fullscreen state
        const fsHandler = () => {
            const anyDoc = document as any;
            isFullscreen = !!(document.fullscreenElement || anyDoc.webkitFullscreenElement);
        };
        document.addEventListener('fullscreenchange', fsHandler);
        // iOS Safari native player events
        videoElement.addEventListener('webkitbeginfullscreen', () => { isFullscreen = true; });
        videoElement.addEventListener('webkitendfullscreen', () => { isFullscreen = false; });

        if (videoElement) {
            const canPlayNativeHls = typeof videoElement.canPlayType === 'function' && videoElement.canPlayType('application/vnd.apple.mpegurl');
            const preferNativeHls = canPlayNativeHls && isMobile;
            if (useHls) {
                if (preferNativeHls) {
                    videoElement.src = hlsUrl;
                } else {
                    import('hls.js').then(({ default: Hls }) => {
                        if (Hls.isSupported()) {
                            const hls = new Hls({
                                autoStartLoad: true,
                                capLevelToPlayerSize: true,
                                maxBufferLength: 15,
                                maxMaxBufferLength: 30,
                                lowLatencyMode: false,
                                maxBufferSize: 30 * 1000 * 1000,
                                startLevel: -1
                            });
                            hls.on(Hls.Events.ERROR, (event: any, data: any) => {
                                if (data.fatal) {
                                    switch (data.type) {
                                        case Hls.ErrorTypes.NETWORK_ERROR:
                                            hls.startLoad();
                                            break;
                                        case Hls.ErrorTypes.MEDIA_ERROR:
                                            hls.recoverMediaError();
                                            break;
                                        default:
                                            hls.destroy();
                                    }
                                }
                            });
                            hls.loadSource(hlsUrl);
                            hls.attachMedia(videoElement);
                            (videoElement as any).hls = hls;
                        } else if (canPlayNativeHls) {
                            videoElement.src = hlsUrl;
                        }
                    });
                }
            } else {
                videoElement.src = videoUrl;
            }

            // Recovery handlers only for Hls.js path (avoid interfering with native iOS pipeline)
            if (useHls && !preferNativeHls) {
                const nudge = () => {
                    try {
                        if (videoElement && !videoElement.paused) {
                            const t = videoElement.currentTime;
                            videoElement.currentTime = Math.max(0, t + 0.01);
                        }
                    } catch (_) {}
                };
                const reloadOnError = () => {
                    try {
                        videoElement.load();
                        videoElement.play().catch(() => {});
                    } catch (_) {}
                };
                videoElement.addEventListener('stalled', nudge);
                videoElement.addEventListener('waiting', nudge);
                videoElement.addEventListener('suspend', nudge);
                videoElement.addEventListener('emptied', nudge);
                videoElement.addEventListener('error', reloadOnError);
            }
        }

        return () => {
			window.removeEventListener('video-playing-with-sound', handleOtherVideoPlaying);
            document.removeEventListener('fullscreenchange', fsHandler);
			window.removeEventListener('video-play-request', playRequestHandler);
            mobileQuery.removeEventListener('change', updateIsMobile);
            coarsePointerQuery.removeEventListener('change', updateIsMobile);
            window.removeEventListener('resize', onResize);
		};
	});

	// Handle URL changes when navigating between projects
    let lastHandledHlsUrl: string | null = hlsUrl || null;
    $effect(() => {
        if (!videoElement || !hlsUrl) return;
        // Avoid double re-initialization on first mount which can cause a brief black frame on mobile
        if (lastHandledHlsUrl === hlsUrl) return;
        lastHandledHlsUrl = hlsUrl;
		
		// Reset video state
		isPlaying = false;
		currentTime = 0;
		duration = 0;
        hasUserPlayed = false;

		// Proactively pause and reset before swapping sources
		try { videoElement.pause(); } catch (_) {}
		try {
			// Destroy existing HLS instance if any before changing src
			if ((videoElement as any).hls) {
				(videoElement as any).hls.destroy();
				(videoElement as any).hls = undefined;
			}
		} catch (_) {}
		
		if (useHls) {
			import('hls.js').then(({ default: Hls }) => {
				if (Hls.isSupported()) {
					const hls = new Hls({ autoStartLoad: true });
					hls.loadSource(hlsUrl);
					hls.attachMedia(videoElement);
					
					// Store HLS instance for cleanup
					(videoElement as any).hls = hls;
				} else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
					videoElement.src = hlsUrl;
				}
			});
		} else {
			videoElement.src = videoUrl;
		}

		// Force a load to reset pipeline (helps Safari)
		try { videoElement.load(); } catch (_) {}

        // Reset mute state and autoplay (with mobile override)
        videoElement.muted = defaultMuted;
        isMuted = defaultMuted;
        videoElement.autoplay = shouldAutoplay;
        try {
            videoElement.setAttribute('playsinline', '');
            videoElement.setAttribute('webkit-playsinline', '');
            if (defaultMuted) videoElement.setAttribute('muted', '');
            if (shouldAutoplay) videoElement.setAttribute('autoplay', '');
        } catch (_) {}
        // Ensure controls are visible initially on mobile
        if (isMobile) {
            showControls = true;
        }

		if (shouldAutoplay) {
			const immediateTryPlay = () => {
				const p = videoElement.play();
				if (p && typeof p.then === 'function') {
					p.catch(() => {
						videoElement.muted = true;
						isMuted = true;
						videoElement.play().catch(() => {});
					});
				}
			};

			// Try immediately, then on readiness events, and also next frame
			try { immediateTryPlay(); } catch (_) {}
			if (videoElement.readyState < 2) {
				videoElement.addEventListener('loadeddata', immediateTryPlay, { once: true });
				videoElement.addEventListener('canplay', immediateTryPlay, { once: true });
			}
			requestAnimationFrame(() => { try { immediateTryPlay(); } catch (_) {} });

			// Fallback: unlock on first user interaction if blocked
			const unlock = () => {
				try { immediateTryPlay(); } catch (_) {}
				document.removeEventListener('touchend', unlock);
				document.removeEventListener('click', unlock);
			};
			document.addEventListener('touchend', unlock, { once: true, passive: true });
			document.addEventListener('click', unlock, { once: true });
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
	onclick={(e) => togglePlayPause(e)}
	onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePlayPause(); } }}
	onmouseenter={() => { if (suppressUI) return; isHovering = true; showSoundIcon = true; if (controls) { showControls = true; notifyControlsShown(); } scheduleAutoHide(); }}
	onmouseleave={() => { isHovering = false; clearAutoHide(); showControls = false; notifyControlsHidden(); }}
	onmousemove={() => { if (suppressUI) return; showSoundIcon = true; if (controls) { showControls = true; notifyControlsShown(); } scheduleAutoHide(); }}
>
	<video
		bind:this={videoElement}
		class={videoClass}
		poster={posterImage?.url || ''}
		preload={isMobile ? 'metadata' : (shouldAutoplay ? 'auto' : 'auto')}
		loop
		muted={isMuted}
		autoplay={shouldAutoplay}
		playsinline
		ontimeupdate={() => { currentTime = videoElement.currentTime; }}
		onloadedmetadata={() => { duration = videoElement.duration; }}
		onplay={() => { isPlaying = true; }}
		onpause={() => { isPlaying = false; }}
	>
		<track kind="captions" src="" label="Captions" />
	</video>

	<!-- Semi-transparent overlay for better control readability -->
	{#if controls && hasSoundMode}
    <div 
        class="absolute inset-0 bg-black/10 transition-opacity duration-200 pointer-events-none"
        class:opacity-100={controlsVisible}
        class:opacity-0={!controlsVisible}
    ></div>
	{/if}

	{#if controls && hasSoundMode}
    <div 
        class="absolute left-3 right-3 bottom-3 transition-opacity w-full duration-200 opacity-80 pointer-events-none"
        class:opacity-70={controlsVisible}
        class:opacity-0={!controlsVisible}
    >
        {#if !isMobile}
            <button
                data-video-control="true"
                class="relative block w-full h-3 pointer-events-auto transition-opacity duration-400"
                class:opacity-100={controlsVisible}
                class:opacity-0={!controlsVisible}
                class:pointer-events-none={!controlsVisible}
                role="slider"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={(duration > 0 ? (currentTime / duration) * 100 : 0)}
                aria-label="Seek"
                onmousedown={(e) => { e.stopPropagation(); startScrubMouse(e as MouseEvent); }}
                ontouchstart={(e) => { e.stopPropagation(); startScrubTouch(e as TouchEvent); }}
                onclick={(e) => { e.stopPropagation(); }}
            >
                <!-- Centered thin visible track -->
                <div class="absolute left-0  right-3 top-1/2 -translate-y-1/2 h-0.5 bg-white/40 rounded w-[calc(100%-1.5rem)]">
                    <div 
                        class="h-full bg-white rounded"
                        style={`width: ${duration > 0 ? (currentTime / duration) * 100 : 0}%`}
                    ></div>
                </div>
            </button>
        {/if}

		<div class="text-white w-full pr-2 md:pr-0">
			{#if controls && hasSoundMode}
				<div class="flex pl-0 pr-1 md:pr-3 pointer-events-none w-full">
					<div 
                        class="w-full pr-3 flex flex-row justify-between md:justify-between pointer-events-auto text-white transition-opacity duration-400"
                        class:opacity-100={controlsVisible}
                        class:opacity-0={!controlsVisible}
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
                        onclick={toggleFullscreen}
						>
                        <span class="hidden md:block">
							{isFullscreen ? 'Back' : 'Fullscreen'}
                        </span>

                        <span class="block md:hidden">
							{isFullscreen ? 'Back' : 'Full'}
                        </span>
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