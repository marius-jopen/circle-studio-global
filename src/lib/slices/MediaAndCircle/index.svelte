<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import VideoPlayerSimple from '$lib/components/VideoPlayerSimple.svelte';
	import TextCircle from '$lib/components/TextCircle.svelte';
	import { browser } from '$app/environment';

	type Props = SliceComponentProps<Content.MediaAndCircleSlice>;

	const { slice }: Props = $props();

	type MediaItem = {
		image?: { url?: string | null; alt?: string | null } | null;
		video_url?: string | null;
	};

	const mediaItems = $derived(
		((slice.primary as { media?: MediaItem[] }).media ?? []).filter((m) => {
			const hasVideo = typeof m?.video_url === 'string' && m.video_url.trim().length > 0;
			const hasImage = !!m?.image?.url;
			return hasVideo || hasImage;
		})
	);

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

	const customText = $derived(
		((slice.primary as { text?: string | null }).text ?? '').trim() || 'will never repeat again'
	);

	const switchOrder = $derived((slice.primary as { switch?: boolean }).switch ?? false);
	const gridColsClass = $derived(
		switchOrder ? 'md:grid-cols-[1fr_2fr]' : 'md:grid-cols-[2fr_1fr]'
	);
	const flexDirClass = $derived(switchOrder ? 'flex-col' : 'flex-col-reverse');
	const mediaOrderClass = $derived(switchOrder ? 'md:order-2' : 'md:order-1');
	const circleOrderClass = $derived(switchOrder ? 'md:order-1' : 'md:order-2');
	const invert = $derived((slice.primary as { invert?: boolean }).invert ?? false);
	const circleBgClass = $derived(invert ? 'bg-neutral-900' : 'bg-white');
	const circleTextColor = $derived(invert ? '#ffffff' : '#171717');

	// One-time fade-in on mount; no fade-out afterwards
	const FADE_IN_TIME = 1.5;
	let triggerFadeIn = $state(false);
	$effect(() => {
		if (!browser) return;
		const t = setTimeout(() => {
			triggerFadeIn = true;
			setTimeout(() => (triggerFadeIn = false), 50);
		}, 150);
		return () => clearTimeout(t);
	});

	const MONTHS = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];

	function ordinalSuffix(day: number): string {
		const j = day % 10;
		const k = day % 100;
		if (j === 1 && k !== 11) return 'st';
		if (j === 2 && k !== 12) return 'nd';
		if (j === 3 && k !== 13) return 'rd';
		return 'th';
	}

	function formatDate(d: Date): string {
		const day = d.getDate();
		return `${MONTHS[d.getMonth()]} ${day}${ordinalSuffix(day)}, ${d.getFullYear()}`;
	}

	let today = $state(new Date());
	const dateLabel = $derived(formatDate(today));
	const circleText = $derived(`${dateLabel} ${customText}`);

	$effect(() => {
		if (!browser) return;
		const tick = () => (today = new Date());
		// Update at next midnight, then every 24h
		const now = new Date();
		const next = new Date(now);
		next.setHours(24, 0, 5, 0);
		const initial = setTimeout(() => {
			tick();
		}, next.getTime() - now.getTime());
		const daily = setInterval(tick, 24 * 60 * 60 * 1000);
		return () => {
			clearTimeout(initial);
			clearInterval(daily);
		};
	});

	// Circle size driven by the right panel
	let circleSize = $state(360);
	let circleBoxRef = $state<HTMLDivElement | null>(null);

	$effect(() => {
		const el = circleBoxRef;
		if (!el || !browser) return;
		const updateSize = () => {
			const w = el.clientWidth;
			const h = el.clientHeight;
			circleSize = Math.max(120, Math.min(w, h) - 16);
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

	const mediaPanelClass =
		'bg-white rounded-lg flex items-center justify-center overflow-hidden shrink-0 relative group';
	const circlePanelClass =
		'rounded-lg shrink-0 min-w-0 flex items-center justify-center overflow-hidden';
</script>

<section
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	class="w-full mb-2"
>
	<!-- Layout matches ContactMedia: 2/3 media + 1/3 square circle -->
	<div class="flex {flexDirClass} md:grid {gridColsClass} md:aspect-[3/1] gap-2 md:gap-2 w-full">
		<!-- Media slideshow (2/3 width) -->
		{#if mediaItems.length > 0}
			<div class="{mediaPanelClass} {mediaOrderClass} w-full aspect-square md:aspect-auto min-h-0">
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
									dimension="landscape"
									itemsPerRow={1}
									containerSizePercent={100}
									enableOnMobile={true}
									square={false}
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

		<!-- Text circle (1/3 width, square) -->
		<div
			bind:this={circleBoxRef}
			class="{circlePanelClass} {circleBgClass} {circleOrderClass} w-full aspect-square md:aspect-auto min-h-0 p-2"
		>
			<div
				class="flex items-center justify-center"
				style="width: {circleSize}px; height: {circleSize}px;"
			>
				{#key `${circleText}-${invert}`}
					<TextCircle
						text={circleText}
						textColor={circleTextColor}
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
						triggerFadeIn={triggerFadeIn}
					/>
				{/key}
			</div>
		</div>
	</div>
</section>
