<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import BigWheel from '../../components/BigWheel.svelte';
	import { onMount } from 'svelte';
    import { mobileSearchOpen } from '$lib/stores';

	type Props = SliceComponentProps<Content.InputSlice>;

	const { slice }: Props = $props();

	let wheelText = $state<string>('Type your text here…');

	// Elements used for measuring available space
	let sectionEl: HTMLElement;
	let wheelAreaEl: HTMLDivElement;

	// BigWheel uses a base container size of 600px internally; mirror it here
	const BASE_CONTAINER_SIZE = 450;

	// Will be computed responsively based on available viewport space
	let containerSizePercent = $state<number>(100);
	
	// Mobile detection for size adjustment
	let isMobile = $state<boolean>(false);
	// Padding on mobile to prevent text from touching screen edges (in pixels)
	const MOBILE_PADDING = 80; // 40px on each side

	// One-time fade-in control
	let manualModeState = $state<boolean>(true);
	let startInvisibleState = $state<boolean>(true);
	let triggerFadeInState = $state<boolean>(false);

	function updateWheelSize() {
		if (!sectionEl) return;
		// Check if mobile
		isMobile = window.innerWidth < 768;
		
		const rect = sectionEl.getBoundingClientRect();
		const maxByHeight = rect.height * 0.6; // cap wheel at 60% of available height
		// On mobile, subtract padding to prevent text from touching borders
		const maxByWidth = isMobile ? rect.width - MOBILE_PADDING : rect.width;
		const wheelSizePx = Math.max(0, Math.min(maxByHeight, maxByWidth));
		const percent = (wheelSizePx / BASE_CONTAINER_SIZE) * 100;
		
		containerSizePercent = Number.isFinite(percent) ? percent : 100;
	}

	onMount(() => {
		updateWheelSize();
		const handleResize = () => updateWheelSize();
		window.addEventListener('resize', handleResize);
		// Trigger one-time fade in shortly after mount
		setTimeout(() => {
			triggerFadeInState = true;
			setTimeout(() => {
				triggerFadeInState = false;
			}, 100);
		}, 50);
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
			fontSizePercent: 20,
			distancePercent: 0,
			paused: false,
			textColor: '#171717',
			transparentBackground: true,
			manualMode: manualModeState,
			startInvisible: startInvisibleState,
			triggerFadeIn: triggerFadeInState,
			fadeInTime: 2.5,
			fadeOutTime: 0,
			triggerFadeOut: false
		}
	});
</script>

<!-- Mobile: Fixed input at top matching MobileNav search style -->
<div class="md:hidden fixed top-5 right-4 left-4 z-50">
	<div class="bg-gray-100 rounded-full flex items-center overflow-hidden" style="height: 48px;">
		<input
			id="wheel-text-input-mobile"
			type="text"
			placeholder="Type text for the circle..."
			bind:value={wheelText}
			class="p-2 px-4 flex-1 bg-transparent outline-none text-xl"
		/>
	</div>
</div>

<section
	class="min-h-[100svh] flex flex-col px-4 pt-8 pb-12 overflow-y-hidden"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	bind:this={sectionEl}
>
	<!-- Wheel area grows to fill available space; we measure it to size the wheel -->
	<div class="flex-1 flex justify-center items-center w-full translate-y-4" bind:this={wheelAreaEl}>
		{#if !$mobileSearchOpen}
			<BigWheel config={wheelConfig} />
		{/if}
	</div>

	<!-- Desktop: Input at the bottom -->
	<div class="hidden md:flex justify-center items-center w-full pt-8">
		<input
			id="wheel-text-input"
			type="text"
			placeholder="Type text for the circle..."
			bind:value={wheelText}
			class="px-6 pt-3.5 text-neutral-500 hover:text-primary transition-colors duration-300 pb-4 bg-neutral-100 rounded-full w-full max-w-xl text-3xl outline-none focus:outline-none focus:ring-0 focus:border-black"
		/>
	</div>
</section>
