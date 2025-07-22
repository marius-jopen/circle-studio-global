<script lang="ts">
	import { SliceZone, PrismicImage, PrismicRichText } from '@prismicio/svelte';
	import type { PageProps } from './$types';
	import VideoAdvanced from '$lib/components/VideoAdvanced.svelte';
	import { onMount } from 'svelte';

	import { components } from '$lib/slices';

	const { data }: PageProps = $props();
	
	const project = $derived(data.project);
	const projectData = $derived(project.data);
	
	let cameFromNavigation = $state(false);
	
	onMount(() => {
		// Check if user came from navigation vs direct access
		const referrer = document.referrer;
		const currentHost = window.location.host;
		
		// If referrer exists and is from the same domain, it's navigation
		// If no referrer or different domain, it's likely direct access
		cameFromNavigation = !!(referrer && new URL(referrer).host === currentHost);
		
		// Debug logging
		console.log('🔍 Navigation Detection Debug:');
		console.log('- Referrer:', referrer);
		console.log('- Current Host:', currentHost);
		console.log('- Came from navigation:', cameFromNavigation);
		console.log('- Should autoplay:', cameFromNavigation);
	});
</script>

<svelte:head>
	<title>{data.title}</title>
	{#if data.meta_description}
		<meta name="description" content={data.meta_description} />
	{/if}
	{#if data.meta_title}
		<meta property="og:title" content={data.meta_title} />
	{/if}
	{#if data.meta_image}
		<meta property="og:image" content={data.meta_image} />
	{/if}
</svelte:head>

<div class="mx-auto px-3">
	<!-- Main Media -->
	{#if projectData.main_video_url || projectData.main_image?.url}
		<div class="mb-12">
			{#if projectData.main_video_url}
				<VideoAdvanced 
					hlsUrl={projectData.main_video_url}
					posterImage={projectData.main_image} 
					classes="w-full h-auto rounded-lg object-cover aspect-video"
					shouldAutoplay={cameFromNavigation}
				/>
			{:else if projectData.main_image?.url}
				<PrismicImage 
					field={projectData.main_image} 
					class="w-full h-auto rounded-lg object-cover"
				/>
			{/if}
		</div>
	{/if}

	<!-- Project Info -->
	<div class="mb-12">
		<h1 class="text-4xl md:text-6xl font-bold mb-4">{projectData.title}</h1>
		{#if projectData.client}
			<p class="text-xl text-gray-600 mb-6">{projectData.client}</p>
		{/if}
		{#if projectData.description}
			<div class="prose prose-lg max-w-none">
				<PrismicRichText field={projectData.description} />
			</div>
		{/if}
	</div>

	<!-- Credits -->
	{#if projectData.credits && projectData.credits.length > 0}
		<section class="mb-12">
			<h2 class="text-2xl font-bold mb-6">Credits</h2>
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each projectData.credits as credit}
					<div class="bg-gray-50 p-4 rounded-lg">
						{#if credit.label}
							<h3 class="font-semibold text-gray-800 mb-2">{credit.label}</h3>
						{/if}
						{#if credit.person && 'data' in credit.person && credit.person.data?.name}
							<p class="text-gray-600">
								{#if credit.person.data.link && 'url' in credit.person.data.link && credit.person.data.link.url}
									<a href={credit.person.data.link.url} class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
										{credit.person.data.name}
									</a>
								{:else}
									{credit.person.data.name}
								{/if}
							</p>
						{/if}
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Content Slices -->
	{#if projectData.slices && projectData.slices.length > 0}
		<SliceZone slices={projectData.slices} {components} />
	{/if}
</div>
