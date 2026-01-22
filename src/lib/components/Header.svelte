<script lang="ts">
	import { PrismicLink } from '@prismicio/svelte';
	import Logo from './Logo.svelte';
	import MobileWheel from './MobileWheel.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { viewMode, setViewMode, initializeViewMode, mobileSearchOpen } from '$lib/stores';
	
	let { settings, faded = false, videoIsDark = false, mainMediaVisible = true } = $props();
	let isHovering = $state(false);
	let isViewModeHovering = $state(false);
	let currentPath = $derived($page.url.pathname);
	
	// Override faded state when hovering over the wheel to prevent unwanted fading
	let effectiveFaded = $derived(isHovering ? false : faded);
	
	
	// Function to handle Grid/List click - navigate to front page with view mode (desktop only)
	function handleViewModeClick() {
		// Get current path directly in the click handler for reliability
		const currentPath = window.location.pathname;
		
		if (currentPath === '/' || currentPath === '/preview') {
			// On front page: toggle view mode and stay on front page
			setViewMode($viewMode === 'grid' ? 'list' : 'grid');
		} else {
			// On other pages: navigate to front page with the view mode indicated by button text
			const targetViewMode = $viewMode === 'grid' ? 'list' : 'grid';
			// Save the target view mode to localStorage before navigation
			localStorage.setItem('indexViewMode', targetViewMode);
			// Mark as internal navigation to suppress welcome on SPA route change
			try {
				sessionStorage.setItem('circle-studio-navigating', 'true');
			} catch {}
			goto(`/?view=${targetViewMode}`);
		}
	}
	
	// Function to handle Grid click specifically
	function handleGridClick() {
		const currentPath = window.location.pathname;
		if (currentPath === '/' || currentPath === '/preview') {
			setViewMode('grid');
		} else {
			localStorage.setItem('indexViewMode', 'grid');
			try {
				sessionStorage.setItem('circle-studio-navigating', 'true');
			} catch {}
			goto('/?view=grid');
		}
	}
	
	// Function to handle List click specifically
	function handleListClick() {
		const currentPath = window.location.pathname;
		if (currentPath === '/' || currentPath === '/preview') {
			setViewMode('list');
		} else {
			localStorage.setItem('indexViewMode', 'list');
			try {
				sessionStorage.setItem('circle-studio-navigating', 'true');
			} catch {}
			goto('/?view=list');
		}
	}
	
	// Function to handle Play click - navigate to /play
	function handlePlayClick(event: MouseEvent) {
		event.preventDefault();
		const currentPath = window.location.pathname;
		try {
			sessionStorage.setItem('circle-studio-navigating', 'true');
		} catch {}
		goto('/play');
	}
	
	// When clicking the logo/wheel, always go home and set Grid view
	function handleLogoClick(event: MouseEvent) {
		event.preventDefault();
		try {
			localStorage.setItem('indexViewMode', 'grid');
		} catch {}
		setViewMode('grid');
		// Mark as internal navigation to suppress welcome on SPA route change
		try {
			sessionStorage.setItem('circle-studio-navigating', 'true');
		} catch {}
		goto('/?view=grid');
	}
	
	
	// Initialize view mode from localStorage or URL
	onMount(() => {
		initializeViewMode();
	});

	// Determine if header should be in dark mode
	const isDarkMode = $derived(videoIsDark && mainMediaVisible);

	// Determine current route for conditional mobile wheel visibility
	const isProject = $derived(currentPath.startsWith('/work/'));
	const isAbout = $derived(currentPath === '/about' || currentPath.startsWith('/about/'));
	const isHome = $derived(currentPath === '/' || currentPath === '/preview');
	const isPlay = $derived(currentPath === '/play' || currentPath === '/play/preview');
	
	// Check if we're on home page with grid mode active (show white logo)
	const isHomePageGrid = $derived(isHome && $viewMode === 'grid');
	
	// Active state for navigation items
	const isGridActive = $derived(isHome && $viewMode === 'grid');
	const isListActive = $derived(isHome && $viewMode === 'list');
	// Play is active when on /play route
	const isPlayActive = $derived(isPlay);
</script>

