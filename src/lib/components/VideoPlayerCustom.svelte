<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		hlsUrl: string;
		posterImage?: any;
		classes?: string;
		playMode?: string | 'no-sound' | 'has-sound';
	}

	const {
		hlsUrl,
		posterImage = null,
		classes = 'w-full h-auto rounded object-cover mb-3',
		playMode = 'no-sound'
	}: Props = $props();

	let videoElement: HTMLVideoElement;
    let isHovering = $state(false);
    let isMuted = $state(true);
    let showSoundIcon = $state(true);
	const videoId = Math.random().toString(36).slice(2);

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
		};
	});
</script>


<div 
	class="relative {classes} overflow-hidden bg-black rounded-lg"
	role="group"
	onmouseenter={() => isHovering = true}
	onmouseleave={() => isHovering = false}
	onmousemove={() => { if (!showSoundIcon) showSoundIcon = true; }}
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
	>
		{#if useHls}
			<source src={hlsUrl} type="application/x-mpegURL" />
			<source src={videoUrl} type="video/mp4" />
		{:else}
			<source src={videoUrl} type="video/mp4" />
		{/if}
		<track kind="captions" src="" label="Captions" />
	</video>

	{#if hasSoundMode}
	<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
		<button
			class="pointer-events-auto flex items-center justify-center text-white transition-opacity duration-200"
			class:opacity-100={isHovering && showSoundIcon}
			class:opacity-0={!isHovering || !showSoundIcon}
			style="width:25%; height:25%"
			aria-label={isMuted ? 'Unmute video' : 'Mute video'}
			onclick={(e) => {
				e.stopPropagation();
				if (!videoElement) return;
				videoElement.muted = !videoElement.muted;
				isMuted = videoElement.muted;
				if (!isMuted) notifyVideoPlayingWithSound();
				showSoundIcon = false;
			}}
		>
			{#if isMuted}
				<div class="text-3xl cursor-pointer">
					Sound On
				</div>
			{:else}
				<div class="text-3xl cursor-pointer">
					Sound Off
				</div>
			{/if}
		</button>
	</div>
	{/if}
</div>

<style>
	video { transition: opacity 0.2s ease; }
</style>