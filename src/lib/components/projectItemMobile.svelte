<script lang="ts">
	import type { ProjectsDocument } from '../../prismicio-types';
	import { PrismicImage } from '@prismicio/svelte';
	import { onMount } from 'svelte';
	import VideoPlayerMobile from './VideoPlayerMobile.svelte';

	export let project: ProjectsDocument | any;
export let dimension: 'landscape' | 'square' | 'portrait' = 'portrait';
export const itemsPerRow: number = 1;
	export let positionInRow: number = 0; // Position in the row (for consistency with ProjectItem)
	export let clickable: boolean = true;
	export let square: boolean = false;

	let projectElement: HTMLElement;
	let isInView = false;
	let io: IntersectionObserver | null = null;

	$: projectData = project.data || project;
	$: projectUid = project.uid || project.id;
	$: projectTitle = projectData?.title || 'Untitled Project';
$: projectClient = projectData?.client || 'Untitled Client';
	
	// Corner style class based on square prop
	$: cornerClass = square ? '' : 'rounded';

	function filterItemsForDimension(items: any[], dim: 'landscape' | 'square' | 'portrait') {
		if (dim === 'portrait') {
			return items.filter((i) => i?.preview_video_url_portrait || i?.preview_image_portrait?.url);
		}
		return items.filter((i) => i?.preview_video_url_landscape || i?.preview_image_landscape?.url);
	}

	// Store the randomly selected preview per project
	let selectedPreviewItem: any = null;
	let lastProjectId: string | null = null;

	// Randomly select a preview video when project data is available
	$: if (projectData && projectUid) {
		const allItems = Array.isArray(projectData?.preview) ? projectData.preview : [];
		const currentProjectId = projectData?.id || projectUid || '';
		const projectChanged = currentProjectId !== lastProjectId;
		
		if (allItems.length === 0) {
			selectedPreviewItem = null;
			lastProjectId = currentProjectId;
		} else {
			const preferred = filterItemsForDimension(allItems, 'portrait');
			const candidates = preferred.length > 0 ? preferred : allItems;
			
			// Re-select if project changed or we don't have a selection yet
			if (projectChanged || selectedPreviewItem === null) {
				// Use Math.random() for truly random selection on each page load
				const randomIndex = Math.floor(Math.random() * candidates.length);
				selectedPreviewItem = candidates[randomIndex];
				lastProjectId = currentProjectId;
			}
		}
	}

	$: selectedPreview = selectedPreviewItem ? { item: selectedPreviewItem, index: 0 } : null;

	onMount(() => {
		const setupIO = () => {
			if (!projectElement) return;
			if (io) { try { io.disconnect(); } catch {}
				io = null; }
			
			// Check if element is already in viewport immediately
			const checkInitialView = () => {
				if (!projectElement) return;
				const rect = projectElement.getBoundingClientRect();
				const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
				if (isVisible) {
					isInView = true;
				}
			};
			
			// Check immediately
			checkInitialView();
			
			io = new IntersectionObserver((entries) => {
				for (const entry of entries) {
					isInView = entry.isIntersecting || entry.intersectionRatio > 0;
				}
			}, { root: null, rootMargin: '0px 0px', threshold: 0.1 });
			io.observe(projectElement);
			
			// Also check after a short delay to catch any timing issues
			setTimeout(checkInitialView, 100);
		};
		setupIO();
		return () => { if (io) { try { io.disconnect(); } catch {} io = null; } };
	});
</script>


{#if clickable}
    <a href="/work/{projectUid}" class="block" bind:this={projectElement} data-sveltekit-preload-code data-sveltekit-preload-data>
		{#if selectedPreview}
			{@const preview = selectedPreview.item}
			{@const videoUrl = preview?.preview_video_url_portrait}
			{@const imageField = preview?.preview_image_portrait}

			{#if videoUrl}
				{#if isInView}
					<div class="relative brightness-[95%] {cornerClass} overflow-hidden bg-black" role="group">
					<VideoPlayerMobile hlsUrl={videoUrl} posterImage={imageField} classes="w-full h-auto object-cover transition-all duration-300 aspect-[3/4]" inView={isInView} square={square} />
						<div class="absolute bottom-0 left-0 right-0 p-3 text-white">
							<div class="text-xl">{projectTitle}</div>
							<div class="text-xl  opacity-60">{projectClient}</div>
						</div>
					</div>
				{:else}
					<div class="relative brightness-[95%] {cornerClass} overflow-hidden bg-white" role="group">
						{#if imageField?.url}
							<PrismicImage field={imageField} class="w-full h-auto {cornerClass} overflow-hidden transition-all duration-300 aspect-[3/4] object-cover" />
						{:else}
							<div class="aspect-[3/4] bg-black"></div>
						{/if}
						<div class="absolute bottom-0 left-0 right-0 p-3 text-white">
							<div class="text-xl font-medium">{projectTitle}</div>
							<div class="text-xl opacity-60">{projectClient}</div>
						</div>
					</div>
				{/if}
			{:else}
					<div class="relative brightness-[95%] {cornerClass} overflow-hidden bg-white" role="group">
					{#if imageField?.url}
						<PrismicImage field={imageField} class="w-full h-auto {cornerClass} overflow-hidden transition-all duration-300 aspect-[3/4] object-cover" />
					{:else}
						<div class="aspect-[3/4] bg-black"></div>
					{/if}
					<div class="absolute bottom-0 left-0 right-0 p-3 text-white">
						<div class="text-xl font-medium">{projectTitle}</div>
						<div class="text-xl opacity-60">{projectClient}</div>
					</div>
				</div>
			{/if}
		{:else}
			<div class="relative brightness-[95%] {cornerClass} overflow-hidden bg-black aspect-[3/4]" role="group">
				<div class="absolute bottom-0 left-0 right-0 p-3 text-white">
					<div class="text-xl font-medium">{projectTitle}</div>
					<div class="text-xl opacity-60">{projectClient}</div>
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
					<div class="relative {cornerClass} overflow-hidden bg-black" role="group">
					<VideoPlayerMobile hlsUrl={videoUrl} posterImage={imageField} classes="w-full h-auto object-cover aspect-[3/4]" inView={isInView} square={square} />
						<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
							<div class="text-xl font-medium">{projectTitle}</div>
							<div class="text-xl opacity-80">{projectClient}</div>
						</div>
					</div>
				{:else}
					<div class="relative {cornerClass} overflow-hidden bg-white" role="group">
						{#if imageField?.url}
							<PrismicImage field={imageField} class="w-full h-auto {cornerClass} object-cover aspect-[3/4]" />
						{:else}
							<div class="aspect-[3/4] bg-black"></div>
						{/if}
						<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
							<div class="text-xl font-medium">{projectTitle}</div>
							<div class="text-xl opacity-80">{projectClient}</div>
						</div>
					</div>
				{/if}
			{:else}
					<div class="relative {cornerClass} overflow-hidden bg-white" role="group">
					{#if imageField?.url}
						<PrismicImage field={imageField} class="w-full h-auto {cornerClass} object-cover aspect-[3/4]" />
					{:else}
						<div class="aspect-[3/4] bg-black"></div>
					{/if}
					<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
						<div class="text-xl font-medium">{projectTitle}</div>
						<div class="text-xl opacity-80">{projectClient}</div>
					</div>
				</div>
			{/if}
		{:else}
			<div class="relative {cornerClass} overflow-hidden bg-black aspect-[3/4]" role="group">
				<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
					<div class="text-xl font-medium">{projectTitle}</div>
					<div class="text-xl opacity-80">{projectClient}</div>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	/* keep minimal */
</style>


