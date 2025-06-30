<script lang="ts">
	import type { ProjectsDocument } from '../../prismicio-types';

	// Accept either a full ProjectsDocument or a content relationship field
	export let project: ProjectsDocument | any;
	
	// Get project data - handle both full documents and content relationships
	$: projectData = project.data || project;
	$: projectTitle = projectData?.title || 'Untitled Project';
</script>

<div>
	{projectTitle}

	{#if projectData?.preview && Array.isArray(projectData.preview) && projectData.preview.length > 0 && projectData.preview[0]}		
		{@const preview = projectData.preview[0]}
		{#if preview?.preview_image_landscape?.url}
			<img 
				src={preview.preview_image_landscape.url} 
				alt={preview.preview_image_landscape.alt || projectTitle}
				class="w-full h-auto rounded aspect-video object-cover mb-4"
			/>
		{/if}
		
		{#if preview?.preview_video_url_landscape}
			<video controls class="w-full h-auto rounded aspect-video object-cover mb-4">
				<source src={preview.preview_video_url_landscape} type="video/mp4">
				Your browser does not support the video tag.
			</video>
		{/if}
	{/if}
</div>


