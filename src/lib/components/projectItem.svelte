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
	// Make config reactive so it updates when projectTitle changes
	$: config = {
		uiVisible: false,
		globalSettings: {
			containerSizePercent: 60,
			fontSizePercent: 8,
			distancePercent: 1,
			paused: false,
			textColor: "#ffffff",
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
	
	// Force BigWheel to update when config changes by adding a key
	$: bigWheelKey = JSON.stringify(config);
</script>

<div>
	{#if projectData?.preview && Array.isArray(projectData.preview) && projectData.preview.length > 0 && projectData.preview[0]}		
		{@const preview = projectData.preview[0]}
		{@const imageField = dimension === 'portrait' ? preview?.preview_image_portrait : preview?.preview_image_landscape}
		{@const videoUrl = dimension === 'portrait' ? preview?.preview_video_url_portrait : preview?.preview_video_url_landscape}
		
		{#if videoUrl}
			<div class="relative mb-4">
				<VideoPreview 
					hlsUrl={videoUrl}
					posterImage={imageField} 
					classes="w-full h-auto rounded object-cover {aspectClass}"
				/>
				<!-- BigWheel positioned directly over the video -->
				<div class="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bigwheel-overlay">
					{#key bigWheelKey}
						<BigWheel {config} />
					{/key}
				</div>
			</div>
		{:else if imageField?.url}
			<div class="relative mb-4">
				<PrismicImage 
					field={imageField} 
					class="w-full h-auto rounded {aspectClass} object-cover"
				/>
				<!-- BigWheel positioned directly over the image -->
				<div class="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bigwheel-overlay">
					{#key bigWheelKey}
						<BigWheel {config} />
					{/key}
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	/* Override BigWheel's layout when used as overlay */
	:global(.bigwheel-overlay > div) {
		/* Reset the flex layout */
		display: block !important;
		flex-direction: column !important;
		gap: 0 !important;
		height: auto !important;
		width: auto !important;
		max-width: none !important;
		margin: 0 !important;
		padding: 0 !important;
		position: static !important;
		top: auto !important;
	}
	
	/* Target the canvas container directly */
	:global(.bigwheel-overlay > div > div:first-child) {
		position: static !important;
		top: auto !important;
		flex-shrink: 1 !important;
		margin: 0 auto !important;
	}
	
	/* Hide controls container when used as overlay */
	:global(.bigwheel-overlay > div > div:last-child) {
		display: none !important;
	}
	
	/* Ensure the canvas itself is centered */
	:global(.bigwheel-overlay > div > div:first-child > div) {
		margin: 0 auto !important;
	}
	
	/* Center the overlay container */
	.bigwheel-overlay {
		display: flex !important;
		align-items: center !important;
		justify-content: center !important;
	}
	
	/* Force white text color for BigWheel overlay */
	:global(.bigwheel-overlay text) {
		fill: white !important;
	}
	
	:global(.bigwheel-overlay span) {
		color: white !important;
	}
	
	:global(.bigwheel-overlay div) {
		color: white !important;
	}
	
	:global(.bigwheel-overlay *) {
		color: white !important;
		fill: white !important;
	}
</style>