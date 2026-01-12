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
		size = 100
	}: { 
		variant?: 'black' | 'white';
		rotationSpeed?: number;
		size?: number;
	} = $props();
	
	// Track the current rotation angle
	let currentRotation = $state(0);
	let lastTimestamp = $state(0);
	let animationFrameId: number | null = null;
	
	// Select the correct logo source
	const logoSrc = $derived(variant === 'white' ? '/logo-white.png' : '/logo-white.png');
	const logoBrightness = $derived(variant === 'white' ? 'brightness-100' : 'brightness-[95%]');
	
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
		class="logo-image {logoBrightness}"
		style="transform: rotate({currentRotation}deg); "
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
