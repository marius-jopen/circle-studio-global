<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import TextCircle from '$lib/components/TextCircle.svelte';
	import VideoPlayerSimple from '$lib/components/VideoPlayerSimple.svelte';
	import { browser } from '$app/environment';

	type Props = SliceComponentProps<Content.VideoAndGeneratorSlice>;

	const { slice }: Props = $props();

	const switchOrder = $derived((slice.primary as { switch?: boolean }).switch ?? false);
	const videoUrl = $derived((slice.primary as { video_url?: string | null }).video_url?.trim() ?? '');
	const imageField = $derived((slice.primary as { image?: { url?: string } }).image);

	// Order: switch false = generator first (left), video second (right)
	//        switch true  = video first (left), generator second (right)
	const generatorFirst = $derived(!switchOrder);

	// Poetry items for the text wheel (batch generator)
	const poetryItems = $derived(
		(slice.primary as { poetry?: Array<{ item?: string | null }> }).poetry
			?.map((p) => (typeof p?.item === 'string' ? p.item : '')?.trim())
			.filter(Boolean) ?? []
	);

	// Cycling text with fade in/out (like AboutContent)
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
		'bg-white rounded-lg flex items-center justify-center overflow-hidden w-full aspect-square flex-1 min-w-0';
</script>

<section
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	class="w-full"
>
	<div class="flex flex-col md:flex-row gap-2 md:gap-2 md:items-stretch w-full">
		{#if generatorFirst}
			<!-- First: Batch generator (TextCircle) -->
			{#if poetryItems.length > 0}
				<div
					bind:this={circleBoxRef}
					class="{panelClass} p-6 md:p-8"
				>
					<div
						class="flex items-center justify-center"
						style="width: {circleSize}px; height: {circleSize}px;"
					>
						{#key wheelText || poetryItems[0]}
							<TextCircle
								text={wheelText || poetryItems[0]}
								containerSize={circleSize}
								fontSize={Math.round(circleSize * 0.13)}
								radius={Math.round(circleSize * 0.35)}
								rotationSpeed={0.1}
								spacingAmplitudePercent={0.5}
								spacingSpeed={0}
								animationType="sin"
								autoTextSize={false}
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

			<!-- Second: Video (autoplay, muted, square) -->
			{#if videoUrl}
				<div class="{panelClass}">
					<VideoPlayerSimple
						hlsUrl={videoUrl}
						posterImage={imageField}
						classes="w-full h-full object-cover"
						dimension="square"
						itemsPerRow={1}
						containerSizePercent={100}
						enableOnMobile={true}
						square={true}
					/>
				</div>
			{/if}
		{:else}
			<!-- Swapped: Video first, generator second -->
			{#if videoUrl}
				<div class="{panelClass}">
					<VideoPlayerSimple
						hlsUrl={videoUrl}
						posterImage={imageField}
						classes="w-full h-full object-cover"
						dimension="square"
						itemsPerRow={1}
						containerSizePercent={100}
						enableOnMobile={true}
						square={true}
					/>
				</div>
			{/if}

			{#if poetryItems.length > 0}
				<div
					bind:this={circleBoxRef}
					class="{panelClass} p-6 md:p-8"
				>
					<div
						class="flex items-center justify-center"
						style="width: {circleSize}px; height: {circleSize}px;"
					>
						{#key wheelText || poetryItems[0]}
							<TextCircle
								text={wheelText || poetryItems[0]}
								containerSize={circleSize}
								fontSize={Math.round(circleSize * 0.13)}
								radius={Math.round(circleSize * 0.35)}
								rotationSpeed={0.1}
								spacingAmplitudePercent={0.5}
								spacingSpeed={0}
								animationType="sin"
								autoTextSize={false}
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
		{/if}
	</div>
</section>
