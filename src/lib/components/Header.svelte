<script lang="ts">
	import { PrismicLink } from '@prismicio/svelte';
	import BigWheel from './BigWheel.svelte';
	import MobileWheel from './MobileWheel.svelte';
	import { onMount } from 'svelte';
	import { viewMode, setViewMode, initializeViewMode } from '$lib/stores';
	
	let { settings, faded = false, videoIsDark = false, mainMediaVisible = true } = $props();
	let isHovering = $state(false);
	let isViewModeHovering = $state(false);
	let currentPath = $state('');
	let isMobileMenuOpen = $state(false);
	
	// Override faded state when hovering over the wheel to prevent unwanted fading
	let effectiveFaded = $derived(isHovering ? false : faded);
	
	// Get current path only on client side
	$effect(() => {
		if (typeof window !== 'undefined') {
			currentPath = window.location.pathname;
		}
	});
	
	// Function to handle Grid/List click - navigate to front page with view mode
	function handleViewModeClick() {
		// Get current path directly in the click handler for reliability
		const currentPath = window.location.pathname;
		console.log('🔍 Click handler - currentPath:', currentPath, 'current viewMode:', $viewMode);
		console.log('💾 localStorage before click:', localStorage.getItem('indexViewMode'));
		
		if (currentPath === '/' || currentPath === '/preview') {
			// On front page: toggle view mode and stay on front page
			console.log('🏠 On front page - toggling view mode');
			setViewMode($viewMode === 'grid' ? 'list' : 'grid');
		} else {
			// On other pages: navigate to front page with the view mode indicated by button text
			const targetViewMode = $viewMode === 'grid' ? 'list' : 'grid';
			console.log('🌐 On other page - navigating to front page with target view mode:', targetViewMode);
			// Save the target view mode to localStorage before navigation
			localStorage.setItem('indexViewMode', targetViewMode);
			console.log('💾 localStorage after direct save:', localStorage.getItem('indexViewMode'));
			console.log('🚀 Navigating to front page...');
			window.location.href = '/';
		}
	}
	
	// Toggle mobile menu
	function toggleMobileMenu() {
		isMobileMenuOpen = !isMobileMenuOpen;
	}
	
	// Close mobile menu when clicking outside
	function closeMobileMenu() {
		isMobileMenuOpen = false;
	}
	
	// Control body scroll when mobile menu is open
	$effect(() => {
		if (typeof document !== 'undefined') {
			if (isMobileMenuOpen) {
				document.body.style.overflow = 'hidden';
			} else {
				document.body.style.overflow = '';
			}
		}
	});
	
	// Initialize view mode from localStorage or URL
	onMount(() => {
		// Removed initializeViewMode() call to prevent conflicts
	});

	// Determine if header should be in dark mode
	const isDarkMode = $derived(videoIsDark && mainMediaVisible);
	
	// Debug logging with $effect
	$effect(() => {
		console.log('🎨 Header state changed - videoIsDark:', videoIsDark, 'mainMediaVisible:', mainMediaVisible, 'isDarkMode:', isDarkMode);
	});
	
	// Debug view mode changes
	$effect(() => {
		console.log('🔄 Header - viewMode changed to:', $viewMode);
	});
</script>

