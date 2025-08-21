<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import BigWheel from '../../components/BigWheel.svelte';
	import { onMount, onDestroy } from 'svelte';

	type Props = SliceComponentProps<Content.InputSlice>;

	const { slice }: Props = $props();

	let wheelText = $state<string>('Type your text here…');

	// Elements used for measuring available space
	let sectionEl: HTMLElement;
	let wheelAreaEl: HTMLDivElement;

	// BigWheel uses a base container size of 600px internally; mirror it here
	const BASE_CONTAINER_SIZE = 600;

	// Will be computed responsively based on available viewport space
	let containerSizePercent = $state<number>(100);

	function updateWheelSize() {
		if (!sectionEl) return;
		const rect = sectionEl.getBoundingClientRect();
		const maxByHeight = rect.height * 0.6; // cap wheel at 60% of available height
		const maxByWidth = rect.width; // do not exceed available width
		const wheelSizePx = Math.max(0, Math.min(maxByHeight, maxByWidth));
		const percent = (wheelSizePx / BASE_CONTAINER_SIZE) * 100;
		containerSizePercent = Number.isFinite(percent) ? percent : 100;
	}

	onMount(() => {
		updateWheelSize();
		const handleResize = () => updateWheelSize();
		window.addEventListener('resize', handleResize);
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	const wheelConfig = $derived({
		uiVisible: false,
		items: [
			{
				text: wheelText,
				rotationSpeed: 0.2,
				spacingAmplitudePercent: 2,
				spacingSpeed: 0,
				rotationStart: 0,
				animationType: 'sin',
				autoTextSize: true
			}
		],
		globalSettings: {
			containerSizePercent,
			fontSizePercent: 11,
			distancePercent: 0,
			paused: false,
			textColor: '#000000',
			transparentBackground: true,
			manualMode: true,
			fadeInTime: 0,
			fadeOutTime: 0
		}
	});
</script>

<section
	class="min-h-[100svh] flex flex-col px-4 pt-8 pb-12 overflow-y-hidden"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	bind:this={sectionEl}
>
	<!-- Wheel area grows to fill available space; we measure it to size the wheel -->
	<div class="flex-1 flex justify-center items-center w-full" bind:this={wheelAreaEl}>
		<BigWheel config={wheelConfig} />
	</div>

	<!-- Input is always visible at the bottom -->
	<div class="flex justify-center items-center w-full pt-8">
		<input
			id="wheel-text-input"
			type="text"
			placeholder="Type text for the circle..."
			bind:value={wheelText}
			class="px-6 pt-3.5 text-neutral-500 hover:text-black transition-colors duration-300 pb-4 bg-[#f3f3f3] rounded-3xl w-full max-w-xl text-3xl outline-none focus:outline-none focus:ring-0 focus:border-black"
		/>
	</div>
</section>
