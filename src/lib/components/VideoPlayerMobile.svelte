<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	interface Props {
		hlsUrl: string;
		posterImage?: any;
		classes?: string;
		inView?: boolean;
	}

	const {
		hlsUrl,
		posterImage = null,
		classes = 'w-full h-auto rounded object-cover',
		inView = false
	}: Props = $props();

	let videoElement = $state<HTMLVideoElement | null>(null);
	let hlsInstance = $state<any>(null);
    let isPlaying = $state(false);
    let overlayVisible = $state(!!(posterImage && posterImage.url));
    let overlayHideTimeout: ReturnType<typeof setTimeout> | null = null;
// Use provided URL directly. iOS Safari supports HLS natively; avoid naive .mp4 swap.
	const resolvedUrl = $derived(hlsUrl);

	const tryPlay = async () => {
		const el = videoElement;
		if (!el) return;
		try {
			el.muted = true;
			(el as any).playsInline = true;
			const p = el.play();
			if (p) await p;
		} catch (e) {
			// Fallback: wait for metadata then retry
			try {
				await new Promise((resolve) => el.addEventListener('loadedmetadata', resolve, { once: true }));
				el.muted = true;
				await el.play();
			} catch {}
		}
	};

	const loadSources = async () => {
		const el = videoElement;
		if (!el) return;
		// Ensure inline playback attributes
		el.setAttribute('webkit-playsinline', 'true');
		el.setAttribute('x-webkit-airplay', 'allow');
		(el as any).playsInline = true;
		el.classList.add('bg-white');

		if (resolvedUrl.includes('.m3u8')) {
			if (el.canPlayType('application/vnd.apple.mpegurl')) {
				el.src = resolvedUrl;
				el.load();
			} else {
				try {
					const { default: Hls } = await import('hls.js');
					if (Hls.isSupported()) {
						if (hlsInstance) { try { hlsInstance.destroy(); } catch {} hlsInstance = null; }
						const hls = new Hls({ autoStartLoad: true, enableWorker: true });
						hls.loadSource(resolvedUrl);
						hls.attachMedia(el);
						hlsInstance = hls;
					} else {
						el.src = resolvedUrl;
						el.load();
					}
				} catch {
					el.src = resolvedUrl;
					el.load();
				}
			}
		} else {
			// Non-HLS direct URL
			el.src = resolvedUrl;
			el.load();
		}
	};

	const unloadSources = () => {
		const el = videoElement;
		if (!el) return;
		try { el.pause(); } catch {}
		if (hlsInstance) { try { hlsInstance.destroy(); } catch {} hlsInstance = null; }
		el.removeAttribute('src');
		el.load();
		isPlaying = false;
		overlayVisible = !!(posterImage && posterImage.url);
	};

	$effect(() => {
		if (!browser || !videoElement) return;
		if (inView) {
			loadSources();
			queueMicrotask(() => tryPlay());
		} else {
			unloadSources();
		}
	});

	onMount(() => {
		if (inView) {
			loadSources();
			tryPlay();
		}
	});
</script>

<div class="relative {classes} bg-white">
	{#if inView}
		<video
			bind:this={videoElement}
			class="w-full h-full object-cover bg-white"
			preload="none"
			autoplay
			loop
			muted
			playsinline
			controlslist="nodownload nofullscreen noremoteplayback"
			aria-label="Project preview video"
            onplaying={() => {
				isPlaying = true;
				if (overlayHideTimeout) clearTimeout(overlayHideTimeout);
                overlayHideTimeout = setTimeout(() => { overlayVisible = false; }, 500);
			}}
			onpause={() => { isPlaying = false; }}
			onemptied={() => { isPlaying = false; }}
		></video>
        {#if posterImage?.url}
            <img
                src={posterImage.url}
                alt="Video placeholder"
                class="absolute inset-0 w-full h-full object-cover pointer-events-none select-none transition-opacity duration-500"
                style:opacity={overlayVisible ? 1 : 0}
                aria-hidden="true"
            />
        {/if}
	{/if}
</div>

<style>
	video { transition: opacity 0.2s ease; }
</style>


