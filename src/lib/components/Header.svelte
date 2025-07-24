<script>
	import { PrismicLink } from '@prismicio/svelte';
	import BigWheel from './BigWheel.svelte';

	let { settings } = $props();
</script>

<!-- Navigation Header -->
{#if settings?.data?.navigation_header}
	<header class="fixed top-0 z-50 w-full">
		<nav class=" px-3 py-4">
			<div class="flex justify-between w-full">
				<!-- Logo/Home Link -->
				<a href="/" class="block hover:opacity-70 transition-opacity -mt-6">
					<BigWheel 
						config={{
							uiVisible: false,
							items: [{
								text: 'CIRCLE STUDIO GLOBAL',
								rotationSpeed: 0.15,
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
				<ul class="flex items-right space-x-6">
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