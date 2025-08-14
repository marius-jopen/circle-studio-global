<script lang="ts">
	import { SliceZone } from '@prismicio/svelte';
	import { isFilled } from '@prismicio/client';
	import { components } from '$lib/slices';
	import ProjectIndex from '$lib/components/ProjectIndex.svelte';
	import ProjectItem from '$lib/components/projectItem.svelte';
    import ProjectIndexList from '$lib/components/ProjectIndexList.svelte';
    import GlobalPreviewPlayer from '$lib/components/GlobalPreviewPlayer.svelte';

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

	// UI state: switch between grid (ProjectIndex) and list (ProjectIndexList)
	let viewMode: 'grid' | 'list' = 'grid';
</script>

<!-- Minimal view switch at top-center, styled like navigation -->
<div class="fixed left-1/2 -translate-x-1/2 top-4 z-[60] pointer-events-auto select-none">
    <div class="flex items-center gap-3 font-medium">
        <button
            class="transition-colors hover:text-gray-900 focus:outline-none"
            class:opacity-40={viewMode !== 'grid'}
            aria-pressed={viewMode === 'grid'}
            onclick={() => (viewMode = 'grid')}
        >
            Grid
        </button>

		<button
            class="transition-colors hover:text-gray-900 focus:outline-none"
            class:opacity-40={viewMode !== 'list'}
            aria-pressed={viewMode === 'list'}
            onclick={() => (viewMode = 'list')}
        >
            List
        </button>
    </div>
</div>

<div class="px-3 mt-20">
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

	{#if viewMode === 'grid'}
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



