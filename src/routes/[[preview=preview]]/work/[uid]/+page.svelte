<script lang="ts">
	import { SliceZone, PrismicImage, PrismicRichText, PrismicLink } from '@prismicio/svelte';
	import type { PageProps } from './$types';
	import VideoPlayerCustom from '$lib/components/VideoPlayerCustom.svelte';
	import Credits from '$lib/components/Credits.svelte';

	import { components } from '$lib/slices';

	const { data }: PageProps = $props();
	
	const project = $derived(data.project);
	const projectData = $derived(project.data);
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
		<div class="mb-3">
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
					/>
				{:else if item.main_image?.url}
					<PrismicImage 
						field={item.main_image} 
						class="w-full h-auto rounded-none"
					/>
				{/if}
			<!-- Multiple items: side by side -->
			{:else}
				<div class="flex flex-row gap-3">
					{#each projectData.main as item}
						{#if item.main_video_url}
							<!-- {item.playmode} -->
							<VideoPlayerCustom 
								hlsUrl={item.main_video_url}
								posterImage={item.main_image} 
								classes="w-full h-auto rounded-none"
								playMode="has-sound"
								controls={true}
							/>
						{:else if item.main_image?.url}
							<PrismicImage 
								field={item.main_image} 
								class="w-full h-auto rounded-none"
							/>
						{/if}
					{/each}
				</div>
			{/if}
		</div>
	{/if}

<div class="mx-auto px-3">
	<!-- Project Info -->
	<div class="mb-32 grid grid-cols-2 gap-2 w-full">
		<div class="col-span-1">
			{projectData.title}{projectData.client ? `, ${projectData.client}` : ''}
		</div>
		{#if projectData.description}
			<div class="prose prose-lg max-w-none">
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
</div>
