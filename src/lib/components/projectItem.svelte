<script lang="ts">
	import type { ProjectsDocument } from '../../prismicio-types';
	import { PrismicImage } from '@prismicio/svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import VideoPlayerCustom from './VideoPlayerCustom.svelte';
	import BigWheel from '$lib/components/BigWheel.svelte';

	// Accept either a full ProjectsDocument or a content relationship field
	export let project: ProjectsDocument | any;
	export let dimension: 'landscape' | 'square' | 'portrait' = 'landscape';
	export let clickable: boolean = true;
	export let itemsPerRow: number = 1;
	
	// Get project data - handle both full documents and content relationships
	$: projectData = project.data || project;
	$: projectTitle = projectData?.title || 'Untitled Project';
	$: projectClient = projectData?.client || 'Untitled Client';
	$: projectDate = projectData?.date || '';
	
	// Get aspect ratio class based on dimension
	$: aspectClass = {
		landscape: 'aspect-video',
		square: 'aspect-square',
		portrait: 'aspect-[3/4]'
	}[dimension];

	// Calculate container size based on dimension and items per row
	function getContainerSizePercent(dimension: string, itemsPerRow: number): number {
		switch (dimension) {
			case 'landscape':
				switch (itemsPerRow) {
					case 1: return 80; // Single landscape - biggest
					case 2: return 50; // Two landscapes side by side
					default: return 50; // Fallback for more items
				}
			case 'square':
				switch (itemsPerRow) {
					case 1: return 70; // Single square
					case 2: return 50; // Two squares side by side
					case 3: return 55; // Three squares
					default: return 35; // Fallback for more items
				}
			case 'portrait':
				switch (itemsPerRow) {
					case 1: return 65; // Single portrait
					case 2: return 60; // Two portraits
					case 3: return 55; // Three portraits
					case 4: return 55; // Four portraits - increased from 45%
					case 5: return 40; // Five portraits - increased from 25%
					default: return 55; // Fallback for more items
				}
			default:
				return 60; // Default fallback
		}
	}

	$: containerSizePercent = getContainerSizePercent(dimension, itemsPerRow);
	
	// Debug logging to understand sizing issues
	$: {
		if (projectTitle && containerSizePercent) {
			console.log(`🎛️ BIGWHEEL SIZE: "${projectTitle}" | ${dimension} | ${itemsPerRow} items | ${containerSizePercent}% container`);
			
			// Special debug for portrait 3 cases
			if (dimension === 'portrait' && itemsPerRow === 3) {
				if (containerSizePercent !== 55) {
					console.error(`❌ PORTRAIT 3 SIZE ERROR: "${projectTitle}" should be 55% but got ${containerSizePercent}%`);
				} else {
					console.log(`✅ PORTRAIT 3 CORRECT: "${projectTitle}" correctly sized at 55%`);
				}
			}
		}
	}

	// Make config reactive so it updates when projectTitle changes
	// Make config reactive so it updates when projectTitle changes
	$: config = {
		uiVisible: false,
		globalSettings: {
			containerSizePercent: containerSizePercent,
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
			fadeInTime: 0.3,
			fadeOutTime: 0.1, // Very fast fade out to hide immediately
			pauseTime: 1.5,
			visibleTime: 5,
			manualMode: true, // Use manual mode for controlled animations
			triggerFadeIn: showText && !isNavigating, // Double check navigation state
			triggerFadeOut: !showText || !initialRenderComplete || isNavigating || !isMounted // Force hidden initially
		},
		items: [
			{
				text: projectTitle,
				rotationSpeed: 0.5,
				spacingAmplitudePercent: 2,
				spacingSpeed: 0.09,
				rotationStart: 0,
				animationType: 'sin'
			},
			{
				text: projectClient,
				rotationSpeed: 0.3,
				spacingAmplitudePercent: 2,
				spacingSpeed: 0.09,
				rotationStart: 180,
				animationType: 'sin'
			},
			{
				text: projectDate,
				rotationSpeed: 0.4,
				spacingAmplitudePercent: 2,
				spacingSpeed: 0.11,
				rotationStart: 250,
				animationType: 'sin'
			}
		]
	};
	
	// Hover state for fade in/out
	let isHovering = false;
	let isMounted = false;
	let welcomeDismissed = false;
	let initialRenderComplete = false;
	let isNavigating = false;
	let projectElement: HTMLElement;
	
	// Check all initial states immediately during script execution (before any rendering)
	if (browser) {
		const hasUserInteracted = sessionStorage.getItem('user-has-interacted') === 'true';
		const navigationState = sessionStorage.getItem('circle-studio-navigating') === 'true';
		
		welcomeDismissed = hasUserInteracted;
		isNavigating = navigationState;
		
		console.log(`🚀 ${projectTitle || 'Project'} script init - hasUserInteracted: ${hasUserInteracted}, isNavigating: ${navigationState}`);
	}
	
	// Check if mouse is already over this element
	function checkInitialHoverState() {
		if (!browser || !projectElement) return;
		
		// Use a simple trick: temporarily add a mouseover listener and trigger a synthetic mouse event
		let hasChecked = false;
		
		const handleMouseOver = () => {
			if (!hasChecked && !isHovering) {
				isHovering = true;
				hasChecked = true;
				console.log(`🎯 ${projectTitle}: Detected pre-existing hover state`);
			}
			projectElement.removeEventListener('mouseover', handleMouseOver);
		};
		
		// Add listener
		projectElement.addEventListener('mouseover', handleMouseOver);
		
		// Check if element is currently hovered by using CSS :hover state
		setTimeout(() => {
			if (!hasChecked) {
				// If no mouseover was detected, check if element matches :hover
				try {
					const isHovered = projectElement.matches(':hover');
					if (isHovered && !isHovering) {
						isHovering = true;
						console.log(`🎯 ${projectTitle}: CSS :hover detected - triggering fade in`);
					}
				} catch (e) {
					// CSS :hover check failed, that's ok
				}
				projectElement.removeEventListener('mouseover', handleMouseOver);
			}
		}, 100);
	}
	
	// Only show text after component is mounted, user hovers, render complete, AND not navigating
	$: showText = isMounted && isHovering && initialRenderComplete && !isNavigating;
	
	// Debug logging for showText state
	$: if (projectTitle) {
		console.log(`🔍 ${projectTitle} - isMounted: ${isMounted}, isHovering: ${isHovering}, welcomeDismissed: ${welcomeDismissed}, initialRenderComplete: ${initialRenderComplete}, isNavigating: ${isNavigating}, showText: ${showText}`);
	}
	
	onMount(() => {
		// Listen for welcome dismissal
		const handleWelcomeDismissed = () => {
			welcomeDismissed = true;
			console.log(`📝 ${projectTitle}: Welcome dismissed, checking for pre-existing hover`);
			// Check if mouse is already over this project when welcome is dismissed
			setTimeout(() => checkInitialHoverState(), 0);
		};
		
		window.addEventListener('welcome-dismissed', handleWelcomeDismissed);
		
		// First, mark as mounted quickly
		setTimeout(() => {
			isMounted = true;
			console.log(`✅ ${projectTitle}: Component mounted`);
		}, 10);
		
		// Then allow initial render to complete (longer delay to prevent any flash)
		setTimeout(() => {
			initialRenderComplete = true;
			console.log(`🎨 ${projectTitle}: Initial render complete`);
		}, 100);
		
		// Clear navigation flag after everything is ready (prevent flash during route changes)
		setTimeout(() => {
			if (isNavigating) {
				sessionStorage.removeItem('circle-studio-navigating');
				isNavigating = false;
				console.log(`🧹 ${projectTitle}: Navigation flag cleared, checking for pre-existing hover`);
				// Check if mouse is already over this project when navigation is cleared
				setTimeout(() => checkInitialHoverState(), 50);
			}
		}, 500);
		
		return () => {
			window.removeEventListener('welcome-dismissed', handleWelcomeDismissed);
		};
	});
	
	// Get project UID for linking
	$: projectUid = project.uid || project.id;
	
	// Random preview selection logic
	$: selectedPreview = (() => {
		if (!projectData?.preview || !Array.isArray(projectData.preview) || projectData.preview.length === 0) {
			return null;
		}
		
		let selectedIndex;
		let selectedItem;
		
		if (projectData.preview.length === 1) {
			// Only one preview item
			selectedIndex = 0;
			selectedItem = projectData.preview[0];
			console.log(`📸 Project "${projectTitle}": Using single preview item (index ${selectedIndex})`);
		} else {
			// Multiple preview items - select randomly
			selectedIndex = Math.floor(Math.random() * projectData.preview.length);
			selectedItem = projectData.preview[selectedIndex];
			console.log(`🎲 Project "${projectTitle}": Randomly selected preview item ${selectedIndex + 1} of ${projectData.preview.length} (index ${selectedIndex})`);
		}
		
		return {
			item: selectedItem,
			index: selectedIndex
		};
	})();
