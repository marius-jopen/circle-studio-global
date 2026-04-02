<script lang="ts">
	import type { Content } from '@prismicio/client';
	import { PrismicRichText, type SliceComponentProps } from '@prismicio/svelte';
	import { isFilled } from '@prismicio/client';
	import TextCircle from '$lib/components/TextCircle.svelte';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { aboutContentVisible } from '$lib/stores';

	type Props = SliceComponentProps<Content.AboutContentSlice>;

	const { slice }: Props = $props();

	let sectionRef = $state<HTMLElement | null>(null);

	$effect(() => {
		const el = sectionRef;
		if (!el || !browser) return;
		const navHeight = 60;
		const onScroll = () => {
			const rect = el.getBoundingClientRect();
			aboutContentVisible.set(rect.top <= navHeight);
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => {
			window.removeEventListener('scroll', onScroll);
			aboutContentVisible.set(false);
		};
	});

	// Poetry items for the text wheel
	const poetryItems = $derived(
		(slice.primary as { poetry?: Array<{ item?: string | null }> }).poetry
			?.map((p) => (typeof p?.item === 'string' ? p.item : '')?.trim())
			.filter(Boolean) ?? []
	);

	// Cycling text with fade in/out (like Circle slice / batch generator)
	let wheelText = $state('');
	let poetryIndex = $state(0);
	let triggerFadeIn = $state(false);
	let triggerFadeOut = $state(false);

	const FADE_IN_TIME = 1.5;
	const FADE_OUT_TIME = 1.5;
	const VISIBLE_TIME = 1.5;
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

	// Track mobile breakpoint
	let isMobile = $state(false);

	$effect(() => {
		if (!browser) return;
		const mq = window.matchMedia('(max-width: 767px)');
		isMobile = mq.matches;
		const handler = (e: MediaQueryListEvent) => (isMobile = e.matches);
		mq.addEventListener('change', handler);
		return () => mq.removeEventListener('change', handler);
	});

	// Measure left column height so the right box never exceeds it
	let leftColRef = $state<HTMLDivElement | null>(null);
	let leftColHeight = $state(0);

	$effect(() => {
		const el = leftColRef;
		if (!el || !browser) return;
		const update = () => {
			leftColHeight = el.offsetHeight;
		};
		update();
		const ro = new ResizeObserver(update);
		ro.observe(el);
		return () => ro.disconnect();
	});

	// Circle size based on the right box dimensions (constrained by left column height)
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
		return () => ro.disconnect();
	});

	const skills = $derived([
		(slice.primary as { skill_1?: string | null }).skill_1,
		(slice.primary as { skill_2?: string | null }).skill_2,
		(slice.primary as { skill_3?: string | null }).skill_3,
		(slice.primary as { skill_4?: string | null }).skill_4,
		(slice.primary as { skill_5?: string | null }).skill_5,
		(slice.primary as { skill_6?: string | null }).skill_6
	].filter(Boolean) as string[]);
</script>

<section
	bind:this={sectionRef}
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
>
	<div class="grid grid-cols-1 md:grid-cols-4 md:items-start gap-2 md:gap-2 mb-2">
		<!-- Left: 3/4 width - white panel with text blocks and skill tags -->
		<div bind:this={leftColRef} class="md:col-span-3 flex flex-col min-w-0">
			<!-- Three text columns -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 bg-white rounded-lg px-6 md:px-0 py-8 md:py-8">
				{#if isFilled.richText((slice.primary as any).text_1)}
					<div class="text-left text-neutral-900 min-w-0 md:px-8">
						<PrismicRichText field={(slice.primary as any).text_1} />
					</div>
				{/if}
				{#if isFilled.richText((slice.primary as any).text_2)}
					<div class="text-left text-neutral-900 min-w-0 md:px-8">
						<PrismicRichText field={(slice.primary as any).text_2} />
					</div>
				{/if}
				{#if isFilled.richText((slice.primary as any).text_3)}
					<div class="text-left text-neutral-900 min-w-0 md:px-8">
						<PrismicRichText field={(slice.primary as any).text_3} />
					</div>
				{/if}
			</div>

			<!-- Six skill tags - white with subtle border, 2x3 grid -->
			{#if skills.length > 0}
				<div class="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-2">
					{#each skills as skill}
						<div
							class="rounded-lg bg-white px-5 py-2.5 text-center text-base text-neutral-900"
						>
							{skill}
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Right: 1/4 width - white panel, height matches left column -->
		{#if poetryItems.length > 0}
			<div
				bind:this={circleBoxRef}
				class="md:col-span-1 bg-white rounded-lg flex items-center justify-center min-w-0 p-2 w-full overflow-hidden {isMobile ? 'aspect-square' : ''}"
				style={!isMobile && leftColHeight ? `height: ${leftColHeight}px;` : ''}
			>
				<div
					class="flex items-center justify-center"
					style="width: {circleSize}px; height: {circleSize}px;"
				>
					{#key false}
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