<!-- Navigation Header -->
{#if settings?.data?.navigation_header}
	<header class="fixed top-0 z-50 w-full pointer-events-none transition-all duration-600" 
		class:opacity-0={effectiveFaded} 
		class:opacity-100={!effectiveFaded}
		class:dark-mode={isDarkMode}>
		<nav class="px-3 py-4">
			<div class="flex justify-between w-full relative">
				<!-- Mobile: Centered wheel -->
				<MobileWheel isDarkMode={isDarkMode} />
				
				<!-- Desktop: Left-aligned wheel -->
				<a 
					href="/" 
					class="hidden md:block -mt-6 transition-all duration-600"
					class:pointer-events-auto={!effectiveFaded}
					class:pointer-events-none={effectiveFaded}
					onmouseenter={() => { isHovering = true; }}
					onmouseleave={() => { isHovering = false; }}
				>
					<!-- Black Wheel (default) -->
					<div class="absolute top-0 left-0 transition-opacity duration-600 z-10" class:opacity-0={isDarkMode} class:opacity-100={!isDarkMode}>
						<BigWheel 
							config={{
								uiVisible: false,
								items: [{
									text: 'CIRCLE STUDIO GLOBAL',
									rotationSpeed: isHovering ? 1 : 0.2,
									spacingAmplitudePercent: 0,
									spacingSpeed: 0,
									rotationStart: 0,
									animationType: 'sin'
								}],
								globalSettings: {
									containerSizePercent: 30,
									fontSizePercent: 15.7,
									distancePercent: 0,
									paused: false,
									textColor: '#000000',
									transparentBackground: true,
									manualMode: true,
									fadeInTime: 0,
									fadeOutTime: 0
								}
							}}
						/>
					</div>
					
					<!-- White Wheel (dark mode) -->
					<div class="absolute top-0 left-0 transition-opacity duration-600 z-10" class:opacity-100={isDarkMode} class:opacity-0={!isDarkMode}>
						<BigWheel 
							config={{
								uiVisible: false,
								items: [{
									text: 'CIRCLE STUDIO GLOBAL',
									rotationSpeed: isHovering ? 1 : 0.2,
									spacingAmplitudePercent: 0,
									spacingSpeed: 0,
									rotationStart: 0,
									animationType: 'sin'
								}],
								globalSettings: {
									containerSizePercent: 30,
									fontSizePercent: 15.7,
									distancePercent: 0,
									paused: false,
									textColor: '#ffffff',
									transparentBackground: true,
									manualMode: true,
									fadeInTime: 0,
									fadeOutTime: 0
								}
							}}
						/>
					</div>
				</a>
				
				<!-- Mobile Burger Menu Button - Top right -->
				<button
					class="md:hidden absolute right-0 top-0 -mt-2 z-50 p-2"
					class:pointer-events-auto={!effectiveFaded}
					class:pointer-events-none={effectiveFaded}
					onclick={toggleMobileMenu}
					aria-label="Toggle mobile menu"
				>
					<div class="w-6 h-6 flex flex-col justify-center items-center">
						<!-- Top line -->
						<span 
							class="w-6 h-0.5 bg-current transition-all duration-300 ease-in-out transform origin-center" 
							class:rotate-0={!isMobileMenuOpen}
						></span>
						<!-- Middle line -->
						<span 
							class="w-6 h-0.5 bg-current transition-all duration-300 ease-in-out mt-1.5" 
							class:opacity-0={isMobileMenuOpen}
						></span>
						<!-- Bottom line -->
						<span 
							class="w-6 h-0.5 bg-current transition-all duration-300 ease-in-out mt-1.5 transform origin-center" 
							class:rotate-0={!isMobileMenuOpen}
						></span>
					</div>
				</button>
				
				<!-- Desktop Navigation - Hidden on mobile -->
				<div class="hidden md:flex items-center" class:pointer-events-auto={!effectiveFaded} class:pointer-events-none={effectiveFaded}>
					<!-- Add Grid/List selector before the navigation -->
					<div class="flex items-center" class:pointer-events-auto={!effectiveFaded} class:pointer-events-none={effectiveFaded}>
						<!-- Grid/List selector -->
						<div class="relative">
							<button
								class="font-medium transition-all duration-600 ease-in-out hover:text-neutral-900 focus:outline-none min-w-[60px] text-left cursor-pointer"
								class:dark-mode={isDarkMode}
								onclick={handleViewModeClick}
								onmouseenter={() => isViewModeHovering = true}
								onmouseleave={() => isViewModeHovering = false}
								aria-label="Switch between grid and list view"
							>
								{(() => {
									if (currentPath === '/' || currentPath === '/preview') {
										// On front page: show toggle option (what you'll get when you click)
										return $viewMode === 'grid' ? 'List' : 'Grid';
									} else {
										// On other pages: show what you want to go to
										return $viewMode === 'grid' ? 'List' : 'Grid';
									}
								})()}
							</button>
						</div>
						
						<!-- Navigation Links -->
						<ul class="flex items-right space-x-6 pr-3" class:pointer-events-auto={!faded} class:pointer-events-none={faded}>
							{#each settings.data.navigation_header as navItem}
								<li class:dark-mode={isDarkMode}>
									<PrismicLink 
										field={navItem} 
										class="hover:text-neutral-900 transition-colors duration-600 font-medium"
									>
										{navItem.text || 'Link'}
									</PrismicLink>
								</li>
							{/each}
						</ul>
					</div>
				</div>
			</div>
			
			<!-- Mobile Menu Overlay -->
			{#if isMobileMenuOpen}
				<div 
					class="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
					onclick={closeMobileMenu}
				></div>
			{/if}
			
			<!-- Mobile Menu Content - Opacity fade instead of slide -->
			<div 
				class="fixed inset-0 bg-white/80 backdrop-blur-md z-50 md:hidden transition-opacity duration-300 flex items-center justify-center"
				class:opacity-100={isMobileMenuOpen}
				class:opacity-0={!isMobileMenuOpen}
				class:pointer-events-auto={isMobileMenuOpen}
				class:pointer-events-none={!isMobileMenuOpen}
			>
				<!-- Close button in top right corner -->
				<button
					class="absolute top-2 right-3 p-2"
					onclick={closeMobileMenu}
					aria-label="Close menu"
				>
					<div class="w-6 h-6 flex flex-col justify-center items-center">
						<span class="w-6 h-0.5 bg-current rotate-45 transform origin-center"></span>
						<span class="w-6 h-0.5 bg-current -rotate-45 transform origin-center absolute"></span>
					</div>
				</button>
				
				<div class="text-center space-y-2">
					<!-- Grid/List selector -->
					<button
						class="block w-full py-3 px-6 text-lg"
						onclick={() => { handleViewModeClick(); closeMobileMenu(); }}
					>
						{(() => {
							if (currentPath === '/' || currentPath === '/preview') {
								// On front page: show toggle option (what you'll get when you click)
								return $viewMode === 'grid' ? 'List' : 'Grid';
							} else {
								// On other pages: show what you want to go to
								return $viewMode === 'grid' ? 'List' : 'Grid';
							}
						})()}
					</button>
					
					<!-- Navigation Links -->
					{#each settings.data.navigation_header as navItem}
						<PrismicLink 
							field={navItem} 
							class="block w-full py-3 px-6 text-lg"
							onclick={closeMobileMenu}
						>
							{navItem.text || 'Link'}
						</PrismicLink>
					{/each}
				</div>
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
	header a[href="/"] {
		pointer-events: auto;
		z-index: 10000;
		position: relative;
	}

	/* Ensure wheels are above everything and handle pointer events correctly */
	header a[href="/"] > div {
		pointer-events: auto;
		z-index: 10001;
		cursor: pointer;
	}

	/* Prevent any cursor conflicts on wheel hover */
	header a[href="/"]:hover {
		cursor: pointer !important;
	}

	header a[href="/"]:hover > div {
		cursor: pointer !important;
	}

	/* Ensure BigWheel components don't interfere with cursor */
	:global(header a[href="/"] canvas) {
		pointer-events: none;
		cursor: pointer;
	}

	/* Dark mode navigation links - target PrismicLink components */
	:global(header.dark-mode li.dark-mode *) {
		color: #ffffff !important;
	}

	:global(header.dark-mode li.dark-mode *:hover) {
		color: #e5e7eb !important;
	}

	/* Alternative targeting for PrismicLink */
	:global(header.dark-mode li.dark-mode a),
	:global(header.dark-mode li.dark-mode button),
	:global(header.dark-mode li.dark-mode span) {
		color: #ffffff !important;
	}

	:global(header.dark-mode li.dark-mode a:hover),
	:global(header.dark-mode li.dark-mode button:hover),
	:global(header.dark-mode li.dark-mode span:hover) {
		color: #e5e7eb !important;
	}

	/* Dark mode styling for Grid/List selector button */
	:global(header.dark-mode button.dark-mode) {
		color: #ffffff !important;
		transition: color 0.6s ease-in-out;
	}

	:global(header.dark-mode button.dark-mode:hover) {
		color: #e5e7eb !important;
		transition: color 0.6s ease-in-out;
	}
</style> 