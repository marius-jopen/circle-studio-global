<script lang="ts">
	import { SliceZone, PrismicImage, PrismicRichText, PrismicLink } from '@prismicio/svelte';
	import { asText } from '@prismicio/client';
	import { page } from '$app/state';
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

	const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

	// Schema.org CreativeWork JSON-LD. Gives crawlers and language models the facts
	// of the project as data: who made it, for whom, when, and who is credited.
	let projectJsonLd = $derived.by(() => {
		const origin = page.url.origin;
		const d = projectData as any;
		const title = (d?.title || '').trim();
		if (!title) return '';

		const description = (asText(d?.description) || '').replace(/\s+/g, ' ').trim();
		const previews = Array.isArray(d?.preview) ? d.preview : [];
		const image =
			d?.meta_image?.url ||
			previews.map((i: any) => i?.preview_image_landscape?.url).find(Boolean) ||
			previews.map((i: any) => i?.preview_image_portrait?.url).find(Boolean);

		// Credits are groups of labelled people; flatten them to unique contributor names.
		const seen = new Set<string>();
		const contributors: Record<string, unknown>[] = [];
		for (const credit of (d?.credits ?? [])) {
			for (const person of (credit?.person ?? [])) {
				const name = (person?.data?.title || '').trim();
				if (!name || seen.has(name)) continue;
				seen.add(name);
				const personLd: Record<string, unknown> = { '@type': 'Person', name };
				const link = person?.data?.link?.url;
				if (link) personLd.sameAs = link;
				contributors.push(personLd);
			}
		}

		const monthIndex = MONTHS.indexOf(d?.month);
		const datePublished = d?.year
			? monthIndex >= 0
				? `${d.year}-${String(monthIndex + 1).padStart(2, '0')}`
				: String(d.year)
			: null;

		const ld: Record<string, unknown> = {
			'@context': 'https://schema.org',
			'@type': 'CreativeWork',
			name: title,
			url: `${origin}/work/${project.uid}`,
			inLanguage: 'en',
			creator: { '@type': 'Organization', name: 'Art Camp', url: origin }
		};
		if (description) ld.description = description;
		if (image) ld.image = image;
		if (datePublished) ld.datePublished = datePublished;
		if (d?.client) ld.sponsor = { '@type': 'Organization', name: d.client };
		if (contributors.length) ld.contributor = contributors;
		const keywords = [d?.client, d?.year, ...(project.tags ?? [])].filter(Boolean);
		if (keywords.length) ld.keywords = keywords.join(', ');

		const json = JSON.stringify(ld).replace(/</g, '\\u003c');
		return `<script type="application/ld+json">${json}<\/script>`;
	});

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

<!-- Meta tags (og:image, og:title, etc.) are handled by +layout.svelte using page.data -->
<svelte:head>
	{#if projectJsonLd}
		{@html projectJsonLd}
	{/if}
	<meta property="og:type" content="article" />
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
									minimalControls={projectData.main.length >= 3}
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
	<div class="grid grid-cols-1 md:grid-cols-2 gap-0! md:gap-2! w-full text-primary mb-2">
		<h1 class="h3 text-2xl bg-neutral-100 rounded-t md:rounded px-4 pt-[13px] md:pt-2 pb-0 md:pb-2 mb-0! md:mb-2! h-full">
			{projectData.title}{projectData.client ? `, ${projectData.client}` : ''}
		</h1>

		{#if projectData.description}
			<div class="prose prose-lg max-w-none content-text h3 bg-neutral-100 rounded-b md:rounded px-4 pt-3.5 md:pt-3 h-full [&_*:last-child]:mb-0">
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
