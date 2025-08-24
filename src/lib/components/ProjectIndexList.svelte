<script lang="ts">
	import type { ProjectsDocument } from '../../prismicio-types';
    import { hoverPreview } from '$lib/stores/preview';
    import { get } from 'svelte/store';
    import { onMount } from 'svelte';

	export let allProjects: ProjectsDocument[] = [];
	export let featuredProjectIds: string[] = [];

	// Remove featured projects to avoid duplicates on the home page
	$: remainingProjects = allProjects.filter(p => !featuredProjectIds.includes(p.id));

	// Search functionality
	let searchQuery = '';
	
	$: filteredProjects = searchQuery.trim() === '' 
		? remainingProjects 
		: remainingProjects.filter(project => {
			const query = searchQuery.toLowerCase();
			const client = (project.data.client || '').toLowerCase();
			const title = (project.data.title || '').toLowerCase();
			const tags = (project.tags || []).join(' ').toLowerCase();
			
			// Handle RichTextField for description
			let description = '';
			if (project.data.description && Array.isArray(project.data.description)) {
				description = project.data.description
					.map((item: any) => item.text || '')
					.join(' ')
					.toLowerCase();
			}
			
			return client.includes(query) || 
				   title.includes(query) || 
				   tags.includes(query) || 
				   description.includes(query);
		});

	function getYear(dateStr: string | null | undefined): string {
		if (!dateStr) return '';
		const d = new Date(dateStr as string);
		if (Number.isNaN(d.getTime())) return '';
		return String(d.getFullYear());
	}

	// Sort by date desc, projects without date are pushed to the end
	$: sortedProjects = [...filteredProjects].sort((a, b) => {
		const aTime = a.data?.date ? new Date(a.data.date as string).getTime() : -Infinity;
		const bTime = b.data?.date ? new Date(b.data.date as string).getTime() : -Infinity;
		return bTime - aTime;
	});

	function pickRandomLandscape(project: ProjectsDocument) {
		const items = Array.isArray(project.data?.preview) ? project.data.preview : [];
		const withVideo = items.filter((i: any) => i?.preview_video_url_landscape);
		if (withVideo.length === 0) return null;
		const idx = Math.floor(Math.random() * withVideo.length);
		const item = withVideo[idx];
		return {
			videoUrl: item.preview_video_url_landscape as string,
			poster: item.preview_image_landscape
		};
	}

	// Animation state - track which items are visible
	let visibleItems = new Set<number>();
	
	onMount(() => {
		// Trigger staggered animation after component mounts
		setTimeout(() => {
			sortedProjects.forEach((_, index) => {
				setTimeout(() => {
					visibleItems.add(index);
					visibleItems = visibleItems; // trigger reactivity
				}, index * 50);
			});
		}, 100);
	});
</script>

<div class="flex justify-end items-center w-full pt-[90px]">
	<input
		id="search-input"
		type="text"
		bind:value={searchQuery}
		placeholder="Search projects, clients, tags..."
		class="px-4 pt-2.5 text-neutral-500 hover:text-black placeholder:text-neutral-400 transition-colors duration-400 pb-3 bg-white rounded-3xl w-full max-w-xs outline-none focus:outline-none focus:ring-0 focus:border-black"
	/>
</div>

<div class="divide-y divide-black/10 border-t border-black/10 text-black hover:text-black/25 mt-4">
	{#each sortedProjects as project, index}
		<a href="/work/{project.uid}"
		   class="block py-2 hover:text-black transition-all duration-500 ease-out {visibleItems.has(index) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}"
		   onmouseenter={() => {
			   const p = pickRandomLandscape(project);
			   if (p) hoverPreview.set({ url: p.videoUrl, poster: p.poster, uid: project.uid });
		   }}
		   onmouseleave={() => {
			   const current = get(hoverPreview);
			   if (current?.uid === project.uid) hoverPreview.set({ url: null });
		   }}
		>
			<div class="grid grid-cols-12 items-center gap-2 paragraph-1">
				<div class="col-span-4 text-left tracking-wide">{project.data.client}</div>
				<div class="col-span-4 text-left">{project.data.title}</div>
				<div class="col-span-3 text-left whitespace-nowrap overflow-hidden text-ellipsis">
					{#if project.tags && project.tags.length > 0}
						{project.tags.join(', ')}
					{/if}
				</div>
				<div class="col-span-1 text-right">{getYear(project.data.date)}</div>
			</div>
		</a>
	{/each}
</div>

<style>
	/* Staggered animation for list items */
	div > a {
		transition: opacity 0.6s ease-out, transform 0.6s ease-out;
	}
</style>


