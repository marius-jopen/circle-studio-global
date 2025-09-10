<script lang="ts">
	import BigWheel from './BigWheel.svelte';
	
	let { isDarkMode = false } = $props();
</script>

<!-- Mobile-specific wheel - always centered and non-interactive -->
<div class="md:hidden fixed inset-0 flex justify-center items-center z-40 pointer-events-none">
	<div class="flex justify-center items-center w-full h-full">
		<!-- Black Wheel (default) -->
		<div class="transition-opacity duration-600 z-10 absolute" class:opacity-0={isDarkMode} class:opacity-100={!isDarkMode}>
			<BigWheel 
				config={{
					uiVisible: false,
					items: [{
						text: 'CIRCLE STUDIO GLOBAL',
						rotationSpeed: 0.5, // Slower, more meditative rotation for mobile
						spacingAmplitudePercent: 0,
						spacingSpeed: 0,
						rotationStart: 0,
						animationType: 'sin'
					}],
					globalSettings: {
						containerSizePercent: 35, // Slightly larger for mobile
						fontSizePercent: 15.7, // Larger text for mobile
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
		<div class="transition-opacity duration-600 z-10 absolute" class:opacity-100={isDarkMode} class:opacity-0={!isDarkMode}>
			<BigWheel 
				config={{
					uiVisible: false,
					items: [{
						text: 'CIRCLE STUDIO GLOBAL',
						rotationSpeed: 0.5, // Slower, more meditative rotation for mobile
						spacingAmplitudePercent: 0,
						spacingSpeed: 0,
						rotationStart: 0,
						animationType: 'sin'
					}],
					globalSettings: {
						containerSizePercent: 35, // Slightly larger for mobile
						fontSizePercent: 15.7, // Larger text for mobile
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
	</div>
</div>
