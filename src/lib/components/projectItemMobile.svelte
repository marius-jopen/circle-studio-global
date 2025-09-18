<script lang="ts">
	import type { ProjectsDocument } from '../../prismicio-types';
	import { PrismicImage } from '@prismicio/svelte';
	import { onMount } from 'svelte';
	import VideoPlayerMobile from './VideoPlayerMobile.svelte';

	export let project: ProjectsDocument | any;
export let dimension: 'landscape' | 'square' | 'portrait' = 'portrait';
export let itemsPerRow: number = 1;
	export let clickable: boolean = true;

	let projectElement: HTMLElement;
	let isInView = false;
	let io: IntersectionObserver | null = null;

	$: projectData = project.data || project;
	$: projectUid = project.uid || project.id;
	$: projectTitle = projectData?.title || 'Untitled Project';
$: projectClient = projectData?.client || 'Untitled Client';

	function filterItemsForDimension(items: any[], dim: 'landscape' | 'square' | 'portrait') {
		if (dim === 'portrait') {
			return items.filter((i) => i?.preview_video_url_portrait || i?.preview_image_portrait?.url);
		}
		return items.filter((i) => i?.preview_video_url_landscape || i?.preview_image_landscape?.url);
	}

	$: selectedPreview = (() => {
		const allItems = Array.isArray(projectData?.preview) ? projectData.preview : [];
		if (allItems.length === 0) return null;
		const preferred = filterItemsForDimension(allItems, 'portrait');
		const candidates = preferred.length > 0 ? preferred : allItems;
		const hash = (projectData?.id || '').split('').reduce((a: number, b: string) => ((a << 5) - a + b.charCodeAt(0)) & a, 0);
		const index = Math.abs(hash) % candidates.length;
		return { item: candidates[index], index };
	})();

	onMount(() => {
		const setupIO = () => {
			if (!projectElement) return;
			if (io) { try { io.disconnect(); } catch {}
				io = null; }
			io = new IntersectionObserver((entries) => {
				for (const entry of entries) {
					isInView = entry.isIntersecting || entry.intersectionRatio > 0;
				}
			}, { root: null, rootMargin: '0px 0px', threshold: 0.1 });
			io.observe(projectElement);
		};
		setupIO();
		return () => { if (io) { try { io.disconnect(); } catch {} io = null; } };
	});
</script>


{#if clickable}
	<a href="/work/{projectUid}" class="block" bind:this={projectElement}>
		{#if selectedPreview}
			{@const preview = selectedPreview.item}
			{@const videoUrl = preview?.preview_video_url_portrait}
			{@const imageField = preview?.preview_image_portrait}

			{#if videoUrl}
				{#if isInView}
					<div class="relative brightness-[95%] rounded overflow-hidden bg-black" role="group">
					<VideoPlayerMobile hlsUrl={videoUrl} posterImage={imageField} classes="w-full h-auto rounded object-cover transition-all duration-300 aspect-[3/4]" inView={isInView} />
						<div class="absolute bottom-0 left-0 right-0 p-3 text-white">
							<div class="text-sm">{projectTitle}</div>
							<div class="text-sm">{projectClient}</div>
						</div>
					</div>
				{:else}
					<div class="relative brightness-[95%] rounded overflow-hidden bg-white" role="group">
						{#if imageField?.url}
							<PrismicImage field={imageField} class="w-full h-auto rounded overflow-hidden transition-all duration-300 aspect-[3/4] object-cover" />
						{:else}
							<div class="aspect-[3/4] bg-black"></div>
						{/if}
						<div class="absolute bottom-0 left-0 right-0 p-3 text-white">
							<div class="text-sm font-medium">{projectTitle}</div>
							<div class="text-sm opacity-60">{projectClient}</div>
						</div>
					</div>
				{/if}
			{:else}
					<div class="relative brightness-[95%] rounded overflow-hidden bg-white" role="group">
					{#if imageField?.url}
						<PrismicImage field={imageField} class="w-full h-auto rounded overflow-hidden transition-all duration-300 aspect-[3/4] object-cover" />
					{:else}
						<div class="aspect-[3/4] bg-black"></div>
					{/if}
					<div class="absolute bottom-0 left-0 right-0 p-3 text-white">
						<div class="text-sm font-medium">{projectTitle}</div>
						<div class="text-sm opacity-60">{projectClient}</div>
					</div>
				</div>
			{/if}
		{:else}
			<div class="relative brightness-[95%] rounded overflow-hidden bg-black aspect-[3/4]" role="group">
				<div class="absolute bottom-0 left-0 right-0 p-3 text-white">
					<div class="text-sm font-medium">{projectTitle}</div>
					<div class="text-sm opacity-60">{projectClient}</div>
				</div>
			</div>
		{/if}
	</a>
{:else}
	<div class="block" bind:this={projectElement}>
		{#if selectedPreview}
			{@const preview = selectedPreview.item}
			{@const videoUrl = preview?.preview_video_url_portrait}
			{@const imageField = preview?.preview_image_portrait}

			{#if videoUrl}
				{#if isInView}
					<div class="relative rounded overflow-hidden bg-black" role="group">
					<VideoPlayerMobile hlsUrl={videoUrl} posterImage={imageField} classes="w-full h-auto rounded object-cover aspect-[3/4]" inView={isInView} />
						<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
							<div class="text-sm font-medium">{projectTitle}</div>
							<div class="text-xs opacity-80">{projectClient}</div>
						</div>
					</div>
				{:else}
					<div class="relative rounded overflow-hidden bg-white" role="group">
						{#if imageField?.url}
							<PrismicImage field={imageField} class="w-full h-auto rounded object-cover aspect-[3/4]" />
						{:else}
							<div class="aspect-[3/4] bg-black"></div>
						{/if}
						<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
							<div class="text-sm font-medium">{projectTitle}</div>
							<div class="text-xs opacity-80">{projectClient}</div>
						</div>
					</div>
				{/if}
			{:else}
					<div class="relative rounded overflow-hidden bg-white" role="group">
					{#if imageField?.url}
						<PrismicImage field={imageField} class="w-full h-auto rounded object-cover aspect-[3/4]" />
					{:else}
						<div class="aspect-[3/4] bg-black"></div>
					{/if}
					<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
						<div class="text-sm font-medium">{projectTitle}</div>
						<div class="text-xs opacity-80">{projectClient}</div>
					</div>
				</div>
			{/if}
		{:else}
			<div class="relative rounded overflow-hidden bg-black aspect-[3/4]" role="group">
				<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
					<div class="text-sm font-medium">{projectTitle}</div>
					<div class="text-xs opacity-80">{projectClient}</div>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	/* keep minimal */
</style>


