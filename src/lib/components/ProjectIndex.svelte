<script lang="ts">
	import type { ProjectsDocument } from '../../prismicio-types';
	import ProjectItem from './projectItem.svelte';

	export let allProjects: ProjectsDocument[] = [];
	export let featuredProjectIds: string[] = [];

	// Filter out featured projects to show only remaining projects
	$: remainingProjects = allProjects.filter(project => !featuredProjectIds.includes(project.id));
</script>

<div>
	{#if remainingProjects.length > 0}
		<div class="grid grid-cols-3 gap-4">
			{#each remainingProjects as project}
				<ProjectItem dimension="portrait" {project} />
			{/each}
		</div>
	{/if}
</div>


