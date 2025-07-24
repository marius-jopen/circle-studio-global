<script lang="ts">
	import { PrismicPreview } from '@prismicio/svelte/kit';
	import { page } from '$app/state';
	import { repositoryName } from '$lib/prismicio';
	import Header from '$lib/components/Header.svelte';
	import Welcome from '$lib/components/Welcome.svelte';
	import { onMount } from 'svelte';
	import "../app.css";

	let { children, data } = $props();
	
	// Global navigation click detection for video autoplay permissions
	onMount(() => {
		const handleNavigationClick = (e: Event) => {
			const target = e.target as HTMLElement;
			if (target.closest('a') || target.closest('button')) {
				sessionStorage.setItem('circle-studio-navigating', 'true');
				sessionStorage.setItem('user-has-interacted', 'true');
				console.log('🌐 Global navigation click detected, stored both flags');
			}
		};
		
		// Listen for all clicks globally
		document.addEventListener('click', handleNavigationClick);
		
		return () => {
			document.removeEventListener('click', handleNavigationClick);
		};
	});
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

<Welcome />

<Header settings={data.settings} />

<main class="mt-14">
	{@render children()}
</main>

<PrismicPreview {repositoryName} /> 
