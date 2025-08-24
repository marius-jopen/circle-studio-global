<script lang="ts">
	import type { ProjectsDocument } from '../../prismicio-types';
	import { PrismicImage } from '@prismicio/svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import VideoPlayerSimple from './VideoPlayerSimple.svelte';
	import BigWheel from '$lib/components/BigWheel.svelte';
    import { hoverPreview } from '$lib/stores/preview';

	// Accept either a full ProjectsDocument or a content relationship field
	export let project: ProjectsDocument | any;
	export let dimension: 'landscape' | 'square' | 'portrait' = 'landscape';
	export let clickable: boolean = true;
	export let itemsPerRow: number = 1;
	
	// Mobile detection
	let isMobile = false;
	
	// Get project data - handle both full documents and content relationships
	$: projectData = project.data || project;
	$: projectTitle = projectData?.title || 'Untitled Project';
	$: projectClient = projectData?.client || 'Untitled Client';
	$: projectDate = projectData?.date || '';
	
	// Get aspect ratio class based on dimension
	// On mobile, always use portrait aspect ratio
	$: effectiveDimension = isMobile ? 'portrait' : dimension;
	$: aspectClass = {
		landscape: 'aspect-video',
		square: 'aspect-square',
		portrait: 'aspect-[3/4]'
	}[effectiveDimension];

	// Calculate container size based on dimension and items per row
	function getContainerSizePercent(dimension: string, itemsPerRow: number, isMobile: boolean): number {
		if (isMobile) {
			// Mobile: consistent sizing regardless of items per row
			switch (dimension) {
				case 'landscape': return 90; // Full width landscape
				case 'square': return 85; // Full width square
				case 'portrait': return 80; // Full width portrait
				default: return 85;
			}
		}
		
		// Desktop: original responsive sizing
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
					default: return 55; // Fallback for more items
				}
			default:
				return 60; // Default fallback
		}
	}

	$: containerSizePercent = getContainerSizePercent(dimension, itemsPerRow, isMobile);
	
	// Debug logging to understand sizing issues
	$: {
		if (projectTitle && containerSizePercent) {
			console.log(`🎛️ BIGWHEEL SIZE: "${projectTitle}" | Original: ${dimension} | Effective: ${effectiveDimension} | ${itemsPerRow} items | ${containerSizePercent}% container | Mobile: ${isMobile}`);
			
			// Special debug for portrait 3 cases
			if (effectiveDimension === 'portrait' && itemsPerRow === 3) {
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
	// On mobile, always show static text instead of BigWheel
	$: showText = isMobile ? false : (isMounted && isHovering && initialRenderComplete && !isNavigating);
	
	// Debug logging for showText state
	$: if (projectTitle) {
		console.log(`🔍 ${projectTitle} - isMounted: ${isMounted}, isHovering: ${isHovering}, welcomeDismissed: ${welcomeDismissed}, initialRenderComplete: ${initialRenderComplete}, isNavigating: ${isNavigating}, showText: ${showText}`);
	}
	
	onMount(() => {
		// Check if we're on mobile
		const checkMobile = () => {
			isMobile = window.innerWidth < 768;
		};
		
		// Initial check
		checkMobile();
		
		// Listen for resize events
		window.addEventListener('resize', checkMobile);
		
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
			window.removeEventListener('resize', checkMobile);
		};
	});
	
	// Get project UID for linking
	$: projectUid = project.uid || project.id;
	
	// Random preview selection logic with dimension support
	function filterItemsForDimension(items: any[], dim: 'landscape' | 'square' | 'portrait') {
		if (dim === 'portrait') {
			return items.filter((i) => i?.preview_video_url_portrait || i?.preview_image_portrait?.url);
		}
		// Treat square the same as landscape asset availability
		return items.filter((i) => i?.preview_video_url_landscape || i?.preview_image_landscape?.url);
	}

	$: selectedPreview = (() => {
		const allItems = Array.isArray(projectData?.preview) ? projectData.preview : [];
		if (allItems.length === 0) return null;

		// On mobile, always prefer portrait assets
		const preferred = filterItemsForDimension(allItems, effectiveDimension);
		const candidates = preferred.length > 0 ? preferred : allItems;
		const selectedIndex = Math.floor(Math.random() * candidates.length);
		const selectedItem = candidates[selectedIndex];

		console.log(`🎲 Project "${projectTitle}": Selected preview with dimension ${effectiveDimension} (original: ${dimension}). ` +
			(preferred.length > 0 ? `From ${preferred.length} supported items.` : `No direct match; fell back to any of ${allItems.length}.`));

		return { item: selectedItem, index: selectedIndex };
	})();
</script>

{#if clickable}
	<a href="/work/{projectUid}" class="block " bind:this={projectElement}
	   on:mouseenter={() => {
		   // Use effective dimension for hover preview (portrait on mobile, original on desktop)
		   const hoverVideoUrl = effectiveDimension === 'portrait' ? 
			   selectedPreview?.item?.preview_video_url_portrait : 
			   selectedPreview?.item?.preview_video_url_landscape;
		   const hoverPoster = effectiveDimension === 'portrait' ? 
			   selectedPreview?.item?.preview_image_portrait : 
			   selectedPreview?.item?.preview_image_landscape;
		   
		   if (hoverVideoUrl) {
			   hoverPreview.set({
				   url: hoverVideoUrl,
				   poster: hoverPoster,
				   uid: projectUid
			   });
		   }
	   }}
	   on:mouseleave={() => {
		   hoverPreview.update(s => (s?.uid === projectUid ? { url: null } : s));
	   }}
	>
		<!-- {projectUid} -->
		{#if selectedPreview}		
			{@const preview = selectedPreview.item}
			{@const imageField = effectiveDimension === 'portrait' ? preview?.preview_image_portrait : preview?.preview_image_landscape}
			{@const videoUrl = effectiveDimension === 'portrait' ? preview?.preview_video_url_portrait : preview?.preview_video_url_landscape}
			
			{#if videoUrl}
				<div class="relative" role="group"
					 on:mouseenter={() => isHovering = true}
					 on:mouseleave={() => isHovering = false}>
					<VideoPlayerSimple 
						hlsUrl={videoUrl}
						posterImage={imageField} 
						classes="w-full h-auto rounded object-cover {aspectClass}"
						playbackRate={isHovering ? 0.5 : 1}
					/>
					<!-- BigWheel positioned directly over the video (desktop only) -->
					{#if !isMobile}
						<div 
							class="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bigwheel-overlay"
							class:force-hidden={isNavigating || !initialRenderComplete || !isMounted}
						>
							<BigWheel {config} />
						</div>
					{/if}
					
					<!-- Mobile static text overlay (always visible on mobile) -->
					{#if isMobile}
						<div class="absolute bottom-0 left-0 right-0 p-3 text-white">
							<div class="text-sm">{projectTitle}</div>
							<div class="text-sm">{projectClient}</div>
						</div>
					{/if}
				</div>
			{:else if imageField?.url}
				<div class="relative" role="group"
					 on:mouseenter={() => isHovering = true}
					 on:mouseleave={() => isHovering = false}>
					<PrismicImage 
						field={imageField} 
						class="w-full h-auto rounded {aspectClass} object-cover"
					/>
					<!-- BigWheel positioned directly over the image (desktop only) -->
					{#if !isMobile}
						<div 
							class="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bigwheel-overlay"
							class:force-hidden={isNavigating || !initialRenderComplete || !isMounted}
						>
							<BigWheel {config} />
						</div>
					{/if}
					
					<!-- Mobile static text overlay (always visible on mobile) -->
					{#if isMobile}
						<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
							<div class="text-sm font-medium">{projectTitle}</div>
							<div class="text-xs opacity-80">{projectClient}</div>
						</div>
					{/if}
				</div>
			{/if}
		{/if}
	</a>
{:else}
    <div class="block" bind:this={projectElement} role="group"
	     on:mouseenter={() => {
		     // Use effective dimension for hover preview (portrait on mobile, original on desktop)
		     const hoverVideoUrl = effectiveDimension === 'portrait' ? 
			     selectedPreview?.item?.preview_video_url_portrait : 
			     selectedPreview?.item?.preview_video_url_landscape;
		     const hoverPoster = effectiveDimension === 'portrait' ? 
			     selectedPreview?.item?.preview_image_portrait : 
			     selectedPreview?.item?.preview_image_landscape;
		     
		     if (hoverVideoUrl) {
			     hoverPreview.set({
				     url: hoverVideoUrl,
				     poster: hoverPoster,
				     uid: projectUid
			     });
		     }
	     }}
	     on:mouseleave={() => {
		     hoverPreview.update(s => (s?.uid === projectUid ? { url: null } : s));
	     }}
	>
		
		{#if selectedPreview}		
			{@const preview = selectedPreview.item}
			{@const imageField = effectiveDimension === 'portrait' ? preview?.preview_image_portrait : preview?.preview_image_landscape}
			{@const videoUrl = effectiveDimension === 'portrait' ? preview?.preview_video_url_portrait : preview?.preview_video_url_landscape}
			
			{#if videoUrl}
				<div class="relative" role="group"
					 on:mouseenter={() => isHovering = true}
					 on:mouseleave={() => isHovering = false}>
					<VideoPlayerSimple 
						hlsUrl={videoUrl}
						posterImage={imageField} 
						classes="w-full h-auto rounded object-cover {aspectClass}"
						playbackRate={isHovering ? 0.5 : 1}
					/>
					<!-- BigWheel positioned directly over the video (desktop only) -->
					{#if !isMobile}
						<div 
							class="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bigwheel-overlay"
							class:force-hidden={isNavigating || !initialRenderComplete || !isMounted}
						>
							<BigWheel {config} />
						</div>
					{/if}
					
					<!-- Mobile static text overlay (always visible on mobile) -->
					{#if isMobile}
						<div class="absolute bottom-0 left-0 right-0 p-3 text-white">
							<div class="text-sm font-medium">{projectTitle}</div>
							<div class="text-xs opacity-80">{projectClient}</div>
						</div>
					{/if}
				</div>
			{:else if imageField?.url}
				<div class="relative" role="group"
					 on:mouseenter={() => isHovering = true}
					 on:mouseleave={() => isHovering = false}>
					<PrismicImage 
						field={imageField} 
						class="w-full h-auto rounded {aspectClass} object-cover"
					/>
					<!-- BigWheel positioned directly over the image (desktop only) -->
					{#if !isMobile}
						<div 
							class="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bigwheel-overlay"
							class:force-hidden={isNavigating || !initialRenderComplete || !isMounted}
						>
							<BigWheel {config} />
						</div>
					{/if}
					
					<!-- Mobile static text overlay (always visible on mobile) -->
					{#if isMobile}
						<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
							<div class="text-sm font-medium">{projectTitle}</div>
							<div class="text-xs opacity-80">{projectClient}</div>
						</div>
					{/if}
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
	:global(.bigwheel-overlay > div > div:nth-child(2)) {
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
	
	/* Mobile-specific adjustments */
	@media (max-width: 767px) {
		:global(.bigwheel-overlay > div > div:first-child) {
			transform: scale(0.9) !important;
		}
		
			/* Ensure mobile text overlay is properly positioned and styled */
	:global(.mobile-text-overlay) {
		z-index: 20 !important;
	}
	
	/* Style all mobile text overlays */
	:global([class*="bg-gradient-to-t"][class*="text-white"]) {
		z-index: 20 !important;
	}
	}
</style>