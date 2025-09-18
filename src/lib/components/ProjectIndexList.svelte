<script lang="ts">
	import type { ProjectsDocument } from '../../prismicio-types';
    import { hoverPreview } from '$lib/stores/preview';
    import { get } from 'svelte/store';
    import { onMount } from 'svelte';
    import { homeSearchQuery } from '$lib/stores';

	export let allProjects: ProjectsDocument[] = [];
	export let featuredProjectIds: string[] = [];

	// Mobile detection
	let isMobile = false;

	// Remove featured projects to avoid duplicates on the home page
	$: remainingProjects = allProjects.filter(p => !featuredProjectIds.includes(p.id));

	// Search functionality (shared with MobileNav via store)
	let searchQuery = '';
	$: searchQuery = $homeSearchQuery;
	
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


	function formatYear(year: string | null | undefined): string {
		if (!year) return '';
		return year;
	}

	// Sort by year and month desc, projects without year/month are pushed to the end
	$: sortedProjects = [...filteredProjects].sort((a, b) => {
		const aYear = a.data?.year ? parseInt(a.data.year as string) : -Infinity;
		const bYear = b.data?.year ? parseInt(b.data.year as string) : -Infinity;
		
		// If years are different, sort by year
		if (aYear !== bYear) {
			return bYear - aYear;
		}
		
		// If years are the same, sort by month
		const monthOrder = ["January", "February", "March", "April", "May", "June", 
			"July", "August", "September", "October", "November", "December"];
		const aMonth = a.data?.month ? monthOrder.indexOf(a.data.month as string) : -1;
		const bMonth = b.data?.month ? monthOrder.indexOf(b.data.month as string) : -1;
		
		return bMonth - aMonth;
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
		// Check if we're on mobile
		const checkMobile = () => {
			isMobile = window.innerWidth < 768;
		};
		
		// Initial check
		checkMobile();
		
		// Listen for resize events
		window.addEventListener('resize', checkMobile);
		
		// Trigger staggered animation after component mounts
		setTimeout(() => {
			sortedProjects.forEach((_, index) => {
				setTimeout(() => {
					visibleItems.add(index);
					visibleItems = visibleItems; // trigger reactivity
				}, index * 50);
			});
		}, 100);
		
		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});
</script>

<div class="flex justify-center md:justify-end items-center w-full pt-[180px] md:pt-[90px]">
    <input
        id="search-input"
        type="text"
        bind:value={searchQuery}
        placeholder="Search projects, clients, tags..."
        class="px-4 pt-[9px] text-neutral-500 hover:text-black placeholder:text-neutral-400 transition-colors duration-400 pb-[9px] bg-neutral-100 rounded-3xl w-full max-w-xs outline-none focus:outline-none focus:ring-0 focus:border-black text-xs md:text-base hidden md:block"
    />
</div>

<div class="divide-y divide-black/10 border-t border-black/10 text-black md:hover:text-black/25 mt-4">
	{#each sortedProjects as project, index}
		<a href="/work/{project.uid}"
		   class="block py-2 transition-all duration-500 ease-out {visibleItems.has(index) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} {isMobile ? '' : 'hover:text-black'}"
		   onmouseenter={() => {
			   // Only show hover preview on desktop
			   if (!isMobile) {
				   const p = pickRandomLandscape(project);
				   if (p) hoverPreview.set({ url: p.videoUrl, poster: p.poster, uid: project.uid });
			   }
		   }}
		   onmouseleave={() => {
			   // Only clear hover preview on desktop
			   if (!isMobile) {
				   const current = get(hoverPreview);
				   if (current?.uid === project.uid) hoverPreview.set({ url: null });
			   }
		   }}
		>
					<div class="grid grid-cols-12 items-center gap-2 paragraph-1">
			<div class="col-span-6 md:col-span-4 text-left tracking-wide text-xs md:text-base">{project.data.client}</div>
			<div class="col-span-6 md:col-span-4 text-left text-xs md:text-base">{project.data.title}</div>
			<!-- Tags column - hidden on mobile -->
			<div class="col-span-3 text-left text-xs md:text-base whitespace-nowrap overflow-hidden text-ellipsis hidden md:block">
				{#if project.tags && project.tags.length > 0}
					{project.tags.join(', ')}
				{/if}
			</div>
			<!-- Year column - hidden on mobile -->
			<div class="col-span-1 text-right hidden md:block text-xs md:text-base">{formatYear(project.data.year as string)}</div>
		</div>
		</a>
	{/each}
</div>

<style>
	/* Staggered animation for list items */
	div > a {
		transition: opacity 0.6s ease-out, transform 0.6s ease-out;
	}
	
	/* Mobile-specific adjustments */
	@media (max-width: 767px) {
		/* Ensure proper spacing on mobile */
		.paragraph-1 {
			font-size: 0.875rem;
			line-height: 1.25rem;
		}
		
		/* Adjust grid gap for mobile */
		.grid {
			gap: 0.5rem;
		}
		
		/* Optimize touch experience on mobile */
		div > a {
			cursor: pointer;
			-webkit-tap-highlight-color: transparent;
		}
	}
</style>


