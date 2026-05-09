<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import TextCircle from '$lib/components/TextCircle.svelte';
	import VideoPlayerSimple from '$lib/components/VideoPlayerSimple.svelte';
	import { browser } from '$app/environment';

	type Props = SliceComponentProps<Content.VideoAndGeneratorMultipleSlice>;

	const { slice }: Props = $props();

	const switchOrder = $derived((slice.primary as { switch?: boolean }).switch ?? false);

	type MediaItem = { image?: { url?: string | null; alt?: string | null } | null; video_url?: string | null };
	const mediaItems = $derived(
		((slice.primary as { media?: MediaItem[] }).media ?? []).filter((m) => {
			const hasVideo = typeof m?.video_url === 'string' && m.video_url.trim().length > 0;
			const hasImage = !!m?.image?.url;
			return hasVideo || hasImage;
		})
	);

	const generatorFirst = $derived(!switchOrder);

	// Slideshow: preload first 3, then progressively load one ahead of current
	let currentIndex = $state(0);
	let highestLoaded = $state(2);

	$effect(() => {
		const target = Math.min(currentIndex + 2, mediaItems.length - 1);
		if (target > highestLoaded) highestLoaded = target;
	});

	function showNext() {
		if (mediaItems.length < 2) return;
		currentIndex = (currentIndex + 1) % mediaItems.length;
	}

	function getVideoUrl(m: MediaItem): string {
		return typeof m?.video_url === 'string' ? m.video_url.trim() : '';
	}

	// Poetry items for the text wheel (batch generator)
	const poetryItems = $derived(
		(slice.primary as { poetry?: Array<{ item?: string | null }> }).poetry
			?.map((p) => (typeof p?.item === 'string' ? p.item : '')?.trim())
			.filter(Boolean) ?? []
	);

	// Cycling text with fade in/out (matches VideoAndGenerator)
	let wheelText = $state('');
	let poetryIndex = $state(0);
	let triggerFadeIn = $state(false);
	let triggerFadeOut = $state(false);

	const FADE_IN_TIME = 1.3;
	const FADE_OUT_TIME = 1.3;
	const VISIBLE_TIME = 2.5;
	const GAP_TIME = 0.3;

	let cycleTimeoutA: ReturnType<typeof setTimeout> | null = null;
	let cycleTimeoutB: ReturnType<typeof setTimeout> | null = null;

	function pulseFade(kind: 'in' | 'out') {
		if (kind === 'in') {
			triggerFadeIn = true;
			setTimeout(() => (triggerFadeIn = false), 50);
		} else {
			triggerFadeOut = true;
			setTimeout(() => (triggerFadeOut = false), 50);
		}
	}

	function startCycle(initial: boolean) {
		if (poetryItems.length === 0) return;

		if (initial) {
			wheelText = poetryItems[0];
			poetryIndex = 0;
			setTimeout(() => pulseFade('in'), 150);
		}

		if (cycleTimeoutA) clearTimeout(cycleTimeoutA);
		cycleTimeoutA = setTimeout(() => {
			pulseFade('out');

			if (cycleTimeoutB) clearTimeout(cycleTimeoutB);
			cycleTimeoutB = setTimeout(() => {
				poetryIndex = (poetryIndex + 1) % poetryItems.length;
				wheelText = poetryItems[poetryIndex] ?? '';
				setTimeout(() => pulseFade('in'), 50);
				startCycle(false);
			}, (FADE_OUT_TIME * 1.5 + GAP_TIME) * 1000);
		}, (FADE_IN_TIME + VISIBLE_TIME) * 1000);
	}

	$effect(() => {
		if (poetryItems.length > 0 && browser) {
			startCycle(true);
		}
		return () => {
			if (cycleTimeoutA) clearTimeout(cycleTimeoutA);
			if (cycleTimeoutB) clearTimeout(cycleTimeoutB);
		};
	});

	// Circle size: responsive square panel
	let circleSize = $state(360);
	let circleBoxRef = $state<HTMLDivElement | null>(null);

	$effect(() => {
		const el = circleBoxRef;
		if (!el || !browser) return;
		const updateSize = () => {
			const w = el.clientWidth;
			circleSize = Math.max(200, w - 48);
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

	const panelClass =
		'bg-white rounded-lg flex items-center justify-center overflow-hidden w-full aspect-square min-w-0 relative';
</script>

<section
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	class="w-full mb-2"
>
	<div class="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
		{#if generatorFirst && poetryItems.length > 0}
			<div bind:this={circleBoxRef} class="{panelClass} p-6 md:p-8">
				<div
					class="flex items-center justify-center"
					style="width: {circleSize}px; height: {circleSize}px;"
				>
					{#key wheelText || poetryItems[0]}
						<TextCircle
							text={wheelText || poetryItems[0]}
							containerSize={circleSize}
							fontSize={38}
							radius={Math.round(circleSize * 0.32)}
							rotationSpeed={0.1}
							spacingAmplitudePercent={0.5}
							spacingSpeed={0}
							animationType="sin"
							autoTextSize={true}
							autoRadius={true}
							manualMode={true}
							startInvisible={true}
							fadeInTime={FADE_IN_TIME}
							fadeOutTime={FADE_OUT_TIME}
							triggerFadeIn={triggerFadeIn}
							triggerFadeOut={triggerFadeOut}
						/>
					{/key}
				</div>
			</div>
		{/if}

		{#if mediaItems.length > 0}
			<div class="{panelClass} group">
				{#each mediaItems as media, i}
					{@const url = getVideoUrl(media)}
					{@const imgUrl = media.image?.url ?? ''}
					{@const isLoaded = i <= highestLoaded}
					<div
						class="absolute inset-0 transition-opacity duration-150"
						style="opacity: {i === currentIndex ? 1 : 0}; z-index: {i === currentIndex ? 1 : 0}; pointer-events: {i === currentIndex ? 'auto' : 'none'};"
					>
						{#if url}
							{#if isLoaded}
								<VideoPlayerSimple
									hlsUrl={url}
									posterImage={media.image as any}
									classes="w-full h-full object-cover"
									dimension="square"
									itemsPerRow={1}
									containerSizePercent={100}
									enableOnMobile={true}
									square={true}
								/>
							{:else if imgUrl}
								<img
									src={imgUrl}
									alt={media.image?.alt ?? ''}
									class="w-full h-full object-cover"
								/>
							{/if}
						{:else if imgUrl}
							<img
								src={imgUrl}
								alt={media.image?.alt ?? ''}
								class="w-full h-full object-cover"
							/>
						{/if}
					</div>
				{/each}

				{#if mediaItems.length > 1}
					<button
						type="button"
						onclick={(e) => { e.preventDefault(); e.stopPropagation(); showNext(); }}
						class="absolute bottom-[7px] right-[7px] z-[2] h-10 px-3 rounded-md bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-[opacity,colors] duration-200 pointer-events-auto cursor-pointer md:opacity-0 md:group-hover:opacity-100"
						aria-label="Next media"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M5 12h14M12 5l7 7-7 7"/>
						</svg>
					</button>
				{/if}
			</div>
		{/if}

		{#if !generatorFirst && poetryItems.length > 0}
			<div bind:this={circleBoxRef} class="{panelClass} p-6 md:p-8">
				<div
					class="flex items-center justify-center"
					style="width: {circleSize}px; height: {circleSize}px;"
				>
					{#key wheelText || poetryItems[0]}
						<TextCircle
							text={wheelText || poetryItems[0]}
							containerSize={circleSize}
							fontSize={38}
							radius={Math.round(circleSize * 0.32)}
							rotationSpeed={0.1}
							spacingAmplitudePercent={0.5}
							spacingSpeed={0}
							animationType="sin"
							autoTextSize={true}
							autoRadius={true}
							manualMode={true}
							startInvisible={true}
							fadeInTime={FADE_IN_TIME}
							fadeOutTime={FADE_OUT_TIME}
							triggerFadeIn={triggerFadeIn}
							triggerFadeOut={triggerFadeOut}
						/>
					{/key}
				</div>
			</div>
		{/if}
	</div>
</section>
