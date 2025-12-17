<script lang="ts">
	import Logo from './Logo.svelte';
	import { onMount } from 'svelte';
	
	let { isDarkMode = false, scrollSpeedMultiplier = 12 } = $props();
	
	let scrollRotation = $state(0);
	let targetRotation = $state(0);
	let isScrolling = $state(false);
	let windowWidth = $state(350);
	let logoSize = $derived(Math.min(windowWidth * 0.9, 500));
	let scrollTimeout: ReturnType<typeof setTimeout>;
	let animationFrame: number;
	let lastScrollY = 0;
	let lastScrollTime = 0;
	let isAnimating = false;
	
	// Continuous animation loop that never stops
	function animate() {
		// Always continue the animation loop
		isAnimating = true;
		
		// Smooth interpolation towards target rotation
		const smoothing = 0.12; // Slightly more responsive
		const diff = targetRotation - scrollRotation;
		scrollRotation += diff * smoothing;
		
		// Continue animation indefinitely
		animationFrame = requestAnimationFrame(animate);
	}
	
	onMount(() => {
		// Set initial window width
		windowWidth = window.innerWidth;
		
		// Fallback for older mobile browsers: lock a stable vh unit to innerHeight
		const handleResize = () => {
			document.documentElement.style.setProperty('--app-vh', `${window.innerHeight * 0.01}px`);
			windowWidth = window.innerWidth;
		};
		handleResize();
		window.addEventListener('resize', handleResize, { passive: true });

		// Start the continuous animation loop
		animate();
		
		const handleScroll = () => {
			const now = performance.now();
			const scrollY = window.scrollY;
			const deltaY = scrollY - lastScrollY;
			const deltaTime = now - lastScrollTime;
			
			// Only update if there's meaningful scroll movement and time has passed
			if (Math.abs(deltaY) > 0.5 && deltaTime > 0) {
				// Clear existing timeout
				clearTimeout(scrollTimeout);
				
				// Set scrolling state
				isScrolling = true;
				
				// Calculate rotation based on scroll velocity (pixels per millisecond)
				const velocity = deltaY / deltaTime;
				const rotationIncrement = velocity * 0.4 * scrollSpeedMultiplier; // Slightly more sensitive (scaled)
				
				// Update target rotation (accumulate, don't replace)
				targetRotation += rotationIncrement;
				
				// Store current values
				lastScrollY = scrollY;
				lastScrollTime = now;
				
				// Set timeout to stop scrolling state
				scrollTimeout = setTimeout(() => {
					isScrolling = false;
				}, 150);
			}
		};
		
		// Add scroll listener with throttling
		let ticking = false;
		const throttledScroll = () => {
			if (!ticking) {
				requestAnimationFrame(() => {
					handleScroll();
					ticking = false;
				});
				ticking = true;
			}
		};
		
		window.addEventListener('scroll', throttledScroll, { passive: true });
		
		// Cleanup
		return () => {
			window.removeEventListener('scroll', throttledScroll);
			window.removeEventListener('resize', handleResize);
			clearTimeout(scrollTimeout);
			isAnimating = false;
			if (animationFrame) {
				cancelAnimationFrame(animationFrame);
			}
		};
	});
</script>

<!-- Mobile-specific wheel - always centered and non-interactive -->
<div class="md:hidden fixed inset-0 flex justify-center items-center z-40 pointer-events-none" style="height: calc(var(--app-vh, 1vh) * 100); height: 100dvh;">
	<div class="flex justify-center items-center w-full h-full">
		<!-- Black Logo (default) -->
		<div 
			class="transition-opacity duration-600 z-10 absolute" 
			class:opacity-0={isDarkMode}
			class:opacity-100={!isDarkMode}
			style="transform: rotate({scrollRotation}deg); will-change: transform;"
		>
			<Logo 
				variant="black"
				rotationSpeed={0}
				size={logoSize}
			/>
		</div>
		
		<!-- White Logo (dark mode) -->
		<div 
			class="transition-opacity duration-600 z-10 absolute" 
			class:opacity-100={isDarkMode}
			class:opacity-0={!isDarkMode}
			style="transform: rotate({scrollRotation}deg); will-change: transform;"
		>
			<Logo 
				variant="white"
				rotationSpeed={0}
				size={logoSize}
			/>
		</div>
	</div>
</div>
