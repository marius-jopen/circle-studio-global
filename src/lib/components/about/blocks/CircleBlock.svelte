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

	const FADE_IN_TIME = 1.5;
	const FADE_OUT_TIME = 1.5;
	const VISIBLE_TIME = 1.5;
	const GAP_TIME = 0;

	let outerRef = $state<HTMLDivElement | null>(null);
	let containerSize = $state(300);
	let mounted = $state(false);

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
			setTimeout(() => pulseFade('in'), 150);
		}

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
			(FADE_IN_TIME + VISIBLE_TIME) * 1000
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
			containerSize = Math.max(120, target - 16);
		};

		if (outerRef) {
			updateSize();
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
	class="w-full h-full {bgClass} rounded-lg overflow-hidden flex items-center justify-center"
>
	{#if mounted && block.items.length > 0}
		<TextCircle
			text={wheelText || block.items[0]}
			containerSize={containerSize}
			fontSize={38}
			radius={Math.round(containerSize * 0.32)}
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
			textColor={textHex}
			{triggerFadeIn}
			{triggerFadeOut}
			revealMode="typewriter"
		/>
	{/if}
</div>
