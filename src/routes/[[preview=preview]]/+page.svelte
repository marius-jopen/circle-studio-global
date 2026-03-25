<script lang="ts">
	import { SliceZone } from '@prismicio/svelte';
	import { isFilled, asText } from '@prismicio/client';
	import { components } from '$lib/slices';
	import Logo from '$lib/components/Logo.svelte';
	import ProjectIndex from '$lib/components/ProjectIndex.svelte';
	import ProjectItem from '$lib/components/projectItem.svelte';
	import ProjectItemMobile from '$lib/components/projectItemMobile.svelte';
    import ProjectIndexList from '$lib/components/ProjectIndexList.svelte';
    import { onMount, tick } from 'svelte';
	import { viewMode, initializeViewMode, homeSearchQuery, searchZeroResults } from '$lib/stores';
	import { hoverPreview } from '$lib/stores/preview';

	export let data;
	// Use client-provided initial view mode (from +page.ts) to avoid grid flash on SPA nav
	let initialViewMode = (data?.initialViewMode ?? null) as ('grid' | 'list' | null);
	$: currentView = (initialViewMode ?? $viewMode) as 'grid' | 'list';
	// Toggle: show GlobalPreviewPlayer in grid mode as well
	const SHOW_PREVIEW_IN_GRID = false;
    // Shared search filtering (used on mobile when search input in MobileNav is open)
    $: filteredAllProjects = (() => {
        const query = $homeSearchQuery.trim().toLowerCase();
        if (!query) return data.allProjects;
        return (data?.allProjects ?? []).filter((project) => {
            const client = (project?.data?.client || '').toLowerCase();
            const title = (project?.data?.title || '').toLowerCase();
            const tags = (project?.tags || []).join(' ').toLowerCase();
            const description = (asText(((project?.data as any)?.description) || []) || '').toLowerCase();
            return client.includes(query) || title.includes(query) || tags.includes(query) || description.includes(query);
        });
    })();
    
    // Check if search is active (has non-empty query)
    $: isSearchActive = $homeSearchQuery.trim().length > 0;

	// Clear hover preview when no results or when in grid view (grid doesn't use hover preview)
	$: if (filteredAllProjects.length === 0 || currentView === 'grid') {
		hoverPreview.set({ url: null });
	}

	// Sync zero-results state for header logo (show black when zero)
	$: searchZeroResults.set(filteredAllProjects.length === 0 && isSearchActive);

	// Extract featured project IDs to exclude them from ProjectIndex
	$: featuredProjectIds = (() => {
		const ids = [];
		
		// Add single featured project ID
		if (isFilled.contentRelationship(data.page.data.feature_project)) {
			ids.push(data.page.data.feature_project.id);
		}
		
		// Add featured projects IDs
		if (data.page.data.feature_projects) {
			data.page.data.feature_projects.forEach(projectGroup => {
				if (isFilled.contentRelationship(projectGroup.items)) {
					ids.push(projectGroup.items.id);
				}
			});
		}
		
		return ids;
	})();

	// Track previous view mode to detect changes
	let previousViewMode = $viewMode;
	
	// Mobile detection for featured projects
	let isMobile = false;

	// Map Prismic "size" select values to ProjectItem dimensions
	function mapSizeToDimension(size?: string | null): 'landscape' | 'square' | 'portrait' {
		switch (size) {
			case 'one':
				return 'landscape'; // Full width
			case 'two':
				return 'square';
			case 'three':
				return 'portrait';
			default:
				return 'square';
		}
	}
	
	// Map "size" to Tailwind grid col-span classes (desktop uses 12-col grid)
	function mapSizeToColSpanClasses(size?: string | null): string {
		switch (size) {
			case 'one':
				return 'col-span-1 md:col-span-12';
			case 'two':
				return 'col-span-1 md:col-span-6';
			case 'three':
				return 'col-span-1 md:col-span-4';
			default:
				return 'col-span-1 md:col-span-6';
		}
	}

	// Watch for view mode changes: scroll to top and reset search filter
	$: if (previousViewMode !== $viewMode) {
		previousViewMode = $viewMode;
		window.scrollTo({ top: 0 });
		if (isSearchActive) homeSearchQuery.set('');
	}

	onMount(() => {
		// Mobile detection
		const updateMobile = () => { isMobile = typeof window !== 'undefined' && window.innerWidth < 768; };
		updateMobile();
		window.addEventListener('resize', updateMobile);
		
		// Sync the live store to the intended initial mode first to avoid any flicker,
		// then clear the temporary initialViewMode so the store drives UI afterwards.
		(async () => {
			try {
				if (initialViewMode === 'grid' || initialViewMode === 'list') {
					const { setViewMode } = await import('$lib/stores');
					setViewMode(initialViewMode);
					await tick();
				} else {
					initializeViewMode();
					await tick();
				}
			} finally {
				initialViewMode = null;
			}
		})();
		
		return () => {
			window.removeEventListener('resize', updateMobile);
		};
	});

	// Safely derive text content from Prismic field (supports StructuredText or Text)
	$: homeTextRaw = data?.page?.data?.text;
	$: homeText = Array.isArray(homeTextRaw) ? asText(homeTextRaw) : (typeof homeTextRaw === 'string' ? homeTextRaw : '');

	$: homeTextRawSub = data?.page?.data?.text_sub;
	$: homeTextSub = Array.isArray(homeTextRawSub) ? asText(homeTextRawSub) : (typeof homeTextRawSub === 'string' ? homeTextRawSub : '');

	// Fisher-Yates shuffle algorithm
	function shuffleArray<T>(array: T[]): T[] {
		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	}

	// Collect all projects and create a single shuffled array (shared between single and grid)
	// Use data.page as dependency to ensure it re-runs on every data change
	$: allShuffledProjects = (() => {
		const allProjects: any[] = [];
		const hasOriginalSingleFeature = isFilled.contentRelationship(data?.page?.data?.feature_project);
		
		// Add single featured project if it exists
		if (hasOriginalSingleFeature) {
			allProjects.push(data.page.data.feature_project);
		}
		
		// Add featured projects from the group
		if (data?.page?.data?.feature_projects) {
			data.page.data.feature_projects.forEach(projectGroup => {
				if (isFilled.contentRelationship(projectGroup.items)) {
					allProjects.push(projectGroup.items);
				}
			});
		}
		
		if (allProjects.length === 0) return [];
		
		// Shuffle if toggle is active (only when randomize_features is true)
		const shouldRandomize = Boolean(data?.page?.data?.randomize_features);
		if (shouldRandomize) {
			// Always shuffle when toggle is true - this ensures new random order on each reactive run
			return shuffleArray(allProjects);
		}
		return allProjects;
	})();

	// Extract single feature project (only if it originally existed in CMS)
	$: shuffledFeatureProject = (() => {
		const hasOriginalSingleFeature = isFilled.contentRelationship(data?.page?.data?.feature_project);
		if (!hasOriginalSingleFeature || allShuffledProjects.length === 0) return null;
		return allShuffledProjects[0] || null;
	})();

	// Extract grid projects with preserved size structure
	$: shuffledFeatureProjects = (() => {
		const hasOriginalSingleFeature = isFilled.contentRelationship(data?.page?.data?.feature_project);
		
		if (allShuffledProjects.length === 0) return [];
		
		// Get original size structure from CMS
		const originalSizes = data?.page?.data?.feature_projects?.map(pg => pg.size) || [];
		
		// If there was a single feature, skip first project (it goes in single feature position)
		// Otherwise, use all projects for grid
		const gridProjects = hasOriginalSingleFeature ? allShuffledProjects.slice(1) : allShuffledProjects;
		
		// Map shuffled projects to grid positions with their original sizes
		return gridProjects.map((project, index) => ({
			items: project,
			size: originalSizes[index] || 'two' // Default to 'two' if no size available
		}));
	})();

	
