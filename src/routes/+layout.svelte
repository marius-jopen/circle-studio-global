<script>
	import { PrismicPreview } from '@prismicio/svelte/kit';
	import { PrismicLink } from '@prismicio/svelte';
	import { page } from '$app/state';
	import { repositoryName } from '$lib/prismicio';
	import "../app.css";

	let { children, data } = $props();
</script>

<svelte:head>
	<title>{page.data.title}</title>
	{#if page.data.meta_description}
		<meta name="description" content={page.data.meta_description} />
	{/if}
	{#if page.data.meta_title}
		<meta name="og:title" content={page.data.meta_title} />
	{/if}
	{#if page.data.meta_image}
		<meta name="og:image" content={page.data.meta_image} />
		<meta name="twitter:card" content="summary_large_image" />
	{/if}
</svelte:head>
<!-- Navigation Header -->
{#if data.settings?.data?.navigation_header}
	<header class="sticky top-0 z-50 bg-white border-b border-gray-200">
		<nav class="container mx-auto px-4 py-4">
			<div class="flex items-center justify-between">
				<!-- Logo/Home Link -->
				<a href="/" class="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
					Circle Studio Global
				</a>
				
				<!-- Navigation Links -->
				<ul class="flex items-center space-x-6">
					{#each data.settings.data.navigation_header as navItem}
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

<main>
	{@render children()}
</main>

<PrismicPreview {repositoryName} /> 
