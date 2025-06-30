<script lang="ts">
	import { SliceZone } from '@prismicio/svelte';
	import { isFilled } from '@prismicio/client';
	import { components } from '$lib/slices';
	import ProjectIndex from '$lib/components/ProjectIndex.svelte';
	import ProjectItem from '$lib/components/projectItem.svelte';

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
</script>

<div>
	{#if isFilled.contentRelationship(data.page.data.feature_project)}
		<ProjectItem project={data.page.data.feature_project} />
	{/if}

	{#if data.page.data.feature_projects && data.page.data.feature_projects.length > 0}
		{#each data.page.data.feature_projects as projectGroup}
			{#if isFilled.contentRelationship(projectGroup.items)}
				<ProjectItem project={projectGroup.items} />
			{/if}
		{/each}
	{/if}

	<ProjectIndex allProjects={data.allProjects} {featuredProjectIds} />

	{#if data.page.data.slices && data.page.data.slices.length > 0}
		<SliceZone slices={data.page.data.slices} {components} />
	{/if}
</div>



