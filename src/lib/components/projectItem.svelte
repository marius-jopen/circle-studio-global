<script lang="ts">
	import type { ProjectsDocument } from '../../prismicio-types';
	import { PrismicImage } from '@prismicio/svelte';
	import VideoPreview from './VideoPreview.svelte';

	// Accept either a full ProjectsDocument or a content relationship field
	export let project: ProjectsDocument | any;
	export let dimension: 'landscape' | 'square' | 'portrait' = 'landscape';
	
	// Get project data - handle both full documents and content relationships
	$: projectData = project.data || project;
	$: projectTitle = projectData?.title || 'Untitled Project';
	
	// Get aspect ratio class based on dimension
	$: aspectClass = {
		landscape: 'aspect-video',
		square: 'aspect-square',
		portrait: 'aspect-[3/4]'
	}[dimension];
</script>

<div>
	{projectTitle}

	<div>
		{#if projectData?.preview && Array.isArray(projectData.preview) && projectData.preview.length > 0 && projectData.preview[0]}		
			{@const preview = projectData.preview[0]}
			{@const imageField = dimension === 'portrait' ? preview?.preview_image_portrait : preview?.preview_image_landscape}
			{@const videoUrl = dimension === 'portrait' ? preview?.preview_video_url_portrait : preview?.preview_video_url_landscape}
			
			{#if videoUrl}
				<VideoPreview 
					hlsUrl={videoUrl}
					posterImage={imageField} 
					classes="w-full h-auto rounded object-cover mb-4 {aspectClass}"
				/>
			{:else if imageField?.url}
				<PrismicImage 
					field={imageField} 
					class="w-full h-auto rounded {aspectClass} object-cover mb-4"
				/>
			{/if}
		{/if}
	</div>
</div>


