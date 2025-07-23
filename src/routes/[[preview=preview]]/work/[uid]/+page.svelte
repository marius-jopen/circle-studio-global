<script lang="ts">
	import { SliceZone, PrismicImage, PrismicRichText, PrismicLink } from '@prismicio/svelte';
	import type { PageProps } from './$types';
	import VideoPlayerCustom from '$lib/components/VideoPlayerCustom.svelte';

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

<div class="mx-auto px-3">
	<!-- Main Media -->
	{#if projectData.main && projectData.main.length > 0}
		<div class="mb-12">
			<!-- Single item: full width -->
			{#if projectData.main.length === 1}
				{@const item = projectData.main[0]}
				{#if item.main_video_url}
					<VideoPlayerCustom 
						hlsUrl={item.main_video_url}
						posterImage={item.main_image} 
						classes="w-full h-auto rounded-lg"
						autoplayWithSound={item.playmode === 'autoplay-sound'}
						shouldAutoplay={item.playmode === 'autoplay-muted'}
					/>
				{:else if item.main_image?.url}
					<PrismicImage 
						field={item.main_image} 
						class="w-full h-auto rounded-lg"
					/>
				{/if}
			<!-- Multiple items: side by side -->
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					{#each projectData.main as item}
						{#if item.main_video_url}
							<VideoPlayerCustom 
								hlsUrl={item.main_video_url}
								posterImage={item.main_image} 
								classes="w-full h-auto rounded-lg"
								autoplayWithSound={item.playmode === 'autoplay-sound'}
								shouldAutoplay={item.playmode === 'autoplay-muted'}
							/>
						{:else if item.main_image?.url}
							<PrismicImage 
								field={item.main_image} 
								class="w-full h-auto rounded-lg"
							/>
						{/if}
					{/each}
				</div>
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
						{#if credit.person && credit.person.length > 0}
							<p class="text-gray-600">
								{#each credit.person as person, index}
									<PrismicLink field={person} class="text-blue-600 hover:underline">
										{(person as any).data?.name || `Person ${index + 1}`}
									</PrismicLink>{#if index < credit.person.length - 1},&nbsp;{/if}
								{/each}
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
