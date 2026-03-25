<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import VideoPlayerCustom from '$lib/components/VideoPlayerCustom.svelte';
	import BigWheel from '$lib/components/BigWheel.svelte';
	import { browser } from '$app/environment';

	type Props = SliceComponentProps<Content.ConversationSlice>;

	const { slice }: Props = $props();

	const videoUrl = $derived((slice.primary as { video_url?: string | null }).video_url?.trim() ?? '');
	const posterImage = $derived((slice.primary as { image?: { url?: string } }).image);
	const title = $derived((slice.primary as { title?: string | null }).title?.trim() ?? '');
	const title2 = $derived((slice.primary as { title_2?: string | null }).title_2?.trim() ?? '');

	let circleSize = $state(320);
	let circleRef = $state<HTMLDivElement | null>(null);

	$effect(() => {
		const el = circleRef;
		if (!el || !browser) return;
		const updateSize = () => {
			const w = el.clientWidth;
			const h = el.clientHeight;
			circleSize = Math.max(160, Math.min(w, h) - 32);
		};
		updateSize();
		const ro = new ResizeObserver(updateSize);
		ro.observe(el);
		window.addEventListener('resize', updateSize);
		return () => {
			ro.disconnect();
			window.removeEventListener('resize', updateSize);
		};
	});

	// BigWheel config: title = outer circle, title_2 = inner circle
	const circleItems = $derived(
		[title, title2]
			.filter(Boolean)
			.map((text, i) => ({
				text,
				rotationSpeed: i === 0 ? 0.3 : 0.25,
				spacingAmplitudePercent: 0,
				spacingSpeed: 0.2,
				rotationStart: i === 0 ? 0 : 180,
				animationType: 'sin' as const
			}))
	);

	let hasClickedToPlay = $state(false);

	function requestVideoPlay() {
		hasClickedToPlay = true;
		window.dispatchEvent(
			new CustomEvent('video-play-request', { detail: { context: 'conversation' } })
		);
	}

	// Overlay visible until first click; after click, never show again
	const overlayVisible = $derived(!hasClickedToPlay);

	const bigWheelConfig = $derived({
		uiVisible: false,
		globalSettings: {
			containerSizePercent: (circleSize / 600) * 100,
			fontSizePercent: 7,
			distancePercent: 1.5,
			paused: false,
			textColor: '#ffffff',
			transparentBackground: true,
			manualMode: true,
			triggerFadeIn: true,
			triggerFadeOut: false,
			startInvisible: false
		},
		items: circleItems
	});
</script>

<section
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	class="w-full mb-2"
>
	{#if videoUrl}
		<div class="relative w-full rounded-lg overflow-hidden conversation-video-wrapper">
			<VideoPlayerCustom
				hlsUrl={videoUrl}
				posterImage={posterImage}
				classes="w-full h-auto rounded-lg"
				playMode="has-sound"
				controls={true}
				context="conversation"
				width={1920}
				height={1080}
				controlsTextClass="text-base"
				autoplayOnMount={false}
				defaultMuted={false}
				basicVideo={false}
				showControlsOnMount={false}
			/>
			{#if circleItems.length > 0}
				<div
					bind:this={circleRef}
					class="absolute inset-0 flex items-center justify-center bigwheel-overlay transition-opacity duration-300 cursor-pointer"
					class:opacity-0={!overlayVisible}
					class:pointer-events-none={!overlayVisible}
					class:pointer-events-auto={overlayVisible}
					role="button"
					tabindex="0"
					aria-label="Play video"
					onclick={(e) => {
						e.preventDefault();
						requestVideoPlay();
					}}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							requestVideoPlay();
						}
					}}
				>
					<BigWheel config={bigWheelConfig} />
				</div>
			{/if}
		</div>
	{/if}
</section>

<style>
	:global(.bigwheel-overlay > div) {
		display: block !important;
		flex-direction: column !important;
		gap: 0 !important;
		height: auto !important;
		width: auto !important;
		max-width: none !important;
		margin: 0 !important;
		padding: 0 !important;
		position: static !important;
	}
	:global(.bigwheel-overlay > div > div:first-child) {
		position: static !important;
		flex-shrink: 1 !important;
		margin: 0 auto !important;
	}
	:global(.bigwheel-overlay > div > div:nth-child(2)) {
		display: none !important;
	}
	:global(.bigwheel-overlay > div > div:first-child > div) {
		margin: 0 auto !important;
	}
	.bigwheel-overlay {
		display: flex !important;
		align-items: center !important;
		justify-content: center !important;
	}
</style>
