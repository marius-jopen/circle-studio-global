<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		hlsUrl: string;
		posterImage?: any;
		classes?: string;
		playbackRate?: number;
		dimension?: 'landscape' | 'square' | 'portrait';
		itemsPerRow?: number;
		containerSizePercent?: number;
	}

	// Mobile detection
	const isMobile = $derived(typeof window !== 'undefined' && window.innerWidth < 768);

	const {
		hlsUrl,
		posterImage = null,
		classes = 'w-full h-auto rounded object-cover mb-3',
		playbackRate = 1,
		dimension = 'landscape',
		itemsPerRow = 1,
		containerSizePercent = 80
	}: Props = $props();

	let videoElement: HTMLVideoElement;

	const useHls = $derived(hlsUrl && hlsUrl.includes('.m3u8'));
	const videoUrl = $derived(hlsUrl.replace('.m3u8', '.mp4'));

	// Calculate optimal video quality based on actual display size and aspect ratio
	const getOptimalQualitySettings = () => {
		// Base viewport width (assuming 1920px desktop)
		const baseViewportWidth = 1920;
		const actualWidth = Math.round((baseViewportWidth * containerSizePercent) / 100);
		
		// Calculate height based on aspect ratio
		let aspectRatio: number;
		switch (dimension) {
			case 'landscape':
				aspectRatio = 16/9; // aspect-video
				break;
			case 'square':
				aspectRatio = 1; // aspect-square
				break;
			case 'portrait':
				aspectRatio = 3/4; // aspect-[3/4]
				break;
			default:
				aspectRatio = 16/9;
		}
		
		const actualHeight = Math.round(actualWidth / aspectRatio);
		
		// Calculate minimum bitrate based on actual display size
		// Use a more sophisticated calculation based on pixels
		const totalPixels = actualWidth * actualHeight;
		let minBitrate: number;
		
		if (totalPixels >= 1920 * 1080) { // Full HD or larger
			minBitrate = 2500000;
		} else if (totalPixels >= 1280 * 720) { // HD
			minBitrate = 1500000;
		} else if (totalPixels >= 854 * 480) { // 480p
			minBitrate = 800000;
		} else if (totalPixels >= 640 * 360) { // 360p
			minBitrate = 400000;
		} else { // Smaller
			minBitrate = 200000;
		}
		
		console.log(`Video quality settings: ${dimension} ${itemsPerRow} items (${containerSizePercent}%) = ${actualWidth}x${actualHeight} pixels, min bitrate: ${minBitrate}`);
		
		return {
			width: actualWidth,
			height: actualHeight,
			minBitrate,
			startLevel: -1, // Let HLS.js choose optimal level
			aspectRatio
		};
	};

	// Network quality detection
	const getNetworkQuality = async () => {
		if ('connection' in navigator) {
			const connection = (navigator as any).connection;
			const effectiveType = connection.effectiveType;
			
			const qualityMap: Record<string, number> = {
				'slow-2g': 0,
				'2g': 1,
				'3g': 2,
				'4g': 3,
			};
			
			return qualityMap[effectiveType] || 2;
		}
		return 2;
	};

	// Optimized autoplay for simultaneous playback
	const tryPlay = async () => {
		if (!videoElement) return;
		
		try {
			// Ensure muted for autoplay
			videoElement.muted = true;
			
			// Try to play immediately, don't wait for loadeddata
			const playPromise = videoElement.play();
			if (playPromise !== undefined) {
				await playPromise;
			}
		} catch (error) {
			// If immediate play fails, wait for minimal data and retry
			try {
				if (videoElement.readyState < 1) {
					await new Promise(resolve => {
						videoElement.addEventListener('loadedmetadata', resolve, { once: true });
					});
				}
				videoElement.muted = true;
				await videoElement.play();
			} catch (retryError) {
				console.log('Autoplay blocked, will require user interaction');
				// Set up user interaction handler
				const enableAutoplay = () => {
					if (videoElement) {
						videoElement.play().catch(() => {});
					}
					document.removeEventListener('click', enableAutoplay);
					document.removeEventListener('touchstart', enableAutoplay);
				};
				document.addEventListener('click', enableAutoplay, { once: true });
				document.addEventListener('touchstart', enableAutoplay, { once: true });
			}
		}
	};

	onMount(() => {
		if (videoElement) {
			videoElement.muted = true;
			videoElement.autoplay = !isMobile; // Disable autoplay on mobile
			videoElement.playbackRate = playbackRate;
			
			// Set webkit-specific attributes for better iOS compatibility
			videoElement.setAttribute('webkit-playsinline', 'true');
			videoElement.setAttribute('x-webkit-airplay', 'allow');
			
			// Only try to play on desktop
			if (!isMobile) {
				tryPlay();
			}
		}

		// Only load HLS on desktop to save mobile bandwidth
		if (useHls && videoElement && !isMobile) {
			import('hls.js').then(async ({ default: Hls }) => {
				if (Hls.isSupported()) {
					const networkQuality = await getNetworkQuality();
					const qualitySettings = getOptimalQualitySettings();
					
					// Quality-optimized HLS.js configuration based on actual display size
					const hls = new Hls({
						autoStartLoad: true,
						startLevel: qualitySettings.startLevel, // Let HLS.js choose optimal quality
						capLevelToPlayerSize: true, // Match quality to player size
						maxBufferLength: 30, // Longer buffer for better quality
						maxMaxBufferLength: 60, // Allow more buffering
						backBufferLength: 30, // Keep more back buffer
						enableWorker: true, // Use workers for better performance
						lowLatencyMode: false, // Prioritize quality over latency
						maxBufferSize: 60 * 1000 * 1000, // 60MB buffer for quality
						maxBufferHole: 0.1, // Smaller buffer holes for smooth playback
						highBufferWatchdogPeriod: 2, // Balanced quality switching
						nudgeOffset: 0.1,
						nudgeMaxRetry: 3,
						maxFragLookUpTolerance: 0.2,
						liveSyncDurationCount: 3,
						liveMaxLatencyDurationCount: 5,
						liveDurationInfinity: false,
						liveBackBufferLength: 0,
						maxLiveSyncPlaybackRate: 1,
						liveSyncDuration: undefined,
						// Quality-focused adaptive bitrate
						abrEwmaFastLive: 3.0,
						abrEwmaSlowLive: 9.0,
						abrEwmaFastVoD: 3.0,
						abrEwmaSlowVoD: 9.0,
						abrEwmaDefaultEstimate: qualitySettings.minBitrate,
						abrMaxWithRealBitrate: false, // Use estimates for better quality decisions
						maxStarvationDelay: 4, // Longer starvation delay for quality
						maxLoadingDelay: 4, // Longer loading delay for quality
						minAutoBitrate: qualitySettings.minBitrate, // Minimum bitrate based on actual display size
						emeEnabled: false,
						widevineLicenseUrl: undefined,
						drmSystemOptions: {},
						requestMediaKeySystemAccessFunc: undefined
					});

					// Quality monitoring and optimization
					hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
						console.log(`Video quality switched to level ${data.level} for ${dimension} ${itemsPerRow} items (${containerSizePercent}%)`);
					});

					// Monitor buffer health for quality decisions
					hls.on('bufferstalled' as any, () => {
						console.log('Buffer stalled - may need quality adjustment');
					});

					hls.on(Hls.Events.BUFFER_APPENDED, (event, data) => {
						// Log buffer health for debugging
						if (data.frag && (data.frag as any).sn % 10 === 0) {
							console.log(`Buffer appended: frag ${(data.frag as any).sn}, level ${(data.frag as any).level}`);
						}
					});

					// Error recovery
					hls.on(Hls.Events.ERROR, (event, data) => {
						if (data.fatal) {
							switch (data.type) {
								case Hls.ErrorTypes.NETWORK_ERROR:
									console.log('Fatal network error, trying to recover...');
									hls.startLoad();
									break;
								case Hls.ErrorTypes.MEDIA_ERROR:
									console.log('Fatal media error, trying to recover...');
									hls.recoverMediaError();
									break;
								default:
									console.log('Fatal error, destroying HLS instance');
									hls.destroy();
									break;
							}
						}
					});

					hls.loadSource(hlsUrl);
					if (videoElement) {
						hls.attachMedia(videoElement);
					}
				} else if (videoElement && videoElement.canPlayType('application/vnd.apple.mpegurl')) {
					videoElement.src = hlsUrl;
				}
			});
		} else if (useHls && videoElement && isMobile) {
			// On mobile, just set the poster and don't load video sources
			videoElement.poster = posterImage?.url || '';
		}
	});

	// Keep playbackRate in sync with prop changes (Svelte runes)
	$effect(() => {
		if (videoElement) {
			videoElement.playbackRate = playbackRate;
		}
	});
</script>

<div class="relative {classes} overflow-hidden bg-white rounded-lg">
	{#if isMobile}
		<!-- On mobile, show only the poster image -->
		<img
			class="w-full h-full object-cover"
			src={posterImage?.url || ''}
			alt="Project preview"
		/>
	{:else}
		<!-- On desktop, show video with autoplay -->
		<video
			bind:this={videoElement}
			class="w-full h-full object-cover"
			poster={posterImage?.url || ''}
			preload="auto"
			loop
			muted
			playsinline
			disablePictureInPicture
			controlsList="nodownload nofullscreen noremoteplayback"
			autoplay
		>
			{#if useHls}
				<source src={hlsUrl} type="application/x-mpegURL" />
				<source src={videoUrl} type="video/mp4" />
			{:else}
				<source src={videoUrl} type="video/mp4" />
			{/if}
		</video>
	{/if}
</div>

<style>
	video { transition: opacity 0.2s ease; }
</style>