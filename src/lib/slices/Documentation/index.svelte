<script lang="ts">
	import type { Content } from '@prismicio/client';
	import type { SliceComponentProps } from '@prismicio/svelte';
	import ProjectItem from '$lib/components/projectItem.svelte';

	type Props = SliceComponentProps<Content.DocumentationSlice>;

	const { slice }: Props = $props();
	
	// Get grid columns class based on items_per_row
	const getGridCols = (itemsPerRow: string) => {
		switch (itemsPerRow) {
			case '1': return 'grid-cols-1';
			case '2': return 'grid-cols-1 md:grid-cols-2';
			case '3': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
			case '4': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
			default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
		}
	};
	
	const gridClass = $derived(getGridCols(slice.primary.items_per_row || '3'));
	
	// Transform items into project-like objects for ProjectItem component
	const transformedProjects = $derived(slice.primary.items?.map((item, index) => ({
		uid: `documentation-item-${index}`,
		data: {
			title: `Documentation Item ${index + 1}`,
			client: 'Documentation',
			preview: [{
				preview_image_landscape: item.image,
				preview_video_url_landscape: item.video_url,
				preview_image_portrait: item.image,
				preview_video_url_portrait: item.video_url
			}]
		}
	})) || []);
</script>

<section 
	data-slice-type={slice.slice_type} 
	data-slice-variation={slice.variation}
	class="container mx-auto px-4 py-8"
>
	{#if transformedProjects.length > 0}
		<div class="grid gap-6 {gridClass}">
			{#each transformedProjects as project}
				<ProjectItem dimension="portrait" {project} />
			{/each}
		</div>
	{/if}
</section>
