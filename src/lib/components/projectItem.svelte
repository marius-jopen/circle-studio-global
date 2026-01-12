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
	export let positionInRow: number = 0; // Position in the row (0 = first, 1 = second, etc.)
	// If true, do not apply rounded corners to media
	export let square: boolean = false;
	
	// ========================================
	// 🎛️ MOBILE VIDEO CONTROL - TOGGLE HERE
	// ========================================
	// Set to false to disable videos on mobile (shows images only)
	// Set to true to enable videos on mobile
	const ENABLE_VIDEOS_ON_MOBILE = false;
	// ========================================
	
	// ========================================
	// 🎛️ CIRCLE TEXT TRUNCATION - TOGGLE HERE
	// ========================================
	// Truncation lengths based on circle type (outer vs inner)
	const TRUNCATION_LENGTHS = {
		outerCircle: 40,  // Outer circle (first item in config - projectTitle)
		innerCircle: 27   // Inner circle (second item in config - projectClient)
	};
	// Default fallback length for any additional circles
	const DEFAULT_TRUNCATION_LENGTH = 27;
	// ========================================
	
	// Mobile detection
	let isMobile = false;
	
	// Function to truncate text with ellipsis
	function truncateText(text: string, maxLength: number): string {
		if (!text || text.length <= maxLength) return text;
		return text.substring(0, maxLength) + '...';
	}
	
	// Get project data - handle both full documents and content relationships
	$: projectData = project.data || project;
	$: projectTitleRaw = projectData?.title || 'Untitled Project';
	$: projectClientRaw = projectData?.client || 'Untitled Client';
	$: projectDateRaw = projectData?.date || '';
	
	// Truncate text for circle display based on circle type
	// Outer circle (projectTitle) gets 40 chars, inner circle (projectClient) gets 10 chars
	$: projectTitle = truncateText(projectTitleRaw, TRUNCATION_LENGTHS.outerCircle);
	$: projectClient = truncateText(projectClientRaw, TRUNCATION_LENGTHS.innerCircle);
	$: projectDate = truncateText(projectDateRaw, DEFAULT_TRUNCATION_LENGTH);
	
	// Get aspect ratio class based on dimension
	// On mobile, always use portrait aspect ratio
	$: effectiveDimension = isMobile ? 'portrait' : dimension;
	$: aspectClass = {
		landscape: 'aspect-video',
		square: 'aspect-square',
		portrait: 'aspect-[3/4]'
	}[effectiveDimension];

	// Corner style class based on square prop
	$: cornerClass = square ? '' : 'rounded';

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
					case 1: return 110; // Single landscape - biggest
					case 2: return 40; // Two landscapes side by side
					default: return 50; // Fallback for more items
				}
			case 'square':
				switch (itemsPerRow) {
					case 1: return 80; // Single square
					case 2: return 80; // Two squares side by side
					case 3: return 65; // Three squares
					default: return 35; // Fallback for more items
				}
			case 'portrait':
				switch (itemsPerRow) {
					case 1: return 65; // Single portrait
					case 2: return 60; // Two portraits
					case 3: return 70; // Three portraits
					case 4: return 50; // Four portraits - increased from 45%
					default: return 50; // Fallback for more items
				}
			default:
				return 60; // Default fallback
		}
	}

	$: containerSizePercent = getContainerSizePercent(dimension, itemsPerRow, isMobile);

	// Make config reactive so it updates when projectTitle changes
	// Make config reactive so it updates when projectTitle changes
	$: config = {
		uiVisible: false,
		globalSettings: {
			containerSizePercent: containerSizePercent,
			fontSizePercent: 10,
			distancePercent: 1.3,
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
			triggerFadeIn: isHovering && !isNavigating, // Only fade in when hovering and not navigating
			triggerFadeOut: (!isHovering && hasEverHovered) || isNavigating, // Fade out when leaving hover (only after having hovered) or during navigation
			startInvisible: true // Start invisible, only show on hover
		},
		items: [
			{
				text: projectTitle,
				rotationSpeed: 0.5,
				spacingAmplitudePercent: 1.1,
				spacingSpeed: 0.09,
				rotationStart: 0,
				animationType: 'sin'
			},
			{
				text: projectClient,
				rotationSpeed: 0.3,
				spacingAmplitudePercent: 1.1,
				spacingSpeed: 0.03,
				rotationStart: 90,
				animationType: 'sin'
			},
			{
				text: projectDate,
				rotationSpeed: 0.4,
				spacingAmplitudePercent: 1.1,
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
	let hasEverHovered = false; // Track if user has ever hovered over this item
	
	// Check all initial states immediately during script execution (before any rendering)
	if (browser) {
		const hasUserInteracted = sessionStorage.getItem('user-has-interacted') === 'true';
		const navigationState = sessionStorage.getItem('circle-studio-navigating') === 'true';
		
		welcomeDismissed = hasUserInteracted;
		isNavigating = navigationState;
		
		// Clear navigation state immediately if it's set, as we're now on a new page
		if (isNavigating) {
			sessionStorage.removeItem('circle-studio-navigating');
			isNavigating = false;
		}
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
			// Check if mouse is already over this project when welcome is dismissed
			setTimeout(() => checkInitialHoverState(), 0);
		};
		
		window.addEventListener('welcome-dismissed', handleWelcomeDismissed);
		
		// First, mark as mounted quickly
		setTimeout(() => {
			isMounted = true;
		}, 10);
		
		// Then allow initial render to complete (longer delay to prevent any flash)
		setTimeout(() => {
			initialRenderComplete = true;
		}, 100);
		
		// Check for pre-existing hover state after everything is ready
		setTimeout(() => {
			// Check if mouse is already over this project
			setTimeout(() => checkInitialHoverState(), 50);
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

	// Store the randomly selected preview per project
	let selectedPreviewItem: any = null;
	let lastProjectId: string | null = null;
	let lastEffectiveDimension: 'landscape' | 'square' | 'portrait' | null = null;

	// Seeded random function - produces consistent results for same seed
	function seededRandom(seed: string): number {
		let hash = 0;
		for (let i = 0; i < seed.length; i++) {
			const char = seed.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32bit integer
		}
		// Convert to a number between 0 and 1
		const x = Math.sin(hash) * 10000;
		return x - Math.floor(x);
	}

	// Select a preview video when project data is available (deterministic based on project ID)
	$: if (projectData && projectUid) {
		const allItems = Array.isArray(projectData?.preview) ? projectData.preview : [];
		const currentProjectId = projectData?.id || projectUid || '';
		
		// Reset selection if project changed or dimension changed
		const projectChanged = currentProjectId !== lastProjectId;
		const dimensionChanged = effectiveDimension !== lastEffectiveDimension;
		
		if (allItems.length === 0) {
			selectedPreviewItem = null;
			lastProjectId = currentProjectId;
			lastEffectiveDimension = effectiveDimension;
		} else {
			// On mobile, always prefer portrait assets
			const preferred = filterItemsForDimension(allItems, effectiveDimension);
			const candidates = preferred.length > 0 ? preferred : allItems;
			
			// Re-select if project changed, dimension changed, or we don't have a selection yet
			if (projectChanged || dimensionChanged || selectedPreviewItem === null) {
				// Use seeded random based on project ID + dimension for consistent server/client selection
				const seed = `${currentProjectId}-${effectiveDimension}`;
				const randomIndex = Math.floor(seededRandom(seed) * candidates.length);
				selectedPreviewItem = candidates[randomIndex];
				lastProjectId = currentProjectId;
				lastEffectiveDimension = effectiveDimension;
			}
		}
	}

	$: selectedPreview = selectedPreviewItem ? { item: selectedPreviewItem, index: 0 } : null;
</script>

		{#if clickable}
    <a href="/work/{projectUid}" class="block " bind:this={projectElement} data-sveltekit-preload-code data-sveltekit-preload-data
	   on:mouseenter={() => {
		   isHovering = true;
		   hasEverHovered = true;
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
		   isHovering = false;
		   hoverPreview.update(s => (s?.uid === projectUid ? { url: null } : s));
	   }}
	>
		<!-- {projectUid} -->
		{#if selectedPreview}		
			{@const preview = selectedPreview.item}
			{@const imageField = effectiveDimension === 'portrait' ? preview?.preview_image_portrait : preview?.preview_image_landscape}
			{@const videoUrl = effectiveDimension === 'portrait' ? preview?.preview_video_url_portrait : preview?.preview_video_url_landscape}
			
			{#if videoUrl && (!isMobile || ENABLE_VIDEOS_ON_MOBILE)}
				<div class="relative brightness-[95%]" role="group">
					<VideoPlayerSimple 
						hlsUrl={videoUrl}
						posterImage={imageField} 
						classes="w-full h-auto {cornerClass} object-cover hover:brightness-60 transition-all duration-300 {aspectClass}"
						playbackRate={isHovering ? 1 : 1} 
						dimension={effectiveDimension}
						{itemsPerRow}
						containerSizePercent={containerSizePercent}
						enableOnMobile={ENABLE_VIDEOS_ON_MOBILE}
						{square}
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
							<div class="text-xl">{projectTitleRaw}</div>
							<div class="text-xl">{projectClientRaw}</div>
						</div>
					{/if}
				</div>
			{:else if imageField?.url}
				<div class="relative brightness-[95%] overflow-hidden {cornerClass}" role="group">
					<PrismicImage 
						field={imageField} 
						class="w-full brightness-90 md:brightness-0 h-auto {cornerClass} overflow-hidden hover:brightness-60 transition-all duration-300 {aspectClass} object-cover"
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
						<div class="absolute bottom-0 left-0 right-0 p-3 text-white">
							<div class="text-xl font-medium">{projectTitleRaw}</div>
							<div class="text-xl  opacity-60">{projectClientRaw}</div>
						</div>
					{/if}
				</div>
			{/if}
		{/if}
	</a>
{:else}
    <div class="block" bind:this={projectElement} role="group"
	     on:mouseenter={() => {
		     isHovering = true;
		     hasEverHovered = true;
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
		     isHovering = false;
		     hoverPreview.update(s => (s?.uid === projectUid ? { url: null } : s));
	     }}
	>
		
		{#if selectedPreview}		
			{@const preview = selectedPreview.item}
			{@const imageField = effectiveDimension === 'portrait' ? preview?.preview_image_portrait : preview?.preview_image_landscape}
			{@const videoUrl = effectiveDimension === 'portrait' ? preview?.preview_video_url_portrait : preview?.preview_video_url_landscape}
			
			{#if videoUrl && (!isMobile || ENABLE_VIDEOS_ON_MOBILE)}
				<div class="relative" role="group">
					<VideoPlayerSimple 
						hlsUrl={videoUrl}
						posterImage={imageField} 
						classes="w-full h-auto {cornerClass} object-cover {aspectClass}"
						playbackRate={isHovering ? 0.5 : 1}
						dimension={effectiveDimension}
						{itemsPerRow}
						containerSizePercent={containerSizePercent}
						enableOnMobile={ENABLE_VIDEOS_ON_MOBILE}
						{square}
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
							<div class="text-xl font-medium">{projectTitleRaw}</div>
							<div class="text-xl  opacity-80">{projectClientRaw}</div>
						</div>
					{/if}
				</div>
			{:else if imageField?.url}
				<div class="relative" role="group">
					<PrismicImage 
						field={imageField} 
						class="w-full h-auto {cornerClass} {aspectClass} object-cover"
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
							<div class="text-xl font-medium">{projectTitleRaw}</div>
							<div class="text-xl  opacity-80">{projectClientRaw}</div>
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