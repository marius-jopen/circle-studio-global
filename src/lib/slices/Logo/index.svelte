<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import BigWheel from '../../components/BigWheel.svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	type Props = SliceComponentProps<Content.LogoSlice>;

	const { slice }: Props = $props();

	// Determine display visibility based on slice data
	const display = slice.primary?.display || 'both';
	const showOnDesktop = display === 'both' || display === 'desktop';
	const showOnMobile = display === 'both' || display === 'mobile';

	// Calculate container size based on viewport width
	// Base container size in BigWheel is 600px
	// We want 50vw on desktop (>= 768px) and 70vw on mobile
	const baseContainerSize = 600;
	let containerSizePercent = $state(100);

	function calculateSize() {
		if (!browser) return;
		const viewportWidth = window.innerWidth;
		const isDesktop = viewportWidth >= 768;
		const targetWidth = isDesktop ? viewportWidth * 0.5 : viewportWidth * 0.5;
		// Calculate what percentage of 600px equals the target width
		containerSizePercent = (targetWidth / baseContainerSize) * 100;
	}

	onMount(() => {
		if (browser) {
			calculateSize();
			window.addEventListener('resize', calculateSize);
			return () => {
				window.removeEventListener('resize', calculateSize);
			};
		}
	});
</script>

<section 
	data-slice-type={slice.slice_type} 
	data-slice-variation={slice.variation}
	class="logo-slice"
>
	<div class="logo-container" class:show-desktop={showOnDesktop} class:show-mobile={showOnMobile}>
		<div class="logo-wrapper">
			<BigWheel 
				config={{
					uiVisible: false,
					items: [{
						text: 'ART CAMP EST.2016',
						rotationSpeed: 0.2,
						spacingAmplitudePercent: 0,
						spacingSpeed: 0,
						rotationStart: 0,
						animationType: 'sin'
					}],
				globalSettings: {
					containerSizePercent: containerSizePercent,
					fontSizePercent: 18,
					distancePercent: 0,
					paused: false,
					textColor: '#171717',
					backgroundColor: '#ffffff',
					transparentBackground: false,
					fontFamily: 'CircularXXWeb',
					manualMode: true,
					fadeInTime: 0,
					fadeOutTime: 0
				}
			}}
			/>
		</div>
	</div>
</section>

<style>
	.logo-slice {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 1rem;
		background-color: #ffffff;
	}

	.logo-container {
		width: 100%;
		display: none; /* Hidden by default */
		justify-content: center;
		align-items: center;
	}

	.logo-wrapper {
		width: 70vw;
		max-width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	/* Show on mobile when show-mobile class is present */
	.show-mobile {
		display: flex;
	}

	/* Show on desktop when show-desktop class is present */
	@media (min-width: 768px) {
		.logo-wrapper {
			width: 50vw;
		}

		.show-desktop {
			display: flex;
		}

		/* Hide if only mobile (not desktop) on desktop screens */
		.logo-container.show-mobile:not(.show-desktop) {
			display: none;
		}
	}
</style>
