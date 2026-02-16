<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import BigWheel from '../../components/BigWheel.svelte';
	import { onMount, tick } from 'svelte';
    import { mobileSearchOpen, playInputActive } from '$lib/stores';

	type Props = SliceComponentProps<Content.InputSlice>;

	const { slice }: Props = $props();

	let wheelText = $state<string>('Type your text here…');
	let mobileInput = $state<HTMLInputElement | null>(null);
	function closeMobileInput() {
		mobileInput?.blur();
		playInputActive.set(false);
	}

	// Elements used for measuring available space
	let sectionEl: HTMLElement;
	let wheelAreaEl: HTMLDivElement;

	// BigWheel uses a base container size of 600px internally; mirror it here
	const BASE_CONTAINER_SIZE = 450;

	// Will be computed responsively based on available viewport space
	let containerSizePercent = $state<number>(100);
	
	// Mobile detection for size adjustment
	let isMobile = $state<boolean>(false);
	let mobileViewportHeight = $state<number>(0);
	// Padding on mobile to prevent text from touching screen edges (in pixels)
	const MOBILE_PADDING = 80; // 40px on each side

	// Fade animation control
	let manualModeState = $state<boolean>(true);
	let startInvisibleState = $state<boolean>(true);
	let triggerFadeInState = $state<boolean>(false);
	let triggerFadeOutState = $state<boolean>(false);
	let isFadingOut = $state<boolean>(false);
	const FADE_OUT_TIME = 1.5;

	function handleDesktopInputFocus() {
		if (isFadingOut) return;
		if (!wheelText || wheelText === '') return;
		isFadingOut = true;
		// Trigger letter-by-letter fade out
		triggerFadeOutState = true;
		setTimeout(() => {
			triggerFadeOutState = false;
		}, 100);
		// After fade out completes, clear text and fade in fresh
		setTimeout(() => {
			wheelText = '';
			isFadingOut = false;
			// Reset to invisible so new text fades in
			startInvisibleState = true;
			// Trigger fade in for whatever gets typed next
			setTimeout(() => {
				triggerFadeInState = true;
				setTimeout(() => {
					triggerFadeInState = false;
				}, 100);
			}, 50);
		}, FADE_OUT_TIME * 1000);
	}

	function updateWheelSize() {
		if (!sectionEl) return;
		// Check if mobile
		isMobile = window.innerWidth < 768;
		
		// Use visualViewport height on mobile (accounts for keyboard) if available
		const availableHeight = (isMobile && window.visualViewport)
			? window.visualViewport.height
			: sectionEl.getBoundingClientRect().height;
		const availableWidth = sectionEl.getBoundingClientRect().width;
		
		const maxByHeight = availableHeight * 0.7; // cap wheel at 70% of available height
		// On mobile, subtract padding to prevent text from touching borders
		const maxByWidth = isMobile ? availableWidth - MOBILE_PADDING : availableWidth;
		const wheelSizePx = Math.max(0, Math.min(maxByHeight, maxByWidth));
		const percent = (wheelSizePx / BASE_CONTAINER_SIZE) * 100;
		
		containerSizePercent = Number.isFinite(percent) ? percent : 100;
	}

	onMount(() => {
		updateWheelSize();
		const handleResize = () => {
			if (window.visualViewport) {
				mobileViewportHeight = window.visualViewport.height;
			}
			updateWheelSize();
		};
		window.addEventListener('resize', handleResize);

		// Listen to visualViewport resize (keyboard open/close on mobile)
		const vv = window.visualViewport;
		if (vv) {
			mobileViewportHeight = vv.height;
			vv.addEventListener('resize', handleResize);
		}

		// Trigger one-time fade in shortly after mount
		setTimeout(() => {
			triggerFadeInState = true;
			setTimeout(() => {
				triggerFadeInState = false;
			}, 100);
		}, 50);
		// Auto-focus mobile input to open keyboard and set store
		if (window.innerWidth < 768) {
			playInputActive.set(true);
			tick().then(() => {
				setTimeout(() => {
					mobileInput?.focus();
				}, 300);
			});
		}
		return () => {
			window.removeEventListener('resize', handleResize);
			if (vv) {
				vv.removeEventListener('resize', handleResize);
			}
			playInputActive.set(false);
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
			fadeOutTime: FADE_OUT_TIME,
			triggerFadeOut: triggerFadeOutState
		}
	});
</script>

{#if $playInputActive}
	<!-- Mobile: Close button (top right) -->
	<button
		class="md:hidden fixed top-[6px] right-[6px] z-50 w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center cursor-pointer"
		onclick={closeMobileInput}
		aria-label="Close input"
	>
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M1 1L13 13M13 1L1 13" stroke="#171717" stroke-width="1.5" stroke-linecap="round"/>
		</svg>
	</button>

	<!-- Mobile: Hidden input (invisible but still captures keyboard input) -->
	<input
		id="wheel-text-input-mobile"
		type="text"
		placeholder="Type your text here…"
		bind:value={wheelText}
		bind:this={mobileInput}
		autocomplete="off"
		class="md:hidden fixed bottom-0 left-0 w-full opacity-0 pointer-events-none z-[-1] h-0"
		style="font-size: 16px;"
	/>
{/if}

<section
	class="flex flex-col px-4 pt-0 md:pt-8 pb-0 md:pb-12 overflow-hidden"
	style="height: {isMobile ? (mobileViewportHeight > 0 ? mobileViewportHeight + 'px' : '100dvh') : '92svh'};"
	data-slice-type={slice.slice_type}
	data-slice-variation={slice.variation}
	bind:this={sectionEl}
>
	<!-- Wheel area: on mobile, fill space above the fixed input; on desktop, flex-1 -->
	<div class="flex-1 flex justify-center items-center w-full md:pb-[100px]" bind:this={wheelAreaEl}>
		{#if !$mobileSearchOpen}
			<BigWheel config={wheelConfig} />
		{/if}
	</div>

</section>

<!-- Desktop: Input fixed at the bottom center -->
<div class="hidden md:flex fixed bottom-8 left-0 right-0 justify-center items-center px-4 z-50">
	<input
		id="wheel-text-input"
		type="text"
		placeholder="Type your text here…"
		bind:value={wheelText}
		onfocus={handleDesktopInputFocus}
		autocomplete="off"
		class="px-6 pt-3.5 text-neutral-500 hover:text-primary transition-colors duration-300 pb-4 bg-neutral-100 rounded-md w-full max-w-xl text-3xl outline-none focus:outline-none focus:ring-0 focus:border-black"
	/>
</div>
