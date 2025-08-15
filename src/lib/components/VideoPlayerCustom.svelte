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
				showSoundIcon = false;
			}}
		>
			{#if isMuted}
				<svg class="w-full h-full" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
					<path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.797L4.05 13.06a.5.5 0 00-.383-.06H2a1 1 0 01-1-1V8a1 1 0 011-1h1.667a.5.5 0 00.383-.06l4.333-3.737a1 1 0 011-.127zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z"/>
				</svg>
			{:else}
				<svg class="w-full h-full" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
					<path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.797L4.05 13.06a.5.5 0 00-.383-.06H2a1 1 0 01-1-1V8a1 1 0 011-1h1.667a.5.5 0 00.383-.06l4.333-3.737a1 1 0 011-.127zM12.5 9a2.5 2.5 0 012.5 2.5 2.5 2.5 0 01-2.5 2.5V9z"/>
				</svg>
			{/if}
		</button>
	</div>
	{/if}
</div>

<style>
	video { transition: opacity 0.2s ease; }
</style>