</script>

<!-- Remove the view switch selector from the top-center -->
<!-- <div class="fixed left-1/2 -translate-x-1/2 top-4 z-[60] pointer-events-auto select-none">
    <div class="flex items-center gap-3 font-medium">
        <button
            class="transition-colors hover:text-neutral-900 focus:outline-none"
            class:opacity-40={viewMode !== 'grid'}
            aria-pressed={viewMode === 'grid'}
            onclick={() => setView('grid')}
        >
            Grid
        </button>

        <button
            class="transition-colors hover:text-neutral-900 focus:outline-none"
            class:opacity-40={viewMode !== 'list'}
            aria-pressed={viewMode === 'list'}
            onclick={() => setView('list')}
        >
            List
        </button>
    </div>
</div> -->



{#if currentView === 'grid' && !isSearchActive}
	{#if shuffledFeatureProject}
		<div class="">
			{#if isMobile}
				<ProjectItemMobile square={true} dimension="portrait" project={shuffledFeatureProject} />
			{:else}
				<ProjectItem dimension="landscape" square={true} project={shuffledFeatureProject} enableHoverPreview={false} />
			{/if}
		</div>
	{/if}

	{#if homeText && homeText.trim().length > 0}
		<div class="content-container mb-12 mt-9 text-center text-primary">
			<div class="h1 pb-2 md:py-0">
				{homeText}
			</div>
		</div>
	{/if}
{/if}

<div class="px-2 {isSearchActive && isMobile ? 'mt-0' : shuffledFeatureProject && !isSearchActive ? 'mt-2' : 'mt-2 md:mt-2'}">
	{#if currentView === 'grid' && !isSearchActive}
		{#if shuffledFeatureProjects && shuffledFeatureProjects.length > 0}
			<div class="grid grid-cols-1 md:grid-cols-12 gap-2 pb-2">
				{#each shuffledFeatureProjects as projectGroup}
					{#if isFilled.contentRelationship(projectGroup.items)}
						<div class={mapSizeToColSpanClasses(projectGroup?.size)}>
							{#if isMobile}
								<ProjectItemMobile dimension="portrait" project={projectGroup.items} />
							{:else}
								<ProjectItem dimension={mapSizeToDimension(projectGroup?.size)} project={projectGroup.items} enableHoverPreview={false} />
							{/if}
						</div>
					{/if}
				{/each}
			</div>
		{/if}
	{/if}
	
	{#if currentView === 'grid' && !isSearchActive}
		{#if homeTextSub && homeTextSub.trim().length > 0}
			<div class="content-container mb-12 mt-8.5 text-center text-primary">
				<div class="h1 py-2 md:py-0">
					{homeTextSub}
				</div>
			</div>
		{/if}
	{/if}

	{#if filteredAllProjects.length === 0 && isSearchActive}
		<!-- Zero results: centered black logo + message, no Contact slice -->
		<div class="flex flex-col items-center justify-center min-h-[75vh] py-16">
			<div class="flex flex-col items-center justify-center gap-8">
				<Logo variant="black" rotationSpeed={10} size={320} />
				<p class="text-primary font-medium text-lg">no projects with this name</p>
			</div>
		</div>
	{:else}
		{#if currentView === 'grid' && isSearchActive && isMobile && filteredAllProjects.length > 0}
			<!-- First search result full-width on mobile, same as featured item -->
			<div class="-mx-2 {filteredAllProjects.length === 1 ? 'mb-[12px]' : 'mb-2'}">
				<ProjectItemMobile square={true} dimension="portrait" project={filteredAllProjects[0]} />
			</div>
			<ProjectIndex allProjects={filteredAllProjects.slice(1)} featuredProjectIds={[]} />
		{:else if currentView === 'grid'}
			<ProjectIndex allProjects={filteredAllProjects} featuredProjectIds={isSearchActive ? [] : featuredProjectIds} />
		{:else}
			<ProjectIndexList allProjects={filteredAllProjects} {featuredProjectIds} />
		{/if}

		{#if data.page.data.slices && data.page.data.slices.length > 0}
			<SliceZone slices={data.page.data.slices} {components} />
		{/if}
	{/if}
</div>



