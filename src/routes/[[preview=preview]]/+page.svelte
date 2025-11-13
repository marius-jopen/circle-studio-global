<script lang="ts">
	import { SliceZone } from '@prismicio/svelte';
	import { isFilled, asText } from '@prismicio/client';
	import { components } from '$lib/slices';
	import ProjectIndex from '$lib/components/ProjectIndex.svelte';
	import ProjectItem from '$lib/components/projectItem.svelte';
    import ProjectIndexList from '$lib/components/ProjectIndexList.svelte';
    import GlobalPreviewPlayer from '$lib/components/GlobalPreviewPlayer.svelte';
    import { onMount, tick } from 'svelte';
	import { viewMode, initializeViewMode, homeSearchQuery } from '$lib/stores';

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

	// Watch for view mode changes and scroll to top
	$: if (previousViewMode !== $viewMode) {
		previousViewMode = $viewMode;
		// Scroll to top when view mode changes
		window.scrollTo({ top: 0 });
	}

	onMount(async () => {
		// Sync the live store to the intended initial mode first to avoid any flicker,
		// then clear the temporary initialViewMode so the store drives UI afterwards.
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
	});

	// Safely derive text content from Prismic field (supports StructuredText or Text)
	$: homeTextRaw = data?.page?.data?.text;
	$: homeText = Array.isArray(homeTextRaw) ? asText(homeTextRaw) : (typeof homeTextRaw === 'string' ? homeTextRaw : '');

	$: homeTextRawSub = data?.page?.data?.text_sub;
	$: homeTextSub = Array.isArray(homeTextRawSub) ? asText(homeTextRawSub) : (typeof homeTextRawSub === 'string' ? homeTextRawSub : '');

	
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

{#if currentView === 'grid'}
	{#if isFilled.contentRelationship(data.page.data.feature_project)}
		<div class="">
			<ProjectItem dimension="landscape" square={true} project={data.page.data.feature_project} />
		</div>
	{/if}

	{#if homeText && homeText.trim().length > 0}
		<div class="content-container mb-12 mt-10 text-left md:text-center text-sm md:text-base text-primary">
			<div class="h1 py-2 md:py-0">
				{homeText}
			</div>
		</div>
	{/if}
{/if}

<div class="px-3 {isFilled.contentRelationship(data.page.data.feature_project) ? 'mt-2' : 'mt-3 md:mt-12 md:mt-14'}">
	{#if currentView === 'grid'}
		{#if data.page.data.feature_projects && data.page.data.feature_projects.length > 0}
			<div class="grid grid-cols-1 md:grid-cols-12 gap-2 pb-2">
				{#each data.page.data.feature_projects as projectGroup}
					{#if isFilled.contentRelationship(projectGroup.items)}
						<div class={mapSizeToColSpanClasses(projectGroup?.size)}>
							<ProjectItem dimension={mapSizeToDimension(projectGroup?.size)} project={projectGroup.items} />
						</div>
					{/if}
				{/each}
			</div>
		{/if}
	{/if}

	{#if currentView === 'grid'}
		{#if homeTextSub && homeTextSub.trim().length > 0}
			<div class="content-container mb-12 mt-10 text-left md:text-center text-sm md:text-base text-primary">
				<div class="h1 py-2 md:py-0">
					{homeTextSub}
				</div>
			</div>
		{/if}
	{/if}

	{#if currentView === 'grid'}
		<ProjectIndex allProjects={filteredAllProjects} {featuredProjectIds} />
	{:else}
		<ProjectIndexList allProjects={filteredAllProjects} {featuredProjectIds} />
		<!-- Fixed bottom-right hover preview video - only for list view -->
		<GlobalPreviewPlayer />
	{/if}
	{#if currentView === 'grid' && SHOW_PREVIEW_IN_GRID}
		<!-- Optional: show hover preview in grid mode too -->
		<GlobalPreviewPlayer />
	{/if}

	{#if data.page.data.slices && data.page.data.slices.length > 0}
		<SliceZone slices={data.page.data.slices} {components} />
	{/if}
</div>



