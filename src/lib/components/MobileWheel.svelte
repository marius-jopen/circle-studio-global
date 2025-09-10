<script lang="ts">
	import BigWheel from './BigWheel.svelte';
	import { onMount } from 'svelte';
	
	let { isDarkMode = false } = $props();
	
	let scrollRotation = $state(0);
	let isScrolling = $state(false);
	let scrollTimeout: ReturnType<typeof setTimeout>;
	
	onMount(() => {
		const handleScroll = () => {
			// Clear existing timeout
			clearTimeout(scrollTimeout);
			
			// Set scrolling state
			isScrolling = true;
			
			// Calculate rotation based on scroll position
			const scrollY = window.scrollY;
			const scrollSpeed = Math.abs(scrollY - (window.lastScrollY || 0));
			const direction = scrollY > (window.lastScrollY || 0) ? 1 : -1;
			
			// Update rotation based on scroll speed and direction
			scrollRotation += scrollSpeed * 0.1 * direction;
			
			// Store current scroll position
			window.lastScrollY = scrollY;
			
			// Set timeout to stop scrolling state
			scrollTimeout = setTimeout(() => {
				isScrolling = false;
			}, 150);
		};
		
		// Add scroll listener
		window.addEventListener('scroll', handleScroll, { passive: true });
		
		// Cleanup
		return () => {
			window.removeEventListener('scroll', handleScroll);
			clearTimeout(scrollTimeout);
		};
	});
</script>

<!-- Mobile-specific wheel - always centered and non-interactive -->
<div class="md:hidden fixed inset-0 flex justify-center items-center z-40 pointer-events-none">
	<div class="flex justify-center items-center w-full h-full">
		<!-- Black Wheel (default) -->
		<div 
			class="transition-opacity duration-600 z-10 absolute" 
			class:opacity-0={isDarkMode} 
			class:opacity-100={!isDarkMode}
			style="transform: rotate({scrollRotation}deg); transition: transform 0.1s ease-out;"
		>
			<BigWheel 
				config={{
					uiVisible: false,
					items: [{
						text: 'CIRCLE STUDIO GLOBAL',
						rotationSpeed: 0, // No internal rotation - controlled by scroll
						spacingAmplitudePercent: 0,
						spacingSpeed: 0,
						rotationStart: 0,
						animationType: 'sin'
					}],
					globalSettings: {
						containerSizePercent: 35, // Slightly larger for mobile
						fontSizePercent: 15.7, // Larger text for mobile
						distancePercent: 0,
						paused: true, // Pause internal animation since we're controlling rotation externally
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
		<div 
			class="transition-opacity duration-600 z-10 absolute" 
			class:opacity-100={isDarkMode} 
			class:opacity-0={!isDarkMode}
			style="transform: rotate({scrollRotation}deg); transition: transform 0.1s ease-out;"
		>
			<BigWheel 
				config={{
					uiVisible: false,
					items: [{
						text: 'CIRCLE STUDIO GLOBAL',
						rotationSpeed: 0, // No internal rotation - controlled by scroll
						spacingAmplitudePercent: 0,
						spacingSpeed: 0,
						rotationStart: 0,
						animationType: 'sin'
					}],
					globalSettings: {
						containerSizePercent: 35, // Slightly larger for mobile
						fontSizePercent: 15.7, // Larger text for mobile
						distancePercent: 0,
						paused: true, // Pause internal animation since we're controlling rotation externally
						textColor: '#ffffff',
						transparentBackground: true,
						manualMode: true,
						fadeInTime: 0,
						fadeOutTime: 0
					}
				}}
			/>
		</div>
	</div>
</div>
