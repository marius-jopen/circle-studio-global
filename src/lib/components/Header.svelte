<script>
	import { PrismicLink } from '@prismicio/svelte';

	let { settings } = $props();
</script>

<!-- Navigation Header -->
{#if settings?.data?.navigation_header}
	<header class="sticky top-0 z-50">
		<nav class=" px-3 py-4">
			<div class="flex justify-between w-full">
				<!-- Logo/Home Link -->
				<a href="/" class="text-xl text-gray-900 hover:text-gray-700 transition-colors">
					Circle Studio Global
				</a>
				
				<!-- Navigation Links -->
				<ul class="flex items-right space-x-6">
					{#each settings.data.navigation_header as navItem}
						<li>
							<PrismicLink 
								field={navItem} 
								class="text-gray-700 hover:text-gray-900 transition-colors font-medium"
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