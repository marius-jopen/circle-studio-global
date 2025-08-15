<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		hlsUrl: string;
		posterImage?: any;
		classes?: string;
		playMode?: string | 'no-sound' | 'has-sound';
		controls?: boolean;
	}

	const {
		hlsUrl,
		posterImage = null,
		classes = 'w-full h-auto rounded object-cover mb-3',
		playMode = 'no-sound',
		controls = false
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

    function scheduleAutoHide() {
        if (hideUiTimeout) clearTimeout(hideUiTimeout);
        hideUiTimeout = setTimeout(() => {
            showControls = false;
            showSoundIcon = false;
        }, 1500);
    }

    function clearAutoHide() {
        if (hideUiTimeout) {
            clearTimeout(hideUiTimeout);
            hideUiTimeout = undefined;
        }
    }

	function notifyVideoPlayingWithSound() {
		window.dispatchEvent(new CustomEvent('video-playing-with-sound', { detail: { videoId } }));
	}

	function handleOtherVideoPlaying(event: Event) {
		const { videoId: otherId } = (event as CustomEvent).detail || {};
		if (otherId && otherId !== videoId && videoElement && !videoElement.muted) {
			videoElement.muted = true;
			isMuted = true;
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
	class="relative {classes} overflow-hidden bg-black rounded-lg"
	role="group"
	bind:this={containerElement}
	onmouseenter={() => { if (suppressUI) return; isHovering = true; showSoundIcon = true; if (controls) showControls = true; scheduleAutoHide(); }}
	onmouseleave={() => { isHovering = false; clearAutoHide(); }}
	onmousemove={() => { if (suppressUI) return; showSoundIcon = true; if (controls) showControls = true; scheduleAutoHide(); }}
>
	<video
		bind:this={videoElement}
		class="w-full h-full object-cover"
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

	{#if controls && hasSoundMode}
	<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
		<div 
			class="group flex flex-col items-center gap-0 pointer-events-auto text-white transition-opacity duration-400"
			class:opacity-100={isHovering && showControls}
			class:opacity-0={!isHovering || !showControls}
			style="width:25%;"
		>
			{#if hasSoundMode && !isFullscreen}
			<button
				class="text-base cursor-pointer opacity-80 group-hover:opacity-80 hover:opacity-100 transition-opacity duration-200"
				aria-label={isMuted ? 'Unmute video' : 'Mute video'}
				onclick={(e) => {
					e.stopPropagation();
					if (!videoElement) return;
					videoElement.muted = !videoElement.muted;
					isMuted = videoElement.muted;
					if (!isMuted) notifyVideoPlayingWithSound();
					scheduleAutoHide();
				}}
			>
				Sound {isMuted ? 'On' : 'Off'}
			</button>
			{/if}

			<button
				class="text-base cursor-pointer opacity-80 group-hover:opacity-80 hover:opacity-100 transition-opacity duration-200"
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
				class="text-base cursor-pointer opacity-80 group-hover:opacity-80 hover:opacity-100 transition-opacity duration-200"
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
				{isFullscreen ? 'Return' : 'Fullscreen'}
			</button>

			<div class="text-base tabular-nums opacity-80 group-hover:opacity-80 hover:opacity-100 transition-opacity duration-200 cursor-default">
				{(() => {
					const s = (n: number) => Math.floor(n).toString().padStart(2, '0');
					const mins = Math.floor(currentTime / 60);
					const secs = Math.floor(currentTime % 60);
					const dmins = Math.floor(duration / 60);
					const dsecs = Math.floor(duration % 60);
					return `${mins}:${s(secs)} / ${dmins}:${s(dsecs)}`;
				})()}
			</div>
		</div>
	</div>
	{/if}
</div>

<style>
	video { transition: opacity 0.2s ease; }
</style>