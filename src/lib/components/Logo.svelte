<script module lang="ts">
	// Decided once when the module loads, survives route changes but resets on hard reload
	const _logoUseAlt = Math.random() < 0.5;
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	
	/**
	 * Rotating Logo Component
	 * 
	 * @prop variant - 'black' or 'white' to choose which logo to display
	 * @prop rotationSpeed - rotation speed in degrees per second (default: 50). Set to 0 to stop.
	 * @prop size - size of the logo in pixels (default: 100)
	 */
	
	let {
		variant = 'black',
		rotationSpeed = 50,
		size = 100,
		useOriginal = false
	}: {
		variant?: 'black' | 'white';
		rotationSpeed?: number;
		size?: number;
		useOriginal?: boolean;
	} = $props();
	
	// Track the current rotation angle
	let currentRotation = $state(0);
	let lastTimestamp = $state(0);
	let animationFrameId: number | null = null;
	
	// Pick logo variant once per page load (module-level), consistent across route changes
	const useAlt = !useOriginal && _logoUseAlt;
	const logoSrc = $derived(
		variant === 'white'
			? (useAlt ? '/logo2-white.png' : '/logo-white.png')
			: (useAlt ? '/logo2-black.png' : '/logo-black.png')
	);
	
	// Animation loop
	function animate(timestamp: number) {
		if (lastTimestamp === 0) {
			lastTimestamp = timestamp;
		}
		
		const deltaTime = (timestamp - lastTimestamp) / 1000; // Convert to seconds
		lastTimestamp = timestamp;
		
		// Update rotation based on speed and time delta
		currentRotation = (currentRotation + rotationSpeed * deltaTime) % 360;
		
		// Continue animating only if speed > 0
		if (rotationSpeed > 0) {
			animationFrameId = requestAnimationFrame(animate);
		}
	}
	
	// Start/stop animation based on rotationSpeed
	$effect(() => {
		if (rotationSpeed > 0) {
			// Start animation
			lastTimestamp = 0;
			animationFrameId = requestAnimationFrame(animate);
		} else {
			// Stop animation but keep current position
			if (animationFrameId !== null) {
				cancelAnimationFrame(animationFrameId);
				animationFrameId = null;
			}
		}
		
		// Cleanup on unmount or when effect reruns
		return () => {
			if (animationFrameId !== null) {
				cancelAnimationFrame(animationFrameId);
				animationFrameId = null;
			}
		};
	});
</script>

<div 
	class="logo-container" 
	style="width: {size}px; height: {size}px;"
>
	<img 
		src={logoSrc} 
		alt="Art Camp Logo" 
		class="logo-image"
		style="transform: rotate({currentRotation}deg);"
	/>
</div>

<style>
	.logo-container {
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: visible;
	}
	
	.logo-image {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
</style>
