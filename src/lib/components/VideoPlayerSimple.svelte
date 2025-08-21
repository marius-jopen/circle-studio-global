<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		hlsUrl: string;
		posterImage?: any;
		classes?: string;
		playbackRate?: number;
	}

	const {
		hlsUrl,
		posterImage = null,
		classes = 'w-full h-auto rounded object-cover mb-3',
		playbackRate = 1
	}: Props = $props();

	let videoElement: HTMLVideoElement;

	const useHls = $derived(hlsUrl && hlsUrl.includes('.m3u8'));
	const videoUrl = $derived(hlsUrl.replace('.m3u8', '.mp4'));

	onMount(() => {
		if (videoElement) {
			videoElement.muted = true;
			videoElement.autoplay = true;
			videoElement.playbackRate = playbackRate;
			const tryPlay = () => {
				const p = videoElement.play();
				if (p && typeof p.then === 'function') {
					p.catch(() => {
						videoElement.muted = true;
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

	// Keep playbackRate in sync with prop changes (Svelte runes)
	$effect(() => {
		if (videoElement) {
			videoElement.playbackRate = playbackRate;
		}
	});
</script>

<div class="relative {classes} overflow-hidden bg-black rounded-lg">
	<video
		bind:this={videoElement}
		class="w-full h-full object-cover"
		poster={posterImage?.url || ''}
		preload="auto"
		loop
		muted
		playsinline
		autoplay
	>
		{#if useHls}
			<source src={hlsUrl} type="application/x-mpegURL" />
			<source src={videoUrl} type="video/mp4" />
		{:else}
			<source src={videoUrl} type="video/mp4" />
		{/if}
	</video>
</div>

<style>
	video { transition: opacity 0.2s ease; }
</style>