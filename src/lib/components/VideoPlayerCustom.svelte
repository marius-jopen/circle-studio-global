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
		width?: number;
		height?: number;
	}

	const {
		hlsUrl,
		posterImage = null,
		classes = 'w-full h-auto rounded object-cover mb-3',
		playMode = 'no-sound',
		controls = false,
		context = undefined,
		controlsTextClass = '',
		width = 1920,
		height = 1080
	}: Props = $props();

	let videoElement: HTMLVideoElement;
    let isHovering = $state(false);
    let isMuted = $state(true);
    let showSoundIcon = $state(true);
	const videoId = Math.random().toString(36).slice(2);
	let isPlaying = $state(false);
	let currentTime = $state(0);
	let duration = $state(0);
    let showControls = $state(true);
    let isFullscreen = $state(false);
    let containerElement: HTMLDivElement;
    let hideUiTimeout: ReturnType<typeof setTimeout> | undefined;
    let suppressUI = $state(false);
    let isScrubbing = $state(false);
    let scrubLeft = 0;
    let scrubWidth = 1;
    let lastShowControls = showControls;

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
		// Always autoplay muted and ensure playback kicks in
		if (videoElement) {
			videoElement.muted = true;
			isMuted = true;
			videoElement.autoplay = true;
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

		// Listen for other videos unmuting
		window.addEventListener('video-playing-with-sound', handleOtherVideoPlaying);

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
		};
	});
</script>


<div 
	class="relative {classes} overflow-hidden bg-white rounded-lg"
	role="group"
	bind:this={containerElement}
	style="aspect-ratio: {width}/{height};"
	onmouseenter={() => { if (suppressUI) return; isHovering = true; showSoundIcon = true; if (controls) { showControls = true; notifyControlsShown(); } scheduleAutoHide(); }}
	onmouseleave={() => { isHovering = false; clearAutoHide(); showControls = false; notifyControlsHidden(); }}
	onmousemove={() => { if (suppressUI) return; showSoundIcon = true; if (controls) { showControls = true; notifyControlsShown(); } scheduleAutoHide(); }}
>
	<video
		bind:this={videoElement}
		class="w-full h-full object-cover scale-[100.5%]"
		poster={posterImage?.url || ''}
		preload="auto"
		loop
		muted
		autoplay
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
		class:opacity-100={isHovering && showControls}
		class:opacity-0={!isHovering || !showControls}
	></div>
	{/if}

	{#if controls && hasSoundMode}
	<div 
		class="absolute left-3 right-3 bottom-3 transition-opacity w-full duration-200 opacity-80 pointer-events-none"
		class:opacity-70={isHovering && showControls}
		class:opacity-0={!isHovering || !showControls}
	>
		<button
			class="relative block w-full h-3 pointer-events-auto transition-opacity duration-400"
			class:opacity-100={isHovering && showControls}
			class:opacity-0={!isHovering || !showControls}
			class:pointer-events-none={!isHovering || !showControls}
			role="slider"
			aria-valuemin="0"
			aria-valuemax="100"
			aria-valuenow={(duration > 0 ? (currentTime / duration) * 100 : 0)}
			aria-label="Seek"
			onmousedown={startScrubMouse}
			ontouchstart={startScrubTouch}
		>
			<!-- Centered thin visible track -->
			<div class="absolute left-0  right-3 top-1/2 -translate-y-1/2 h-0.5 bg-white/40 rounded w-[calc(100%-1.5rem)]">
				<div 
					class="h-full bg-white rounded"
					style={`width: ${duration > 0 ? (currentTime / duration) * 100 : 0}%`}
				></div>
			</div>
		</button>

		<div class="text-white w-full">
			{#if controls && hasSoundMode}
				<div class="flex px-3 pointer-events-none w-full">
					<div 
						class="w-full pr-3 flex flex-row justify-between pointer-events-auto text-white transition-opacity duration-400"
						class:opacity-100={isHovering && showControls}
						class:opacity-0={!isHovering || !showControls}
					>

							<button 
							onclick={() => {
								if (!videoElement) return;
								videoElement.currentTime = 0;
								currentTime = 0;
								scheduleAutoHide();
							}}
							class="{controlsTextClass} text-left w-1/4 cursor-pointer tabular-nums opacity-80 group-hover:opacity-80 hover:opacity-100 transition-opacity duration-200 cursor-default">
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
							class="{controlsTextClass} w-1/4 cursor-pointer opacity-80 group-hover:opacity-80 hover:opacity-100 transition-opacity duration-200"
							aria-label={isPlaying ? 'Pause video' : 'Play video'}
							onclick={() => {
								if (!videoElement) return;
								if (videoElement.paused) { videoElement.play(); } else { videoElement.pause(); }
								scheduleAutoHide();
							}}
						>
							{isPlaying ? 'Pause' : 'Play'}
						</button>

						<button
						class="{controlsTextClass} w-1/4 cursor-pointer opacity-80 group-hover:opacity-80 hover:opacity-100 transition-opacity duration-200"
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
							class="{controlsTextClass} text-right w-1/4 cursor-pointer opacity-80 group-hover:opacity-80 hover:opacity-100 transition-opacity duration-200"
							aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
							onclick={async () => {
								if (!containerElement) return;
								try {
									if (!document.fullscreenElement) {
										await containerElement.requestFullscreen();
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