</script>

{#if clickable}
	<a href="/work/{projectUid}" class="block brightness-[95%]" bind:this={projectElement}>
		<!-- {projectUid} -->
		{#if selectedPreview}		
			{@const preview = selectedPreview.item}
			{@const imageField = dimension === 'portrait' ? preview?.preview_image_portrait : preview?.preview_image_landscape}
			{@const videoUrl = dimension === 'portrait' ? preview?.preview_video_url_portrait : preview?.preview_video_url_landscape}
			
			{#if videoUrl}
				<div class="relative" 
					 on:mouseenter={() => isHovering = true}
					 on:mouseleave={() => isHovering = false}>
					<VideoPlayerCustom 
						hlsUrl={videoUrl}
						posterImage={imageField} 
						classes="w-full h-auto rounded object-cover {aspectClass}"
						shouldAutoplay={true}
						hideControls={true}
					/>
					<!-- BigWheel positioned directly over the video -->
					<div 
						class="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bigwheel-overlay"
						class:force-hidden={isNavigating || !initialRenderComplete || !isMounted}
					>
						<BigWheel {config} />
					</div>
				</div>
			{:else if imageField?.url}
				<div class="relative"
					 on:mouseenter={() => isHovering = true}
					 on:mouseleave={() => isHovering = false}>
					<PrismicImage 
						field={imageField} 
						class="w-full h-auto rounded {aspectClass} object-cover"
					/>
					<!-- BigWheel positioned directly over the image -->
					<div 
						class="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bigwheel-overlay"
						class:force-hidden={isNavigating || !initialRenderComplete || !isMounted}
					>
						<BigWheel {config} />
					</div>
				</div>
			{/if}
		{/if}
	</a>
{:else}
	<div class="block" bind:this={projectElement}>
		
		{#if selectedPreview}		
			{@const preview = selectedPreview.item}
			{@const imageField = dimension === 'portrait' ? preview?.preview_image_portrait : preview?.preview_image_landscape}
			{@const videoUrl = dimension === 'portrait' ? preview?.preview_video_url_portrait : preview?.preview_video_url_landscape}
			
			{#if videoUrl}
				<div class="relative" 
					 on:mouseenter={() => isHovering = true}
					 on:mouseleave={() => isHovering = false}>
					<VideoPlayerCustom 
						hlsUrl={videoUrl}
						posterImage={imageField} 
						classes="w-full h-auto rounded object-cover {aspectClass}"
						shouldAutoplay={true}
						hideControls={true}
					/>
					<!-- BigWheel positioned directly over the video -->
					<div 
						class="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bigwheel-overlay"
						class:force-hidden={isNavigating || !initialRenderComplete || !isMounted}
					>
						<BigWheel {config} />
					</div>
				</div>
			{:else if imageField?.url}
				<div class="relative"
					 on:mouseenter={() => isHovering = true}
					 on:mouseleave={() => isHovering = false}>
					<PrismicImage 
						field={imageField} 
						class="w-full h-auto rounded {aspectClass} object-cover"
					/>
					<!-- BigWheel positioned directly over the image -->
					<div 
						class="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bigwheel-overlay"
						class:force-hidden={isNavigating || !initialRenderComplete || !isMounted}
					>
						<BigWheel {config} />
					</div>
				</div>
			{/if}
		{/if}
	</div>
{/if}

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
	
	/* Force hide BigWheel overlay during navigation and initialization */
	.bigwheel-overlay.force-hidden {
		visibility: hidden !important;
		opacity: 0 !important;
		pointer-events: none !important;
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