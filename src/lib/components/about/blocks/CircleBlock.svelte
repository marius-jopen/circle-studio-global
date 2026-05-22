<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import TextCircle from '$lib/components/TextCircle.svelte';
	import type { CircleBlock } from '$lib/types/aboutBlock';
	import { BG_CLASS, TEXT_HEX } from '$lib/types/aboutBlock';

	interface Props {
		block: CircleBlock;
	}

	const { block }: Props = $props();

	const bgClass = $derived(BG_CLASS[block.backgroundColor]);
	const textHex = $derived(TEXT_HEX[block.textColor]);

	const FADE_IN_TIME = 2.5;
	const FADE_OUT_TIME = 1.5;
	const VISIBLE_TIME = 1.5;
	const GAP_TIME = 0;

	let outerRef = $state<HTMLDivElement | null>(null);
	let containerSize = $state(300);
	let mounted = $state(false);

	// Shrink the rendered circle ~8% vs the cell so radius + font don't crowd the border.
	const renderSize = $derived(Math.round(containerSize * 0.92));

	let wheelText = $state('');
	let poetryIndex = $state(0);
	let triggerFadeIn = $state(false);
	let triggerFadeOut = $state(false);

	let cycleTimeoutA: ReturnType<typeof setTimeout> | null = null;
	let cycleTimeoutB: ReturnType<typeof setTimeout> | null = null;
	let resizeObserver: ResizeObserver | null = null;

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
		if (block.items.length === 0) return;

		if (initial) {
			wheelText = block.items[0];
			poetryIndex = 0;
		}

		const waitBeforeOut = initial ? VISIBLE_TIME : FADE_IN_TIME + VISIBLE_TIME;

		if (cycleTimeoutA) clearTimeout(cycleTimeoutA);
		cycleTimeoutA = setTimeout(
			() => {
				pulseFade('out');

				if (cycleTimeoutB) clearTimeout(cycleTimeoutB);
				cycleTimeoutB = setTimeout(() => {
					poetryIndex = (poetryIndex + 1) % block.items.length;
					wheelText = block.items[poetryIndex] ?? '';
					setTimeout(() => pulseFade('in'), 50);
					startCycle(false);
				}, GAP_TIME * 1000);
			},
			waitBeforeOut * 1000
		);
	}

	onMount(() => {
		mounted = true;
		if (!browser) return;

		const updateSize = () => {
			if (!outerRef) return;
			const w = outerRef.clientWidth;
			const h = outerRef.clientHeight;
			const target = Math.min(w, h);
			if (target <= 0) return;
			containerSize = Math.max(120, target - 16);
		};

		if (outerRef) {
			// Defer initial measurement to next frame so parent layout has settled
			requestAnimationFrame(() => requestAnimationFrame(updateSize));
			resizeObserver = new ResizeObserver(updateSize);
			resizeObserver.observe(outerRef);
		}

		if (block.items.length > 0) startCycle(true);
	});

	onDestroy(() => {
		if (cycleTimeoutA) clearTimeout(cycleTimeoutA);
		if (cycleTimeoutB) clearTimeout(cycleTimeoutB);
		resizeObserver?.disconnect();
	});
</script>

<div
	bind:this={outerRef}
	class="relative w-full h-full {bgClass} rounded-lg overflow-hidden"
>
	{#if block.headline}
		<div
			class="absolute bottom-0 left-0 z-[2] text-sm md:text-xl font-medium text-left pl-4 pr-4 md:pr-6 pt-2.5 pb-[13px] pointer-events-none"
			style="color: {textHex};"
		>
			{block.headline}
		</div>
	{/if}
	{#if mounted && block.items.length > 0}
		<div class="absolute inset-0 flex items-center justify-center">
		<TextCircle
			text={wheelText || block.items[0]}
			containerSize={renderSize}
			fontSize={38}
			radius={Math.round(renderSize * 0.32)}
			rotationSpeed={0.1}
			rotationStart={-60}
			spacingAmplitudePercent={0.5}
			spacingSpeed={0}
			animationType="sin"
			autoTextSize={true}
			autoRadius={true}
			maxFontSize={Math.round(renderSize * 0.5)}
			manualMode={true}
			startInvisible={false}
			fadeInTime={FADE_IN_TIME}
			fadeOutTime={FADE_OUT_TIME}
			textColor={textHex}
			{triggerFadeIn}
			{triggerFadeOut}
			revealMode="typewriter"
		/>
		</div>
	{/if}
</div>