<!-- Navigation Header -->
{#if settings?.data?.navigation_header}
	<!-- Always-visible Mobile Navigation (independent of header fading and dark mode) -->
	<!-- <div class="md:hidden fixed inset-x-0 top-2 z-[10001] p-1 pointer-events-auto mobile-nav">
		<nav class="flex items-center justify-center gap-x-4">
			<a href="/" class="text-center font-medium transition-colors duration-600">
				Work
			</a>
			<a href="/about" class="text-center font-medium transition-colors duration-600">
				About
			</a>
		</nav>
	</div> -->

	<!-- Navigation - Always visible, outside header fade -->
	<div class="hidden md:flex fixed top-0 right-0 z-[10001] pointer-events-auto px-3 py-4 items-center space-x-2">
		<!-- Grid and List in same box -->
		<div class="bg-gray-100 rounded-full px-4 py-2 flex items-center space-x-3">
			<!-- Grid -->
			<button
				class="font-medium transition-colors duration-300 ease-in-out hover:text-neutral-900 focus:outline-none cursor-pointer"
				class:text-neutral-500={isGridActive}
				class:text-neutral-900={!isGridActive}
				onclick={handleGridClick}
				aria-label="Grid view"
			>
				Grid
			</button>
			<!-- List -->
			<button
				class="font-medium transition-colors duration-300 ease-in-out hover:text-neutral-900 focus:outline-none cursor-pointer"
				class:text-neutral-500={isListActive}
				class:text-neutral-900={!isListActive}
				onclick={handleListClick}
				aria-label="List view"
			>
				List
			</button>
		</div>
		<!-- About -->
		<a
			href="/about"
			class="bg-gray-100 rounded-full px-4 py-2 font-medium transition-colors duration-300 ease-in-out hover:text-neutral-900"
			class:text-neutral-500={isAbout}
			class:text-neutral-900={!isAbout}
		>
			About
		</a>
		<!-- Play -->
		<a
			href="/play"
			class="bg-gray-100 rounded-full px-4 py-2 font-medium transition-colors duration-300 ease-in-out hover:text-neutral-900"
			class:text-neutral-500={isPlayActive}
			class:text-neutral-900={!isPlayActive}
			onclick={handlePlayClick}
		>
			Play
		</a>
	</div>

	<header class="fixed top-0 z-50 w-full pointer-events-none transition-all duration-600" 
		class:opacity-0={effectiveFaded} 
		class:opacity-100={!effectiveFaded}
		class:dark-mode={isDarkMode}>
		<nav class="px-3 py-4">
			<div class="flex justify-between w-full relative">
				<!-- Mobile: Centered wheel (hidden on project/about pages and when mobile search open) -->
				{#if !isProject && !isAbout && !$mobileSearchOpen}
					<MobileWheel isDarkMode={isDarkMode || isHomePageGrid} />
				{/if}
				
				<!-- Desktop: Left-aligned wheel -->
				<a 
					href="/?view=grid" 
					class="hidden md:block -mt-6 transition-all duration-600 logo-link"
					class:pointer-events-auto={!effectiveFaded}
					class:pointer-events-none={effectiveFaded}
					onclick={handleLogoClick}
					onmouseenter={() => { isHovering = true; }}
					onmouseleave={() => { isHovering = false; }}
				>
					<!-- Black Logo (default) -->
					<div class="absolute top-4 left-0 transition-opacity duration-600 z-10" class:opacity-0={isDarkMode || isHomePageGrid || isProject} class:opacity-100={!isDarkMode && !isHomePageGrid && !isProject}>
						<Logo 
							variant="black"
							rotationSpeed={isHovering ? 50 : 10}
							size={185}
						/>
					</div>
					
					<!-- White Logo (dark mode, home page grid mode, or project pages) -->
					<div 
						class="absolute top-4 left-0 transition-opacity duration-600 z-10 project-page-logo" 
						class:opacity-100={isDarkMode || isHomePageGrid || isProject} 
						class:opacity-0={!isDarkMode && !isHomePageGrid && !isProject}
						class:project-page={isProject && !isDarkMode}
					>
						<Logo 
							variant="white"
							rotationSpeed={isHovering ? 50 : 10}
							size={185}
						/>
					</div>
				</a>
				
				<!-- Mobile Navigation removed here; now rendered above header to stay visible -->
				
			</div>
			
		</nav>
	</header>
{/if} 

<style>
	/* Ensure header is above all other content */
	header {
		z-index: 9999;
		/* Don't disable pointer events on the entire header */
	}

	/* Make the logo link properly handle pointer events */
	header a.logo-link {
		pointer-events: auto;
		z-index: 10000;
		position: relative;
	}

	/* Ensure wheels are above everything and handle pointer events correctly */
	header a.logo-link > div {
		pointer-events: auto;
		z-index: 10001;
		cursor: pointer;
	}

	/* Prevent any cursor conflicts on wheel hover */
	header a.logo-link:hover {
		cursor: pointer !important;
	}

	header a.logo-link:hover > div {
		cursor: pointer !important;
	}

	/* Ensure Logo components don't interfere with cursor */
	:global(header a.logo-link img) {
		pointer-events: none;
		cursor: pointer;
	}

	/* Navigation text always stays black, regardless of dark mode */
	:global(header nav ul li a),
	:global(header nav button) {
		color: #171717 !important; /* neutral-900 */
	}

	:global(header nav ul li a:hover),
	:global(header nav button:hover) {
		color: #171717 !important; /* neutral-900 */
	}

	/* Mobile nav is always visible and not theme-dependent */

	/* Darken white logo on project pages (when not in dark mode) with 40% brightness */
	:global(header .project-page-logo.project-page img) {
		filter: brightness(0.9) !important;
	}

</style> 