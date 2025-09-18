<script lang="ts">
	import { PrismicPreview } from '@prismicio/svelte/kit';
	import { page } from '$app/state';
	import { repositoryName } from '$lib/prismicio';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Welcome from '$lib/components/Welcome.svelte';
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import "../app.css";
	import MobileNav from '$lib/components/MobileNav.svelte';
	let { children, data } = $props();
	
	// Global navigation click detection for video autoplay permissions
	let headerFaded = $state(false);
	let mainMediaVisible = $state(true);
	let videoIsDark = $state(false);
	let soundContexts = new Map<string, Set<string>>();
	let controlsVisibleContexts = new Map<string, Set<string>>();

	let io: IntersectionObserver | undefined;
	let observedEl: HTMLElement | null = null;

	function attachObserver() {
		const mainEl = document.getElementById('main-media');
		console.log('🔍 attachObserver called, main-media element:', mainEl);
		if (observedEl === mainEl) return;
		if (io && observedEl) io.unobserve(observedEl);
		observedEl = mainEl;
		if (mainEl && 'IntersectionObserver' in window) {
			console.log('🔍 Setting up intersection observer for main-media');
			io = new IntersectionObserver((entries) => {
				const entry = entries[0];
				const wasVisible = mainMediaVisible;
				mainMediaVisible = entry.isIntersecting && entry.intersectionRatio > 0;
				console.log('👁️ Intersection observer:', { 
					isIntersecting: entry.isIntersecting, 
					intersectionRatio: entry.intersectionRatio, 
					mainMediaVisible, 
					wasVisible 
				});
				// Defer calling updateHeaderState until it's defined in onMount
			}, { threshold: [0, 0.01, 0.1] });
			io.observe(mainEl);
		} else {
			console.log('⚠️ No main-media element found or IntersectionObserver not supported');
			mainMediaVisible = false;
			// Defer calling updateHeaderState until it's defined in onMount
		}
	}

	onMount(() => {
		const handleNavigationClick = (e: Event) => {
			const target = e.target as HTMLElement;
			// Ignore clicks coming from video components/controls
			if (target.closest('[data-video-interactive="true"]') || target.closest('[data-video-control="true"]')) {
				return;
			}
			if (target.closest('a') || target.closest('button')) {
				sessionStorage.setItem('circle-studio-navigating', 'true');
				sessionStorage.setItem('user-has-interacted', 'true');
				console.log('🌐 Global navigation click detected, stored both flags');
			}
		};

		const handleVideoSoundOn = (e: Event) => {
			const { context, videoId } = (e as CustomEvent).detail || {};
			if (!context || !videoId) return updateHeaderState();
			if (!soundContexts.has(context)) soundContexts.set(context, new Set());
			soundContexts.get(context)!.add(videoId);
			updateHeaderState();
		};
		const handleVideoSoundOff = (e: Event) => {
			const { context, videoId } = (e as CustomEvent).detail || {};
			if (!context || !videoId) return updateHeaderState();
			const set = soundContexts.get(context);
			if (set) {
				set.delete(videoId);
				if (set.size === 0) soundContexts.delete(context);
			}
			updateHeaderState();
		};

		const handleControlsShown = (e: Event) => {
			const { context, videoId } = (e as CustomEvent).detail || {};
			if (!context || !videoId) return updateHeaderState();
			if (!controlsVisibleContexts.has(context)) controlsVisibleContexts.set(context, new Set());
			controlsVisibleContexts.get(context)!.add(videoId);
			updateHeaderState();
		};
		const handleControlsHidden = (e: Event) => {
			const { context, videoId } = (e as CustomEvent).detail || {};
			if (!context || !videoId) return updateHeaderState();
			const set = controlsVisibleContexts.get(context);
			if (set) {
				set.delete(videoId);
				if (set.size === 0) controlsVisibleContexts.delete(context);
			}
			updateHeaderState();
		};

		const handleProjectVideoDarkMode = (e: Event) => {
			const { isDark } = (e as CustomEvent).detail || {};
			console.log('🌙 Layout received dark mode event:', isDark);
			videoIsDark = isDark;
			console.log('🌙 Project video dark mode updated:', videoIsDark);
		};

		function updateHeaderState() {
			const controlsMainVisible = (controlsVisibleContexts.get('main')?.size ?? 0) > 0;
			if (controlsMainVisible) {
				headerFaded = false;
				return;
			}
			const soundMainOn = (soundContexts.get('main')?.size ?? 0) > 0;
			headerFaded = !!(mainMediaVisible && soundMainOn);
		}

		// Listen for all clicks globally
		document.addEventListener('click', handleNavigationClick);
		// Listen for video sound events
		window.addEventListener('video-playing-with-sound', handleVideoSoundOn as EventListener);
		window.addEventListener('video-sound-off', handleVideoSoundOff as EventListener);
		window.addEventListener('video-controls-shown', handleControlsShown as EventListener);
		window.addEventListener('video-controls-hidden', handleControlsHidden as EventListener);
		window.addEventListener('header-hover-on', updateHeaderState as EventListener);
		window.addEventListener('header-hover-off', updateHeaderState as EventListener);
		window.addEventListener('project-video-dark-mode', handleProjectVideoDarkMode as EventListener);
		
		// Observe main media visibility (initial)
		attachObserver();
		// Also try again after a delay to ensure DOM is ready
		setTimeout(() => {
			console.log('⏰ Delayed attachObserver attempt');
			attachObserver();
		}, 500);
		// Now that updateHeaderState exists, trigger initial compute
		updateHeaderState();

		// Re-attach on route changes and reset per-page context
		afterNavigate(() => {
			// Clear only 'main' context states on navigation
			controlsVisibleContexts.delete('main');
			soundContexts.delete('main');
			mainMediaVisible = true;
			videoIsDark = false; // Reset video dark mode on navigation
			attachObserver();
			// Also try again after a delay to ensure DOM is ready
			setTimeout(() => {
				console.log('⏰ afterNavigate delayed attachObserver attempt');
				attachObserver();
			}, 500);
			updateHeaderState();
		});
		
		return () => {
			document.removeEventListener('click', handleNavigationClick);
			window.removeEventListener('video-playing-with-sound', handleVideoSoundOn as EventListener);
			window.removeEventListener('video-sound-off', handleVideoSoundOff as EventListener);
			window.removeEventListener('video-controls-shown', handleControlsShown as EventListener);
			window.removeEventListener('video-controls-hidden', handleControlsHidden as EventListener);
			if (io && observedEl) io.unobserve(observedEl);
			window.removeEventListener('header-hover-on', updateHeaderState as EventListener);
			window.removeEventListener('header-hover-off', updateHeaderState as EventListener);
			window.removeEventListener('project-video-dark-mode', handleProjectVideoDarkMode as EventListener);
		};
	});
</script>

<svelte:head>
	<title>{page.data.title}</title>
	{#if page.data.meta_description}
		<meta name="description" content={page.data.meta_description} />
	{/if}
	{#if page.data.meta_title}
		<meta name="og:title" content={page.data.meta_title} />
	{/if}
	{#if page.data.meta_image}
		<meta name="og:image" content={page.data.meta_image} />
		<meta name="twitter:card" content="summary_large_image" />
	{/if}
</svelte:head>

<div class="min-h-screen flex flex-col">
	<!-- <Welcome /> -->
	<MobileNav />
	<Header settings={data.settings} faded={headerFaded} videoIsDark={videoIsDark} mainMediaVisible={mainMediaVisible} />

	<main class="flex-1">
		{@render children()}
	</main>

	{#if !(page?.data?.page?.data?.no_footer ?? false)}
		<Footer settings={data.settings} />
	{/if}
</div>

<PrismicPreview {repositoryName} /> 
