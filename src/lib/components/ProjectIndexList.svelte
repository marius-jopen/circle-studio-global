<script lang="ts">
	import type { ProjectsDocument } from '../../prismicio-types';
    import { hoverPreview } from '$lib/stores/preview';
    import { get } from 'svelte/store';

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
</script>

<div class="divide-y divide-black/20">
	{#each sortedProjects as project}
		<a href="/work/{project.uid}"
		   class="block py-2"
		   on:mouseenter={() => {
			   const p = pickRandomLandscape(project);
			   if (p) hoverPreview.set({ url: p.videoUrl, poster: p.poster, uid: project.uid });
		   }}
		   on:mouseleave={() => {
			   const current = get(hoverPreview);
			   if (current?.uid === project.uid) hoverPreview.set({ url: null });
		   }}
		>
			<div class="grid grid-cols-12 items-center">
				<div class="col-span-5 text-left uppercase tracking-wide">{project.data.client}</div>
				<div class="col-span-5 text-center">{project.data.title}</div>
				<div class="col-span-2 text-right">{getYear(project.data.date)}</div>
			</div>
		</a>
	{/each}
</div>


