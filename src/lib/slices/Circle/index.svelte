<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
    import { onMount, onDestroy } from 'svelte';
	import BigWheel from '$lib/components/BigWheel.svelte';
	import TextCircle from '$lib/components/TextCircle.svelte';
	import { mobileSearchOpen } from '$lib/stores';


	type Props = SliceComponentProps<Content.CircleSlice>;

	const { slice }: Props = $props();

	// Collect non-empty texts from the repeatable group
	const texts = (slice.primary.items ?? [])
		.map((item) => (item.text ?? '').trim())
		.filter((t) => !!t);

	// Configuration
	const useBigWheelOnMobile = $state(false); // Use TextCircle on mobile by default

	// State & timing
	let selectedIndex = $state<number>(-1);
	let selectedText = $state<string | null>(null);
	let isMobile = $state(false);
	let mounted = $state(false);
	let mobileContainerSize = $state(450);

	let fadeInTimeSec = $state(1.7);
	let fadeOutTimeSec = $state(1.7);
	let visibleTimeSec = $state(4.7);
	let gapTimeSec = $state(1);

	// BigWheel manual triggers
	let triggerFadeIn = $state(false);
	let triggerFadeOut = $state(false);

	// Internal timers
	let cycleTimeoutA: ReturnType<typeof setTimeout> | null = null;
	let cycleTimeoutB: ReturnType<typeof setTimeout> | null = null;
	let mobileCycleTimeout: ReturnType<typeof setTimeout> | null = null;

	function randomIndexDifferentFrom(current: number, length: number): number {
		if (length <= 1) return 0;
		let next = current;
		while (next === current) {
			const arr = new Uint32Array(1);
			crypto.getRandomValues(arr);
			next = arr[0] % length;
		}
		return next;
	}

	function pickInitial() {
		if (texts.length === 0) return;
		const arr = new Uint32Array(1);
		crypto.getRandomValues(arr);
		selectedIndex = arr[0] % texts.length;
		selectedText = texts[selectedIndex];
	}

	function pickNext() {
		if (texts.length === 0) return;
		selectedIndex = randomIndexDifferentFrom(selectedIndex, texts.length);
		selectedText = texts[selectedIndex];
	}

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
		// Optionally trigger the initial fade-in
		if (initial) {
			pulseFade('in');
		}

		// After fade-in + visible time, fade out
		if (cycleTimeoutA) clearTimeout(cycleTimeoutA);
		cycleTimeoutA = setTimeout(() => {
			pulseFade('out');

			// After fade-out completes + gap, switch text and fade in again, then loop
			if (cycleTimeoutB) clearTimeout(cycleTimeoutB);
			cycleTimeoutB = setTimeout(() => {
				pickNext();
				pulseFade('in');
				startCycle(false);
			}, (fadeOutTimeSec + gapTimeSec) * 1000);
		}, (fadeInTimeSec + visibleTimeSec) * 1000);
	}

	function startMobileCycle() {
		// Use the same fade animation system as desktop
		startCycle(true);
	}

	function checkMobile() {
		if (typeof window !== 'undefined') {
			isMobile = window.innerWidth < 768;
			const width = window.innerWidth || 360;
			mobileContainerSize = Math.max(200, Math.min(300, Math.floor(width * 0.6)));
		}
	}

    // Route-based visibility (hide on mobile for project/about and when mobile search is open)
    let pathname = $state('');
    const isProjectRoute = $derived(pathname.startsWith('/work/'));
    const isAboutRoute = $derived(pathname === '/about' || pathname.startsWith('/about/'));
	const hideOnMobile = $derived(isMobile && ($mobileSearchOpen));

	onMount(() => {
		mounted = true;
        if (typeof window !== 'undefined') {
            pathname = window.location.pathname;
        }
		
		if (texts.length > 0) {
			pickInitial();
			checkMobile();
			
			if (isMobile) {
				startMobileCycle();
			} else {
				startCycle(true);
			}
		}

		// Listen for resize events to handle mobile/desktop switching
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', checkMobile);
		}
	});

	onDestroy(() => {
		if (cycleTimeoutA) clearTimeout(cycleTimeoutA);
		if (cycleTimeoutB) clearTimeout(cycleTimeoutB);
		if (mobileCycleTimeout) clearTimeout(mobileCycleTimeout);
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', checkMobile);
		}
	});
</script>

<section data-slice-type={slice.slice_type} data-slice-variation={slice.variation}>
	<div class="flex justify-center items-center w-full pt-24 pb-24 content-container aspect-square md:aspect-auto">
		{#if selectedText}
			{#if mounted && isMobile}
				{#if hideOnMobile}
					<!-- Hidden on mobile for project/about pages and when mobile search is open -->
				{:else}
					{#if useBigWheelOnMobile}
						<div class="w-full max-w-sm ">
							<BigWheel
								config={{
									uiVisible: false,
									items: [
										{
											text: selectedText,
											rotationSpeed: 0.2,
											spacingAmplitudePercent: 0,
											spacingSpeed: 0,
											rotationStart: 0,
											animationType: 'sin',
											autoTextSize: true,
										}
									],
									globalSettings: {
										containerSizePercent: 60,
										fontSizePercent: 16,
										distancePercent: 0,
										paused: false,
										textColor: '#171717',
										transparentBackground: true,
										manualMode: true,
										fadeInTime: fadeInTimeSec,
										fadeOutTime: fadeOutTimeSec,
										triggerFadeIn: triggerFadeIn,
										triggerFadeOut: triggerFadeOut
									}
								}}
							/>
						</div>
					{:else}
						<div class="w-full flex justify-center">
							<div style={`width: ${mobileContainerSize}px; height: ${mobileContainerSize}px;`} class="relative">
								<div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
									<TextCircle
										text={selectedText}
										fontSize={mobileContainerSize * 0.16}
										radius={(mobileContainerSize / 2) - (mobileContainerSize * 0.16 * 1.2)}
										rotationSpeed={0.2}
										spacingAmplitudePercent={0}
										spacingSpeed={0}
										rotationStart={0}
										animationType={'sin'}
										containerSize={mobileContainerSize}
										paused={false}
										textColor={'#171717'}
										fadeInTime={fadeInTimeSec}
										fadeOutTime={fadeOutTimeSec}
										manualMode={true}
										triggerFadeIn={triggerFadeIn}
										triggerFadeOut={triggerFadeOut}
										autoTextSize={true}
									/>
								</div>
							</div>
						</div>
					{/if}
				{/if}
			{:else if mounted}
				<BigWheel
					config={{
						uiVisible: false,
						items: [
							{
								text: selectedText,
								rotationSpeed: 0.2,
								spacingAmplitudePercent: 0,
								spacingSpeed: 0,
								rotationStart: 0,
								animationType: 'sin',
								autoTextSize: true,
							}
						],
						globalSettings: {
							containerSizePercent: 100,
							fontSizePercent: 9,
							distancePercent: 0,
							paused: false,
							textColor: '#171717',
							transparentBackground: true,
							manualMode: true,
							fadeInTime: fadeInTimeSec,
							fadeOutTime: fadeOutTimeSec,
							triggerFadeIn: triggerFadeIn,
							triggerFadeOut: triggerFadeOut
						}
					}}
				/>
			{:else}
				<!-- Fallback during SSR - show simple text -->
				<div class="text-center px-4">
					<div class="text-base md:text-2xl font-medium text-primary ">
						{selectedText}
					</div>
				</div>
			{/if}
		{/if}
	</div>
</section>
