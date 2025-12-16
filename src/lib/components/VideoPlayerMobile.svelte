<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	interface Props {
		hlsUrl: string;
		posterImage?: any;
		classes?: string;
		inView?: boolean;
		square?: boolean;
	}

	const {
		hlsUrl,
		posterImage = null,
		classes = 'w-full h-auto rounded object-cover',
		inView = false,
		square = false
	}: Props = $props();
	
	// Remove rounded from classes if square is true, and clean up extra spaces
	const processedClasses = $derived(
		square 
			? classes.replace(/\brounded\b/g, '').replace(/\s+/g, ' ').trim()
			: classes
	);

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
		
		// Ensure all autoplay-friendly attributes are set
		el.muted = true;
		el.autoplay = true;
		(el as any).playsInline = true;
		el.setAttribute('playsinline', '');
		el.setAttribute('webkit-playsinline', '');
		el.setAttribute('muted', '');
		el.setAttribute('autoplay', '');
		
		// Wait for video to have enough data before playing
		const attemptPlay = async () => {
			try {
				// If video already has enough data, play immediately
				if (el.readyState >= 2) {
					const playPromise = el.play();
					if (playPromise !== undefined) {
						await playPromise;
					}
					return;
				}
				
				// Otherwise wait for loadeddata event
				await new Promise<void>((resolve, reject) => {
					const timeout = setTimeout(() => {
						reject(new Error('Timeout waiting for video data'));
					}, 5000);
					
					const onLoadedData = () => {
						clearTimeout(timeout);
						el.removeEventListener('loadeddata', onLoadedData);
						el.removeEventListener('canplay', onCanPlay);
						resolve();
					};
					
					const onCanPlay = () => {
						clearTimeout(timeout);
						el.removeEventListener('loadeddata', onLoadedData);
						el.removeEventListener('canplay', onCanPlay);
						resolve();
					};
					
					el.addEventListener('loadeddata', onLoadedData, { once: true });
					el.addEventListener('canplay', onCanPlay, { once: true });
					
					// If already ready, resolve immediately
					if (el.readyState >= 2) {
						clearTimeout(timeout);
						el.removeEventListener('loadeddata', onLoadedData);
						el.removeEventListener('canplay', onCanPlay);
						resolve();
					}
				});
				
				// Now try to play
				const playPromise = el.play();
				if (playPromise !== undefined) {
					await playPromise;
				}
			} catch (error) {
				// Set up user interaction handler as fallback
				const enableAutoplay = () => {
					if (el && el.paused) {
						el.play().catch(() => {});
					}
					document.removeEventListener('touchstart', enableAutoplay);
					document.removeEventListener('click', enableAutoplay);
				};
				document.addEventListener('touchstart', enableAutoplay, { once: true });
				document.addEventListener('click', enableAutoplay, { once: true });
			}
		};
		
		// Try playing immediately, or wait for data
		if (el.readyState >= 2) {
			await attemptPlay();
		} else {
			// Wait a bit for the source to start loading, then try
			setTimeout(() => attemptPlay(), 100);
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
			// Wait a bit longer for sources to start loading before attempting play
			setTimeout(() => tryPlay(), 200);
		} else {
			unloadSources();
		}
	});

	onMount(() => {
		if (inView) {
			loadSources();
			// Wait for sources to load before attempting play
			setTimeout(() => tryPlay(), 200);
		}
	});
</script>

<div class="relative {processedClasses} bg-white">
	{#if inView}
		<video
			bind:this={videoElement}
			class="w-full h-full object-cover bg-white"
			preload="auto"
			autoplay
			loop
			muted
			playsinline
			webkit-playsinline
			controlslist="nodownload nofullscreen noremoteplayback"
			aria-label="Project preview video"
            onplaying={() => {
				isPlaying = true;
				if (overlayHideTimeout) clearTimeout(overlayHideTimeout);
                overlayHideTimeout = setTimeout(() => { overlayVisible = false; }, 500);
			}}
			onpause={() => { isPlaying = false; }}
			onemptied={() => { isPlaying = false; }}
			onloadeddata={() => {
				// Ensure autoplay when data is loaded
				if (videoElement && videoElement.paused && inView) {
					videoElement.play().catch(() => {});
				}
			}}
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


