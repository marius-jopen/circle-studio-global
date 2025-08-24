<script>
	import { PrismicLink } from '@prismicio/svelte';
	import BigWheel from './BigWheel.svelte';

	let { settings, faded = false, videoIsDark = false, mainMediaVisible = true } = $props();
	let isHovering = $state(false);

	// Determine if header should be in dark mode
	const isDarkMode = $derived(videoIsDark && mainMediaVisible);
	
	// Debug logging with $effect
	$effect(() => {
		console.log('🎨 Header state changed - videoIsDark:', videoIsDark, 'mainMediaVisible:', mainMediaVisible, 'isDarkMode:', isDarkMode);
	});
</script>

<!-- Navigation Header -->
{#if settings?.data?.navigation_header}
	<header class="fixed top-0 z-50 w-full pointer-events-none transition-all duration-600" 
		class:opacity-0={faded} 
		class:opacity-100={!faded}
		class:dark-mode={isDarkMode}>
		<nav class="px-3 py-4">
			<div class="flex justify-between w-full">
				<!-- Logo/Home Link -->
				<a 
					href="/" 
					class="block -mt-6 transition-all duration-600 relative"
					class:pointer-events-auto={!faded}
					class:pointer-events-none={faded}
					onmouseenter={() => { isHovering = true; }}
					onmouseleave={() => { isHovering = false; }}
				>
					<!-- Black Wheel (default) -->
					<div class="absolute top-0 left-0 transition-opacity duration-600" class:opacity-0={isDarkMode} class:opacity-100={!isDarkMode}>
						<BigWheel 
							config={{
								uiVisible: false,
								items: [{
									text: 'CIRCLE STUDIO GLOBAL',
									rotationSpeed: isHovering ? 2 : 0.15,
									spacingAmplitudePercent: 0,
									spacingSpeed: 0,
									rotationStart: 0,
									animationType: 'sin'
								}],
								globalSettings: {
									containerSizePercent: 30,
									fontSizePercent: 15.7,
									distancePercent: 0,
									paused: false,
									textColor: '#000000',
									transparentBackground: true,
									manualMode: true,
									fadeInTime: 0,
									fadeOutTime: 0
								}
							}}
						/>
					</div>
					
					<!-- White Wheel (dark mode) -->
					<div class="absolute top-0 left-0 transition-opacity duration-600" class:opacity-100={isDarkMode} class:opacity-0={!isDarkMode}>
						<BigWheel 
							config={{
								uiVisible: false,
								items: [{
									text: 'CIRCLE STUDIO GLOBAL',
									rotationSpeed: isHovering ? 2 : 0.15,
									spacingAmplitudePercent: 0,
									spacingSpeed: 0,
									rotationStart: 0,
									animationType: 'sin'
								}],
								globalSettings: {
									containerSizePercent: 30,
									fontSizePercent: 15.7,
									distancePercent: 0,
									paused: false,
									textColor: '#ffffff',
									transparentBackground: true,
									manualMode: true,
									fadeInTime: 0,
									fadeOutTime: 0
								}
							}}
						/>
					</div>
				</a>
				
				<!-- Navigation Links -->
				<ul class="flex items-right space-x-6 pr-3" class:pointer-events-auto={!faded} class:pointer-events-none={faded}>
					{#each settings.data.navigation_header as navItem}
						<li class:dark-mode={isDarkMode}>
							<PrismicLink 
								field={navItem} 
								class="hover:text-gray-900 transition-colors duration-600 font-medium"
							>
								{navItem.text || 'Link'}
							</PrismicLink>
						</li>
					{/each}
				</ul>
			</div>
		</nav>
	</header>
{/if} 

<style>
	/* Dark mode navigation links - target PrismicLink components */
	:global(header.dark-mode li.dark-mode *) {
		color: #ffffff !important;
	}

	:global(header.dark-mode li.dark-mode *:hover) {
		color: #e5e7eb !important;
	}

	/* Alternative targeting for PrismicLink */
	:global(header.dark-mode li.dark-mode a),
	:global(header.dark-mode li.dark-mode button),
	:global(header.dark-mode li.dark-mode span) {
		color: #ffffff !important;
	}

	:global(header.dark-mode li.dark-mode a:hover),
	:global(header.dark-mode li.dark-mode button:hover),
	:global(header.dark-mode li.dark-mode span:hover) {
		color: #e5e7eb !important;
	}
</style> 