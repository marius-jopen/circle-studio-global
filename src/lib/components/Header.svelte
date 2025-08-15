<script>
	import { PrismicLink } from '@prismicio/svelte';
	import BigWheel from './BigWheel.svelte';

	let { settings, faded = false } = $props();
	let isHovering = $state(false);
</script>

<!-- Navigation Header -->
{#if settings?.data?.navigation_header}
	<header class="fixed top-0 z-50 w-full pointer-events-none transition-opacity duration-600" class:opacity-0={faded} class:opacity-100={!faded}>
		<nav class=" px-3 py-4">
			<div class="flex justify-between w-full">
				<!-- Logo/Home Link -->
				<a 
					href="/" 
					class="block -mt-6"
					class:pointer-events-auto={!faded}
					class:pointer-events-none={faded}
					onmouseenter={() => isHovering = true}
					onmouseleave={() => isHovering = false}
				>
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
				</a>
				
				<!-- Navigation Links -->
				<ul class="flex items-right space-x-6" class:pointer-events-auto={!faded} class:pointer-events-none={faded}>
					{#each settings.data.navigation_header as navItem}
						<li>
							<PrismicLink 
								field={navItem} 
								class="hover:text-gray-900 transition-colors font-medium"
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