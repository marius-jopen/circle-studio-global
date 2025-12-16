<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import Logo from '../../components/Logo.svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	type Props = SliceComponentProps<Content.LogoSlice>;

	const { slice }: Props = $props();

	// Determine display visibility based on slice data
	const display = slice.primary?.display || 'both';
	const showOnDesktop = display === 'both' || display === 'desktop';
	const showOnMobile = display === 'both' || display === 'mobile';

	// Calculate logo size based on viewport width
	let logoSize = $state(200);

	function calculateSize() {
		if (!browser) return;
		const viewportWidth = window.innerWidth;
		const isDesktop = viewportWidth >= 768;
		// 50vw on desktop, 70vw on mobile
		logoSize = isDesktop ? viewportWidth * 0.5 : viewportWidth * 0.5;
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
		<div class="logo-wrapper mt-6 mb-2">
			<Logo 
				variant="black"
				rotationSpeed={10}
				size={logoSize}
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
		.show-desktop {
			display: flex;
		}

		/* Hide if only mobile (not desktop) on desktop screens */
		.logo-container.show-mobile:not(.show-desktop) {
			display: none;
		}
	}
</style>
