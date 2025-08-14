<script lang="ts">
	import type { ProjectsDocument } from '../../prismicio-types';

	export let allProjects: ProjectsDocument[] = [];
	export let featuredProjectIds: string[] = [];

	// Remove featured projects to avoid duplicates on the home page
	$: remainingProjects = allProjects.filter(p => !featuredProjectIds.includes(p.id));

	function getYear(dateStr: string | null | undefined): string {
		if (!dateStr) return '';
		const d = new Date(dateStr as string);
		if (Number.isNaN(d.getTime())) return '';
		return String(d.getFullYear());
	}

	// Sort by date desc, projects without date are pushed to the end
	$: sortedProjects = [...remainingProjects].sort((a, b) => {
		const aTime = a.data?.date ? new Date(a.data.date as string).getTime() : -Infinity;
		const bTime = b.data?.date ? new Date(b.data.date as string).getTime() : -Infinity;
		return bTime - aTime;
	});
</script>

<div class="divide-y divide-black/20">
	{#each sortedProjects as project}
		<a href="/work/{project.uid}" class="block py-2">
			<div class="grid grid-cols-12 items-center">
				<div class="col-span-5 text-left uppercase tracking-wide">{project.data.client}</div>
				<div class="col-span-5 text-center">{project.data.title}</div>
				<div class="col-span-2 text-right">{getYear(project.data.date)}</div>
			</div>
		</a>
	{/each}
</div>


