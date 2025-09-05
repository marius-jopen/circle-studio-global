<script lang="ts">
	import { SliceZone, PrismicImage, PrismicRichText, PrismicLink } from '@prismicio/svelte';
	import type { PageProps } from './$types';
	import VideoPlayerCustom from '$lib/components/VideoPlayerCustom.svelte';
	import Credits from '$lib/components/Credits.svelte';
	import RelatedProjects from '$lib/components/RelatedProjects.svelte';
	import { onMount } from 'svelte';

	import { components } from '$lib/slices';

	const { data }: PageProps = $props();
	
	const project = $derived(data.project);
	const projectData = $derived(project.data);
	const relatedProjects = $derived(data.relatedProjects);

	// Calculate controls text class based on number of main items
	let controlsTextClass = $state('h2');
	$effect(() => {
		const mainItemsCount = projectData.main?.length || 0;
		if (mainItemsCount === 1) controlsTextClass = 'h2';
		else if (mainItemsCount === 2) controlsTextClass = 'text-base';
		else controlsTextClass = 'text-sm';
	});

	// Dispatch video_is_dark state to layout when component mounts
	onMount(() => {
		console.log('🔍 Project page mounted');
		console.log('🔍 Full projectData:', projectData);
		console.log('🔍 video_is_dark field:', projectData.video_is_dark);
		console.log('🔍 video_is_dark type:', typeof projectData.video_is_dark);
		console.log('🔍 video_is_dark === true:', projectData.video_is_dark === true);
		console.log('🔍 video_is_dark === false:', projectData.video_is_dark === false);
		
		// Listen for welcome screen dismissal to ensure proper timing
		const handleWelcomeDismissed = () => {
			console.log('🎭 Welcome dismissed, now dispatching dark mode event');
			if (projectData.video_is_dark !== undefined) {
				console.log('🌙 Dispatching dark mode event:', projectData.video_is_dark);
				window.dispatchEvent(new CustomEvent('project-video-dark-mode', {
					detail: { isDark: projectData.video_is_dark }
				}));
			} else {
				console.log('⚠️ video_is_dark field is undefined');
			}
		};
		
		window.addEventListener('welcome-dismissed', handleWelcomeDismissed);
		
		// Also try immediate dispatch in case welcome is already dismissed
		setTimeout(() => {
			if (projectData.video_is_dark !== undefined) {
				console.log('🌙 Immediate dispatch attempt:', projectData.video_is_dark);
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

	<!-- Main Media -->
	{#if projectData.main && projectData.main.length > 0}
		<div class="mb-3" id="main-media">
			<!-- Single item: full width -->
			{#if projectData.main.length === 1}
				{@const item = projectData.main[0]}
				{#if item.main_video_url}
					<!-- {item.playmode} -->
					<VideoPlayerCustom 
						hlsUrl={item.main_video_url}
						posterImage={item.main_image} 
						classes="w-full h-auto rounded-none"
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
						class="w-full h-auto rounded-none"
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
							
							// Desktop: conditional rounded corners
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
						
						<!-- Debug: Log the rounded classes -->
						{console.log(`Item ${index}: roundedClasses = "${roundedClasses}", isFirst=${isFirst}, isLast=${isLast}, isMiddle=${isMiddle}, totalItems=${projectData.main.length}`)}
						
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

<div class="mx-auto px-3 paragraph-1">
	<!-- Project Info -->
	<div class="mb-16 md:mb-32 flex flex-col md:grid md:grid-cols-2 gap-2 w-full">
		<div class="md:col-span-1 pb-12 md:pb-0">
			{projectData.title}{projectData.client ? `, ${projectData.client}` : ''}
		</div>
		{#if projectData.description}
			<div class="prose prose-lg max-w-none content-text">
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
	<Credits credits={projectData.credits} />

	<!-- Related Projects -->
	{#if relatedProjects && relatedProjects.length > 0}
		<div class="mt-16">
			<RelatedProjects projects={relatedProjects} />
		</div>
	{/if}
</div>
