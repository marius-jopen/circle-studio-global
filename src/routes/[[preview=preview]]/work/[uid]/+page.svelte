<script lang="ts">
	import { SliceZone, PrismicImage, PrismicRichText, PrismicLink } from '@prismicio/svelte';
	import type { PageProps } from './$types';
	import VideoPlayerCustom from '$lib/components/VideoPlayerCustom.svelte';
  import Credits from '$lib/components/Credits.svelte';
  import CreditsMobile from '$lib/components/CreditsMobile.svelte';
	import RelatedProjects from '$lib/components/RelatedProjects.svelte';
	import { onMount } from 'svelte';

	import { components } from '$lib/slices';

	const { data }: PageProps = $props();
	
	const project = $derived(data.project);
	const projectData = $derived(project.data);
	const relatedProjects = $derived(data.relatedProjects);

	// Use a consistently large controls text size across environments
	let controlsTextClass = $state('text-4xl');

	// Dispatch video_is_dark state to layout when component mounts
	onMount(() => {
		// Scroll to top when project page loads (ensures it works on mobile)
		window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
		document.documentElement.scrollTop = 0;
		document.body.scrollTop = 0;
		// Also try with delays to handle async rendering and welcome screen
		setTimeout(() => {
			window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
			document.documentElement.scrollTop = 0;
			document.body.scrollTop = 0;
		}, 0);
		setTimeout(() => {
			window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
			document.documentElement.scrollTop = 0;
			document.body.scrollTop = 0;
		}, 100);
		
		// Listen for welcome screen dismissal to ensure proper timing
		const handleWelcomeDismissed = () => {
			// Scroll to top again after welcome screen dismisses
			window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
			document.documentElement.scrollTop = 0;
			document.body.scrollTop = 0;
			
			if (projectData.video_is_dark !== undefined) {
				window.dispatchEvent(new CustomEvent('project-video-dark-mode', {
					detail: { isDark: projectData.video_is_dark }
				}));
			}
		};
		
		window.addEventListener('welcome-dismissed', handleWelcomeDismissed);
		
		// Also try immediate dispatch in case welcome is already dismissed
		setTimeout(() => {
			if (projectData.video_is_dark !== undefined) {
				window.dispatchEvent(new CustomEvent('project-video-dark-mode', {
					detail: { isDark: projectData.video_is_dark }
				}));
			}
		}, 100);
		
		return () => {
			window.removeEventListener('welcome-dismissed', handleWelcomeDismissed);
		};
	});
</script>

<svelte:head>
	<title>Art Camp - Creative Studio | {data.title}</title>
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

	<!-- Main Media -->
	 {#key projectData.main}
		{#if projectData.main && projectData.main.length > 0}
			<div class="mb-3 md:mt-0" id="main-media">
				<!-- Single item: full width -->
				{#if projectData.main.length === 1}
					{@const item = projectData.main[0]}
					{#if item.main_video_url}
						<!-- {item.playmode} -->
						<VideoPlayerCustom 
							hlsUrl={item.main_video_url}
							posterImage={item.main_image} 
							classes="w-full h-auto !rounded-none"
							playMode="has-sound"
							controls={true}
							context="main"
							width={item.width || 1920}
							height={item.height || 1080}
							controlsTextClass={controlsTextClass}
						/>
					{:else if item.main_image?.url}
						<PrismicImage 
							field={item.main_image} 
							class="w-full h-auto !rounded-none"
						/>
					{/if}
				<!-- Multiple items: side by side on desktop, stacked on mobile -->
				{:else}
					<div class="flex flex-col md:flex-row gap-2">
						{#each projectData.main as item, index}
							{@const isFirst = index === 0}
							{@const isLast = index === projectData.main.length - 1}
							{@const isMiddle = !isFirst && !isLast}
							
							{@const roundedClasses = (() => {
								// Mobile: no rounded corners
								const baseClasses = 'w-full h-auto';
								
								// If only one item, no rounded corners at all
								if (projectData.main.length === 1) {
									return `${baseClasses} !rounded-none`;
								}
								
								// Desktop: conditional rounded corners for multiple items
								if (projectData.main.length === 2) {
									if (isFirst) return `${baseClasses} !rounded-none md:!rounded-br-lg md:!rounded-tl-none md:!rounded-tr-none md:!rounded-bl-none`;
									if (isLast) return `${baseClasses} !rounded-none md:!rounded-bl-lg md:!rounded-tl-none md:!rounded-tr-none md:!rounded-br-none`;
								} else if (projectData.main.length === 3) {
									if (isFirst) return `${baseClasses} !rounded-none md:!rounded-br-lg md:!rounded-tl-none md:!rounded-tr-none md:!rounded-bl-none`;
									if (isMiddle) return `${baseClasses} !rounded-none md:!rounded-bl-lg md:!rounded-br-lg md:!rounded-tl-none md:!rounded-tr-none`;
									if (isLast) return `${baseClasses} !rounded-none md:!rounded-bl-lg md:!rounded-tl-none md:!rounded-tr-none md:!rounded-br-none`;
								}
								return `${baseClasses} !rounded-none`;
							})()}
							
							
							{#if item.main_video_url}
								<!-- {item.playmode} -->
								<VideoPlayerCustom 
									hlsUrl={item.main_video_url}
									posterImage={item.main_image} 
									classes={roundedClasses}
									playMode="has-sound"
									controls={true}
									context="main"
									width={item.width || 1920}
									height={item.height || 1080}
									controlsTextClass={controlsTextClass}
								/>
							{:else if item.main_image?.url}
								<PrismicImage 
									field={item.main_image} 
									class={roundedClasses}
								/>
							{/if}
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	 {/key}

<div class="mx-auto px-2 paragraph-1 -mt-1">
	<!-- Project Info -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-2 w-full text-primary mb-2">
		<div class="h3 bg-neutral-100 rounded px-4 py-2 h-full">
			{projectData.title}{projectData.client ? `, ${projectData.client}` : ''}
		</div>

		{#if projectData.description}
			<div class="prose prose-lg max-w-none content-text h3 bg-neutral-100 rounded px-4 pt-3 h-full [&_*:last-child]:mb-0">
				<PrismicRichText field={projectData.description} />
			</div>
		{/if}
	</div>

	<!-- Credits -->
	<!-- <Credits credits={projectData.credits} /> -->

	<!-- Content Slices -->
	{#if projectData.slices && projectData.slices.length > 0}
		<SliceZone slices={projectData.slices} {components} />
	{/if}

  <!-- Credits -->
  <div class="hidden md:block">
    <Credits credits={projectData.credits} />
  </div>
  <div class="block md:hidden">
    <CreditsMobile credits={projectData.credits} />
  </div>

	<!-- Related Projects -->
	{#if relatedProjects && relatedProjects.length > 0}
		<div class="">
			<RelatedProjects projects={relatedProjects} />
		</div>
	{/if}
</div>

<style>
	/* Force remove rounded corners for single videos */
	#main-media .rounded-none,
	#main-media [class*="rounded"],
	#main-media * {
		border-radius: 0 !important;
	}
	
	/* Specifically target video containers */
	#main-media > div,
	#main-media > div > div {
		border-radius: 0 !important;
	}
</style>
