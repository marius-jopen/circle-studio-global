<script lang="ts">
	import type { Content } from '@prismicio/client';
	import { PrismicRichText, type SliceComponentProps } from '@prismicio/svelte';
	import { isFilled } from '@prismicio/client';
	import TextCircle from '$lib/components/TextCircle.svelte';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	type Props = SliceComponentProps<Content.AboutContentSlice>;

	const { slice }: Props = $props();

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

	const FADE_IN_TIME = 1.7;
	const FADE_OUT_TIME = 1.7;
	const VISIBLE_TIME = 2.5;
	const GAP_TIME = 0.8;

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

	// Responsive circle size (300 mobile, 360 desktop)
	let circleSize = $state(360);
	onMount(() => {
		const updateSize = () => {
			circleSize = window.innerWidth >= 768 ? 360 : 300;
		};
		updateSize();
		window.addEventListener('resize', updateSize);
		return () => window.removeEventListener('resize', updateSize);
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
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
>
	<div class="flex flex-col md:flex-row md:items-stretch gap-6 md:gap-2">
		<!-- Left: White panel with text blocks and skill tags -->
		<div class="flex-1 min-w-0  ">
			<!-- Three text columns -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 bg-white rounded-lg px-6 md:px-10 py-8 md:py-12">
				{#if isFilled.richText((slice.primary as any).text_1)}
					<div class=" text-neutral-900">
						<PrismicRichText field={(slice.primary as any).text_1} />
					</div>
				{/if}
				{#if isFilled.richText((slice.primary as any).text_2)}
					<div class=" text-neutral-900">
						<PrismicRichText field={(slice.primary as any).text_2} />
					</div>
				{/if}
				{#if isFilled.richText((slice.primary as any).text_3)}
					<div class=" text-neutral-900">
						<PrismicRichText field={(slice.primary as any).text_3} />
					</div>
				{/if}
			</div>

			<!-- Six skill tags - white with subtle border, 2x3 grid -->
			{#if skills.length > 0}
				<div class="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-2">
					{#each skills as skill}
						<div
							class="rounded-lg bg-white px-5 py-3.5 text-center text-lg text-neutral-900"
						>
							{skill}
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Right: White panel with circular text -->
		{#if poetryItems.length > 0}
			<div class="bg-white rounded-lg flex items-center justify-center shrink-0">
				<div
					class="flex items-center justify-center"
					style="width: {circleSize}px; height: {circleSize}px;"
				>
					{#key wheelText || poetryItems[0]}
						<TextCircle
							text={wheelText || poetryItems[0]}
							containerSize={circleSize}
							fontSize={56}
							radius={Math.round(circleSize * 0.43)}
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
	</div>
</section>
