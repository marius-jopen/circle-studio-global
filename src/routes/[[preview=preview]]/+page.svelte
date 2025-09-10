<script lang="ts">
	import { SliceZone } from '@prismicio/svelte';
	import { isFilled } from '@prismicio/client';
	import { components } from '$lib/slices';
	import ProjectIndex from '$lib/components/ProjectIndex.svelte';
	import ProjectItem from '$lib/components/projectItem.svelte';
    import ProjectIndexList from '$lib/components/ProjectIndexList.svelte';
    import GlobalPreviewPlayer from '$lib/components/GlobalPreviewPlayer.svelte';
    import { onMount } from 'svelte';
	import { viewMode, initializeViewMode } from '$lib/stores';

	export let data;

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

	// Watch for view mode changes and scroll to top
	$: if (previousViewMode !== $viewMode) {
		previousViewMode = $viewMode;
		// Scroll to top when view mode changes
		window.scrollTo({ top: 0 });
	}

	onMount(() => {
		// Always check localStorage and set the correct view mode
		const stored = localStorage.getItem('indexViewMode');
		console.log('🏠 Home page - onMount, stored view mode:', stored);
		console.log('🏠 Home page - current viewMode store value:', $viewMode);
		
		if (stored === 'grid' || stored === 'list') {
			console.log('🏠 Home page - setting view mode from localStorage:', stored);
			// Use setViewMode to ensure proper store updates and localStorage sync
			import('$lib/stores').then(({ setViewMode }) => {
				console.log('🏠 Home page - calling setViewMode with:', stored);
				setViewMode(stored as 'grid' | 'list');
				console.log('🏠 Home page - setViewMode completed, new store value:', $viewMode);
			});
		} else {
			console.log('🏠 Home page - no stored view mode, initializing...');
			initializeViewMode();
		}
	});
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

<div class="px-3 mt-12 md:mt-14 ">
	{#if isFilled.contentRelationship(data.page.data.feature_project)}
		<div class="pb-4">
			<ProjectItem dimension="landscape" project={data.page.data.feature_project} />
		</div>
	{/if}

	{#if data.page.data.feature_projects && data.page.data.feature_projects.length > 0}
		<div class="grid grid-cols-2 gap-4">
			{#each data.page.data.feature_projects as projectGroup}
				{#if isFilled.contentRelationship(projectGroup.items)}
					<div class="pb-4">
						<ProjectItem dimension="square" project={projectGroup.items} />
					</div>
				{/if}
			{/each}
		</div>
	{/if}

	{#if $viewMode === 'grid'}
		<ProjectIndex allProjects={data.allProjects} {featuredProjectIds} />
	{:else}
		<ProjectIndexList allProjects={data.allProjects} {featuredProjectIds} />
		<!-- Fixed bottom-right hover preview video - only for list view -->
		<GlobalPreviewPlayer />
	{/if}

	{#if data.page.data.slices && data.page.data.slices.length > 0}
		<SliceZone slices={data.page.data.slices} {components} />
	{/if}
</div>



