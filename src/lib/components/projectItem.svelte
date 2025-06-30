<script lang="ts">
	import type { ProjectsDocument } from '../../prismicio-types';
	import { PrismicImage } from '@prismicio/svelte';
	import VideoPreview from './VideoPreview.svelte';
	import BigWheel from '$lib/components/BigWheel.svelte';

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

	// Make config reactive so it updates when projectTitle changes
	$: config = {
		uiVisible: false,
		globalSettings: {
			containerSizePercent: 60,
			fontSizePercent: 10,
			distancePercent: 1,
			paused: false,
			textColor: "white",
			backgroundColor: "#ffffff",
			transparentBackground: true,
			saveStillTrigger: false,
			startRecording: false,
			stopRecording: false,
			exportResolution: 400,
			useHighResRecording: false,
			fadeInTime: 3,
			fadeOutTime: 2.5,
			pauseTime: 1.5,
			visibleTime: 5,
			manualMode: true,
			triggerFadeIn: false,
			triggerFadeOut: false
		},
		items: [
			{
				text: projectTitle,
				rotationSpeed: 0.5,
				spacingAmplitudePercent: 2,
				spacingSpeed: 0.09,
				rotationStart: 0,
				animationType: 'sin'
			}
		]
	};
</script>

<style>
	/* Override BigWheel's sticky positioning when used as overlay */
	:global(.bigwheel-overlay > div > div) {
		position: static !important;
		top: auto !important;
	}
</style>

<div>
	{#if projectData?.preview && Array.isArray(projectData.preview) && projectData.preview.length > 0 && projectData.preview[0]}		
		{@const preview = projectData.preview[0]}
		{@const imageField = dimension === 'portrait' ? preview?.preview_image_portrait : preview?.preview_image_landscape}
		{@const videoUrl = dimension === 'portrait' ? preview?.preview_video_url_portrait : preview?.preview_video_url_landscape}
		
		<div class="relative">
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
			
			<!-- BigWheel positioned directly over the video/image -->
			<div class="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bigwheel-overlay">
				<BigWheel {config} />
			</div>
		</div>
	{/if}
</div>


